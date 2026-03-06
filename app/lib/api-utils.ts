import { NextRequest } from 'next/server';
import { getDatabase, getAsync } from '@/db';
import { verifyToken, extractToken } from './auth';

/**
 * Extracts and validates the JWT from the Authorization header.
 * Returns the userId string, or null if unauthorized.
 */
export function getAuthUserId(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    if (!token) return null;
    const decoded = verifyToken(token);
    return decoded?.userId || null;
}

/**
 * Looks up the role ('owner' | 'trainer') for a given userId.
 * Returns null if the user has no profile.
 */
export async function getUserRole(userId: string): Promise<string | null> {
    const db = await getDatabase();
    const profile = await getAsync(db, 'SELECT role FROM user_profiles WHERE user_id = ?', [userId]);
    return profile?.role || null;
}
