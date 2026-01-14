import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, runAsync, allAsync, getAsync } from '@/db';
import { generateId } from '@/app/lib/utils';
import { verifyToken, extractToken } from '@/app/lib/auth';

function getAuthUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  const token = extractToken(authHeader);
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

async function getUserRole(userId: string): Promise<string | null> {
  const db = await getDatabase();
  const profile = await getAsync(db, 'SELECT role FROM user_profiles WHERE user_id = ?', [userId]);
  return profile?.role || null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    let query = `SELECT p.*, m.name as member_name, m.phone as member_phone FROM payments p 
                 LEFT JOIN members m ON p.member_id = m.id`;
    const params: any[] = [];

    if (memberId) {
      query += ` WHERE p.member_id = ?`;
      params.push(memberId);
    }

    query += ` ORDER BY p.payment_date DESC`;

    const payments = await allAsync(db, query, params);

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      memberId,
      member_id,
      amount,
      paymentType,
      payment_type,
      paymentMode,
      payment_mode,
      transactionId,
      transaction_id,
      paymentDate,
      payment_date,
      status,
      notes,
    } = body;

    // Handle subscriptionId separately to avoid redeclaration
    const bodySubscriptionId = body.subscriptionId || body.subscription_id;

    const finalMemberId = memberId || member_id;
    const finalPaymentType = paymentType || payment_type;
    const finalPaymentMode = paymentMode || payment_mode;
    const finalTransactionId = transactionId || transaction_id;
    const finalPaymentDate = paymentDate || payment_date;

    if (!finalMemberId || !amount || !finalPaymentType || !finalPaymentMode || !finalPaymentDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Verify member exists
    const member = await getAsync(db, 'SELECT id FROM members WHERE id = ?', [finalMemberId]);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const paymentId = generateId('pay_');

    // If this is a membership payment with a fee plan, create/update subscription
    let subscriptionId = bodySubscriptionId;
    if (finalPaymentType === 'membership' && body.feePlanId) {
      const feePlan = await getAsync(db, 'SELECT * FROM fee_plans WHERE id = ?', [body.feePlanId]);

      if (feePlan) {
        // Check if member already has an active subscription
        const existingSubscription = await getAsync(
          db,
          'SELECT id, end_date FROM subscriptions WHERE member_id = ? AND status = ? ORDER BY end_date DESC LIMIT 1',
          [finalMemberId, 'active']
        );

        if (existingSubscription) {
          // Extend existing subscription
          const currentEndDate = new Date(existingSubscription.end_date);
          const newEndDate = new Date(currentEndDate);
          newEndDate.setMonth(newEndDate.getMonth() + feePlan.duration);

          await runAsync(
            db,
            'UPDATE subscriptions SET end_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newEndDate.getTime(), existingSubscription.id]
          );

          subscriptionId = existingSubscription.id;
        } else {
          // Create new subscription
          subscriptionId = generateId('sub_');
          const startDate = finalPaymentDate;
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + feePlan.duration);

          await runAsync(
            db,
            `INSERT INTO subscriptions (id, member_id, fee_plan_id, start_date, end_date, status, created_by, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [subscriptionId, finalMemberId, body.feePlanId, startDate, endDate.getTime(), 'active', userId]
          );
        }
      }
    }

    await runAsync(
      db,
      `INSERT INTO payments (id, member_id, subscription_id, amount, payment_type, payment_mode, transaction_id, payment_date, status, notes, recorded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [paymentId, finalMemberId, subscriptionId || null, amount, finalPaymentType, finalPaymentMode, finalTransactionId || null, finalPaymentDate, status || 'completed', notes || null, userId]
    );

    // Log action
    await runAsync(
      db,
      `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId('log_'), userId, 'ADD_PAYMENT', 'payment', paymentId, `Recorded payment of ${amount}`, Date.now()]
    );

    return NextResponse.json({ id: paymentId, subscriptionId }, { status: 201 });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
