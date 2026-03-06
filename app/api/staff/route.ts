import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, runAsync, allAsync, getAsync } from '@/db';
import { generateId } from '@/app/lib/utils';
import { getAuthUserId, getUserRole } from '@/app/lib/api-utils';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
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
    const staff = await allAsync(db, 'SELECT * FROM staff ORDER BY joining_date DESC');
    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
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
      role,
      email,
      phone,
      salary,
      joiningDate,
      joining_date,
      password,
      notes,
    } = body;

    const finalJoiningDate = joiningDate || joining_date;

    if (!name || !role || !phone || !salary || !finalJoiningDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Additional validation for trainers
    if (role === 'trainer' && (!email || !password)) {
      return NextResponse.json(
        { error: 'Email and password are required for trainers' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const staffId = generateId('staff_');

    // If role is trainer, create user account
    if (role === 'trainer' && email && password) {
      // Check if email already exists
      const existingUser = await getAsync(db, 'SELECT id FROM users WHERE email = ?', [email]);
      if (existingUser) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user account
      const userId = generateId('user_');
      await runAsync(
        db,
        'INSERT INTO users (id, email, password, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [userId, email, hashedPassword]
      );

      // Create user profile
      await runAsync(
        db,
        'INSERT INTO user_profiles (user_id, name, role, phone, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [userId, name, 'trainer', phone]
      );
    }

    // Create staff record (for all roles)
    await runAsync(
      db,
      `INSERT INTO staff (id, name, role, email, phone, salary, joining_date, is_active, notes, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [staffId, name, role, email || null, phone, salary, finalJoiningDate, 1, notes || null, userId]
    );

    // Log action
    await runAsync(
      db,
      `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId('log_'), userId, 'ADD_STAFF', 'staff', staffId, `Added staff: ${name}${role === 'trainer' ? ' (with login account)' : ''}`, Date.now()]
    );

    return NextResponse.json({ id: staffId }, { status: 201 });
  } catch (error) {
    console.error('Error adding staff:', error);
    return NextResponse.json({ error: 'Failed to add staff' }, { status: 500 });
  }
}
