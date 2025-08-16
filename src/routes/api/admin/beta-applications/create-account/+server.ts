import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users, promoCodes, betaApplications } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { hash } from '@node-rs/argon2';
import { generateUniqueUsername } from '$lib/utils/username.js';
import { applyPromoCodeToUser } from '$lib/utils/promo-codes.js';

export const POST: RequestHandler = async ({ locals, request }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const {
			applicationId,
			email,
			name,
			password,
			businessName,
			phone,
			location,
			country
		} = await request.json();

		// Validation
		if (!applicationId || !email || !name || !password) {
			return json({ 
				error: 'Application ID, email, name, and password are required' 
			}, { status: 400 });
		}

		if (password.length < 8) {
			return json({ 
				error: 'Password must be at least 8 characters long' 
			}, { status: 400 });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json({ 
				error: 'Please provide a valid email address' 
			}, { status: 400 });
		}

		// Check if application exists and is accepted
		const application = await db
			.select()
			.from(betaApplications)
			.where(eq(betaApplications.id, applicationId))
			.limit(1);

		if (application.length === 0) {
			return json({ 
				error: 'Beta application not found' 
			}, { status: 404 });
		}

		if (application[0].status !== 'accepted') {
			return json({ 
				error: 'Only accepted applications can have accounts created' 
			}, { status: 400 });
		}

		// Check if user already exists
		const existingUser = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email.toLowerCase()))
			.limit(1);

		if (existingUser.length > 0) {
			return json({ 
				error: 'A user with this email already exists' 
			}, { status: 400 });
		}

		// Generate unique username
		const username = await generateUniqueUsername(name);

		// Hash password
		const hashedPassword = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		// Create user
		const newUserId = createId();
		await db.insert(users).values({
			id: newUserId,
			email: email.toLowerCase(),
			name,
			username,
			hashedPassword,
			role: 'user',
			emailVerified: true, // Admin-created accounts are pre-verified
			businessName: businessName || null,
			phone: phone || null,
			location: location || null,
			country: country || null,
			currency: 'EUR' // Default currency
		});

		// Apply BETA_APPRECIATION promo code
		let promoMessage = '';
		try {
			// Get the BETA_APPRECIATION promo code
			const betaPromoCode = await db
				.select()
				.from(promoCodes)
				.where(eq(promoCodes.code, 'BETA_APPRECIATION'))
				.limit(1);

			if (betaPromoCode.length > 0) {
				const result = await applyPromoCodeToUser(newUserId, betaPromoCode[0]);
				if (result.success) {
					promoMessage = ' Beta benefits applied: 12 months free + 30% lifetime discount.';
				} else {
					console.error('Failed to apply beta promo code:', result.error);
					promoMessage = ' (Note: Beta promo code could not be applied automatically)';
				}
			} else {
				console.error('BETA_APPRECIATION promo code not found in database');
				promoMessage = ' (Note: Beta promo code not found - please apply manually)';
			}
		} catch (error) {
			console.error('Error applying beta promo code:', error);
			promoMessage = ' (Note: Beta promo code could not be applied automatically)';
		}

		// Update application to mark that account was created
		await db
			.update(betaApplications)
			.set({
				reviewerNotes: (application[0].reviewerNotes || '') + 
					`\n\n[${new Date().toISOString()}] Beta account created by ${locals.user.email}. User ID: ${newUserId}`,
				updatedAt: new Date()
			})
			.where(eq(betaApplications.id, applicationId));

		// Return success without sensitive data
		return json({ 
			success: true,
			message: `Beta account created successfully for ${email}.${promoMessage}`,
			user: {
				id: newUserId,
				email: email.toLowerCase(),
				name,
				username,
				role: 'user',
				emailVerified: true,
				isBetaTester: true
			}
		});

	} catch (error) {
		console.error('Error creating beta account:', error);
		return json({ 
			error: 'Failed to create beta account' 
		}, { status: 500 });
	}
};
