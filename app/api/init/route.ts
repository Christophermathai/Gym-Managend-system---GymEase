import { getDatabase, runAsync } from '@/db';
import { generateId } from '@/app/lib/utils';
import { hashPassword } from '@/app/lib/auth';

export async function POST() {
    try {
        const db = await getDatabase();

        // Check if any users exist
        const existingUsers = await db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

        if (existingUsers.count > 0) {
            return Response.json({ message: 'Users already exist' }, { status: 200 });
        }

        // Create default owner account
        const userId = generateId('user_');
        const email = 'admin@gymease.com';
        const password = 'admin123'; // Default password
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
            [profileId, userId, 'owner', 'Admin', null, 1]
        );

        return Response.json({
            message: 'Default admin account created',
            email,
            password,
            note: 'Please change the password after first login'
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating default user:', error);
        return Response.json({ error: 'Failed to create default user' }, { status: 500 });
    }
}
