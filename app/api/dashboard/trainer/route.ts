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
    if (userRole !== 'trainer') {
      return NextResponse.json({ error: 'Access denied: Trainer role required' }, { status: 403 });
    }

    const db = await getDatabase();

    const now = Date.now();
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);

    // Active members count
    const activeMembers = await allAsync(
      db,
      'SELECT id FROM members WHERE is_active = ?',
      [1]
    );

    // Pending payments (count only, no amounts for trainers)
    const pendingPayments = await allAsync(
      db,
      'SELECT member_id FROM payments WHERE status = ?',
      ['pending']
    );

    // New admissions this month
    const newAdmissions = await allAsync(
      db,
      'SELECT id FROM members WHERE admission_date >= ? AND admission_date < ? AND is_active = ?',
      [startOfMonth, startOfMonth + (30 * 24 * 60 * 60 * 1000), 1]
    );

    // Expiring memberships
    const expiringSubscriptions = await allAsync(
      db,
      'SELECT id FROM subscriptions WHERE end_date >= ? AND end_date <= ? AND status = ?',
      [now, sevenDaysFromNow, 'active']
    );

    // Get member details for pending payments (names only, no amounts)
    const pendingMemberIds = [...new Set(pendingPayments.map(p => p.member_id))];
    const pendingMembers = await Promise.all(
      pendingMemberIds.slice(0, 10).map(id => getAsync(db, 'SELECT id, name, phone FROM members WHERE id = ?', [id]))
    );

    // Expiring members
    const expiringMembers = await allAsync(
      db,
      `SELECT m.*, s.end_date
       FROM members m
       LEFT JOIN subscriptions s ON m.id = s.member_id
       WHERE s.end_date >= ? AND s.end_date <= ? AND s.status = ? AND m.is_active = ?
       ORDER BY s.end_date ASC
       LIMIT 10`,
      [now, sevenDaysFromNow, 'active', 1]
    );

    // Leads assigned to this trainer
    const recentLeads = await allAsync(
      db,
      'SELECT * FROM leads WHERE assigned_to = ? ORDER BY created_at DESC LIMIT 10',
      [userId]
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
        pendingPaymentsCount: pendingPayments.length,
        paidMembersCount: paidMembers.length,
        partialMembersCount: partialMembers.length,
        newAdmissionsMonth: newAdmissions.length,
        expiringMemberships: expiringSubscriptions.length,
      },
      pendingMembers: pendingMembers.filter(Boolean),
      expiringMembers,
      recentLeads,
    });
  } catch (error) {
    console.error('Error fetching trainer dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch trainer dashboard' }, { status: 500 });
  }
}
