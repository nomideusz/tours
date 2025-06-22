import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users, tours, bookings, timeSlots, sessions, notifications, oauthAccounts } from '$lib/db/schema/index.js';
import { eq, and, gte, isNull, or } from 'drizzle-orm';
import { lucia } from '$lib/auth/lucia.js';
import { getStripe } from '$lib/stripe.server.js';
import { verify } from '@node-rs/argon2';

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	try {
		if (!locals.user || !locals.session) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { password } = await request.json();
		const userId = locals.user.id;

		// Get user data
		const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Verify password for non-OAuth users
		if (user.hashedPassword) {
			if (!password) {
				return json({ error: 'Password is required' }, { status: 400 });
			}
			
			const validPassword = await verify(user.hashedPassword, password, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});
			
			if (!validPassword) {
				return json({ error: 'Invalid password' }, { status: 401 });
			}
		}

		// Check for active bookings (future bookings that are confirmed or pending)
		const now = new Date();
		const activeBookings = await db.select({
			id: bookings.id,
			tourName: tours.name,
			startTime: timeSlots.startTime,
			customerName: bookings.customerName,
			status: bookings.status
		})
		.from(bookings)
		.innerJoin(tours, eq(bookings.tourId, tours.id))
		.innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
		.where(
			and(
				eq(tours.userId, userId),
				gte(timeSlots.startTime, now),
				or(
					eq(bookings.status, 'confirmed'),
					eq(bookings.status, 'pending')
				)
			)
		);

		if (activeBookings.length > 0) {
			return json({ 
				error: 'Cannot delete account with active bookings',
				details: `You have ${activeBookings.length} upcoming bookings. Please cancel or complete them first.`,
				activeBookings: activeBookings.map(b => ({
					tourName: b.tourName,
					startTime: b.startTime,
					customerName: b.customerName,
					status: b.status
				}))
			}, { status: 400 });
		}

		// Perform soft delete
		await db.transaction(async (tx) => {
			// 1. Anonymize user data
			await tx.update(users)
				.set({
					email: `deleted_${userId}@deleted.zaur.app`,
					name: 'Deleted User',
					username: null,
					businessName: null,
					phone: null,
					website: null,
					location: null,
					description: null,
					avatar: null,
					hashedPassword: null,
					stripeAccountId: null,
					stripeCustomerId: null,
					subscriptionId: null,
					deletedAt: new Date(),
					updatedAt: new Date()
				})
				.where(eq(users.id, userId));

			// 2. Deactivate all tours
			await tx.update(tours)
				.set({
					status: 'draft',
					updatedAt: new Date()
				})
				.where(eq(tours.userId, userId));

			// 3. Cancel future time slots for user's tours
			const userTours = await tx.select({ id: tours.id })
				.from(tours)
				.where(eq(tours.userId, userId));
			
			if (userTours.length > 0) {
				const tourIds = userTours.map(t => t.id);
				for (const tourId of tourIds) {
					await tx.update(timeSlots)
						.set({
							status: 'cancelled',
							updatedAt: new Date()
						})
						.where(
							and(
								eq(timeSlots.tourId, tourId),
								gte(timeSlots.startTime, now)
							)
						);
				}
			}

			// 4. Clear notifications
			await tx.delete(notifications).where(eq(notifications.userId, userId));

			// 5. Clear OAuth accounts
			await tx.delete(oauthAccounts).where(eq(oauthAccounts.userId, userId));

			// 6. Handle Stripe account closure if exists
			if (user.stripeAccountId) {
				try {
					const stripe = getStripe();
					// Note: Stripe doesn't allow programmatic account deletion
					// We can only disconnect the account from our platform
					console.log(`Stripe account ${user.stripeAccountId} needs manual closure`);
				} catch (stripeError) {
					console.error('Stripe disconnection error:', stripeError);
					// Continue with deletion even if Stripe fails
				}
			}

			// 7. Cancel subscription if exists
			if (user.subscriptionId && user.stripeCustomerId) {
				try {
					const stripe = getStripe();
					await stripe.subscriptions.cancel(user.subscriptionId);
				} catch (stripeError) {
					console.error('Subscription cancellation error:', stripeError);
					// Continue with deletion
				}
			}
		});

		// Invalidate all user sessions
		await lucia.invalidateUserSessions(userId);
		
		// Clear the current session cookie
		const sessionCookie = lucia.createBlankSessionCookie();
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		return json({ 
			success: true,
			message: 'Your account has been deleted. You have 30 days to contact support if you wish to recover it.'
		});

	} catch (error) {
		console.error('Account deletion error:', error);
		return json({ error: 'Failed to delete account' }, { status: 500 });
	}
}; 