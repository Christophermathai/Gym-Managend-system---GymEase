import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, runAsync, allAsync } from '@/db';
import { generateId } from '@/app/lib/utils';
import { getAuthUserId, getUserRole } from '@/app/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(userId);
    if (!userRole || !['owner', 'trainer'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const db = await getDatabase();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = 'SELECT * FROM expenses';
    const params: any[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY expense_date DESC LIMIT ?';
    params.push(limit);

    const expenses = await allAsync(db, query, params);
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(userId);
    if (!userRole || !['owner', 'trainer'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      category,
      description,
      amount,
      expenseDate,
      expense_date,
      paymentMode,
      payment_mode,
      receiptNumber,
      receipt_number,
      notes,
    } = body;

    const finalExpenseDate = expenseDate || expense_date;
    const finalPaymentMode = paymentMode || payment_mode;
    const finalReceiptNumber = receiptNumber || receipt_number;

    if (!category || !description || !amount || !finalExpenseDate || !finalPaymentMode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const expenseId = generateId('exp_');

    await runAsync(
      db,
      `INSERT INTO expenses (id, category, description, amount, expense_date, payment_mode, receipt_number, notes, recorded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [expenseId, category, description, amount, finalExpenseDate, finalPaymentMode, finalReceiptNumber || null, notes || null, userId]
    );

    // Log action
    await runAsync(
      db,
      `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId('log_'), userId, 'ADD_EXPENSE', 'expense', expenseId, `Added expense: ${description} (${amount})`, Date.now()]
    );

    return NextResponse.json({ id: expenseId }, { status: 201 });
  } catch (error) {
    console.error('Error recording expense:', error);
    return NextResponse.json({ error: 'Failed to record expense: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
