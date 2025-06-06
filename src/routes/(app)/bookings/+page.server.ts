import type { PageServerLoad } from './$types.js';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours, bookings, timeSlots } from '$lib/db/schema/index.js';
import { eq, and, desc, inArray } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	// Get parent layout data first
	const parentData = await parent();
	
	// Check if user is authenticated (should already be handled by layout)
	if (!locals.user) {
		console.log('Bookings page: User not authenticated, redirecting to login');
		const redirectTo = url.pathname + url.search;
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}
	
	try {
		const userId = locals.user.id;
		
		// Get user's tours first (up to 100)
		const userTours = await db
			.select({
				id: tours.id,
				name: tours.name
			})
			.from(tours)
			.where(eq(tours.userId, userId))
			.limit(100);
		
		if (userTours.length === 0) {
			return {
				...parentData,
				bookings: []
			};
		}
		
		// Get recent bookings for user's tours (last 100)
		const tourIds = userTours.map(t => t.id);
		const bookingsData = await db
			.select({
				// Booking fields
				id: bookings.id,
				status: bookings.status,
				paymentStatus: bookings.paymentStatus,
				totalAmount: bookings.totalAmount,
				participants: bookings.participants,
				customerName: bookings.customerName,
				customerEmail: bookings.customerEmail,
				customerPhone: bookings.customerPhone,
				specialRequests: bookings.specialRequests,
				createdAt: bookings.createdAt,
				updatedAt: bookings.updatedAt,
				
				// Tour fields  
				tourId: bookings.tourId,
				tourName: tours.name,
				tourLocation: tours.location,
				
				// Time slot fields
				timeSlotId: bookings.timeSlotId,
				timeSlotStartTime: timeSlots.startTime,
				timeSlotEndTime: timeSlots.endTime
			})
			.from(bookings)
			.leftJoin(tours, eq(bookings.tourId, tours.id))
			.leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
			.where(inArray(bookings.tourId, tourIds))
			.orderBy(desc(bookings.createdAt))
			.limit(100);
		
		// Transform to match expected format with expand structure
		const processedBookings = bookingsData.map((booking) => ({
			id: booking.id,
			status: booking.status,
			paymentStatus: booking.paymentStatus,
			totalAmount: booking.totalAmount || '0',
			participants: booking.participants || 1,
			customerName: booking.customerName,
			customerEmail: booking.customerEmail,
			customerPhone: booking.customerPhone,
			specialRequests: booking.specialRequests,
			created: booking.createdAt.toISOString(),
			updated: booking.updatedAt.toISOString(),
			effectiveDate: booking.timeSlotStartTime?.toISOString() || booking.createdAt.toISOString(),
			expand: {
				tour: {
					id: booking.tourId,
					name: booking.tourName,
					location: booking.tourLocation
				},
				timeSlot: booking.timeSlotId ? {
					id: booking.timeSlotId,
					startTime: booking.timeSlotStartTime?.toISOString(),
					endTime: booking.timeSlotEndTime?.toISOString()
				} : null
			}
		}));
		
		// Return parent data merged with bookings data
		return {
			...parentData,
			bookings: processedBookings
		};
		
	} catch (err) {
		console.error('Error loading bookings:', err);
		
		// Return parent data with empty bookings on error
		return {
			...parentData,
			bookings: []
		};
	}
}; 