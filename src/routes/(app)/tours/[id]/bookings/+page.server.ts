import type { PageServerLoad } from './$types.js';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours, bookings, timeSlots } from '$lib/db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url, params, parent }) => {
	// Get parent layout data first
	const parentData = await parent();
	
	// Check if user is authenticated
	if (!locals.user) {
		console.log('Tour bookings page: User not authenticated, redirecting to login');
		const redirectTo = url.pathname + url.search;
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	// Validate that tour ID is provided
	if (!params.id) {
		throw error(400, 'Tour ID is required');
	}

	try {
		const userId = locals.user.id;
		const tourId = params.id;

		// First, verify the tour exists and belongs to the user
		const tourData = await db
			.select({
				id: tours.id,
				name: tours.name,
				location: tours.location,
				price: tours.price,
				description: tours.description
			})
			.from(tours)
			.where(and(
				eq(tours.id, tourId),
				eq(tours.userId, userId)
			))
			.limit(1);

		if (tourData.length === 0) {
			throw error(404, 'Tour not found');
		}

		const tour = tourData[0];

		// Get all bookings for this specific tour
		const tourBookings = await db
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
				attendanceStatus: bookings.attendanceStatus,
				checkedInAt: bookings.checkedInAt,
				
				// Time slot fields
				timeSlotId: bookings.timeSlotId,
				timeSlotStartTime: timeSlots.startTime,
				timeSlotEndTime: timeSlots.endTime
			})
			.from(bookings)
			.leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
			.where(eq(bookings.tourId, tourId))
			.orderBy(desc(bookings.createdAt));

		// Calculate tour-specific stats
		let totalBookings = tourBookings.length;
		let confirmedBookings = 0;
		let totalRevenue = 0;
		let totalParticipants = 0;
		let upcomingCount = 0;
		let checkedInCount = 0;
		const now = new Date();

		// Transform bookings and calculate stats simultaneously
		const processedBookings = tourBookings.map((booking) => {
			const amount = typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) : (booking.totalAmount || 0);
			const participants = booking.participants || 1;
			
			// Stats calculations
			if (booking.status === 'confirmed') {
				confirmedBookings++;
				if (booking.paymentStatus === 'paid') {
					totalRevenue += amount;
					totalParticipants += participants;
				}
			}
			
			// Check if upcoming
			if (booking.status === 'confirmed' && booking.timeSlotStartTime) {
				try {
					const tourDate = new Date(booking.timeSlotStartTime);
					if (tourDate > now) {
						upcomingCount++;
					}
				} catch (dateError) {
					console.warn('Invalid date for booking', booking.id, ':', booking.timeSlotStartTime);
				}
			}

			// Count check-ins
			if (booking.attendanceStatus === 'checked_in') {
				checkedInCount++;
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
				attendanceStatus: booking.attendanceStatus,
				checkedInAt: booking.checkedInAt?.toISOString(),
				created: booking.createdAt.toISOString(),
				updated: booking.updatedAt.toISOString(),
				effectiveDate: booking.timeSlotStartTime?.toISOString() || booking.createdAt.toISOString(),
				expand: {
					tour: {
						id: tour.id,
						name: tour.name,
						location: tour.location,
						price: tour.price
					},
					timeSlot: booking.timeSlotId ? {
						id: booking.timeSlotId,
						startTime: booking.timeSlotStartTime?.toISOString(),
						endTime: booking.timeSlotEndTime?.toISOString()
					} : null
				}
			};
		});

		// Tour-specific stats
		const stats = {
			totalBookings,
			confirmedBookings,
			totalRevenue,
			totalParticipants,
			upcomingCount,
			checkedInCount
		};

		return {
			...parentData,
			tour,
			bookings: processedBookings,
			stats
		};

	} catch (err) {
		console.error('Error loading tour bookings:', err);
		
		if (err instanceof Error && err.message.includes('not found')) {
			throw error(404, 'Tour not found');
		}
		
		throw error(500, 'Failed to load tour bookings');
	}
}; 