import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, allAsync, getAsync } from '@/db';
import { generateId, generateMemberId } from '@/app/lib/utils';
import { getAuthContext } from '@/app/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext(request);
    if (!context) {
      console.log('GET /api/members: Unauthorized - No context');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = context;
    if (!role || !['owner', 'trainer'].includes(role)) {
      console.log(`GET /api/members: Access denied for role: ${role}`);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const db = await getDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT 
        m.*,
        s.id as subscription_id, s.fee_plan_id, s.start_date, s.end_date, s.status as subscription_status,
        f.name as plan_name, f.duration, f.monthly_fee, f.is_personal_training
      FROM members m
      LEFT JOIN subscriptions s ON m.id = s.member_id AND s.id = (
        SELECT id FROM subscriptions WHERE member_id = m.id ORDER BY created_at DESC LIMIT 1
      )
      LEFT JOIN fee_plans f ON s.fee_plan_id = f.id
    `;
    const params: any[] = [];

    const conditions: string[] = [];
    if (isActive !== null) {
      conditions.push('m.is_active = ?');
      params.push(isActive === 'true' ? 1 : 0);
    }

    if (search) {
      conditions.push('m.name LIKE ?');
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const members = await allAsync(db, query, params);

    // Grouping results and fetching payments efficiently (could also be joined but payments is 1:N)
    const membersWithPayments = await Promise.all(
      members.map(async (member: any) => {
        const payments = await allAsync(
          db,
          'SELECT * FROM payments WHERE member_id = ? AND COALESCE(is_active, 1) = 1 ORDER BY payment_date DESC',
          [member.id]
        );

        // Normalize subscription structure to match previous API response
        const subscription = member.subscription_id ? {
          id: member.subscription_id,
          member_id: member.id,
          fee_plan_id: member.fee_plan_id,
          start_date: member.start_date,
          end_date: member.end_date,
          status: member.subscription_status,
          plan_name: member.plan_name,
          duration: member.duration,
          monthly_fee: member.monthly_fee,
          is_personal_training: member.is_personal_training
        } : null;

        return {
          ...member,
          subscription,
          subscriptions: subscription ? [subscription] : [],
          payments: payments || [],
        };
      })
    );

    return NextResponse.json({ members: membersWithPayments });
  } catch (error: any) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Failed to fetch members', details: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getAuthContext(request);
    if (!context) {
      console.log('POST /api/members: Unauthorized - No context');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, role } = context;
    if (!role || !['owner', 'trainer'].includes(role)) {
      console.log(`POST /api/members: Access denied for role: ${role}`);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      email,
      gender,
      bloodGroup,
      blood_group,
      feePlanId,
      fee_plan_id,
      admissionDate,
      admission_date,
    } = body;

    const finalBloodGroup = bloodGroup || blood_group;
    const finalFeePlanId = feePlanId || fee_plan_id;
    const finalAdmissionDate = admissionDate || admission_date;

    if (!name || !phone || !finalAdmissionDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const normalizedPhone = phone.trim();

    const db = await getDatabase();

    // Check if phone already exists
    const existing = await getAsync(db, 'SELECT id FROM members WHERE phone = ?', [normalizedPhone]);
    if (existing) {
      console.log('POST /api/members: Member already exists with phone:', normalizedPhone);
      return NextResponse.json({ error: 'Member with this phone already exists' }, { status: 400 });
    }

    let feePlan = null;
    if (finalFeePlanId) {
      // Verify fee plan exists and is active only if provided
      feePlan = await getAsync(db, 'SELECT * FROM fee_plans WHERE id = ? AND is_active = ?', [finalFeePlanId, 1]);
      if (!feePlan) {
        return NextResponse.json({ error: 'Invalid or inactive fee plan' }, { status: 400 });
      }
    }

    const memberId = generateMemberId();
    const memberDocId = generateId('member_');
    const now = Date.now();

    // Use a transaction for atomic member creation
    try {
      db.transaction(() => {
        // Create member
        db.prepare(`
          INSERT INTO members (id, member_id, name, email, phone, gender, blood_group, admission_date, is_active, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run(memberDocId, memberId, name, email || null, phone, gender || null, finalBloodGroup || null, finalAdmissionDate, 1, userId);

        if (feePlan) {
          const subscriptionEndDate = new Date(finalAdmissionDate);
          subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + feePlan.duration);
          const subscriptionId = generateId('sub_');

          db.prepare(`
            INSERT INTO subscriptions (id, member_id, fee_plan_id, start_date, end_date, status, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).run(subscriptionId, memberDocId, finalFeePlanId, finalAdmissionDate, subscriptionEndDate.getTime(), 'active', userId);
        }

        // Log action
        db.prepare(`
          INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(generateId('log_'), userId, 'ADD_MEMBER', 'member', memberDocId, `Added new member: ${name} (${memberId})`, now);
      })();

      return NextResponse.json(
        { memberDocId, memberId },
        { status: 201 }
      );
    } catch (txError) {
      console.error('Transaction failed:', txError);
      throw txError;
    }
  } catch (error: any) {
    console.error('POST /api/members: Error adding member:', error);
    return NextResponse.json({
      error: 'Failed to add member',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}
