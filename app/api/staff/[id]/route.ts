import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, runAsync, getAsync } from '@/db';
import { generateId } from '@/app/lib/utils';
import { getAuthUserId, getUserRole } from '@/app/lib/api-utils';

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
    const { name, role, salary, email, phone, joiningDate, notes, isActive } = body;

    const db = await getDatabase();
    const staff = await getAsync(db, 'SELECT * FROM staff WHERE id = ?', [id]);
    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Sync credentials and profile if they are a trainer
    if (staff.role === 'trainer' && staff.email) {
      const trainerUser = await getAsync(db, 'SELECT id FROM users WHERE email = ? COLLATE NOCASE', [staff.email]);
      if (trainerUser) {
        // If email has changed, verify the new email is not already in use
        if (email && email.toLowerCase() !== staff.email.toLowerCase()) {
          const existingUser = await getAsync(
            db,
            'SELECT id FROM users WHERE email = ? COLLATE NOCASE AND id != ?',
            [email, trainerUser.id]
          );
          if (existingUser) {
            return NextResponse.json({ error: 'New email is already in use by another user account' }, { status: 400 });
          }
          await runAsync(db, 'UPDATE users SET email = ? WHERE id = ?', [email, trainerUser.id]);
        }

        // Update user profile details
        await runAsync(
          db,
          `UPDATE user_profiles SET 
             name = COALESCE(?, name),
             phone = COALESCE(?, phone),
             is_active = COALESCE(?, is_active)
           WHERE user_id = ?`,
          [
            name !== undefined ? name : null,
            phone !== undefined ? phone : null,
            isActive !== undefined ? (isActive ? 1 : 0) : null,
            trainerUser.id
          ]
        );
      }
    }

    const updateQuery = `
      UPDATE staff SET 
        name = COALESCE(?, name),
        role = COALESCE(?, role),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        salary = COALESCE(?, salary),
        joining_date = COALESCE(?, joining_date),
        is_active = COALESCE(?, is_active),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `;

    await runAsync(db, updateQuery, [
      name, role, email, phone, salary, joiningDate,
      isActive !== undefined ? (isActive ? 1 : 0) : null, notes, id
    ]);

    await runAsync(
      db,
      `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId('log_'), userId, 'UPDATE_STAFF', 'staff', id, `Updated staff: ${staff.name}`, Date.now()]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ error: error.message || 'Failed to update staff' }, { status: 500 });
  }
}

export async function DELETE(
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

    const db = await getDatabase();
    const staff = await getAsync(db, 'SELECT * FROM staff WHERE id = ?', [id]);
    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    if (staff.is_active === 0) {
      // Inactive staff is deleted permanently from the system
      if (staff.role === 'trainer' && staff.email) {
        const trainerUser = await getAsync(db, 'SELECT id FROM users WHERE email = ? COLLATE NOCASE', [staff.email]);
        if (trainerUser) {
          await runAsync(db, 'DELETE FROM user_profiles WHERE user_id = ?', [trainerUser.id]);
          await runAsync(db, 'DELETE FROM users WHERE id = ?', [trainerUser.id]);
        }
      }

      await runAsync(db, 'DELETE FROM staff WHERE id = ?', [id]);

      await runAsync(
        db,
        `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [generateId('log_'), userId, 'HARD_DELETE_STAFF', 'staff', id, `Permanently deleted inactive staff: ${staff.name}`, Date.now()]
      );
    } else {
      // Soft delete: deactivate
      await runAsync(db, 'UPDATE staff SET is_active = ? WHERE id = ?', [0, id]);

      await runAsync(
        db,
        `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [generateId('log_'), userId, 'DELETE_STAFF', 'staff', id, `Deactivated staff: ${staff.name}`, Date.now()]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
  }
}
