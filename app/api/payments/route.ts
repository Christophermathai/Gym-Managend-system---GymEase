import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, runAsync, allAsync, getAsync } from '@/db';
import { generateId } from '@/app/lib/utils';
import { getAuthUserId } from '@/app/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    let query = `SELECT p.*, m.name as member_name, m.phone as member_phone,
                   COALESCE(p.amount_due, 0) as amount_due,
                   COALESCE(p.balance, 0) as balance
                 FROM payments p
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
      receiptNo,
      receipt_no,
      coupleMemberId,
      couple_member_id,
      notes,
    } = body;

    // Handle subscriptionId separately to avoid redeclaration
    const bodySubscriptionId = body.subscriptionId || body.subscription_id;

    const finalMemberId = memberId || member_id;
    const finalPaymentType = paymentType || payment_type;
    const finalPaymentMode = paymentMode || payment_mode;
    const finalTransactionId = transactionId || transaction_id;
    const finalReceiptNo = receiptNo || receipt_no;
    const finalPaymentDate = paymentDate || payment_date;

    // Determine if it's a couple payment first to calculate amounts
    let isCouplePayment = false;
    let feePlan = null;
    const db = await getDatabase();

    if (finalPaymentType === 'membership' && body.feePlanId) {
      feePlan = await getAsync(db, 'SELECT * FROM fee_plans WHERE id = ?', [body.feePlanId]);
      if (feePlan && feePlan.is_couple_package && (coupleMemberId || couple_member_id)) {
        isCouplePayment = true;
      }
    }

    const amountPaid = parseFloat(amount) || 0;
    const amountDue = parseFloat(body.amount_due ?? body.amountDue ?? amount) || amountPaid;

    if (!finalMemberId || !amount || !finalPaymentType || !finalPaymentMode || !finalPaymentDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const finalCoupleMemberId = coupleMemberId || couple_member_id;

    // Determine members and amounts
    const membersToProcess = isCouplePayment ? [finalMemberId, finalCoupleMemberId] : [finalMemberId];

    // Split the amount precisely if couple package
    const perMemberAmountPaid = isCouplePayment ? amountPaid / 2 : amountPaid;
    const perMemberAmountDue = isCouplePayment ? amountDue / 2 : amountDue;
    const perMemberBalance = Math.max(0, perMemberAmountDue - perMemberAmountPaid);
    const perMemberStatus = perMemberBalance > 0 ? 'partial' : (body.status || 'completed');

    for (const currentMemberId of membersToProcess) {
      const paymentId = generateId('pay_');
      let subscriptionId = bodySubscriptionId;

      if (finalPaymentType === 'membership' && feePlan) {
        // Check if this specific member already has an active subscription
        const existingSubscription = await getAsync(
          db,
          'SELECT id, end_date FROM subscriptions WHERE member_id = ? AND status = ? ORDER BY end_date DESC LIMIT 1',
          [currentMemberId, 'active']
        );

        if (existingSubscription) {
          // Extend existing subscription
          const currentEndDate = new Date(existingSubscription.end_date);
          const newEndDate = new Date(currentEndDate);
          newEndDate.setMonth(newEndDate.getMonth() + feePlan.duration);

          await runAsync(
            db,
            'UPDATE subscriptions SET end_date = ? WHERE id = ?',
            [newEndDate.getTime(), existingSubscription.id]
          );

          subscriptionId = existingSubscription.id;
        } else {
          // Create new subscription
          subscriptionId = generateId('sub_');
          const startDate = finalPaymentDate;
          const endDate = new Date(startDate);
          // Safety: avoid double counting duration if doing couple logic, but it's okay because this loops per member.
          endDate.setMonth(endDate.getMonth() + feePlan.duration);

          await runAsync(
            db,
            `INSERT INTO subscriptions (id, member_id, fee_plan_id, start_date, end_date, status, created_by, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [subscriptionId, currentMemberId, body.feePlanId, startDate, endDate.getTime(), 'active', userId]
          );
        }
      }

      // If settling a previous balance, the new payment itself doesn't have an outstanding balance
      const finalSettlePaymentId = body.settlePaymentId || body.settle_payment_id;
      const isSettlement = !!finalSettlePaymentId;

      const effectiveAmountDue = isSettlement ? perMemberAmountPaid : perMemberAmountDue;
      const effectiveBalance = isSettlement ? 0 : perMemberBalance;
      const effectiveStatus = isSettlement ? 'completed' : perMemberStatus;

      await runAsync(
        db,
        `INSERT INTO payments (id, member_id, subscription_id, amount, amount_due, balance, payment_type, payment_mode, transaction_id, receipt_no, payment_date, status, notes, recorded_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [paymentId, currentMemberId, subscriptionId || null, perMemberAmountPaid, effectiveAmountDue, effectiveBalance, finalPaymentType, finalPaymentMode, finalTransactionId || null, finalReceiptNo || null, finalPaymentDate, effectiveStatus, notes || null, userId]
      );

      // If settling a previous balance, update the original payment
      if (finalSettlePaymentId && !isCouplePayment) {
        // Settlement is typically not done as a new combined couple payment
        const origPayment = await getAsync(db, 'SELECT * FROM payments WHERE id = ?', [finalSettlePaymentId]);
        if (origPayment) {
          const newBalance = Math.max(0, origPayment.balance - perMemberAmountPaid);
          const newStatus = newBalance > 0 ? 'partial' : 'completed';
          await runAsync(
            db,
            'UPDATE payments SET balance = ?, status = ? WHERE id = ?',
            [newBalance, newStatus, finalSettlePaymentId]
          );
        }
      }

      // Log action
      await runAsync(
        db,
        `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [generateId('log_'), userId, 'RECORD_PAYMENT', 'payment', paymentId, `Recorded ${finalPaymentType} payment of ${perMemberAmountPaid} for member ${currentMemberId}`, Date.now()]
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
    }

    const db = await getDatabase();

    // Check if payment exists
    const payment = await getAsync(db, 'SELECT * FROM payments WHERE id = ?', [id]);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Currently only supporting notes update, can be expanded later
    if (notes !== undefined) {
      await runAsync(
        db,
        'UPDATE payments SET notes = ? WHERE id = ?',
        [notes, id]
      );

      // Log action
      await runAsync(
        db,
        `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [generateId('log_'), userId, 'UPDATE_PAYMENT', 'payment', id, 'Updated payment notes', Date.now()]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}
