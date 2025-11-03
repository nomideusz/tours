import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { createPasswordResetToken } from '$lib/auth/tokens.js';
import { sendAuthEmail } from '$lib/email.server.js';

// Simple page load handler - nothing special needed here
export const load: PageServerLoad = async () => {
    return {};
};

export const actions: Actions = {
    // Default form action
    default: async ({ request, url }) => {
        // Get form data
        const formData = await request.formData();
        const email = formData.get('email')?.toString();
        
        // Validate email
        if (!email) {
            return fail(400, { message: 'Email is required' });
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return fail(400, { message: 'Please enter a valid email address' });
        }
        
        try {
            // Check if user exists (but don't reveal this to prevent email enumeration)
            const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
            
            if (existingUser.length > 0) {
                const user = existingUser[0];
                console.log('Password reset requested for existing user:', email);
                
                // Generate password reset token
                const token = await createPasswordResetToken(user.id);
                
                // Build reset URL
                const resetUrl = `${url.origin}/auth/reset-password?token=${token}`;
                
                // Send password reset email
                console.log(`Attempting to send password reset email to ${user.email}...`);
                const emailResult = await sendAuthEmail('password-reset', {
                    email: user.email,
                    name: user.name,
                    resetUrl
                });
                
                if (!emailResult.success) {
                    console.error('❌ Failed to send password reset email:', emailResult.error);
                    console.error(`   User ID: ${user.id}, Email: ${user.email}`);
                    console.error(`   Reset URL: ${resetUrl}`);
                    return fail(500, { message: 'Failed to send reset email. Please try again later.' });
                }
                
                console.log(`✅ Password reset email sent successfully to ${email} (messageId: ${emailResult.messageId})`);
            } else {
                console.log('Password reset requested for non-existent user:', email);
                // Still continue to prevent email enumeration
            }
            
            // Always return success to prevent email enumeration attacks
            return { success: true };
        } catch (err) {
            console.error('Password reset error:', err);
            
            // Return generic error to prevent revealing system details
            return fail(500, { message: 'An error occurred. Please try again later.' });
        }
    }
}; 