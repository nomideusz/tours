import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { hash } from '@node-rs/argon2';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

// Simple page load handler
export const load: PageServerLoad = async () => {
    return {};
};

export const actions: Actions = {
    // Default action for password reset form
    default: async ({ request }) => {
        // Get form data
        const formData = await request.formData();
        const token = formData.get('token')?.toString();
        const password = formData.get('password')?.toString();
        const passwordConfirm = formData.get('passwordConfirm')?.toString();
        
        // Validate input
        if (!token) {
            return fail(400, { message: 'Reset token is missing' });
        }
        
        if (!password || !passwordConfirm) {
            return fail(400, { message: 'Password is required' });
        }
        
        if (password !== passwordConfirm) {
            return fail(400, { message: 'Passwords do not match' });
        }
        
        if (password.length < 8) {
            return fail(400, { message: 'Password must be at least 8 characters long' });
        }
        
        try {
            // TODO: Implement proper token validation and password reset
            // For now, this is a stub that always fails since we don't have token system yet
            console.log('Password reset attempted with token:', token);
            
            return fail(400, { message: 'Password reset functionality is not yet implemented. Please contact support.' });
        } catch (err) {
            console.error('Password reset error:', err);
            
            return fail(500, { 
                message: err instanceof Error ? err.message : 'Failed to reset password' 
            });
        }
    }
}; 