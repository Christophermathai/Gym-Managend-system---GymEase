import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, runAsync } from '@/db';
import { generateId, generateMemberId } from '@/app/lib/utils';
import { verifyToken, extractToken } from '@/app/lib/auth';

function getAuthUserId(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    if (!token) return null;
    const decoded = verifyToken(token);
    return decoded?.userId || null;
}

export async function POST(request: NextRequest) {
    try {
        const userId = getAuthUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { members } = await request.json();

        if (!Array.isArray(members) || members.length === 0) {
            return NextResponse.json({ error: 'No members provided' }, { status: 400 });
        }

        const db = await getDatabase();
        let successCount = 0;
        let failedCount = 0;
        const errors: string[] = [];

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
            id, member_id, name, email, phone, gender, address, 
            blood_group, medical_notes, admission_date, is_active, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                    [
                        memberId,
                        displayMemberId,
                        member.name,
                        member.email || null,
                        member.phone,
                        member.gender || 'other',
                        member.address || null,
                        member.bloodGroup || null,
                        null,
                        Date.now(),
                        1,
                        userId
                    ]
                );

                successCount++;
            } catch (error: any) {
                errors.push(`Failed: ${member.name} - ${error.message}`);
                failedCount++;
            }
        }

        return NextResponse.json({
            success: successCount,
            failed: failedCount,
            errors
        }, { status: 200 });

    } catch (error) {
        console.error('Bulk import error:', error);
        return NextResponse.json({ error: 'Bulk import failed' }, { status: 500 });
    }
}
