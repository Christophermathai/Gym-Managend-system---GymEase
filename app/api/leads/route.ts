import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, runAsync, allAsync } from '@/db';
import { generateId } from '@/app/lib/utils';
import { getAuthUserId } from '@/app/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = 'SELECT * FROM leads';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const leads = await allAsync(db, query, params);
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      email,
      source,
      interestLevel,
      interest_level,
      notes,
    } = body;

    const finalInterestLevel = interestLevel || interest_level;

    if (!name || !phone || !source || !finalInterestLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const leadId = generateId('lead_');

    await runAsync(
      db,
      `INSERT INTO leads (id, name, phone, email, source, interest_level, status, notes, assigned_to, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [leadId, name, phone, email || null, source, finalInterestLevel, 'new', notes || null, userId, userId]
    );

    // Log action
    await runAsync(
      db,
      `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId('log_'), userId, 'ADD_LEAD', 'lead', leadId, `Added lead: ${name}`, Date.now()]
    );

    return NextResponse.json({ id: leadId }, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to create lead: ${message}` }, { status: 500 });
  }
}
