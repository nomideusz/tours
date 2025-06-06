import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots, users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const bookingId = params.id;
	
	if (!bookingId) {
		return json({ error: 'Booking ID is required' }, { status: 400 });
	}
	
	try {
		// Get booking with expanded data (tour, timeSlot, and tour user/guide)
		const bookingData = await db.select({
			// Booking fields
			id: bookings.id,
			customerName: bookings.customerName,
			customerEmail: bookings.customerEmail,
			customerPhone: bookings.customerPhone,
			participants: bookings.participants,
			totalAmount: bookings.totalAmount,
			status: bookings.status,
			paymentId: bookings.paymentId,
			paymentStatus: bookings.paymentStatus,
			bookingReference: bookings.bookingReference,
			specialRequests: bookings.specialRequests,
			ticketQRCode: bookings.ticketQRCode,
			attendanceStatus: bookings.attendanceStatus,
			checkedInAt: bookings.checkedInAt,
			checkedInBy: bookings.checkedInBy,
			createdAt: bookings.createdAt,
			updatedAt: bookings.updatedAt,
			// Tour fields
			tourId: tours.id,
			tourName: tours.name,
			tourDescription: tours.description,
			tourPrice: tours.price,
			tourDuration: tours.duration,
			tourCapacity: tours.capacity,
			tourStatus: tours.status,
			tourLocation: tours.location,
			// TimeSlot fields
			timeSlotId: timeSlots.id,
			timeSlotStartTime: timeSlots.startTime,
			timeSlotEndTime: timeSlots.endTime,
			timeSlotAvailableSpots: timeSlots.availableSpots,
			timeSlotBookedSpots: timeSlots.bookedSpots,
			timeSlotStatus: timeSlots.status,
			// Guide/User fields
			guideId: users.id,
			guideName: users.name,
			guideEmail: users.email
		})
		.from(bookings)
		.innerJoin(tours, eq(bookings.tourId, tours.id))
		.innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
		.innerJoin(users, eq(tours.userId, users.id))
		.where(eq(bookings.id, bookingId))
		.limit(1);
		
		if (bookingData.length === 0) {
			return json({ error: 'Booking not found' }, { status: 404 });
		}
		
		const booking = bookingData[0];
		
		// Format the response with booking data
		const response = {
			id: booking.id,
			customerName: booking.customerName,
			customerEmail: booking.customerEmail,
			customerPhone: booking.customerPhone,
			participants: booking.participants,
			totalAmount: booking.totalAmount,
			status: booking.status,
			paymentId: booking.paymentId,
			paymentStatus: booking.paymentStatus,
			bookingReference: booking.bookingReference,
			specialRequests: booking.specialRequests,
			ticketQRCode: booking.ticketQRCode,
			attendanceStatus: booking.attendanceStatus,
			checkedInAt: booking.checkedInAt,
			checkedInBy: booking.checkedInBy,
			created: booking.createdAt,
			updated: booking.updatedAt,
			// Expanded tour data
			expand: {
				tour: {
					id: booking.tourId,
					name: booking.tourName,
					description: booking.tourDescription,
					price: booking.tourPrice,
					duration: booking.tourDuration,
					capacity: booking.tourCapacity,
					status: booking.tourStatus,
					location: booking.tourLocation,
					// Expanded user data
					user: {
						id: booking.guideId,
						name: booking.guideName,
						email: booking.guideEmail
					}
				},
				timeSlot: {
					id: booking.timeSlotId,
					startTime: booking.timeSlotStartTime,
					endTime: booking.timeSlotEndTime,
					availableSpots: booking.timeSlotAvailableSpots,
					bookedSpots: booking.timeSlotBookedSpots,
					status: booking.timeSlotStatus
				}
			}
		};
		
		return json(response);
	} catch (err) {
		console.error('Error fetching booking status:', err);
		return json({ error: 'Failed to fetch booking status' }, { status: 500 });
	}
}; 