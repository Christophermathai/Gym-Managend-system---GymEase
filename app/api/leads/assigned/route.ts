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

export async function GET(request: NextRequest) {
    try {
        const userId = getAuthUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const db = await getDatabase();

        // Fetch leads assigned to the user OR created by the user
        // This allows trainers to see leads they added even if assigned_to logic is complex
        const query = `
      SELECT * FROM leads 
      WHERE assigned_to = ? OR created_by = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;

        const leads = await allAsync(db, query, [userId, userId, limit]);

        return NextResponse.json({ leads });
    } catch (error) {
        console.error('Error fetching assigned leads:', error);
        return NextResponse.json({ error: 'Failed to fetch assigned leads' }, { status: 500 });
    }
}
