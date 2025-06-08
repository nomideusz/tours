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
				bookings: [],
				stats: {
					totalBookings: 0,
					confirmedBookings: 0,
					totalRevenue: 0,
					totalParticipants: 0,
					upcomingCount: 0
				}
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
		
		// Calculate stats server-side to avoid frontend errors
		let totalBookings = bookingsData.length;
		let confirmedBookings = 0;
		let totalRevenue = 0;
		let totalParticipants = 0;
		let upcomingCount = 0;
		const now = new Date();
		
		// Transform bookings and calculate stats simultaneously
		const processedBookings = bookingsData.map((booking) => {
			const amount = typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) : (booking.totalAmount || 0);
			const participants = booking.participants || 1;
			
			// Stats calculations with safe data access
			if (booking.status === 'confirmed') {
				confirmedBookings++;
				if (booking.paymentStatus === 'paid') {
					totalRevenue += amount;
					totalParticipants += participants;
				}
			}
			
			// Check if upcoming (safe date handling)
			if (booking.status === 'confirmed' && booking.timeSlotStartTime) {
				try {
					const tourDate = new Date(booking.timeSlotStartTime);
					if (tourDate > now) {
						upcomingCount++;
					}
				} catch (dateError) {
					// Skip invalid dates
					console.warn('Invalid date for booking', booking.id, ':', booking.timeSlotStartTime);
				}
			}
			
			return {
				id: booking.id,
				status: booking.status,
				paymentStatus: booking.paymentStatus,
				totalAmount: booking.totalAmount || '0',
				participants: participants,
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
			};
		});
		
		// Pre-calculated stats to avoid frontend complexity
		const stats = {
			totalBookings,
			confirmedBookings,
			totalRevenue,
			totalParticipants,
			upcomingCount
		};
		
		// Return parent data merged with bookings data and stats
		return {
			...parentData,
			bookings: processedBookings,
			stats
		};
		
	} catch (err) {
		console.error('Error loading bookings:', err);
		
		// Return parent data with empty bookings and zero stats on error
		return {
			...parentData,
			bookings: [],
			stats: {
				totalBookings: 0,
				confirmedBookings: 0,
				totalRevenue: 0,
				totalParticipants: 0,
				upcomingCount: 0
			}
		};
	}
}; 