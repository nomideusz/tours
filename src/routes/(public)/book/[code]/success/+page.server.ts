import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots, users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const bookingId = url.searchParams.get('booking');
	
	if (!bookingId) {
		throw error(400, 'Booking ID is required');
	}
	
	try {
		// Get booking details with all related data
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
				timeSlotBookedSpots: timeSlots.bookedSpots,
				
				// Tour owner fields
				tourOwnerEmail: users.email,
				tourOwnerName: users.name,
				tourOwnerUsername: users.username
			})
			.from(bookings)
			.leftJoin(tours, eq(bookings.tourId, tours.id))
			.leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
			.leftJoin(users, eq(tours.userId, users.id))
			.where(eq(bookings.id, bookingId))
			.limit(1);
		
		if (bookingData.length === 0) {
			throw error(404, 'Booking not found');
		}
		
		const booking = bookingData[0];
		
		// Check if this is a valid booking for success page
		// Allow confirmed/paid (webhook processed) OR pending payment (payment processing)
		const isValidForSuccess = (
			// Booking is fully confirmed and paid (webhook processed)
			(booking.status === 'confirmed' && booking.paymentStatus === 'paid') ||
			// OR booking has payment in progress (user just paid, webhook hasn't processed yet)
			(booking.status === 'pending' && booking.paymentStatus === 'pending' && booking.paymentId)
		);
		
		if (!isValidForSuccess) {
			// Only fail if booking is clearly not payment-related (no paymentId) or has failed
			if (!booking.paymentId || booking.paymentStatus === 'failed') {
				throw error(400, 'Booking is not valid for confirmation page');
			}
		}
		
		// Determine if payment is still processing
		const isPaymentProcessing = booking.status === 'pending' && booking.paymentStatus === 'pending' && booking.paymentId;
		
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
					user: {
						id: booking.tourUserId,
						email: booking.tourOwnerEmail,
						name: booking.tourOwnerName,
						username: booking.tourOwnerUsername
					}
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
		
		return {
			booking: formattedBooking,
			isPaymentProcessing,
			tourOwner: {
				username: booking.tourOwnerUsername,
				name: booking.tourOwnerName
			}
		};
	} catch (err) {
		console.error('Error loading success page:', err);
		if ((err as any).status) throw err;
		throw error(500, 'Failed to load booking confirmation');
	}
}; 