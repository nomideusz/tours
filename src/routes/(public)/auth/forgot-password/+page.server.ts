import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

// Simple page load handler - nothing special needed here
export const load: PageServerLoad = async () => {
    return {};
};

export const actions: Actions = {
    // Default form action
    default: async ({ request }) => {
        // Get form data
        const formData = await request.formData();
        const email = formData.get('email')?.toString();
        
        // Validate email
        if (!email) {
            return fail(400, { message: 'Email is required' });
        }
        
        try {
            // Check if user exists (but don't reveal this to prevent email enumeration)
            const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
            
            // TODO: Implement email sending with reset token
            // For now, we'll just log that a reset was requested
            if (existingUser.length > 0) {
                console.log('Password reset requested for existing user:', email);
                // In the future, generate a token and send email here
            } else {
                console.log('Password reset requested for non-existent user:', email);
            }
            
            // Always return success to prevent email enumeration attacks
            return { success: true };
        } catch (err) {
            console.error('Password reset error:', err);
            
            // Still return success to prevent email enumeration attacks
            return { success: true };
        }
    }
}; 