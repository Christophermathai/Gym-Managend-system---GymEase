import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, runAsync, allAsync, getAsync } from '@/db';
import { generateId, generateMemberId } from '@/app/lib/utils';
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

    const userRole = await getUserRole(userId);
    if (!userRole || !['owner', 'trainer'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const db = await getDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = 'SELECT * FROM members';
    const params: any[] = [];

    if (isActive !== null) {
      query += ' WHERE is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    if (search) {
      query += isActive !== null ? ' AND' : ' WHERE';
      query += ' name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const members = await allAsync(db, query, params);

    // Fetch subscription and payment details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member: any) => {
        const subscription = await getAsync(
          db,
          `SELECT s.*, f.name as plan_name, f.duration, f.monthly_fee
           FROM subscriptions s
           LEFT JOIN fee_plans f ON s.fee_plan_id = f.id
           WHERE s.member_id = ? 
           ORDER BY s.created_at DESC LIMIT 1`,
          [member.id]
        );

        // Fetch payments for this member
        const payments = await allAsync(
          db,
          'SELECT * FROM payments WHERE member_id = ? ORDER BY payment_date DESC',
          [member.id]
        );

        return {
          ...member,
          subscription,
          subscriptions: subscription ? [subscription] : [],
          payments: payments || [],
        };
      })
    );

    return NextResponse.json({ members: membersWithDetails });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(userId);
    if (!userRole || !['owner', 'trainer'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      email,
      secondaryPhone,
      secondary_phone,
      dateOfBirth,
      date_of_birth,
      gender,
      address,
      bloodGroup,
      blood_group,
      medicalNotes,
      medical_notes,
      feePlanId,
      fee_plan_id,
      admissionDate,
      admission_date,
    } = body;

    const finalSecondaryPhone = secondaryPhone || secondary_phone;
    const finalDateOfBirth = dateOfBirth || date_of_birth;
    const finalBloodGroup = bloodGroup || blood_group;
    const finalMedicalNotes = medicalNotes || medical_notes;
    const finalFeePlanId = feePlanId || fee_plan_id;
    const finalAdmissionDate = admissionDate || admission_date;

    if (!name || !phone || !finalAdmissionDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if phone already exists
    const existing = await getAsync(db, 'SELECT id FROM members WHERE phone = ?', [phone]);
    if (existing) {
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

    // Create member
    await runAsync(
      db,
      `INSERT INTO members (id, member_id, name, email, phone, secondary_phone, date_of_birth, gender, address, blood_group, medical_notes, admission_date, is_active, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [memberDocId, memberId, name, email || null, phone, finalSecondaryPhone || null, finalDateOfBirth || null, gender || null, address || null, finalBloodGroup || null, finalMedicalNotes || null, finalAdmissionDate, 1, userId]
    );

    let subscriptionId = null;
    if (feePlan) {
      // Create subscription only if plan was selected
      const subscriptionEndDate = new Date(finalAdmissionDate);
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + feePlan.duration);
      subscriptionId = generateId('sub_');

      await runAsync(
        db,
        `INSERT INTO subscriptions (id, member_id, fee_plan_id, start_date, end_date, status, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [subscriptionId, memberDocId, finalFeePlanId, finalAdmissionDate, subscriptionEndDate.getTime(), 'active', userId]
      );
    }

    // Log action
    await runAsync(
      db,
      `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId('log_'), userId, 'ADD_MEMBER', 'member', memberDocId, `Added new member: ${name} (${memberId})`, now]
    );

    return NextResponse.json(
      { memberDocId, memberId, subscriptionId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}
