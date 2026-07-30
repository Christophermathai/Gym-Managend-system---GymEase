import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getAsync, runAsync } from '@/db';
import { getAuthContext } from '@/app/lib/api-utils';

export async function GET(request: NextRequest) {
    try {
        const authCtx = await getAuthContext(request);
        if (!authCtx) {
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
        const authCtx = await getAuthContext(request);
        if (!authCtx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (authCtx.role !== 'owner') {
            return NextResponse.json({ error: 'Forbidden: Owner role required' }, { status: 403 });
        }

        const body = await request.json();
        const { gym_name, gym_address, gym_phone, gym_email, whatsapp_message_template, whatsapp_mode, api_key, available_credits, show_transaction_id } = body;

        const db = await getDatabase();

        await runAsync(
            db,
            'UPDATE gym_settings SET gym_name = ?, gym_address = ?, gym_phone = ?, gym_email = ?, whatsapp_message_template = ?, whatsapp_mode = ?, api_key = ?, available_credits = ?, show_transaction_id = ? WHERE id = 1',
            [gym_name, gym_address || null, gym_phone || null, gym_email || null, whatsapp_message_template || null, whatsapp_mode || 'manual', api_key || null, available_credits ?? 0, show_transaction_id ?? 1]
        );

        return NextResponse.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating gym settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
