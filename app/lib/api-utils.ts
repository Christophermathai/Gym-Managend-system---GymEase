import { NextRequest } from 'next/server';
import { getDatabase, getAsync } from '@/db';
import { verifyToken, extractToken } from './auth';

/**
 * Extracts and validates the JWT from the Authorization header.
 * Returns the { userId, role } object, or null if unauthorized.
 * Handles database fallback if role is missing from token.
 */
export async function getAuthContext(request: NextRequest): Promise<{ userId: string; role: string } | null> {
    const authHeader = request.headers.get('authorization');
    let token = extractToken(authHeader);

    // Fallback to HttpOnly cookie
    if (!token) {
        token = request.cookies.get('token')?.value || null;
    }

    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    const db = await getDatabase();
    const isInvalidated = await getAsync(db, 'SELECT token FROM invalidated_tokens WHERE token = ?', [token]);
    if (isInvalidated) {
        console.warn('Attempted to use an invalidated token.');
        return null;
    }

    let role = decoded.role;
    if (!role) {
        // Fallback for old tokens
        role = await getUserRole(decoded.userId) || 'trainer';
    }

    console.log(`getAuthContext: Decoded user ${decoded.userId}, role: ${role}`);
    return { userId: decoded.userId, role };
}

/**
 * Extracts and validates the JWT from the Authorization header (Synchronous).
 * ONLY use this if you don't need the role or are sure the token is new.
 * DEPRECATED: Use getAuthContext instead.
 */
export function getAuthUserContext(request: NextRequest): { userId: string; role: string } | null {
    const authHeader = request.headers.get('authorization');
    let token = extractToken(authHeader);
    if (!token) {
        token = request.cookies.get('token')?.value || null;
    }
    if (!token) return null;
    const decoded = verifyToken(token);
    if (!decoded) return null;
    return { userId: decoded.userId, role: decoded.role };
}

/**
 * Looks up the role ('owner' | 'trainer') for a given userId.
 * DEPRECATED: Role is now included in JWT. This is kept for fallback only.
 */
export async function getUserRole(userId: string): Promise<string | null> {
    const db = await getDatabase();
    const profile = await getAsync(db, 'SELECT role FROM user_profiles WHERE user_id = ?', [userId]);
    return profile?.role || null;
}

/**
 * Extracts the userId for compatibility with older routes.
 */
export function getAuthUserId(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    let token = extractToken(authHeader);
    if (!token) {
        token = request.cookies.get('token')?.value || null;
    }
    if (!token) return null;
    const decoded = verifyToken(token);
    return decoded?.userId || null;
}
