import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, allAsync, getAsync } from '@/db';
import { getAuthUserId, getUserRole } from '@/app/lib/api-utils';

export async function GET(request: NextRequest) {
    try {
        const userId = getAuthUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userRole = await getUserRole(userId);
        if (userRole !== 'owner') {
            return NextResponse.json({ error: 'Access denied: Owner role required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const from = searchParams.get('from') ? parseInt(searchParams.get('from')!) : new Date(new Date().getFullYear(), 0, 1).getTime();
        const to = searchParams.get('to') ? parseInt(searchParams.get('to')!) : Date.now();
        const days = parseInt(searchParams.get('days') || '7');

        if (!type) {
            return NextResponse.json({ error: 'Report type is required' }, { status: 400 });
        }

        const db = await getDatabase();

        // ─── MEMBERS REPORT ───────────────────────────────────────────────────────
        if (type === 'members') {
            const members = await allAsync(
                db,
                `SELECT 
          m.member_id,
          m.name,
          m.phone,
          m.email,
          m.gender,
          m.admission_date,
          m.is_active,
          m.blood_group,
          s.status as subscription_status,
          s.start_date,
          s.end_date,
          f.name as plan_name,
          f.duration,
          f.monthly_fee
        FROM members m
        LEFT JOIN subscriptions s ON m.id = s.member_id AND s.status = 'active'
        LEFT JOIN fee_plans f ON s.fee_plan_id = f.id
        ORDER BY m.admission_date DESC`,
                []
            );

            const total = members.length;
            const active = members.filter((m: any) => m.is_active === 1).length;
            const withActiveSubscription = members.filter((m: any) => m.subscription_status === 'active').length;

            return NextResponse.json({
                type,
                generatedAt: Date.now(),
                summary: { total, active, inactive: total - active, withActiveSubscription },
                data: members,
            });
        }

        // ─── PAYMENTS REPORT ──────────────────────────────────────────────────────
        if (type === 'payments') {
            const payments = await allAsync(
                db,
                `SELECT 
          p.id,
          p.amount,
          p.payment_type,
          p.payment_mode,
          p.payment_date,
          p.status,
          p.notes,
          p.transaction_id,
          m.name as member_name,
          m.member_id as member_display_id,
          m.phone as member_phone
        FROM payments p
        LEFT JOIN members m ON p.member_id = m.id
        WHERE p.payment_date >= ? AND p.payment_date <= ?
        ORDER BY p.payment_date DESC`,
                [from, to]
            );

            const completed = payments.filter((p: any) => p.status === 'completed');
            const pending = payments.filter((p: any) => p.status === 'pending');
            const totalRevenue = completed.reduce((sum: number, p: any) => sum + p.amount, 0);
            const totalPending = pending.reduce((sum: number, p: any) => sum + p.amount, 0);

            // Breakdown by payment type
            const byType: Record<string, number> = {};
            completed.forEach((p: any) => {
                byType[p.payment_type] = (byType[p.payment_type] || 0) + p.amount;
            });

            return NextResponse.json({
                type,
                generatedAt: Date.now(),
                dateRange: { from, to },
                summary: {
                    totalTransactions: payments.length,
                    completedTransactions: completed.length,
                    pendingTransactions: pending.length,
                    totalRevenue,
                    totalPending,
                    byType,
                },
                data: payments,
            });
        }

        // ─── EXPENSES REPORT ──────────────────────────────────────────────────────
        if (type === 'expenses') {
            const expenses = await allAsync(
                db,
                `SELECT 
          e.id,
          e.category,
          e.description,
          e.amount,
          e.expense_date,
          e.payment_mode,
          e.receipt_number,
          e.notes,
          up.name as recorded_by_name
        FROM expenses e
        LEFT JOIN user_profiles up ON e.recorded_by = up.user_id
        WHERE e.expense_date >= ? AND e.expense_date <= ?
        ORDER BY e.expense_date DESC`,
                [from, to]
            );

            const totalExpenses = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);

            // Subtotals by category
            const byCategory: Record<string, number> = {};
            expenses.forEach((e: any) => {
                byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
            });

            return NextResponse.json({
                type,
                generatedAt: Date.now(),
                dateRange: { from, to },
                summary: {
                    totalExpenses,
                    totalTransactions: expenses.length,
                    byCategory,
                },
                data: expenses,
            });
        }

        // ─── FINANCIAL SUMMARY REPORT ─────────────────────────────────────────────
        if (type === 'summary') {
            const payments = await allAsync(
                db,
                `SELECT amount, payment_date, payment_type FROM payments WHERE status = 'completed' AND payment_date >= ? AND payment_date <= ?`,
                [from, to]
            );

            const expenses = await allAsync(
                db,
                `SELECT amount, expense_date, category FROM expenses WHERE expense_date >= ? AND expense_date <= ?`,
                [from, to]
            );

            const totalRevenue = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
            const totalExpenses = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
            const netProfit = totalRevenue - totalExpenses;

            // Revenue by payment type
            const revenueByType: Record<string, number> = {};
            payments.forEach((p: any) => {
                revenueByType[p.payment_type] = (revenueByType[p.payment_type] || 0) + p.amount;
            });

            // Expenses by category
            const expensesByCategory: Record<string, number> = {};
            expenses.forEach((e: any) => {
                expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
            });

            // Active members count
            const activeMembersRow = await getAsync(db, 'SELECT COUNT(*) as count FROM members WHERE is_active = 1', []);
            const activeMembers = activeMembersRow?.count || 0;

            return NextResponse.json({
                type,
                generatedAt: Date.now(),
                dateRange: { from, to },
                summary: {
                    totalRevenue,
                    totalExpenses,
                    netProfit,
                    profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0',
                    activeMembers,
                    revenueByType,
                    expensesByCategory,
                },
                data: [],
            });
        }

        // ─── EXPIRING MEMBERSHIPS REPORT ──────────────────────────────────────────
        if (type === 'expiring') {
            const now = Date.now();
            const future = now + days * 24 * 60 * 60 * 1000;

            const members = await allAsync(
                db,
                `SELECT 
          m.member_id,
          m.name,
          m.phone,
          m.email,
          m.is_active,
          s.end_date,
          s.status as subscription_status,
          f.name as plan_name,
          f.duration,
          f.monthly_fee,
          CAST((s.end_date - ? ) / 86400000 AS INTEGER) as days_remaining
        FROM members m
        INNER JOIN subscriptions s ON m.id = s.member_id
        INNER JOIN fee_plans f ON s.fee_plan_id = f.id
        WHERE s.status = 'active'
          AND s.end_date >= ?
          AND s.end_date <= ?
          AND m.is_active = 1
        ORDER BY s.end_date ASC`,
                [now, now, future]
            );

            return NextResponse.json({
                type,
                generatedAt: Date.now(),
                daysAhead: days,
                summary: { expiringCount: members.length },
                data: members,
            });
        }

        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });

    } catch (error) {
        console.error('Error generating report:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
