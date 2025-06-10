import type { PageServerLoad } from './$types.js';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots, users } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const bookingId = url.searchParams.get('booking');
	
	console.log('Payment page loading for booking:', bookingId);
	
	if (!bookingId) {
		throw error(400, 'Booking ID is required');
	}
	
	try {
		// Get booking details with expanded tour and timeSlot data
		const bookingData = await db
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
				tourOwnerUsername: users.username,
				tourOwnerName: users.name
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
		
		// Verify booking is pending payment
		if (booking.paymentStatus !== 'pending') {
			console.log('Booking already paid, redirecting to success page');
			throw redirect(302, `/book/${params.code}/success?booking=${bookingId}`);
		}
		
		// Verify QR code exists in tour
		const tourWithQR = await db
			.select({ id: tours.id, qrCode: tours.qrCode })
			.from(tours)
			.where(eq(tours.qrCode, params.code))
			.limit(1);
		
		if (tourWithQR.length === 0) {
			throw error(404, 'QR code not found');
		}
		
		// Transform to match expected format with expand structure
		const formattedBooking = {
			id: booking.id,
			status: booking.status,
			paymentStatus: booking.paymentStatus,
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
						username: booking.tourOwnerUsername,
						name: booking.tourOwnerName
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
			qrCode: { code: params.code },
			tourOwner: {
				username: booking.tourOwnerUsername,
				name: booking.tourOwnerName
			}
		};
	} catch (err) {
		console.error('Error loading payment page:', err);
		if ((err as any).status === 302 || (err as any).status === 303) throw err;
		throw error(500, 'Failed to load payment information');
	}
}; 