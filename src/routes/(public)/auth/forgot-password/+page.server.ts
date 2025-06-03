import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';

// Simple page load handler - nothing special needed here
export const load: PageServerLoad = async () => {
    return {};
};

export const actions: Actions = {
    // Default form action
    default: async ({ request, locals }) => {
        // Get form data
        const formData = await request.formData();
        const email = formData.get('email')?.toString();
        
        // Validate email
        if (!email) {
            return fail(400, { message: 'Email is required' });
        }
        
        try {
            // Use PocketBase's password reset request
            await locals.pb.collection('users').requestPasswordReset(email);
            
            // We don't want to reveal if the email exists in our system for security
            // So we always return success, even if the email doesn't exist
            return { success: true };
        } catch (err) {
            // Log the error for debugging, but don't expose details to the user
            console.error('Password reset error:', err);
            
            // Still return success to prevent email enumeration attacks
            // Only error out for obvious issues like network problems
            if (err instanceof Error && 
                (err.message.includes('network') || err.message.includes('connect'))) {
                return fail(500, { message: 'Server error. Please try again later.' });
            }
            
            // Return success even if the email doesn't exist in the database
            return { success: true };
        }
    }
}; 