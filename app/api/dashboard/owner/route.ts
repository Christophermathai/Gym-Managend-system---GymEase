import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, allAsync } from '@/db';
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

    const db = await getDatabase();

    const now = Date.now();
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);

    // Active members count
    const activeMembers = await allAsync(
      db,
      'SELECT id FROM members WHERE is_active = ?',
      [1]
    );

    // Revenue calculations
    const allPayments = await allAsync(
      db,
      'SELECT amount, payment_date FROM payments WHERE status = ?',
      ['completed']
    );

    const todayStart = new Date().setHours(0, 0, 0, 0);
    const todayRevenue = allPayments
      .filter(p => p.payment_date >= todayStart)
      .reduce((sum, p) => sum + p.amount, 0);

    const monthRevenue = allPayments
      .filter(p => p.payment_date >= startOfMonth)
      .reduce((sum, p) => sum + p.amount, 0);

    const yearRevenue = allPayments
      .filter(p => p.payment_date >= startOfYear)
      .reduce((sum, p) => sum + p.amount, 0);

    // Expense calculations
    const allExpenses = await allAsync(db, 'SELECT amount, expense_date FROM expenses', []);

    const monthExpenses = allExpenses
      .filter(e => e.expense_date >= startOfMonth)
      .reduce((sum, e) => sum + e.amount, 0);

    const yearExpenses = allExpenses
      .filter(e => e.expense_date >= startOfYear)
      .reduce((sum, e) => sum + e.amount, 0);

    // Pending payments
    const pendingPayments = await allAsync(
      db,
      'SELECT amount FROM payments WHERE status = ?',
      ['pending']
    );

    const pendingPaymentsAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    // New admissions this month
    const newAdmissionsMonth = await allAsync(
      db,
      'SELECT id FROM members WHERE admission_date >= ? AND admission_date < ?',
      [startOfMonth, startOfMonth + (30 * 24 * 60 * 60 * 1000)]
    );

    // Expiring memberships in next 7 days
    const expiringSubscriptions = await allAsync(
      db,
      'SELECT id FROM subscriptions WHERE end_date >= ? AND end_date <= ? AND status = ?',
      [now, sevenDaysFromNow, 'active']
    );

    // Recent payments
    const recentPayments = await allAsync(
      db,
      `SELECT p.*, m.name as member_name, m.member_id
       FROM payments p
       LEFT JOIN members m ON p.member_id = m.id
       WHERE p.status = ?
       ORDER BY p.payment_date DESC
       LIMIT 10`,
      ['completed']
    );

    // Expiring members
    const expiringMembers = await allAsync(
      db,
      `SELECT m.*, s.end_date
       FROM members m
       LEFT JOIN subscriptions s ON m.id = s.member_id
       WHERE s.end_date >= ? AND s.end_date <= ? AND s.status = ? AND m.is_active = ?
       ORDER BY s.end_date ASC`,
      [now, sevenDaysFromNow, 'active', 1]
    );

    // Paid members (members with at least one completed payment)
    const paidMembers = await allAsync(
      db,
      `SELECT DISTINCT m.id
       FROM members m
       INNER JOIN payments p ON m.id = p.member_id
       WHERE m.is_active = ? AND p.status = ?`,
      [1, 'completed']
    );

    // Partial members (members with at least one partial payment)
    const partialMembers = await allAsync(
      db,
      `SELECT DISTINCT m.id
       FROM members m
       INNER JOIN payments p ON m.id = p.member_id
       WHERE m.is_active = ? AND p.status = ?`,
      [1, 'partial']
    );

    return NextResponse.json({
      overview: {
        totalActiveMembers: activeMembers.length,
        todayRevenue,
        monthRevenue,
        yearRevenue,
        monthExpenses,
        yearExpenses,
        netProfitMonth: monthRevenue - monthExpenses,
        netProfitYear: yearRevenue - yearExpenses,
        pendingPaymentsAmount,
        pendingPaymentsCount: pendingPayments.length,
        paidMembersCount: paidMembers.length,
        partialMembersCount: partialMembers.length,
        newAdmissionsMonth: newAdmissionsMonth.length,
        expiringMemberships: expiringSubscriptions.length,
      },
      recentPayments,
      expiringMembers,
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
