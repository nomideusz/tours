import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users, tours, bookings, promoCodes } from '$lib/db/schema/index.js';
import { sql, count, sum, eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { hash } from '@node-rs/argon2';
import { generateUniqueUsername } from '$lib/utils/username.js';
import { applyPromoCodeToUser } from '$lib/utils/promo-codes.js';

export const GET: RequestHandler = async ({ locals }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get all users
		const allUsers = await db
			.select()
			.from(users)
			.orderBy(sql`${users.createdAt} DESC`);

		// Get stats for each user
		const usersWithStats = await Promise.all(
			allUsers.map(async (user) => {
				// Get tour count
				const tourCountResult = await db
					.select({ count: count() })
					.from(tours)
					.where(eq(tours.userId, user.id));
				const tourCount = tourCountResult[0]?.count || 0;

				// Get booking count (as customer)
				const bookingCountResult = await db
					.select({ count: count() })
					.from(bookings)
					.where(eq(bookings.customerEmail, user.email));
				const bookingCount = bookingCountResult[0]?.count || 0;

				// Get total revenue (sum of bookings where they are the tour guide)
				const revenueResult = await db
					.select({ total: sum(bookings.totalAmount) })
					.from(bookings)
					.innerJoin(tours, eq(tours.id, bookings.tourId))
					.where(
						sql`${tours.userId} = ${user.id} AND ${bookings.status} = 'confirmed'`
					);
				const totalRevenue = Number(revenueResult[0]?.total || 0);

			return {
				id: user.id,
				email: user.email,
				name: user.name,
				username: user.username,
				businessName: user.businessName,
				role: user.role,
				avatar: user.avatar,
				phone: user.phone,
				website: user.website,
				description: user.description,
				location: user.location,
				country: user.country,
				currency: user.currency,
				emailVerified: user.emailVerified,
				earlyAccessMember: user.earlyAccessMember,
				lastLogin: user.lastLogin,
				createdAt: user.createdAt,
				subscriptionPlan: user.subscriptionPlan || 'free',
				stripeAccountId: user.stripeAccountId,
				tourCount,
				bookingCount,
				totalRevenue
			};
			})
		);

		return json(usersWithStats);
	} catch (error) {
		console.error('Error fetching users:', error);
		return json({ error: 'Failed to fetch users' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ locals, request }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const formData = await request.formData();
		const email = formData.get('email')?.toString()?.trim();
		const name = formData.get('name')?.toString()?.trim();
		const password = formData.get('password')?.toString();
		const role = formData.get('role')?.toString() || 'user';
		const betaGroup = formData.get('betaGroup')?.toString() || '';

		// Validation
		if (!email || !name || !password) {
			return json({ 
				error: 'Email, name, and password are required' 
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

		// Validate role
		if (!['user', 'admin'].includes(role)) {
			return json({ 
				error: 'Role must be either user or admin' 
			}, { status: 400 });
		}

		// Validate beta group
		if (betaGroup && !['beta_1', 'beta_2'].includes(betaGroup)) {
			return json({ 
				error: 'Beta group must be either beta_1 or beta_2' 
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
			role: role as 'user' | 'admin',
			emailVerified: true, // Admin-created accounts are pre-verified
			betaGroup: (betaGroup || null) as 'beta_1' | 'beta_2' | null, // Set beta group if provided
			country: null, // User will set during onboarding
			currency: 'EUR' // Default currency
		});

		// Apply promo code based on beta group
		let promoMessage = '';
		if (betaGroup) {
			try {
				// Determine which promo code to apply
				const promoCodeToApply = betaGroup === 'beta_1' ? 'BETA_APPRECIATION' : 'BETA2';
				const benefitsText = betaGroup === 'beta_1' 
					? '12 months free + 30% lifetime discount'
					: '4 months free + 20% lifetime discount';

				// Get the promo code from database
				const promoCode = await db
					.select()
					.from(promoCodes)
					.where(eq(promoCodes.code, promoCodeToApply))
					.limit(1);

				if (promoCode.length > 0) {
					const result = await applyPromoCodeToUser(newUserId, promoCode[0]);
					if (result.success) {
						promoMessage = ` ${betaGroup.toUpperCase()} benefits applied: ${benefitsText}.`;
					} else {
						console.error('Failed to apply promo code:', result.error);
						promoMessage = ` (Note: ${betaGroup.toUpperCase()} promo code could not be applied automatically)`;
					}
				} else {
					console.error(`${promoCodeToApply} promo code not found in database`);
					promoMessage = ` (Note: ${betaGroup.toUpperCase()} promo code not found - please apply manually)`;
				}
			} catch (error) {
				console.error('Error applying promo code:', error);
				promoMessage = ` (Note: ${betaGroup.toUpperCase()} promo code could not be applied automatically)`;
			}
		}

		// Return success without sensitive data
		return json({ 
			success: true,
			message: `User account created successfully for ${email}.${promoMessage}`,
			user: {
				id: newUserId,
				email: email.toLowerCase(),
				name,
				username,
				role,
				emailVerified: true,
				betaGroup: betaGroup || null
			}
		});

	} catch (error) {
		console.error('Error creating user:', error);
		return json({ 
			error: 'Failed to create user account' 
		}, { status: 500 });
	}
}; 