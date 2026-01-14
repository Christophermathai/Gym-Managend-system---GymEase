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
      const existing = await getAsync(db, 'SELECT id FROM users WHERE email = ?', [email]);
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

      const token = createToken(userId, email);
      const response = NextResponse.json({ token, userId });
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    } else {
      // Sign in
      const user = await getAsync(db, 'SELECT id, password FROM users WHERE email = ?', [email]);
      if (!user) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }

      const validPassword = await verifyPassword(password, user.password);
      if (!validPassword) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }

      const token = createToken(user.id, email);
      const response = NextResponse.json({ token, userId: user.id });
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
