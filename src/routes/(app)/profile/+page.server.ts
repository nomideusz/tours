import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { hash, verify } from '@node-rs/argon2';

export const load: PageServerLoad = async ({ locals }) => {
    // Check if user is authenticated
    if (!locals.user) {
        throw redirect(303, '/auth/login?redirectTo=/profile');
    }

    // Return user data for the profile form
    return {
        user: {
            id: locals.user.id,
            email: locals.user.email,
            name: locals.user.name || '',
            username: locals.user.username || '',
            businessName: locals.user.businessName || '',
            description: locals.user.description || '',
            phone: locals.user.phone || '',
            website: locals.user.website || '',
            avatar: locals.user.avatar || '',
            verified: locals.user.emailVerified || false,
            stripeAccountId: locals.user.stripeAccountId || '',
            // Check if user has OAuth2 login (no password)
            isOAuth2User: !!(locals.user.avatar || locals.user.name)
        }
    };
};

export const actions: Actions = {
    // Update profile information
    updateProfile: async ({ request, locals }) => {
        if (!locals.user) {
            return fail(401, { error: 'Unauthorized' });
        }

        const formData = await request.formData();
        const name = formData.get('name')?.toString() || '';
        const username = formData.get('username')?.toString() || '';
        const businessName = formData.get('businessName')?.toString() || '';
        const description = formData.get('description')?.toString() || '';
        const phone = formData.get('phone')?.toString() || '';
        const website = formData.get('website')?.toString() || '';

        // Basic validation
        if (username && username.length < 3) {
            return fail(400, { error: 'Username must be at least 3 characters long' });
        }

        if (website && !website.match(/^https?:\/\/.+/)) {
            return fail(400, { error: 'Website must be a valid URL starting with http:// or https://' });
        }

        // Validate username if provided
        if (username) {
            const { validateUsername, isUsernameAvailable } = await import('$lib/utils/username.js');
            const validation = validateUsername(username);
            
            if (!validation.valid) {
                return fail(400, { error: validation.error });
            }

            // Check if username is available (excluding current user)
            if (username !== locals.user.username) {
                const available = await isUsernameAvailable(username);
                if (!available) {
                    return fail(400, { error: 'Username is already taken' });
                }
            }
        }

        try {
            // Update user profile
            const updatedUsers = await db.update(users)
                .set({
                    name,
                    username: username || locals.user.username, // Keep existing username if not provided
                    businessName,
                    description,
                    phone,
                    website,
                    updatedAt: new Date()
                })
                .where(eq(users.id, locals.user.id))
                .returning();

            if (updatedUsers.length === 0) {
                return fail(500, { error: 'Failed to update profile. User not found.' });
            }

            const updatedUser = updatedUsers[0];

            // Update locals.user with the new data
            locals.user = { ...locals.user, ...updatedUser };

            return { 
                success: true, 
                message: 'Profile updated successfully!',
                updatedUser: {
                    name: updatedUser.name || '',
                    username: updatedUser.username || '',
                    businessName: updatedUser.businessName || '',
                    description: updatedUser.description || '',
                    phone: updatedUser.phone || '',
                    website: updatedUser.website || ''
                }
            };
        } catch (error) {
            console.error('Profile update error:', error);
            return fail(500, { error: 'Failed to update profile. Please try again.' });
        }
    },

    // Setup Stripe Connect account for receiving payments
    setupPayments: async ({ locals, url }) => {
        if (!locals.user) {
            return fail(401, { error: 'Unauthorized' });
        }

        try {
            console.log('Setup payments - User ID:', locals.user.id);
            console.log('Setup payments - API URL:', `${url.origin}/api/payments/connect/setup`);
            
            // Call API to create/manage Stripe Connect account
            const response = await fetch(`${url.origin}/api/payments/connect/setup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: locals.user.id,
                    email: locals.user.email,
                    businessName: locals.user.businessName || locals.user.name
                })
            });
            
            console.log('Setup payments - Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                return fail(500, { error: errorData.error || 'Failed to setup payment account' });
            }

            const { accountLink } = await response.json();
            
            console.log('Account link received:', accountLink);
            
            // Return the account link for client-side redirect
            return { 
                success: true,
                redirect: accountLink,
                message: 'Redirecting to Stripe...'
            };
        } catch (error) {
            if (error instanceof Response && error.status === 303) {
                throw error; // Re-throw redirect
            }
            console.error('Payment setup error:', error);
            return fail(500, { error: 'Failed to setup payment account. Please try again.' });
        }
    },

    // Change password (only for non-OAuth2 users)
    changePassword: async ({ request, locals }) => {
        if (!locals.user) {
            return fail(401, { error: 'Unauthorized' });
        }

        const formData = await request.formData();
        const currentPassword = formData.get('currentPassword')?.toString() || '';
        const newPassword = formData.get('newPassword')?.toString() || '';
        const confirmPassword = formData.get('confirmPassword')?.toString() || '';

        // Validation
        if (!currentPassword) {
            return fail(400, { error: 'Current password is required' });
        }

        if (!newPassword || newPassword.length < 8) {
            return fail(400, { error: 'New password must be at least 8 characters long' });
        }

        if (newPassword !== confirmPassword) {
            return fail(400, { error: 'New passwords do not match' });
        }

        try {
            // Get current user with hashed password
            const currentUser = await db.select()
                .from(users)
                .where(eq(users.id, locals.user.id))
                .limit(1);

            if (currentUser.length === 0) {
                return fail(400, { error: 'User not found' });
            }

            // Verify current password
            const user = currentUser[0];
            if (!user.hashedPassword) {
                return fail(400, { error: 'No password set for this account' });
            }

            const isCurrentPasswordValid = await verify(user.hashedPassword, currentPassword, {
                memoryCost: 19456,
                timeCost: 2,
                outputLen: 32,
                parallelism: 1
            });

            if (!isCurrentPasswordValid) {
                return fail(400, { error: 'Current password is incorrect' });
            }

            // Hash new password
            const hashedNewPassword = await hash(newPassword, {
                memoryCost: 19456,
                timeCost: 2,
                outputLen: 32,
                parallelism: 1
            });

            // Update password
            await db.update(users)
                .set({
                    hashedPassword: hashedNewPassword,
                    updatedAt: new Date()
                })
                .where(eq(users.id, locals.user.id));

            return { success: true, message: 'Password changed successfully!' };
        } catch (error) {
            console.error('Password change error:', error);
            return fail(500, { error: 'Failed to change password. Please try again.' });
        }
    },

    // Request email verification (stubbed out for now)
    requestVerification: async ({ locals }) => {
        if (!locals.user) {
            return fail(401, { error: 'Unauthorized' });
        }

        if (locals.user.emailVerified) {
            return fail(400, { error: 'Email is already verified' });
        }

        try {
            // TODO: Implement email verification system
            // For now, we'll just return a message indicating it's not yet implemented
            console.log('Email verification requested for:', locals.user.email);
            return { 
                success: true, 
                message: 'Email verification is not yet implemented. Please contact support if you need help.' 
            };
        } catch (error) {
            console.error('Email verification request error:', error);
            return fail(500, { error: 'Failed to send verification email. Please try again.' });
        }
    }
}; 