import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getAsync, runAsync, allAsync } from '@/db';
import { generateId } from '@/app/lib/utils';
import { verifyToken, extractToken } from '@/app/lib/auth';

function getAuthUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  const token = extractToken(authHeader);
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();

    // Get user with profile
    const user = await getAsync(db, 'SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const profile = await getAsync(
      db,
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    return NextResponse.json({
      id: user.id,
      email: user.email,
      profile: profile || null,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, role, phone } = await request.json();

    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role required' }, { status: 400 });
    }

    if (!['owner', 'trainer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const db = await getDatabase();

    // Check if profile already exists
    const existing = await getAsync(
      db,
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    if (existing) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 400 });
    }

    const profileId = generateId('profile_');
    await runAsync(
      db,
      `INSERT INTO user_profiles (id, user_id, role, name, phone, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [profileId, userId, role, name, phone || null, true]
    );

    // Log action
    await runAsync(
      db,
      `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId('log_'), userId, 'CREATE_USER_PROFILE', 'userProfile', profileId, `Created profile for ${name}`, Date.now()]
    );

    return NextResponse.json({
      id: profileId,
      userId,
      name,
      role,
      phone,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}
