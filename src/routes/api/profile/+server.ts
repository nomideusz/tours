import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Fetch fresh user data from database instead of relying on locals.user
		const freshUserData = await db.select()
			.from(users)
			.where(eq(users.id, locals.user.id))
			.limit(1);

		if (freshUserData.length === 0) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const user = freshUserData[0];
		
		console.log('🔍 Profile fetch - database user data:', {
			userId: user.id,
			country: user.country,
			currency: user.currency,
			location: user.location,
			businessName: user.businessName,
			countryType: typeof user.country,
			currencyType: typeof user.currency,
			locationHasValue: !!user.location,
			businessNameHasValue: !!user.businessName
		});

		// Return user data for the profile form
		const userData = {
			id: user.id,
			email: user.email,
			name: user.name || '',
			username: user.username || '',
			businessName: user.businessName || '',
			description: user.description || '',
			phone: user.phone || '',
			website: user.website || '',
			location: user.location || '',
			avatar: user.avatar || '',
			emailVerified: user.emailVerified || false,
			stripeAccountId: user.stripeAccountId || '',
			country: user.country || '',
			currency: user.currency || 'EUR',
			role: user.role || 'user',
			created: user.createdAt,
			// Check if user has OAuth2 login (no password)
			isOAuth2User: !!(user.avatar && user.avatar.startsWith('http')),
			// Subscription fields
			subscriptionPlan: user.subscriptionPlan || 'free',
			subscriptionStatus: user.subscriptionStatus || 'active',
			subscriptionId: user.subscriptionId || null,
			subscriptionCurrentPeriodStart: user.subscriptionCurrentPeriodStart || null,
			subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd || null,
			subscriptionCancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd || false,
			monthlyBookingsUsed: user.monthlyBookingsUsed || 0,
			monthlyBookingsResetAt: user.monthlyBookingsResetAt || null,
			// Promo code fields
			promoCodeUsed: user.promoCodeUsed || null,
			subscriptionDiscountPercentage: user.subscriptionDiscountPercentage || 0,
			subscriptionFreeUntil: user.subscriptionFreeUntil || null,
			isLifetimeDiscount: user.isLifetimeDiscount || false,
			earlyAccessMember: user.earlyAccessMember || false,
			// Notification preferences
			whatsappNotifications: user.whatsappNotifications ?? true
		};

		return json(userData, {
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate' // Always fetch fresh data
			}
		});
	} catch (error) {
		console.error('Error fetching profile data:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}; 