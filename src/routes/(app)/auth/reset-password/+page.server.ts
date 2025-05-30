import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';

// Simple page load handler
export const load: PageServerLoad = async () => {
    return {};
};

export const actions: Actions = {
    // Default action for password reset form
    default: async ({ request, locals }) => {
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
            // Use PocketBase's confirm password reset method
            await locals.pb.collection('users').confirmPasswordReset(
                token,
                password,
                passwordConfirm
            );
            
            // Return success
            return { success: true };
        } catch (err) {
            console.error('Password reset error:', err);
            
            if (err instanceof Error && err.message.includes('token')) {
                return fail(400, { message: 'Invalid or expired reset token' });
            }
            
            return fail(500, { 
                message: err instanceof Error ? err.message : 'Failed to reset password' 
            });
        }
    }
}; 