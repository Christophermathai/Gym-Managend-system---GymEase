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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(userId);
    if (!userRole || !['owner', 'trainer'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const db = await getDatabase();

    // Fetch member
    const member = await getAsync(db, 'SELECT * FROM members WHERE id = ?', [id]);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Fetch latest subscription with fee plan details
    const subscription = await getAsync(
      db,
      `SELECT s.*, f.name as plan_name, f.duration, f.monthly_fee
       FROM subscriptions s
       LEFT JOIN fee_plans f ON s.fee_plan_id = f.id
       WHERE s.member_id = ?
       ORDER BY s.created_at DESC LIMIT 1`,
      [id]
    );

    return NextResponse.json({
      member,
      subscription,
    });
  } catch (error) {
    console.error('Error fetching member details:', error);
    return NextResponse.json({ error: 'Failed to fetch member details' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { memberId, ...updateData } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'memberId required' }, { status: 400 });
    }

    const db = await getDatabase();

    // Get existing member
    const member = await getAsync(db, 'SELECT * FROM members WHERE id = ?', [memberId]);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check if phone number already exists (if changing)
    if (updateData.phone && updateData.phone !== member.phone) {
      const existing = await getAsync(db, 'SELECT id FROM members WHERE phone = ? AND id != ?', [updateData.phone, memberId]);
      if (existing) {
        return NextResponse.json({ error: 'Phone number already exists' }, { status: 400 });
      }
    }

    // Update only provided fields
    const updateFields: any = { updated_at: new Date().toISOString() };
    if (updateData.name) updateFields.name = updateData.name;
    if (updateData.phone) updateFields.phone = updateData.phone;
    if (updateData.email !== undefined) updateFields.email = updateData.email;
    if (updateData.secondaryPhone !== undefined) updateFields.secondary_phone = updateData.secondaryPhone;
    if (updateData.dateOfBirth !== undefined) updateFields.date_of_birth = updateData.dateOfBirth;
    if (updateData.gender !== undefined) updateFields.gender = updateData.gender;
    if (updateData.address !== undefined) updateFields.address = updateData.address;
    if (updateData.bloodGroup !== undefined) updateFields.blood_group = updateData.bloodGroup;
    if (updateData.medicalNotes !== undefined) updateFields.medical_notes = updateData.medicalNotes;
    if (updateData.isActive !== undefined) updateFields.is_active = updateData.isActive;

    let updateQuery = 'UPDATE members SET ';
    const updateParams: any[] = [];
    const setClauses = Object.keys(updateFields).map(key => {
      updateParams.push(updateFields[key]);
      return `${key} = ?`;
    });
    updateQuery += setClauses.join(', ') + ' WHERE id = ?';
    updateParams.push(memberId);

    await runAsync(db, updateQuery, updateParams);

    // Log action
    await runAsync(
      db,
      `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId('log_'), userId, 'UPDATE_MEMBER', 'member', memberId, `Updated member: ${member.name}`, Date.now()]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(userId);
    if (!userRole || userRole !== 'owner') {
      return NextResponse.json({ error: 'Only owners can delete members' }, { status: 403 });
    }

    const db = await getDatabase();

    // Check if member exists
    const member = await getAsync(db, 'SELECT * FROM members WHERE id = ?', [id]);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Delete related records first (due to foreign key constraints)
    await runAsync(db, 'DELETE FROM payments WHERE member_id = ?', [id]);
    await runAsync(db, 'DELETE FROM subscriptions WHERE member_id = ?', [id]);

    // Delete the member
    await runAsync(db, 'DELETE FROM members WHERE id = ?', [id]);

    // Log action
    await runAsync(
      db,
      `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId('log_'), userId, 'DELETE_MEMBER', 'member', id, `Deleted member: ${member.name}`, Date.now()]
    );

    return NextResponse.json({ success: true, message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
