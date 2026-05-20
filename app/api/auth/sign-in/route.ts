import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, runAsync, getAsync } from '@/db';
import { generateId } from '@/app/lib/utils';
import { hashPassword, createToken, verifyPassword } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, flow } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const db = await getDatabase();

    if (flow === 'signUp') {
      // Check if user exists
      const existing = await getAsync(db, 'SELECT id FROM users WHERE email = ? COLLATE NOCASE', [email]);
      if (existing) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }

      // Create new user
      const userId = generateId('user_');
      const hashedPassword = await hashPassword(password);
      await runAsync(
        db,
        'INSERT INTO users (id, email, password) VALUES (?, ?, ?)',
        [userId, email, hashedPassword]
      );

      // Fetch role
      const profile = await getAsync(db, 'SELECT role FROM user_profiles WHERE user_id = ?', [userId]);
      const role = profile?.role || 'trainer'; // Default to trainer if profile not yet setup

      const token = createToken(userId, email, role);
      const response = NextResponse.json({ token, userId });
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: false, // Must be false for local HTTP (Electron 127.0.0.1)
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    } else {
      // Sign in
      const user = await getAsync(db, 'SELECT id, password FROM users WHERE email = ? COLLATE NOCASE', [email]);
      if (!user) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }

      const validPassword = await verifyPassword(password, user.password);
      if (!validPassword) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }

      // Fetch role
      const profile = await getAsync(db, 'SELECT role FROM user_profiles WHERE user_id = ?', [user.id]);
      const role = profile?.role || 'trainer';

      const token = createToken(user.id, email, role);
      const response = NextResponse.json({ token, userId: user.id });
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: false, // Must be false for local HTTP (Electron 127.0.0.1)
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
