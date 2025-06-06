import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { isValidTicketQRCode } from '$lib/ticket-qr.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots, users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	const ticketCode = params.code;
	
	if (!ticketCode || !isValidTicketQRCode(ticketCode)) {
		throw error(400, 'Invalid ticket code format');
	}
	
	try {
		console.log('Fetching public ticket:', ticketCode);
		
		// Get booking with expanded tour, timeSlot, and tour owner data
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
				timeSlotBookedSpots: timeSlots.bookedSpots,
				
				// Tour owner fields
				tourOwnerEmail: users.email,
				tourOwnerName: users.name
			})
			.from(bookings)
			.leftJoin(tours, eq(bookings.tourId, tours.id))
			.leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
			.leftJoin(users, eq(tours.userId, users.id))
			.where(eq(bookings.ticketQRCode, ticketCode))
			.limit(1);
		
		if (bookingData.length === 0) {
			throw error(404, 'Ticket not found. Please ensure the ticket code is valid.');
		}
		
		const booking = bookingData[0];
		
		// Only show confirmed bookings
		if (booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') {
			throw error(400, 'Ticket is not valid or payment is incomplete');
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
					user: {
						id: booking.tourUserId,
						email: booking.tourOwnerEmail,
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
			ticketCode
		};
	} catch (err) {
		console.error('Failed to fetch ticket:', ticketCode, err);
		if ((err as any).status) throw err;
		throw error(404, 'Ticket not found. Please ensure the ticket code is valid.');
	}
}; 