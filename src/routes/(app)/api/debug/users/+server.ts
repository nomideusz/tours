import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
    try {
        // Check if user is authenticated (optional security check)
        if (!locals.user) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all users from the collection
        const users = await locals.pb.collection('users').getFullList({
            sort: '-created',
            fields: 'id,email,name,username,avatar,created,updated,verified'
        });

        console.log(`Found ${users.length} users in the database`);
        users.forEach(user => {
            console.log(`- ${user.email} (${user.name || 'no name'}) - Created: ${user.created}`);
        });

        return json({
            success: true,
            count: users.length,
            users: users.map(user => ({
                id: user.id,
                email: user.email,
                name: user.name,
                username: user.username,
                hasAvatar: !!user.avatar,
                created: user.created,
                verified: user.verified
            }))
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        return json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}; 