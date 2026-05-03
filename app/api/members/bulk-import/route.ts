import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, runAsync, getAsync, allAsync } from '@/db';
import { generateId, generateMemberId } from '@/app/lib/utils';
import { getAuthUserId } from '@/app/lib/api-utils';

export async function POST(request: NextRequest) {
    try {
        const userId = getAuthUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { members, feePlanId } = await request.json();

        if (!Array.isArray(members) || members.length === 0) {
            return NextResponse.json({ error: 'No members provided' }, { status: 400 });
        }

        const db = await getDatabase();
        let successCount = 0;
        let failedCount = 0;
        let subscriptionsCreated = 0;
        const errors: string[] = [];

        // Fetch fee plan once if provided
        let feePlan: any = null;
        if (feePlanId) {
            feePlan = await getAsync(db, 'SELECT * FROM fee_plans WHERE id = ? AND is_active = 1', [feePlanId]);
            if (!feePlan) {
                return NextResponse.json({ error: 'Selected fee plan not found or inactive' }, { status: 400 });
            }
        }

        const partnerPhones = Array.from(new Set(members
            .map((member: any) => member.partnerPhone?.trim())
            .filter(Boolean)
        ));

        const existingPartnerMap = new Map<string, string>();
        if (partnerPhones.length > 0) {
            const placeholders = partnerPhones.map(() => '?').join(',');
            const existingPartners = await allAsync(db, `SELECT phone, id FROM members WHERE phone IN (${placeholders})`, partnerPhones);
            existingPartners.forEach((row: any) => {
                if (row.phone) existingPartnerMap.set(row.phone, row.id);
            });
        }

        const importedMemberMap = new Map<string, string>();
        const insertedMembers: Array<any> = [];

        for (const member of members) {
            try {
                // Validate required fields
                if (!member.name || !member.phone) {
                    errors.push(`Skipped: Missing name or phone - ${member.name || 'Unknown'}`);
                    failedCount++;
                    continue;
                }

                // Check if member with same phone already exists
                const existing = await db.prepare('SELECT id FROM members WHERE phone = ?').get(member.phone);
                if (existing) {
                    errors.push(`Skipped: Phone ${member.phone} already exists`);
                    failedCount++;
                    continue;
                }

                // Generate IDs
                const memberId = generateId('mem_');
                const displayMemberId = generateMemberId();

                // Insert member
                await runAsync(
                    db,
                    `INSERT INTO members (
            id, member_id, name, email, phone, gender, 
            blood_group, admission_date, is_active, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                    [
                        memberId,
                        displayMemberId,
                        member.name,
                        member.email || null,
                        member.phone,
                        member.gender || 'other',
                        member.bloodGroup || null,
                        member.paymentDate || Date.now(),
                        1,
                        userId
                    ]
                );
                importedMemberMap.set(member.phone, memberId);
                insertedMembers.push({ ...member, memberId });
                successCount++;
            } catch (error: any) {
                errors.push(`Failed: ${member.name} - ${error.message}`);
                failedCount++;
            }
        }

        const processedCoupleGroups = new Set<string>();

        for (const member of insertedMembers) {
            if (!feePlan || !member.paymentDate) {
                if (feePlan && !member.paymentDate) {
                    console.log(`No paymentDate for ${member.name}, skipping subscription`);
                }
                continue;
            }

            const startDate = new Date(member.paymentDate);
            const endDate = new Date(member.paymentDate);
            endDate.setMonth(endDate.getMonth() + feePlan.duration);
            const subscriptionAmount = feePlan.monthly_fee;

            if (feePlan.is_couple_package && member.partnerPhone?.trim()) {
                const partnerPhone = member.partnerPhone.trim();
                const partnerId = importedMemberMap.get(partnerPhone) || existingPartnerMap.get(partnerPhone);
                const groupKey = [member.phone, partnerPhone].sort().join('|');

                if (!partnerId || partnerId === member.memberId) {
                    errors.push(`Couple partner not found or invalid for ${member.name} (${member.phone}) with partner phone ${partnerPhone}; imported member only.`);
                } else if (!processedCoupleGroups.has(groupKey)) {
                    processedCoupleGroups.add(groupKey);

                    const subscriptionIdA = generateId('sub_');
                    const subscriptionIdB = generateId('sub_');

                    await runAsync(
                        db,
                        `INSERT INTO subscriptions (id, member_id, fee_plan_id, start_date, end_date, status, created_by, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                        [subscriptionIdA, member.memberId, feePlanId, startDate.getTime(), endDate.getTime(), 'active', userId]
                    );
                    await runAsync(
                        db,
                        `INSERT INTO subscriptions (id, member_id, fee_plan_id, start_date, end_date, status, created_by, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                        [subscriptionIdB, partnerId, feePlanId, startDate.getTime(), endDate.getTime(), 'active', userId]
                    );

                    const perMemberAmount = Math.round((subscriptionAmount / 2 + Number.EPSILON) * 100) / 100;

                    await runAsync(
                        db,
                        `INSERT INTO payments (id, member_id, subscription_id, amount, amount_due, balance, payment_type, payment_mode, payment_date, status, recorded_by, is_active, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                        [generateId('pay_'), member.memberId, subscriptionIdA, perMemberAmount, perMemberAmount, 0, 'membership', 'cash', member.paymentDate, 'completed', userId, 1]
                    );
                    await runAsync(
                        db,
                        `INSERT INTO payments (id, member_id, subscription_id, amount, amount_due, balance, payment_type, payment_mode, payment_date, status, recorded_by, is_active, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                        [generateId('pay_'), partnerId, subscriptionIdB, perMemberAmount, perMemberAmount, 0, 'membership', 'cash', member.paymentDate, 'completed', userId, 1]
                    );

                    subscriptionsCreated += 2;
                }
            } else {
                const subscriptionId = generateId('sub_');
                await runAsync(
                    db,
                    `INSERT INTO subscriptions (id, member_id, fee_plan_id, start_date, end_date, status, created_by, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                    [subscriptionId, member.memberId, feePlanId, startDate.getTime(), endDate.getTime(), 'active', userId]
                );

                await runAsync(
                    db,
                    `INSERT INTO payments (id, member_id, subscription_id, amount, amount_due, balance, payment_type, payment_mode, payment_date, status, recorded_by, is_active, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                    [generateId('pay_'), member.memberId, subscriptionId, subscriptionAmount, subscriptionAmount, 0, 'membership', 'cash', member.paymentDate, 'completed', userId, 1]
                );

                subscriptionsCreated++;
            }
        }

        return NextResponse.json({
            success: successCount,
            failed: failedCount,
            subscriptionsCreated,
            errors
        }, { status: 200 });

    } catch (error) {
        console.error('Bulk import error:', error);
        return NextResponse.json({ error: 'Bulk import failed' }, { status: 500 });
    }
}
