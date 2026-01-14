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

        const db = await getDatabase();

        // Fetch expenses (utilities) for the trainer/user
        // Assuming expenses logic might be "created_by" the user or just general expenses visible to them
        // For now, let's fetch expenses created by this user or all expenses if role is owner (but this route is my-expenses, so likely created by user)

        const query = `
      SELECT * FROM expenses 
      WHERE recorded_by = ? 
      ORDER BY expense_date DESC
    `;

        const expenses = await allAsync(db, query, [userId]);

        return NextResponse.json({ expenses });
    } catch (error) {
        console.error('Error fetching my expenses:', error);
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }
}
