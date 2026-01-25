import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getAsync, runAsync } from '@/db';
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
        const settings = await getAsync(db, 'SELECT * FROM gym_settings WHERE id = 1', []);

        return NextResponse.json(settings || { gym_name: 'Gym Ease' });
    } catch (error) {
        console.error('Error fetching gym settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const userId = getAuthUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { gym_name, gym_address, gym_phone, gym_email } = body;

        const db = await getDatabase();

        await runAsync(
            db,
            'UPDATE gym_settings SET gym_name = ?, gym_address = ?, gym_phone = ?, gym_email = ? WHERE id = 1',
            [gym_name, gym_address || null, gym_phone || null, gym_email || null]
        );

        return NextResponse.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating gym settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
