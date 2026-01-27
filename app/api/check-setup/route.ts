import { NextResponse } from 'next/server';
import { getDatabase } from '@/db';

export async function GET() {
    try {
        const db = await getDatabase();

        // Check if any users exist
        const result = await db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

        return NextResponse.json({
            needsSetup: result.count === 0
        });
    } catch (error) {
        console.error('Error checking setup status:', error);
        return NextResponse.json({ error: 'Failed to check setup status' }, { status: 500 });
    }
}
