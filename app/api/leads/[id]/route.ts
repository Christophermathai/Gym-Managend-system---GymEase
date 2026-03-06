import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, runAsync, getAsync } from '@/db';
import { generateId } from '@/app/lib/utils';
import { getAuthUserId } from '@/app/lib/api-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, email, source, interestLevel, interest_level, status, assignedTo, notes } = body;

    const db = await getDatabase();
    const lead = await getAsync(db, 'SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Build dynamic update query based on provided fields
    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [];

    if (name !== undefined) {
      updates.unshift('name = ?');
      values.push(name);
    }
    if (phone !== undefined) {
      updates.unshift('phone = ?');
      values.push(phone);
    }
    if (email !== undefined) {
      updates.unshift('email = ?');
      values.push(email);
    }
    if (source !== undefined) {
      updates.unshift('source = ?');
      values.push(source);
    }
    if (interestLevel !== undefined || interest_level !== undefined) {
      updates.unshift('interest_level = ?');
      values.push(interestLevel || interest_level);
    }
    if (status !== undefined) {
      updates.unshift('status = ?');
      values.push(status);
    }
    if (assignedTo !== undefined) {
      updates.unshift('assigned_to = ?');
      values.push(assignedTo);
    }
    if (notes !== undefined) {
      updates.unshift('notes = ?');
      values.push(notes);
    }

    values.push(id);

    const updateQuery = `UPDATE leads SET ${updates.join(', ')} WHERE id = ?`;

    await runAsync(db, updateQuery, values);

    await runAsync(
      db,
      `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId('log_'), userId, 'UPDATE_LEAD', 'lead', id, `Updated lead: ${lead.name} - Status: ${status || lead.status}`, Date.now()]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, email, source, interestLevel, interest_level, status, assignedTo, notes } = body;

    const db = await getDatabase();
    const lead = await getAsync(db, 'SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Build dynamic update query based on provided fields
    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [];

    if (name !== undefined) {
      updates.unshift('name = ?');
      values.push(name);
    }
    if (phone !== undefined) {
      updates.unshift('phone = ?');
      values.push(phone);
    }
    if (email !== undefined) {
      updates.unshift('email = ?');
      values.push(email);
    }
    if (source !== undefined) {
      updates.unshift('source = ?');
      values.push(source);
    }
    if (interestLevel !== undefined || interest_level !== undefined) {
      updates.unshift('interest_level = ?');
      values.push(interestLevel || interest_level);
    }
    if (status !== undefined) {
      updates.unshift('status = ?');
      values.push(status);
    }
    if (assignedTo !== undefined) {
      updates.unshift('assigned_to = ?');
      values.push(assignedTo);
    }
    if (notes !== undefined) {
      updates.unshift('notes = ?');
      values.push(notes);
    }

    values.push(id);

    const updateQuery = `UPDATE leads SET ${updates.join(', ')} WHERE id = ?`;

    await runAsync(db, updateQuery, values);

    await runAsync(
      db,
      `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId('log_'), userId, 'UPDATE_LEAD', 'lead', id, `Updated lead: ${lead.name} - Status: ${status || lead.status}`, Date.now()]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const lead = await getAsync(db, 'SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await runAsync(db, 'DELETE FROM leads WHERE id = ?', [id]);

    await runAsync(
      db,
      `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId('log_'), userId, 'DELETE_LEAD', 'lead', id, `Deleted lead: ${lead.name}`, Date.now()]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
