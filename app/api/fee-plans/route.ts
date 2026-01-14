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

    const userRole = await getUserRole(userId);
    if (!userRole || !['owner', 'trainer'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly');
    const showAll = searchParams.get('showAll') === 'true';

    let query = 'SELECT * FROM fee_plans';
    const params: any[] = [];

    // By default, only show active plans unless showAll is true
    if (!showAll) {
      query += ' WHERE is_active = ?';
      params.push(true);
    } else if (activeOnly === 'true') {
      query += ' WHERE is_active = ?';
      params.push(true);
    }

    query += ' ORDER BY created_at DESC';

    const feePlans = await allAsync(db, query, params);
    return NextResponse.json(feePlans);
  } catch (error) {
    console.error('Error fetching fee plans:', error);
    return NextResponse.json({ error: 'Failed to fetch fee plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(userId);
    if (userRole !== 'owner') {
      return NextResponse.json({ error: 'Access denied: Owner role required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      duration,
      monthlyFee,
      monthly_fee,
      admissionFee,
      admission_fee,
      registrationFee,
      registration_fee,
      securityDeposit,
      security_deposit,
    } = body;

    const finalMonthlyFee = monthlyFee || monthly_fee;
    const finalAdmissionFee = admissionFee || admission_fee;
    const finalRegistrationFee = registrationFee || registration_fee;
    const finalSecurityDeposit = securityDeposit || security_deposit;

    // Detailed validation
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!duration) {
      return NextResponse.json({ error: 'Duration is required' }, { status: 400 });
    }

    if (finalMonthlyFee === undefined || finalMonthlyFee === null) {
      return NextResponse.json({ error: 'Monthly fee is required' }, { status: 400 });
    }

    if (![1, 3, 6, 12].includes(Number(duration))) {
      return NextResponse.json({ error: 'Duration must be 1, 3, 6, or 12 months' }, { status: 400 });
    }

    const db = await getDatabase();
    const feePlanId = generateId('plan_');

    await runAsync(
      db,
      `INSERT INTO fee_plans (id, name, description, duration, monthly_fee, admission_fee, registration_fee, security_deposit, is_active, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [feePlanId, name, description || null, duration, finalMonthlyFee, finalAdmissionFee || null, finalRegistrationFee || null, finalSecurityDeposit || null, true, userId]
    );

    // Log action
    await runAsync(
      db,
      `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId('log_'), userId, 'CREATE_FEE_PLAN', 'feePlan', feePlanId, `Created fee plan: ${name}`, Date.now()]
    );

    return NextResponse.json({ id: feePlanId }, { status: 201 });
  } catch (error) {
    console.error('Error creating fee plan:', error);
    return NextResponse.json({ error: 'Failed to create fee plan' }, { status: 500 });
  }
}
