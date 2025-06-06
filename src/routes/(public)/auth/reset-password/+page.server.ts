import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import { verifyPasswordResetToken, consumePasswordResetToken } from '$lib/auth/tokens.js';
import { lucia } from '$lib/auth/lucia.js';

export const load: PageServerLoad = async ({ url, locals }) => {
    // Redirect if already logged in
    if (locals.session) {
        throw redirect(303, '/dashboard');
    }

    const token = url.searchParams.get('token');
    
    if (!token) {
        return { error: 'Missing reset token' };
    }

    // Verify token is valid (but don't consume it yet)
    const userId = await verifyPasswordResetToken(token);
    
    if (!userId) {
        return { error: 'Invalid or expired reset token' };
    }

    return { token };
};

export const actions: Actions = {
    default: async ({ request, cookies }) => {
        const formData = await request.formData();
        const token = formData.get('token')?.toString();
        const password = formData.get('password')?.toString();
        const confirmPassword = formData.get('confirmPassword')?.toString();

        // Validate inputs
        if (!token) {
            return fail(400, { error: 'Missing reset token' });
        }

        if (!password) {
            return fail(400, { error: 'Password is required' });
        }

        if (password.length < 8) {
            return fail(400, { error: 'Password must be at least 8 characters' });
        }

        if (password !== confirmPassword) {
            return fail(400, { error: 'Passwords do not match' });
        }

        try {
            // Consume the token (this validates and deletes it)
            const userId = await consumePasswordResetToken(token);
            
            if (!userId) {
                return fail(400, { error: 'Invalid or expired reset token' });
            }

            // Get user details
            const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            
            if (user.length === 0) {
                return fail(400, { error: 'User not found' });
            }

            // Hash the new password
            const hashedPassword = await hash(password, {
                memoryCost: 19456,
                timeCost: 2,
                outputLen: 32,
                parallelism: 1
            });

            // Update user's password
            await db
                .update(users)
                .set({ 
                    hashedPassword,
                    updatedAt: new Date()
                })
                .where(eq(users.id, userId));

            // Invalidate all existing sessions for this user
            await lucia.invalidateUserSessions(userId);

            console.log(`✅ Password reset successfully for user: ${user[0].email}`);

            // Create a new session for auto-login
            const session = await lucia.createSession(userId, {});
            const sessionCookie = lucia.createSessionCookie(session.id);
            cookies.set(sessionCookie.name, sessionCookie.value, {
                path: ".",
                ...sessionCookie.attributes
            });

            console.log('✅ Auto-login successful after password reset');

        } catch (err) {
            console.error('Password reset error:', err);
            return fail(500, { error: 'Failed to reset password. Please try again.' });
        }

        throw redirect(303, '/dashboard');
    }
}; 