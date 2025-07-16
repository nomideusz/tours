import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { tours, bookings, timeSlots, users } from '$lib/db/schema/index.js';
import { eq, and, sql, count, sum } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, params }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(401, 'Unauthorized');
	}

	if (!params.id) {
		throw error(400, 'Tour ID is required');
	}

	try {
		// Get tour with user info and stats
		const tourWithStats = await db
			.select({
				// Tour fields
				id: tours.id,
				name: tours.name,
				description: tours.description,
				price: tours.price,
				duration: tours.duration,
				capacity: tours.capacity,
				status: tours.status,
				category: tours.category,
				location: tours.location,
				includedItems: tours.includedItems,
				requirements: tours.requirements,
				cancellationPolicy: tours.cancellationPolicy,
				enablePricingTiers: tours.enablePricingTiers,
				pricingTiers: tours.pricingTiers,
				images: tours.images,
				qrCode: tours.qrCode,
				qrScans: tours.qrScans,
				qrConversions: tours.qrConversions,
				publicListing: tours.publicListing,
				createdAt: tours.createdAt,
				updatedAt: tours.updatedAt,
				// User fields
				userId: users.id,
				userName: users.name,
				userEmail: users.email,
				userRole: users.role,
				userCountry: users.country,
				userCurrency: users.currency,
				userAvatar: users.avatar,
				userCreatedAt: users.createdAt,
			})
			.from(tours)
			.innerJoin(users, eq(tours.userId, users.id))
			.where(eq(tours.id, params.id))
			.limit(1);

		if (tourWithStats.length === 0) {
			throw error(404, 'Tour not found');
		}

		const tour = tourWithStats[0];

		// Get detailed stats
		const [bookingStats, slotStats] = await Promise.all([
			// Booking statistics
			db.select({
				totalBookings: count(),
				confirmedBookings: sum(sql`CASE WHEN ${bookings.status} = 'confirmed' THEN 1 ELSE 0 END`),
				totalRevenue: sum(sql`CASE WHEN ${bookings.status} = 'confirmed' THEN ${bookings.totalAmount} ELSE 0 END`),
				pendingBookings: sum(sql`CASE WHEN ${bookings.status} = 'pending' THEN 1 ELSE 0 END`),
				cancelledBookings: sum(sql`CASE WHEN ${bookings.status} = 'cancelled' THEN 1 ELSE 0 END`),
			}).from(bookings).where(eq(bookings.tourId, params.id)),

			// Time slot statistics  
			db.select({
				totalSlots: count(),
				activeSlots: sum(sql`CASE WHEN ${timeSlots.status} = 'available' AND ${timeSlots.startTime} > NOW() THEN 1 ELSE 0 END`),
				pastSlots: sum(sql`CASE WHEN ${timeSlots.startTime} < NOW() THEN 1 ELSE 0 END`),
				fullSlots: sum(sql`CASE WHEN ${timeSlots.status} = 'full' THEN 1 ELSE 0 END`),
				cancelledSlots: sum(sql`CASE WHEN ${timeSlots.status} = 'cancelled' THEN 1 ELSE 0 END`),
			}).from(timeSlots).where(eq(timeSlots.tourId, params.id))
		]);

		const bookingData = bookingStats[0] || {};
		const slotData = slotStats[0] || {};

		return json({
			tour: {
				id: tour.id,
				name: tour.name,
				description: tour.description,
				price: parseFloat(tour.price),
				duration: tour.duration,
				capacity: tour.capacity,
				status: tour.status,
				category: tour.category,
				location: tour.location,
				includedItems: tour.includedItems || [],
				requirements: tour.requirements || [],
				cancellationPolicy: tour.cancellationPolicy,
				enablePricingTiers: tour.enablePricingTiers,
				pricingTiers: tour.pricingTiers,
				images: tour.images || [],
				qrCode: tour.qrCode,
				qrScans: tour.qrScans || 0,
				qrConversions: tour.qrConversions || 0,
				publicListing: tour.publicListing,
				createdAt: tour.createdAt,
				updatedAt: tour.updatedAt,
				user: {
					id: tour.userId,
					name: tour.userName,
					email: tour.userEmail,
					role: tour.userRole,
					country: tour.userCountry,
					currency: tour.userCurrency,
					avatar: tour.userAvatar,
					createdAt: tour.userCreatedAt,
				},
				stats: {
					bookings: {
						total: Number(bookingData.totalBookings || 0),
						confirmed: Number(bookingData.confirmedBookings || 0),
						pending: Number(bookingData.pendingBookings || 0),
						cancelled: Number(bookingData.cancelledBookings || 0),
						revenue: Number(bookingData.totalRevenue || 0),
					},
					slots: {
						total: Number(slotData.totalSlots || 0),
						active: Number(slotData.activeSlots || 0),
						past: Number(slotData.pastSlots || 0),
						full: Number(slotData.fullSlots || 0),
						cancelled: Number(slotData.cancelledSlots || 0),
					}
				}
			}
		});

	} catch (err) {
		console.error('Admin tour fetch error:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'Failed to fetch tour');
	}
};

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(401, 'Unauthorized');
	}

	if (!params.id) {
		throw error(400, 'Tour ID is required');
	}

	try {
		const body = await request.json();
		const { status, publicListing } = body;

		// Validate input
		const updates: any = {};
		
		if (status !== undefined) {
			if (!['active', 'draft'].includes(status)) {
				throw error(400, 'Invalid status. Must be "active" or "draft"');
			}
			updates.status = status;
		}

		if (publicListing !== undefined) {
			updates.publicListing = Boolean(publicListing);
		}

		if (Object.keys(updates).length === 0) {
			throw error(400, 'No valid updates provided');
		}

		// Check if tour exists
		const existingTour = await db
			.select({ id: tours.id, name: tours.name, userId: tours.userId, status: tours.status })
			.from(tours)
			.where(eq(tours.id, params.id))
			.limit(1);

		if (existingTour.length === 0) {
			throw error(404, 'Tour not found');
		}

		const tour = existingTour[0];

		// Update the tour
		updates.updatedAt = new Date();
		const updatedTour = await db
			.update(tours)
			.set(updates)
			.where(eq(tours.id, params.id))
			.returning();

		if (updatedTour.length === 0) {
			throw error(500, 'Failed to update tour');
		}

		// Log admin action for audit trail
		console.log(`🔧 ADMIN ACTION: ${locals.user.email} updated tour ${params.id} (${tour.name})`, {
			adminId: locals.user.id,
			adminEmail: locals.user.email,
			tourId: params.id,
			tourName: tour.name,
			tourOwnerId: tour.userId,
			updates,
			timestamp: new Date().toISOString()
		});

		return json({
			success: true,
			tour: updatedTour[0],
			message: `Tour ${status ? 'status' : 'settings'} updated successfully`
		});

	} catch (err) {
		console.error('Admin tour update error:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'Failed to update tour');
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(401, 'Unauthorized');
	}

	if (!params.id) {
		throw error(400, 'Tour ID is required');
	}

	try {
		// Get tour info for logging before deletion
		const tourInfo = await db
			.select({
				id: tours.id,
				name: tours.name,
				userId: tours.userId,
				status: tours.status
			})
			.from(tours)
			.where(eq(tours.id, params.id))
			.limit(1);

		if (tourInfo.length === 0) {
			throw error(404, 'Tour not found');
		}

		const tour = tourInfo[0];

		// Get tour stats for logging
		const [bookingCount, revenue] = await Promise.all([
			db.select({ count: count() })
				.from(bookings)
				.where(eq(bookings.tourId, params.id)),
			
			db.select({ total: sum(bookings.totalAmount) })
				.from(bookings)
				.where(and(eq(bookings.tourId, params.id), eq(bookings.status, 'confirmed')))
		]);

		const stats = {
			bookings: Number(bookingCount[0]?.count || 0),
			revenue: Number(revenue[0]?.total || 0)
		};

		// Delete tour (cascading deletes will handle related records)
		const deletedTour = await db
			.delete(tours)
			.where(eq(tours.id, params.id))
			.returning();

		if (deletedTour.length === 0) {
			throw error(500, 'Failed to delete tour');
		}

		// Log admin action for audit trail
		console.log(`🗑️  ADMIN ACTION: ${locals.user.email} deleted tour ${params.id} (${tour.name})`, {
			adminId: locals.user.id,
			adminEmail: locals.user.email,
			tourId: params.id,
			tourName: tour.name,
			tourOwnerId: tour.userId,
			tourStatus: tour.status,
			stats,
			timestamp: new Date().toISOString()
		});

		return json({
			success: true,
			message: `Tour "${tour.name}" deleted successfully`,
			deletedTour: deletedTour[0]
		});

	} catch (err) {
		console.error('Admin tour deletion error:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err; // Re-throw SvelteKit errors  
		}
		throw error(500, 'Failed to delete tour');
	}
}; 