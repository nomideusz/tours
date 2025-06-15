import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { isValidTicketQRCode } from '$lib/ticket-qr.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots, users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const ticketCode = params.code;
	
	console.log(`Ticket API called with code: ${ticketCode}`);
	console.log(`Is valid ticket code: ${isValidTicketQRCode(ticketCode)}`);
	
	if (!ticketCode || !isValidTicketQRCode(ticketCode)) {
		console.log(`Rejecting invalid ticket code: ${ticketCode}`);
		return json({ error: 'Invalid ticket code format' }, { status: 400 });
	}
	
	try {
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
				tourOwnerName: users.name,
				tourOwnerUsername: users.username,
				tourOwnerCurrency: users.currency
			})
			.from(bookings)
			.leftJoin(tours, eq(bookings.tourId, tours.id))
			.leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
			.leftJoin(users, eq(tours.userId, users.id))
			.where(eq(bookings.ticketQRCode, ticketCode))
			.limit(1);
		
		console.log(`Found ${bookingData.length} bookings for ticket code: ${ticketCode}`);
		
		if (bookingData.length === 0) {
			console.log(`No booking found for ticket code: ${ticketCode}`);
			return json({ error: 'Ticket not found' }, { status: 404 });
		}
		
		const booking = bookingData[0];
		
		console.log(`Booking found:`, {
			id: booking.id,
			status: booking.status,
			paymentStatus: booking.paymentStatus,
			ticketQRCode: booking.ticketQRCode
		});
		
		// Only show confirmed bookings
		if (booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') {
			console.log(`Booking not confirmed/paid: status=${booking.status}, paymentStatus=${booking.paymentStatus}`);
			return json({ error: 'Ticket is not valid or payment is incomplete' }, { status: 400 });
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
		
		return json({
			booking: formattedBooking,
			tourOwner: {
				username: booking.tourOwnerUsername,
				name: booking.tourOwnerName,
				currency: booking.tourOwnerCurrency
			},
			ticketCode
		});
		
	} catch (err) {
		console.error('Error fetching public ticket data:', err);
		return json({ error: 'Failed to load ticket data' }, { status: 500 });
	}
}; 