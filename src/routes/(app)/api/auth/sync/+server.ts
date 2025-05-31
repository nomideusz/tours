import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const { token, userId } = await request.json();
        
        console.log('Auth sync API: Received token for user:', userId);
        
        if (!token || !userId) {
            console.log('Auth sync API: Missing token or userId');
            return json({ error: 'Missing auth data' }, { status: 400 });
        }

        // Manually set the auth store with the provided token
        locals.pb.authStore.save(token, null);
        
        // Try to get the user data with this token
        try {
            const user = await locals.pb.collection('users').getOne(userId);
            console.log('Auth sync API: User found:', user.email);
            
            // Update the auth store with the full record
            locals.pb.authStore.save(token, user);
            
            // Update locals for this request
            locals.user = user;
            
            console.log('Auth sync API: Successfully synced auth state');
            return json({ success: true, user: { id: user.id, email: user.email } });
            
        } catch (userError) {
            console.log('Auth sync API: Failed to get user:', userError);
            return json({ error: 'Invalid token or user' }, { status: 401 });
        }
        
    } catch (error) {
        console.error('Auth sync API: Error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}; 