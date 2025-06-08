import type { PageServerLoad, Actions } from './$types.js';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours, bookings, timeSlots } from '$lib/db/schema/index.js';
import { eq, and, desc, count, sum, sql } from 'drizzle-orm';
import { processBooking, calculateBookingStats, type ProcessedBooking } from '$lib/utils/booking-helpers.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	console.log('Tour detail page load started for tour:', params.id);
	
	if (!locals.user) {
		console.log('Tour detail: User not authenticated');
		throw error(401, 'Unauthorized');
	}

	console.log('Tour detail: User authenticated:', locals.user.email);

	try {
		// Get tour with owner check
		console.log('Fetching tour data for ID:', params.id);
		const tourData = await db
			.select()
			.from(tours)
			.where(and(
				eq(tours.id, params.id),
				eq(tours.userId, locals.user.id)
			))
			.limit(1);
		
		console.log('Tour query completed, found:', tourData.length, 'tours');
		
		if (tourData.length === 0) {
			console.log('Tour not found or access denied for tour:', params.id);
			throw error(404, 'Tour not found or access denied');
		}
		
		const tour = tourData[0];
		console.log('Tour loaded successfully:', tour.name);

		// Load recent bookings with time slot information (LIMITED TO PREVENT 502)
		console.log('Fetching bookings for tour:', params.id);
		const allBookingsData = await db
			.select({
				id: bookings.id,
				status: bookings.status,
				paymentStatus: bookings.paymentStatus,
				totalAmount: bookings.totalAmount,
				participants: bookings.participants,
				createdAt: bookings.createdAt,
				timeSlotId: bookings.timeSlotId,
				timeSlotStartTime: timeSlots.startTime,
				timeSlotEndTime: timeSlots.endTime,
				customerName: bookings.customerName,
				customerEmail: bookings.customerEmail,
				ticketQRCode: bookings.ticketQRCode,
				bookingReference: bookings.bookingReference,
				attendanceStatus: bookings.attendanceStatus
			})
			.from(bookings)
			.leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
			.where(eq(bookings.tourId, params.id))
			.orderBy(desc(bookings.createdAt))
			.limit(20); // Reasonable limit to prevent timeout

		console.log('Bookings query completed, found:', allBookingsData.length, 'bookings');

		// Transform using helper for consistency
		const allBookings: ProcessedBooking[] = allBookingsData.map(booking => 
			processBooking({
				id: booking.id,
				status: booking.status,
				paymentStatus: booking.paymentStatus,
				totalAmount: booking.totalAmount ? parseFloat(booking.totalAmount) : 0,
				participants: booking.participants || 0,
				created: booking.createdAt.toISOString(),
				updated: booking.createdAt.toISOString(),
				customerName: booking.customerName || '',
				customerEmail: booking.customerEmail || '',
				ticketQRCode: booking.ticketQRCode || null,
				bookingReference: booking.bookingReference || '',
				attendanceStatus: booking.attendanceStatus || null,
				tour: tour.name,
				expand: {
					timeSlot: booking.timeSlotId ? {
						id: booking.timeSlotId,
						startTime: booking.timeSlotStartTime?.toISOString() || null,
						endTime: booking.timeSlotEndTime?.toISOString() || null
					} : undefined
				}
			})
		);

		// Calculate statistics using helper
		const baseStats = calculateBookingStats(allBookings);
		
		// Filter for upcoming bookings (for check-ins)
		const now = new Date();
		const upcomingBookings = allBookings.filter(b => {
			if (!b.expand?.timeSlot?.startTime) return false;
			const tourDate = new Date(b.expand.timeSlot.startTime);
			const isUpcoming = tourDate > now || tourDate.toDateString() === now.toDateString();
			return isUpcoming && b.status === 'confirmed' && b.paymentStatus === 'paid';
		});

		// Extended statistics
		const stats = {
			...baseStats,
			thisWeekBookings: allBookings.filter(b => new Date(b.created) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
			averageBookingValue: baseStats.confirmed > 0 ? baseStats.totalRevenue / baseStats.confirmed : 0,
			checkIns: upcomingBookings.filter(b => b.attendanceStatus === 'checked_in').length,
			noShows: allBookings.filter(b => b.attendanceStatus === 'no_show').length
		};

		console.log('Tour detail page load completed successfully');

		return {
			tour: {
				...tour,
				price: tour.price ? parseFloat(tour.price) : 0,
				createdAt: tour.createdAt.toISOString(),
				updatedAt: tour.updatedAt.toISOString()
			},
			bookings: upcomingBookings,
			allBookings: allBookings,
			stats
		};
	} catch (err) {
		console.error('CRITICAL ERROR loading tour detail:', err);
		console.error('Error type:', err instanceof Error ? err.constructor.name : typeof err);
		console.error('Error message:', err instanceof Error ? err.message : String(err));
		console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
		
		if ((err as any).status === 404) {
			throw error(404, 'Tour not found');
		}
		if ((err as any).status) {
			throw err;
		}
		throw error(500, 'Failed to load tour details');
	}
};

export const actions: Actions = {
	delete: async ({ params, locals }) => {
		if (!locals.user) {
			throw error(401, 'Unauthorized');
		}

		try {
			// Verify ownership before deletion
			const tourData = await db
				.select()
				.from(tours)
				.where(and(
					eq(tours.id, params.id),
					eq(tours.userId, locals.user.id)
				))
				.limit(1);
			
			if (tourData.length === 0) {
				throw error(404, 'Tour not found or access denied');
			}

			// Delete tour (cascade will handle related records)
			await db
				.delete(tours)
				.where(and(
					eq(tours.id, params.id),
					eq(tours.userId, locals.user.id)
				));

		} catch (err) {
			console.error('Error deleting tour:', err);
			throw error(500, 'Failed to delete tour');
		}

		throw redirect(303, '/tours');
	},

	toggleStatus: async ({ params, locals }) => {
		if (!locals.user) {
			throw error(401, 'Unauthorized');
		}

		try {
			// Get current tour status
			const tourData = await db
				.select({ status: tours.status })
				.from(tours)
				.where(and(
					eq(tours.id, params.id),
					eq(tours.userId, locals.user.id)
				))
				.limit(1);
			
			if (tourData.length === 0) {
				throw error(404, 'Tour not found or access denied');
			}

			const newStatus = tourData[0].status === 'active' ? 'draft' : 'active';

			// Update tour status
			await db
				.update(tours)
				.set({ 
					status: newStatus,
					updatedAt: new Date()
				})
				.where(and(
					eq(tours.id, params.id),
					eq(tours.userId, locals.user.id)
				));

			return { success: true, newStatus };
		} catch (err) {
			console.error('Error toggling tour status:', err);
			throw error(500, 'Failed to update tour status');
		}
	}
}; 