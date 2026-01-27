import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/app/lib/auth';

function getAuthUserId(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    if (!token) return null;
    const decoded = verifyToken(token);
    return decoded?.userId || null;
}

export async function GET(request: NextRequest) {
    try {
        const userId = getAuthUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Dynamic imports to avoid build-time execution
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');

        const documentsPath = path.join(os.homedir(), 'Documents');
        const backupDir = path.join(documentsPath, 'GymEase_Backups');

        if (!fs.existsSync(backupDir)) {
            return NextResponse.json({ backups: [] });
        }

        const files = fs.readdirSync(backupDir)
            .filter((file: string) => file.endsWith('.db'))
            .map((file: string) => {
                const filePath = path.join(backupDir, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    path: filePath,
                    size: stats.size,
                    modified: stats.mtime.getTime()
                };
            })
            .sort((a: any, b: any) => b.modified - a.modified); // Most recent first

        return NextResponse.json({ backups: files });
    } catch (error) {
        console.error('Error listing backups:', error);
        return NextResponse.json({ error: 'Failed to list backups' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = getAuthUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { backupPath } = await request.json();

        if (!backupPath) {
            return NextResponse.json({ error: 'Backup path required' }, { status: 400 });
        }

        // Verify user role is owner
        const { getDatabase, getAsync } = await import('@/db');
        const db = await getDatabase();
        const user = await getAsync(
            db,
            'SELECT up.role FROM user_profiles up WHERE up.user_id = ?',
            [userId]
        );

        if (!user || user.role !== 'owner') {
            return NextResponse.json({ error: 'Only owners can restore database' }, { status: 403 });
        }

        const fs = await import('fs');
        const path = await import('path');

        // Verify backup file exists
        if (!fs.existsSync(backupPath)) {
            return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
        }

        // Get current database path from environment
        const currentDbPath = process.env.DB_PATH;
        if (!currentDbPath) {
            return NextResponse.json({ error: 'Database path not configured' }, { status: 500 });
        }

        // Close current database connection
        db.close();

        // Create a backup of current database before restoring
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const preRestoreBackup = path.join(
            path.dirname(currentDbPath),
            `pre_restore_${timestamp}.db`
        );

        if (fs.existsSync(currentDbPath)) {
            fs.copyFileSync(currentDbPath, preRestoreBackup);
        }

        // Restore the backup
        fs.copyFileSync(backupPath, currentDbPath);

        return NextResponse.json({
            message: 'Database restored successfully. Please restart the application.',
            preRestoreBackup
        });
    } catch (error) {
        console.error('Error restoring backup:', error);
        return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 });
    }
}
