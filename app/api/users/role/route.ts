import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, allAsync } from '@/db';
import { verifyToken, extractToken } from '@/app/lib/auth';

function getAuthUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  const token = extractToken(authHeader);
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

async function getUserRole(db: any, userId: string): Promise<string | null> {
  const profile = await db.get('SELECT role FROM user_profiles WHERE user_id = ?', [userId]);
  return profile?.role || null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const userRole = await getUserRole(db, userId);

    return NextResponse.json({ role: userRole });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 });
  }
}
