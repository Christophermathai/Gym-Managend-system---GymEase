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

    // Pending payments (balances from partial payments + amounts from pending payments)
    const pendingAndPartialPayments = await allAsync(
      db,
      'SELECT amount, balance, status FROM payments WHERE status IN (?, ?)',
      ['pending', 'partial']
    );

    let pendingPaymentsAmount = 0;
    let pendingPaymentsCount = 0;

    pendingAndPartialPayments.forEach(p => {
      if (p.status === 'pending') {
        pendingPaymentsAmount += (p.amount || 0);
        pendingPaymentsCount++;
      } else if (p.status === 'partial' && p.balance > 0) {
        pendingPaymentsAmount += p.balance;
        pendingPaymentsCount++;
      }
    });

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

    // Expiring members (in next 30 days) to make it more populated
    const thirtyDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);
    const expiringMembers = await allAsync(
      db,
      `SELECT m.*, s.end_date
       FROM members m
       LEFT JOIN subscriptions s ON m.id = s.member_id
       WHERE s.end_date >= ? AND s.end_date <= ? AND s.status = ? AND m.is_active = ?
       ORDER BY s.end_date ASC
       LIMIT 10`,
      [now, thirtyDaysFromNow, 'active', 1]
    );

    // Partial members (members with an outstanding partial balance)
    const partialMembers = await allAsync(
      db,
      `SELECT DISTINCT m.id
       FROM members m
       INNER JOIN payments p ON m.id = p.member_id
       WHERE m.is_active = 1 AND p.status = 'partial' AND p.balance > 0`,
      []
    );

    // Paid members (members with an active subscription and NO outstanding partial balance)
    const paidMembers = await allAsync(
      db,
      `SELECT DISTINCT m.id
       FROM members m
       INNER JOIN subscriptions s ON m.id = s.member_id
       WHERE m.is_active = 1 
         AND s.end_date >= ?
         AND s.status = 'active'
         AND m.id NOT IN (
           SELECT member_id FROM payments WHERE status = 'partial' AND balance > 0
         )`,
      [now]
    );

    // Expired Members with Unpaid Balances
    // Get members whose subscription has expired (end_date < now) AND they have a partial payment balance
    const expiredMembersWithUnpaid = await allAsync(
      db,
      `SELECT m.id, m.name, m.phone, s.end_date, SUM(p.balance) as unpaid_amount
       FROM members m
       INNER JOIN subscriptions s ON m.id = s.member_id
       INNER JOIN payments p ON m.id = p.member_id
       WHERE s.end_date < ? 
         AND p.status = 'partial' 
         AND p.balance > 0
       GROUP BY m.id
       ORDER BY s.end_date DESC
       LIMIT 10`,
      [now]
    );

    return NextResponse.json({
      overview: {
        totalActiveMembers: activeMembers.length,
        todayRevenue,
        monthRevenue,
        yearRevenue,
        monthExpenses,
        yearExpenses,
        netProfitMonth: Math.round(((monthRevenue - monthExpenses) + Number.EPSILON) * 100) / 100,
        netProfitYear: Math.round(((yearRevenue - yearExpenses) + Number.EPSILON) * 100) / 100,
        pendingPaymentsAmount,
        pendingPaymentsCount,
        paidMembersCount: paidMembers.length,
        partialMembersCount: partialMembers.length,
        newAdmissionsMonth: newAdmissionsMonth.length,
        expiringMemberships: expiringSubscriptions.length,
      },
      recentPayments,
      expiringMembers,
      expiredMembersWithUnpaid,
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
