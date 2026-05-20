import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, runAsync, getAsync } from '@/db';
import { generateId } from '@/app/lib/utils';
import { getAuthUserId, getUserRole } from '@/app/lib/api-utils';
import bcrypt from 'bcryptjs';

export async function POST(
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
      return NextResponse.json({ error: 'Access denied: Owner role required' }, { status: 403 });
    }

    const body = await request.json();
    const { adminPassword, action, newPassword } = body;

    // action: 'reset' | 'revoke'
    if (!adminPassword || !action) {
      return NextResponse.json({ error: 'adminPassword and action are required' }, { status: 400 });
    }
    if (action === 'reset' && !newPassword) {
      return NextResponse.json({ error: 'newPassword is required for reset action' }, { status: 400 });
    }

    const db = await getDatabase();

    // ── 1. Verify admin password ──────────────────────────────────────────────
    const adminUser = await getAsync(db, 'SELECT password FROM users WHERE id = ?', [userId]);
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin account not found' }, { status: 404 });
    }
    const passwordValid = await bcrypt.compare(adminPassword, adminUser.password);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Incorrect admin password' }, { status: 401 });
    }

    // ── 2. Find the trainer staff record ─────────────────────────────────────
    const staffMember = await getAsync(db, 'SELECT * FROM staff WHERE id = ?', [id]);
    if (!staffMember) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }
    if (staffMember.role !== 'trainer') {
      return NextResponse.json({ error: 'This action is only available for trainers' }, { status: 400 });
    }
    if (!staffMember.email) {
      return NextResponse.json({ error: 'This trainer has no login account' }, { status: 400 });
    }

    // ── 3. Find the trainer's user account ───────────────────────────────────
    const trainerUser = await getAsync(db, 'SELECT id FROM users WHERE email = ? COLLATE NOCASE', [staffMember.email]);
    if (!trainerUser) {
      return NextResponse.json({ error: 'Trainer login account not found' }, { status: 404 });
    }

    if (action === 'reset') {
      // Hash and update password
      const hashed = await bcrypt.hash(newPassword, 10);
      await runAsync(db, 'UPDATE users SET password = ? WHERE id = ?', [hashed, trainerUser.id]);

      await runAsync(
        db,
        `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [generateId('log_'), userId, 'RESET_TRAINER_PASSWORD', 'staff', id,
          `Admin reset password for trainer: ${staffMember.name}`, Date.now()]
      );

      return NextResponse.json({ success: true, message: `Password reset for ${staffMember.name}` });
    }

    if (action === 'revoke') {
      // Delete the user account → trainer can no longer log in
      await runAsync(db, 'DELETE FROM user_profiles WHERE user_id = ?', [trainerUser.id]);
      await runAsync(db, 'DELETE FROM users WHERE id = ?', [trainerUser.id]);
      // Mark staff as inactive too
      await runAsync(db, 'UPDATE staff SET is_active = 0 WHERE id = ?', [id]);

      await runAsync(
        db,
        `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [generateId('log_'), userId, 'REVOKE_TRAINER_ACCESS', 'staff', id,
          `Admin revoked login access for trainer: ${staffMember.name}`, Date.now()]
      );

      return NextResponse.json({ success: true, message: `Login access revoked for ${staffMember.name}` });
    }

    return NextResponse.json({ error: 'Invalid action. Use "reset" or "revoke"' }, { status: 400 });

  } catch (error) {
    console.error('Error in reset-password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
