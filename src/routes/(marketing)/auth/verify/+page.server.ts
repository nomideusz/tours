import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { consumeEmailVerificationToken } from '$lib/auth/tokens.js';
import { sendAuthEmail } from '$lib/email.server.js';
import { sendNotificationToUser } from '$lib/notifications/server.js';

// Simple page load handler
export const load: PageServerLoad = async ({ url, locals }) => {
    const token = url.searchParams.get('token');
    
    if (!token) {
        return { error: 'Missing verification token' };
    }

    try {
        // First, try to get the userId from the token without consuming it
        // We need to decode the token to check ownership
        const { verifyEmailVerificationToken } = await import('$lib/auth/tokens.js');
        const tokenUserId = await verifyEmailVerificationToken(token);
        
        if (!tokenUserId) {
            // Token is invalid or expired
            if (locals.user?.emailVerified) {
                return { 
                    error: 'Your email is already verified', 
                    alreadyVerified: true 
                };
            }
            
            return { error: 'Invalid or expired verification token' };
        }
        
        // Check if a user is logged in and if it's a different user
        if (locals.user && locals.user.id !== tokenUserId) {
            // Get the email of the token owner for display
            const tokenUser = await db.select().from(users).where(eq(users.id, tokenUserId)).limit(1);
            const tokenEmail = tokenUser[0]?.email || 'another account';
            
            return { 
                error: `This verification link is for ${tokenEmail}, but you are logged in as ${locals.user.email}. Please log out and try again, or log in to the correct account.`,
                wrongAccount: true,
                tokenEmail,
                currentEmail: locals.user.email
            };
        }
        
        // If we're here, either no one is logged in or the correct user is logged in
        // Now we can consume the token
        const userId = await consumeEmailVerificationToken(token);
        
        if (!userId) {
            // This shouldn't happen since we already verified the token
            return { error: 'Failed to verify email. Please try again.' };
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
            
            // Send success notification
            try {
                await sendNotificationToUser(userId, {
                    type: 'info',
                    id: `email_verified_${userId}_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    title: '✅ Email Verified',
                    message: 'Your email has been successfully verified! Welcome to Zaur Tours.',
                    data: {
                        userId: userId,
                        email: user[0].email
                    }
                });
                console.log(`✅ Verification success notification sent to ${user[0].email}`);
            } catch (notificationError) {
                console.warn('⚠️ Error sending verification notification:', notificationError);
            }
            
            // Redirect immediately after successful verification with success parameter
            throw redirect(302, '/dashboard?verified=true');
        }

        return { error: 'User not found' };

    } catch (err) {
        // Re-throw redirects so SvelteKit can handle them properly
        if (err && typeof err === 'object' && 'status' in err && err.status === 302) {
            throw err;
        }
        
        console.error('Email verification error:', err);
        return { error: 'Failed to verify email. Please try again or contact support.' };
    }
};

export const actions: Actions = {
    // Action to verify email with token
    verify: async ({ request, url, locals }) => {
        const formData = await request.formData();
        const token = formData.get('token') as string;
        
        if (!token) {
            return fail(400, { error: 'Missing verification token' });
        }

        try {
            // First, verify the token and check ownership
            const { verifyEmailVerificationToken } = await import('$lib/auth/tokens.js');
            const tokenUserId = await verifyEmailVerificationToken(token);
            
            if (!tokenUserId) {
                // Check if the current user is already verified
                if (locals.user?.emailVerified) {
                    return fail(400, { 
                        error: 'Your email is already verified',
                        alreadyVerified: true,
                        success: false
                    });
                }
                
                return fail(400, { error: 'Invalid or expired verification token' });
            }
            
            // Check if a user is logged in and if it's a different user
            if (locals.user && locals.user.id !== tokenUserId) {
                // Get the email of the token owner for display
                const tokenUser = await db.select().from(users).where(eq(users.id, tokenUserId)).limit(1);
                const tokenEmail = tokenUser[0]?.email || 'another account';
                
                return fail(403, { 
                    error: `This verification link is for ${tokenEmail}, but you are logged in as ${locals.user.email}. Please log out and try again, or log in to the correct account.`,
                    wrongAccount: true,
                    tokenEmail,
                    currentEmail: locals.user.email,
                    success: false
                });
            }
            
            // Now consume the token
            const userId = await consumeEmailVerificationToken(token);
            
            if (!userId) {
                return fail(400, { error: 'Failed to verify email. Please try again.' });
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
                
                // Send success notification
                try {
                    await sendNotificationToUser(userId, {
                        type: 'info',
                        id: `email_verified_${userId}_${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        title: '✅ Email Verified',
                        message: 'Your email has been successfully verified! Welcome to Zaur Tours.',
                        data: {
                            userId: userId,
                            email: user[0].email
                        }
                    });
                    console.log(`✅ Verification success notification sent to ${user[0].email}`);
                } catch (notificationError) {
                    console.warn('⚠️ Error sending verification notification:', notificationError);
                    // Don't fail the verification if notification fails
                }
                
                // Redirect to dashboard after successful verification with success parameter
                throw redirect(302, '/dashboard?verified=true');
            }

            return fail(404, { error: 'User not found' });

        } catch (err) {
            // Re-throw redirects so SvelteKit can handle them properly
            if (err && typeof err === 'object' && 'status' in err && err.status === 302) {
                throw err;
            }
            
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