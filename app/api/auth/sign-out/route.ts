import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, runAsync } from '@/db';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token) {
      token = request.cookies.get('token')?.value || null;
    }

    if (token) {
      const db = await getDatabase();
      await runAsync(db, 'INSERT OR IGNORE INTO invalidated_tokens (token) VALUES (?)', [token]);
    }
  } catch (error) {
    console.error('Logout error:', error);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete('token');
  return response;
}
