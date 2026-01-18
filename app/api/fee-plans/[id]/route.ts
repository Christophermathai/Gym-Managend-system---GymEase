import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, runAsync, getAsync } from '@/db';
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(userId);
    if (userRole !== 'owner') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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
      security_deposit
    } = body;

    const finalMonthlyFee = monthlyFee ?? monthly_fee;
    const finalAdmissionFee = admissionFee ?? admission_fee;
    const finalRegistrationFee = registrationFee ?? registration_fee;
    const finalSecurityDeposit = securityDeposit ?? security_deposit;

    if (!name || !duration || finalMonthlyFee === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDatabase();
    const plan = await getAsync(db, 'SELECT * FROM fee_plans WHERE id = ?', [id]);
    if (!plan) {
      return NextResponse.json({ error: 'Fee plan not found' }, { status: 404 });
    }

    await runAsync(
      db,
      `UPDATE fee_plans SET name = ?, description = ?, duration = ?, monthly_fee = ?, 
       admission_fee = ?, registration_fee = ?, security_deposit = ?
       WHERE id = ?`,
      [name, description || null, duration, finalMonthlyFee, finalAdmissionFee || 0, finalRegistrationFee || 0, finalSecurityDeposit || 0, id]
    );

    await runAsync(
      db,
      `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId('log_'), userId, 'UPDATE_PLAN', 'fee_plan', id, `Updated plan: ${name}`, Date.now()]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating fee plan:', error);
    return NextResponse.json({ error: 'Failed to update fee plan' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(userId);
    if (userRole !== 'owner') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const db = await getDatabase();
    const plan = await getAsync(db, 'SELECT * FROM fee_plans WHERE id = ?', [id]);
    if (!plan) {
      return NextResponse.json({ error: 'Fee plan not found' }, { status: 404 });
    }

    console.log('Deleting fee plan:', id, 'Current is_active:', plan.is_active);

    // Soft delete: Mark as inactive
    const result = await runAsync(db, 'UPDATE fee_plans SET is_active = ? WHERE id = ?', [0, id]);

    console.log('Delete result:', result);

    // Verify the update
    const updatedPlan = await getAsync(db, 'SELECT * FROM fee_plans WHERE id = ?', [id]);
    console.log('After update, is_active:', updatedPlan?.is_active);

    await runAsync(
      db,
      `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId('log_'), userId, 'DELETE_PLAN', 'fee_plan', id, `Deleted plan: ${plan.name}`, Date.now()]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting fee plan:', error);
    return NextResponse.json({ error: 'Failed to delete fee plan' }, { status: 500 });
  }
}
