import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';

// Simple page load handler
export const load: PageServerLoad = async () => {
    return {};
};

export const actions: Actions = {
    // Default action for email verification
    default: async ({ request, locals }) => {
        // Get form data
        const formData = await request.formData();
        const token = formData.get('token')?.toString();
        
        // Validate input
        if (!token) {
            return fail(400, { message: 'Verification token is missing' });
        }
        
        try {
            // Use PocketBase's confirm email verification method
            await locals.pb.collection('users').confirmVerification(token);
            
            // Return success
            return { success: true };
        } catch (err) {
            console.error('Email verification error:', err);
            
            if (err instanceof Error && err.message.includes('token')) {
                return fail(400, { message: 'Invalid or expired verification token' });
            }
            
            return fail(500, { 
                message: err instanceof Error ? err.message : 'Failed to verify email' 
            });
        }
    }
}; 