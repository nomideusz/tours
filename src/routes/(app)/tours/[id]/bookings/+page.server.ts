import type { PageServerLoad, Actions } from './$types.js';
import { error, redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours, bookings, timeSlots, qrCodes } from '$lib/db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url, params, parent }) => {
	console.log('Tour bookings page load started for tour:', params.id);
	
	// Get parent layout data first
	const parentData = await parent();
	
	// Check if user is authenticated (should already be handled by layout)
	if (!locals.user) {
		console.log('Tour bookings: User not authenticated, redirecting to login');
		const redirectTo = url.pathname + url.search;
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}
	
	console.log('Tour bookings: User authenticated:', locals.user.id);
	
	// Validate that tour ID is provided
	if (!params.id) {
		console.error('Tour bookings: Tour ID is missing');
		throw error(400, 'Tour ID is required');
	}
	
	try {
		const userId = locals.user.id;
		const tourId = params.id;
		
		console.log(`Loading bookings for tour ${tourId} by user ${userId}`);
		
		// Get the tour first to verify ownership
		console.log('Fetching tour to verify ownership...');
		const tourData = await db
			.select()
			.from(tours)
			.where(and(
				eq(tours.id, tourId),
				eq(tours.userId, userId)
			))
			.limit(1);
		
		console.log('Tour query result:', tourData.length, 'tours found');
		
		if (tourData.length === 0) {
			console.log('Tour not found or access denied for tour:', tourId);
			throw error(404, 'Tour not found or access denied');
		}
		
		const tour = tourData[0];
		console.log('Tour verified:', tour.name);
		
		// Get recent bookings for this specific tour
		console.log('Fetching bookings for tour:', tourId);
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
				bookingReference: bookings.bookingReference,
				attendanceStatus: bookings.attendanceStatus,
				checkedInAt: bookings.checkedInAt,
				ticketQRCode: bookings.ticketQRCode,
				
				// Time slot fields
				timeSlotId: bookings.timeSlotId,
				timeSlotStartTime: timeSlots.startTime,
				timeSlotEndTime: timeSlots.endTime,
				timeSlotAvailableSpots: timeSlots.availableSpots,
				timeSlotBookedSpots: timeSlots.bookedSpots,
				
				// QR code fields
				qrCodeId: bookings.qrCodeId,
				qrCodeCode: qrCodes.code,
				qrCodeCategory: qrCodes.category
			})
			.from(bookings)
			.leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
			.leftJoin(qrCodes, eq(bookings.qrCodeId, qrCodes.id))
			.where(eq(bookings.tourId, params.id))
			.orderBy(desc(bookings.createdAt))
			.limit(50); // Reduced from 100 to 50 to prevent 502 timeout
		
		console.log('Bookings query completed, found:', bookingsData.length, 'bookings');
		
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
			bookingReference: booking.bookingReference,
			attendanceStatus: booking.attendanceStatus,
			checkedInAt: booking.checkedInAt?.toISOString() || null,
			ticketQRCode: booking.ticketQRCode,
			expand: {
				timeSlot: booking.timeSlotId ? {
					id: booking.timeSlotId,
					startTime: booking.timeSlotStartTime?.toISOString(),
					endTime: booking.timeSlotEndTime?.toISOString(),
					availableSpots: booking.timeSlotAvailableSpots,
					bookedSpots: booking.timeSlotBookedSpots
				} : null,
				qrCode: booking.qrCodeId ? {
					id: booking.qrCodeId,
					code: booking.qrCodeCode,
					category: booking.qrCodeCategory
				} : null
			}
		}));
		
		console.log('Tour bookings page load completed successfully');
		
		// Return parent data merged with bookings data
		return {
			...parentData,
			tour: {
				...tour,
				price: parseFloat(tour.price),
				createdAt: tour.createdAt.toISOString(),
				updatedAt: tour.updatedAt.toISOString()
			},
			bookings: processedBookings
		};
		
	} catch (err) {
		console.error('CRITICAL ERROR loading tour bookings:', err);
		console.error('Error details:', {
			message: err instanceof Error ? err.message : 'Unknown error',
			stack: err instanceof Error ? err.stack : 'No stack trace',
			type: err instanceof Error ? err.constructor.name : typeof err,
			status: (err as any)?.status
		});
		
		if ((err as any)?.status === 404) {
			throw error(404, 'Tour not found');
		}
		
		if ((err as any)?.status) {
			throw err; // Re-throw SvelteKit errors
		}
		
		// Return parent data with empty bookings on error
		return {
			...parentData,
			bookings: []
		};
	}
};

export const actions: Actions = {
	updateStatus: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const bookingId = formData.get('bookingId') as string;
		const newStatus = formData.get('status') as 'confirmed' | 'cancelled' | 'completed' | 'no_show';

		if (!bookingId || !newStatus) {
			return fail(400, { error: 'Missing booking ID or status' });
		}

		try {
			// Get booking with tour ownership check
			const bookingData = await db
				.select({
					id: bookings.id,
					status: bookings.status,
					paymentStatus: bookings.paymentStatus
				})
				.from(bookings)
				.innerJoin(tours, eq(bookings.tourId, tours.id))
				.where(and(
					eq(bookings.id, bookingId),
					eq(tours.userId, locals.user.id)
				))
				.limit(1);

			if (bookingData.length === 0) {
				return fail(404, { error: 'Booking not found' });
			}

			const booking = bookingData[0];

			// Validate status transitions
			if (newStatus === 'confirmed' && booking.paymentStatus !== 'paid') {
				return fail(400, { 
					error: 'Cannot confirm booking: Payment not completed. Customer must complete payment first.' 
				});
			}

			if (newStatus === 'completed' && booking.status !== 'confirmed') {
				return fail(400, { 
					error: 'Cannot complete booking: Only confirmed bookings can be marked as completed.' 
				});
			}

			// Update booking status
			await db
				.update(bookings)
				.set({ 
					status: newStatus,
					updatedAt: new Date()
				})
				.where(eq(bookings.id, bookingId));

			return { success: true };
		} catch (err) {
			console.error('Error updating booking status:', err);
			return fail(500, { error: 'Failed to update booking status' });
		}
	}
}; 