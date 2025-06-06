import type { PageServerLoad } from './$types.js';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots, payments } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url, params, parent }) => {
	// Get parent layout data first
	const parentData = await parent();
	
	// Check if user is authenticated (should already be handled by layout)
	if (!locals.user) {
		console.log('Booking detail: User not authenticated, redirecting to login');
		const redirectTo = url.pathname + url.search;
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}
	
	// Validate that booking ID is provided
	if (!params.id) {
		throw error(400, 'Booking ID is required');
	}
	
	try {
		const userId = locals.user.id;
		const bookingId = params.id;
		
		console.log(`Loading booking ${bookingId} for user ${userId}`);
		
		// Get the booking with expanded tour and timeSlot data
		const bookingData = await db
			.select({
				// Booking fields
				id: bookings.id,
				status: bookings.status,
				paymentStatus: bookings.paymentStatus,
				paymentId: bookings.paymentId,
				totalAmount: bookings.totalAmount,
				participants: bookings.participants,
				customerName: bookings.customerName,
				customerEmail: bookings.customerEmail,
				customerPhone: bookings.customerPhone,
				specialRequests: bookings.specialRequests,
				bookingReference: bookings.bookingReference,
				ticketQRCode: bookings.ticketQRCode,
				attendanceStatus: bookings.attendanceStatus,
				checkedInAt: bookings.checkedInAt,
				createdAt: bookings.createdAt,
				updatedAt: bookings.updatedAt,
				
				// Tour fields
				tourId: bookings.tourId,
				tourName: tours.name,
				tourDescription: tours.description,
				tourLocation: tours.location,
				tourPrice: tours.price,
				tourDuration: tours.duration,
				tourUserId: tours.userId,
				
				// Time slot fields
				timeSlotId: bookings.timeSlotId,
				timeSlotStartTime: timeSlots.startTime,
				timeSlotEndTime: timeSlots.endTime,
				timeSlotAvailableSpots: timeSlots.availableSpots,
				timeSlotBookedSpots: timeSlots.bookedSpots
			})
			.from(bookings)
			.leftJoin(tours, eq(bookings.tourId, tours.id))
			.leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
			.where(eq(bookings.id, bookingId))
			.limit(1);
		
		if (bookingData.length === 0) {
			throw error(404, 'Booking not found');
		}
		
		const booking = bookingData[0];
		
		// Check if the booking belongs to a tour owned by this user
		if (booking.tourUserId !== userId) {
			throw error(403, 'You can only view bookings for your own tours');
		}
		
		// Transform to match expected format with expand structure
		const formattedBooking = {
			id: booking.id,
			status: booking.status,
			paymentStatus: booking.paymentStatus,
			paymentId: booking.paymentId,
			totalAmount: booking.totalAmount,
			participants: booking.participants,
			customerName: booking.customerName,
			customerEmail: booking.customerEmail,
			customerPhone: booking.customerPhone,
			specialRequests: booking.specialRequests,
			bookingReference: booking.bookingReference,
			ticketQRCode: booking.ticketQRCode,
			attendanceStatus: booking.attendanceStatus,
			checkedInAt: booking.checkedInAt?.toISOString(),
			created: booking.createdAt.toISOString(),
			updated: booking.updatedAt.toISOString(),
			expand: {
				tour: {
					id: booking.tourId,
					name: booking.tourName,
					description: booking.tourDescription,
					location: booking.tourLocation,
					price: booking.tourPrice,
					duration: booking.tourDuration,
					user: booking.tourUserId
				},
				timeSlot: booking.timeSlotId ? {
					id: booking.timeSlotId,
					startTime: booking.timeSlotStartTime?.toISOString(),
					endTime: booking.timeSlotEndTime?.toISOString(),
					availableSpots: booking.timeSlotAvailableSpots,
					bookedSpots: booking.timeSlotBookedSpots
				} : null
			}
		};
		
		// Get payment information if exists
		let payment = null;
		if (booking.paymentId) {
			try {
				console.log(`Loading payment for booking ${bookingId} with paymentId: ${booking.paymentId}`);
				
				const paymentData = await db
					.select()
					.from(payments)
					.where(eq(payments.stripePaymentIntentId, booking.paymentId))
					.limit(1);
				
				if (paymentData.length > 0) {
					payment = {
						...paymentData[0],
						created: paymentData[0].createdAt.toISOString(),
						updated: paymentData[0].updatedAt.toISOString(),
						expand: {
							booking: formattedBooking
						}
					};
					console.log(`Payment loaded successfully for booking ${bookingId}`);
				}
			} catch (paymentErr) {
				console.log('Payment not found or accessible for booking', bookingId, ':', paymentErr);
				// Payment record doesn't exist or isn't accessible - this is OK, continue without it
				payment = null;
			}
		}
		
		// Return parent data merged with booking data
		return {
			...parentData,
			booking: formattedBooking,
			payment: payment
		};
		
	} catch (err) {
		console.error('Error loading booking details for booking:', params.id);
		console.error('User ID:', locals.user?.id);
		console.error('Error details:', {
			message: err instanceof Error ? err.message : 'Unknown error',
			status: (err as any)?.status,
			stack: err instanceof Error ? err.stack : 'No stack trace'
		});
		
		if ((err as any).status === 404) {
			console.error('Booking not found - 404 error for booking:', params.id);
			throw error(404, 'Booking not found');
		}
		
		if ((err as any).status === 403) {
			console.error('Access denied - 403 error for booking:', params.id);
			throw error(403, 'You can only view bookings for your own tours');
		}
		
		// For any other error, including timeouts
		console.error('Server error (500) for booking:', params.id, 'Error:', err);
		throw error(500, 'Failed to load booking details');
	}
}; 