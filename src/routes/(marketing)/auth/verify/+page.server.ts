import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { consumeEmailVerificationToken } from '$lib/auth/tokens.js';
import { sendAuthEmail } from '$lib/email.server.js';

// Simple page load handler
export const load: PageServerLoad = async ({ url, locals }) => {
    const token = url.searchParams.get('token');
    
    if (!token) {
        return { error: 'Missing verification token' };
    }

    try {
        // Consume the verification token (this validates, deletes it, and marks email as verified)
        const userId = await consumeEmailVerificationToken(token);
        
        if (!userId) {
            return { error: 'Invalid or expired verification token' };
        }

        // Get user details for welcome email
        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        
        if (user.length > 0) {
            console.log(`✅ Email verified successfully for user: ${user[0].email}`);
            
            // Send welcome email
            try {
                const emailResult = await sendAuthEmail('welcome', {
                    email: user[0].email,
                    name: user[0].name
                });
                
                if (emailResult.success) {
                    console.log(`✅ Welcome email sent to ${user[0].email}`);
                } else {
                    console.warn(`⚠️ Failed to send welcome email:`, emailResult.error);
                }
            } catch (emailError) {
                console.warn('⚠️ Error sending welcome email:', emailError);
            }
            
            // Redirect immediately after successful verification
            throw redirect(302, '/dashboard');
        }

        return { error: 'User not found' };

    } catch (err) {
        console.error('Email verification error:', err);
        return { error: 'Failed to verify email. Please try again or contact support.' };
    }
};

export const actions: Actions = {
    // Action to verify email with token
    verify: async ({ request, url }) => {
        const formData = await request.formData();
        const token = formData.get('token') as string;
        
        if (!token) {
            return fail(400, { error: 'Missing verification token' });
        }

        try {
            // Consume the verification token
            const userId = await consumeEmailVerificationToken(token);
            
            if (!userId) {
                return fail(400, { error: 'Invalid or expired verification token' });
            }

            // Get user details for welcome email
            const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            
            if (user.length > 0) {
                console.log(`✅ Email verified successfully for user: ${user[0].email}`);
                
                // Send welcome email
                try {
                    const emailResult = await sendAuthEmail('welcome', {
                        email: user[0].email,
                        name: user[0].name
                    });
                    
                    if (emailResult.success) {
                        console.log(`✅ Welcome email sent to ${user[0].email}`);
                    } else {
                        console.warn(`⚠️ Failed to send welcome email:`, emailResult.error);
                    }
                } catch (emailError) {
                    console.warn('⚠️ Error sending welcome email:', emailError);
                }
                
                // Redirect to dashboard after successful verification
                throw redirect(302, '/dashboard');
            }

            return fail(404, { error: 'User not found' });

        } catch (err) {
            console.error('Email verification error:', err);
            return fail(500, { error: 'Failed to verify email. Please try again or contact support.' });
        }
    },

    // Action to resend verification email
    resend: async ({ request, url, locals }) => {
        if (!locals.user) {
            return fail(401, { error: 'You must be logged in to resend verification email' });
        }

        const user = locals.user;
        
        if (user.emailVerified) {
            return fail(400, { error: 'Email is already verified' });
        }

        try {
            const { createEmailVerificationToken } = await import('$lib/auth/tokens.js');
            
            // Create new verification token
            const verificationToken = await createEmailVerificationToken(user.id);
            const verificationUrl = `${url.origin}/auth/verify?token=${verificationToken}`;
            
            // Send verification email
            const emailResult = await sendAuthEmail('email-verification', {
                email: user.email,
                name: user.name,
                verificationUrl
            });
            
            if (!emailResult.success) {
                return fail(500, { error: 'Failed to send verification email. Please try again.' });
            }
            
            console.log(`✅ Verification email resent to ${user.email}`);
            return { success: true, message: 'Verification email sent! Please check your inbox.' };
            
        } catch (err) {
            console.error('Error resending verification email:', err);
            return fail(500, { error: 'Failed to send verification email. Please try again.' });
        }
    }
}; 