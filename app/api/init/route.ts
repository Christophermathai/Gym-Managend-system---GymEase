import { getDatabase, runAsync } from '@/db';
import { generateId } from '@/app/lib/utils';
import { hashPassword } from '@/app/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { gymName, adminEmail, adminPassword, adminName, adminPhone } = body;

        const db = await getDatabase();

        // Check if any users exist
        const existingUsers = await db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

        if (existingUsers.count > 0) {
            return Response.json({ message: 'System already initialized' }, { status: 200 });
        }

        // Update gym settings
        if (gymName) {
            await runAsync(
                db,
                'UPDATE gym_settings SET gym_name = ? WHERE id = 1',
                [gymName]
            );
        }

        // Create default owner account
        const userId = generateId('user_');
        const email = adminEmail || 'admin@gymease.com';
        const password = adminPassword || 'admin123';
        const name = adminName || 'Admin';
        const phone = adminPhone || null;
        const hashedPassword = await hashPassword(password);

        await runAsync(
            db,
            'INSERT INTO users (id, email, password, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
            [userId, email, hashedPassword]
        );

        // Create owner profile
        const profileId = generateId('profile_');
        await runAsync(
            db,
            'INSERT INTO user_profiles (id, user_id, role, name, phone, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [profileId, userId, 'owner', name, phone, 1]
        );

        return Response.json({
            message: 'System initialized successfully',
            gymName: gymName || 'Gym Ease',
            adminEmail: email,
            adminPassword: password,
            note: 'Please change the password after first login'
        }, { status: 201 });
    } catch (error) {
        console.error('Error initializing system:', error);
        return Response.json({ error: 'Failed to initialize system' }, { status: 500 });
    }
}
