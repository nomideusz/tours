import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';

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
            verified: locals.user.verified || false,
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

        try {
            // Update user profile
            const updatedUser = await locals.pb.collection('users').update(locals.user.id, {
                name,
                username,
                businessName,
                description,
                phone,
                website
            });

            // Update locals.user with the new data
            locals.user = updatedUser;

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
            // Verify current password and update
            await locals.pb.collection('users').update(locals.user.id, {
                oldPassword: currentPassword,
                password: newPassword,
                passwordConfirm: confirmPassword
            });

            return { success: true, message: 'Password changed successfully!' };
        } catch (error) {
            console.error('Password change error:', error);
            
            // Handle specific PocketBase errors
            if (error instanceof Error && error.message.includes('password')) {
                return fail(400, { error: 'Current password is incorrect' });
            }
            
            return fail(500, { error: 'Failed to change password. Please try again.' });
        }
    },

    // Request email verification
    requestVerification: async ({ locals }) => {
        if (!locals.user) {
            return fail(401, { error: 'Unauthorized' });
        }

        if (locals.user.verified) {
            return fail(400, { error: 'Email is already verified' });
        }

        try {
            await locals.pb.collection('users').requestVerification(locals.user.email);
            return { success: true, message: 'Verification email sent! Please check your inbox.' };
        } catch (error) {
            console.error('Email verification request error:', error);
            return fail(500, { error: 'Failed to send verification email. Please try again.' });
        }
    }
}; 