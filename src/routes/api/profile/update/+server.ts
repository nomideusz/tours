import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { 
  processAndSaveAvatar, 
  deleteAvatar, 
  getAvatarUrl, 
  isAvatarStorageAvailable,
  initializeAvatarStorage 
} from '$lib/utils/avatar-storage.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString() || '';
		const username = formData.get('username')?.toString() || '';
		const businessName = formData.get('businessName')?.toString() || '';
		const description = formData.get('description')?.toString() || '';
		const phone = formData.get('phone')?.toString() || '';
		const website = formData.get('website')?.toString() || '';
		const location = formData.get('location')?.toString() || '';
		
		// Handle country - preserve existing value if form has empty string
		const countryValue = formData.get('country')?.toString();
		const country = countryValue || locals.user.country || '';
		
		// Handle currency - preserve existing value if form has empty string
		const currencyValue = formData.get('currency')?.toString();
		const currency = currencyValue || locals.user.currency || 'EUR';
		
		// Handle WhatsApp notifications preference
		const whatsappNotificationsValue = formData.get('whatsappNotifications')?.toString();
		const whatsappNotifications = whatsappNotificationsValue ? whatsappNotificationsValue === 'true' : locals.user.whatsappNotifications ?? true;
		
		const avatarFile = formData.get('avatar') as File;
		const avatarValue = formData.get('avatar')?.toString(); // Check if avatar is being explicitly removed

		console.log('📝 Profile update - form data:', {
			formCountry: countryValue,
			formCurrency: currencyValue,
			finalCountry: country,
			finalCurrency: currency,
			existingCountry: locals.user.country,
			existingCurrency: locals.user.currency,
			avatarValue: avatarValue,
			avatarFile: avatarFile
		});

		// Basic validation
		if (username && username.length < 2) {
			return json({ error: 'Username must be at least 2 characters long' }, { status: 400 });
		}

		if (website && !website.match(/^https?:\/\/.+/)) {
			return json({ error: 'Website must be a valid URL starting with http:// or https://' }, { status: 400 });
		}

		// Validate username if provided
		if (username) {
			const { validateUsername, isUsernameAvailable } = await import('$lib/utils/username.js');
			const validation = validateUsername(username);
			
			if (!validation.valid) {
				return json({ error: validation.error }, { status: 400 });
			}

			// Check if username is available (excluding current user)
			if (username !== locals.user.username) {
				const available = await isUsernameAvailable(username);
				if (!available) {
					return json({ error: 'Username is already taken' }, { status: 400 });
				}
			}
		}

		// Validate currency using single source of truth
		const { CURRENCY_DATA } = await import('$lib/utils/countries.js');
		if (!(currency in CURRENCY_DATA)) {
			return json({ error: 'Invalid currency selected' }, { status: 400 });
		}

		// Handle avatar upload/removal
		let newAvatarUrl = locals.user.avatar; // Keep existing avatar by default
		
		// Check if avatar is being explicitly removed (empty string)
		if (avatarValue === '') {
			console.log('🗑️ Removing avatar for user:', locals.user.id);
			
			// Delete old avatar if it exists and is not an OAuth2 avatar (external URL)
			if (locals.user.avatar && !locals.user.avatar.startsWith('http')) {
				try {
					// Extract filename from current avatar URL (assumes format /api/avatars/userId/filename)
					const avatarUrlParts = locals.user.avatar.split('/');
					const oldFilename = avatarUrlParts[avatarUrlParts.length - 1]?.split('?')[0];
					if (oldFilename) {
						await deleteAvatar(locals.user.id, oldFilename);
						console.log('✅ Old avatar deleted successfully');
					}
				} catch (deleteError) {
					console.warn('Failed to delete old avatar:', deleteError);
					// Continue with removal even if old avatar deletion fails
				}
			}
			
			// Set avatar to null/empty
			newAvatarUrl = '';
		} else if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
			try {
				// Check if avatar storage is available
				const storageAvailable = await isAvatarStorageAvailable();
				
				if (!storageAvailable) {
					return json({
						error: 'Avatar upload unavailable',
						message: 'Unable to upload avatar. Please try again later.'
					}, { status: 500 });
				}

				// Initialize avatar storage
				await initializeAvatarStorage();
				
				// Delete old avatar if it exists and is not an OAuth2 avatar (external URL)
				if (locals.user.avatar && !locals.user.avatar.startsWith('http')) {
					try {
						// Extract filename from current avatar URL (assumes format /api/avatars/userId/filename)
						const avatarUrlParts = locals.user.avatar.split('/');
						const oldFilename = avatarUrlParts[avatarUrlParts.length - 1]?.split('?')[0];
						if (oldFilename) {
							await deleteAvatar(locals.user.id, oldFilename);
						}
					} catch (deleteError) {
						console.warn('Failed to delete old avatar:', deleteError);
						// Continue with upload even if old avatar deletion fails
					}
				}
				
				// Process and save new avatar
				const processedAvatar = await processAndSaveAvatar(avatarFile, locals.user.id);
				newAvatarUrl = await getAvatarUrl(locals.user.id, processedAvatar.filename, 'medium');
				
				console.log(`✅ Avatar uploaded successfully: ${newAvatarUrl}`);
			} catch (avatarError) {
				console.error('Avatar upload error:', avatarError);
				return json({ 
					error: 'Avatar upload failed', 
					message: avatarError instanceof Error ? avatarError.message : 'Failed to upload avatar'
				}, { status: 500 });
			}
		}

		// Update user profile
		const userUpdate = {
			name,
			username: username || locals.user.username, // Keep existing username if not provided
			businessName,
			description,
			phone,
			website,
			location,
			country,
			currency,
			whatsappNotifications,
			avatar: newAvatarUrl,
			updatedAt: new Date()
		};
		
		const updatedUsers = await db.update(users)
			.set(userUpdate)
			.where(eq(users.id, locals.user.id))
			.returning();

		if (updatedUsers.length === 0) {
			return json({ error: 'Failed to update profile. User not found.' }, { status: 500 });
		}

		const updatedUser = updatedUsers[0];

		// Update locals.user with the new data
		locals.user = { ...locals.user, ...updatedUser };

		// Create a properly typed return object
		const userReturnData = {
			name: updatedUser.name || '',
			username: updatedUser.username || '',
			businessName: updatedUser.businessName || '',
			description: updatedUser.description || '',
			phone: updatedUser.phone || '',
			website: updatedUser.website || '',
			location: updatedUser.location || '',
			country: updatedUser.country || '',
			currency: updatedUser.currency || 'EUR',
			whatsappNotifications: updatedUser.whatsappNotifications ?? true,
			avatar: updatedUser.avatar || '',
		};

		return json({ 
			success: true, 
			message: 'Profile updated successfully!',
			updatedUser: userReturnData
		});
	} catch (error) {
		console.error('Profile update error:', error);
		return json({ error: 'Failed to update profile. Please try again.' }, { status: 500 });
	}
}; 