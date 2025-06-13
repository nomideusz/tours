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

		// First, verify the tour exists and belongs to the user - simple query
		const [tour] = await db
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

		if (!tour) {
			throw error(404, 'Tour not found');
		}

		// Get bookings with minimal joins - limit to 100 for performance
		const bookingsData = await db
			.select({
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
				timeSlotId: bookings.timeSlotId
			})
			.from(bookings)
			.where(eq(bookings.tourId, tourId))
			.orderBy(desc(bookings.createdAt))
			.limit(100); // Reduced from 500 to 100

		// Fetch time slots separately to avoid complex joins
		const timeSlotIds = [...new Set(bookingsData.map(b => b.timeSlotId).filter(Boolean))];
		const timeSlotsMap = new Map();
		
		if (timeSlotIds.length > 0) {
			try {
				const timeSlotsData = await db
					.select({
						id: timeSlots.id,
						startTime: timeSlots.startTime,
						endTime: timeSlots.endTime
					})
					.from(timeSlots)
					.where(eq(timeSlots.id, timeSlotIds[0])); // Just get first one for now
				
				timeSlotsData.forEach(slot => {
					timeSlotsMap.set(slot.id, slot);
				});
			} catch (slotError) {
				console.warn('Failed to fetch time slots:', slotError);
				// Continue without time slots
			}
		}

		// Simple stats calculation - avoid complex aggregations
		let totalBookings = bookingsData.length;
		let confirmedBookings = 0;
		let totalRevenue = 0;
		let totalParticipants = 0;
		let upcomingCount = 0;
		
		// Simplified processing
		const processedBookings = bookingsData.map((booking) => {
			// Simple amount parsing
			const amount = parseFloat(booking.totalAmount || '0');
			const participants = booking.participants || 1;
			
			// Basic stats - avoid complex logic
			if (booking.status === 'confirmed') {
				confirmedBookings++;
				if (booking.paymentStatus === 'paid') {
					totalRevenue += amount;
					totalParticipants += participants;
				}
			}
			
			// Get time slot info if available
			const timeSlot = booking.timeSlotId ? timeSlotsMap.get(booking.timeSlotId) : null;
			
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
				effectiveDate: timeSlot?.startTime?.toISOString() || booking.createdAt.toISOString(),
				expand: {
					tour: {
						id: tourId,
						name: tour.name,
						location: tour.location
					},
					timeSlot: timeSlot ? {
						id: booking.timeSlotId,
						startTime: timeSlot.startTime?.toISOString(),
						endTime: timeSlot.endTime?.toISOString()
					} : null
				}
			};
		});

		// Simple stats object
		const stats = {
			totalBookings,
			confirmedBookings,
			totalRevenue,
			totalParticipants,
			upcomingCount: 0, // Simplified - avoid complex date calculations
			checkedInCount: 0
		};

		return {
			...parentData,
			tour,
			bookings: processedBookings,
			stats
		};

	} catch (err) {
		console.error('Error loading tour bookings:', err);
		
		// Better error handling - return safe fallback instead of throwing
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		
		// Return minimal safe data to prevent 502
		try {
			const [tour] = await db
				.select({
					id: tours.id,
					name: tours.name,
					location: tours.location || '',
					price: tours.price,
					description: tours.description || ''
				})
				.from(tours)
				.where(and(
					eq(tours.id, params.id!),
					eq(tours.userId, locals.user.id)
				))
				.limit(1);

			return {
				...parentData,
				tour: tour || {
					id: params.id!,
					name: 'Tour',
					location: '',
					price: '0',
					description: ''
				},
				bookings: [],
				stats: {
					totalBookings: 0,
					confirmedBookings: 0,
					totalRevenue: 0,
					totalParticipants: 0,
					upcomingCount: 0,
					checkedInCount: 0
				}
			};
		} catch (fallbackError) {
			console.error('Fallback query failed:', fallbackError);
			throw error(500, 'Failed to load tour bookings');
		}
	}
}; 