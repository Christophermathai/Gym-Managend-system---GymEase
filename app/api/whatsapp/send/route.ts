import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getAsync } from '@/db';
import { getAuthContext } from '@/app/lib/api-utils';

export async function POST(request: NextRequest) {
    try {
        const authCtx = await getAuthContext(request);
        if (!authCtx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { memberPhone, messageText } = body;

        if (!memberPhone || !messageText) {
            return NextResponse.json({ error: 'Phone number and message text are required' }, { status: 400 });
        }

        const db = await getDatabase();
        const settings = await getAsync(db, 'SELECT * FROM gym_settings WHERE id = 1', []);

        if (!settings || !settings.gupshup_api_key || !settings.gupshup_app_name) {
            return NextResponse.json({ error: 'Gupshup credentials are not configured in settings.' }, { status: 400 });
        }

        // Clean the phone number (assuming it might have +91 or just be 10 digits)
        let cleanPhone = memberPhone.replace(/\D/g, '');
        if (cleanPhone.length === 10) {
            cleanPhone = '91' + cleanPhone; // Default to India country code if not present
        }

        // Prepare the payload for Gupshup standard text message
        const gupshupEndpoint = 'https://api.gupshup.io/wa/api/v1/msg';
        
        const formData = new URLSearchParams();
        formData.append('channel', 'whatsapp');
        formData.append('source', settings.gupshup_app_name);
        formData.append('destination', cleanPhone);
        formData.append('src.name', settings.gupshup_app_name);
        
        // We structure it as a standard text message.
        // If it's a template, the payload would be different (e.g. template JSON),
        // but user requested to use the embedded text message from settings.
        const msgPayload = {
            type: "text",
            text: messageText
        };
        formData.append('message', JSON.stringify(msgPayload));

        const response = await fetch(gupshupEndpoint, {
            method: 'POST',
            headers: {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded',
                'apikey': settings.gupshup_api_key,
            },
            body: formData.toString()
        });

        const data = await response.text();
        
        if (!response.ok) {
            console.error('Gupshup API Error:', data);
            return NextResponse.json({ error: 'Failed to send WhatsApp message via Gupshup', details: data }, { status: response.status });
        }

        return NextResponse.json({ success: true, response: data });

    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 });
    }
}
