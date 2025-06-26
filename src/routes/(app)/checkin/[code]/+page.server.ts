import type { PageServerLoad, Actions } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { isValidTicketQRCode } from '$lib/ticket-qr.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots, users } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	const ticketCode = params.code;
	
	if (!ticketCode || !isValidTicketQRCode(ticketCode)) {
		throw error(400, 'Invalid ticket code format');
	}
	
	// Check if user is authenticated
	if (!locals?.user) {
		throw error(401, 'Authentication required. Please log in to access check-in functionality.');
	}
	
	const currentUser = locals.user;
	
	try {
		console.log('Looking for booking with ticket code:', ticketCode);
		
		// Find booking by ticket QR code with expanded tour and timeSlot data
		const bookingData = await db
			.select({
				// Booking fields
				id: bookings.id,
				status: bookings.status,
				paymentStatus: bookings.paymentStatus,
				totalAmount: bookings.totalAmount,
				participants: bookings.participants,
				participantBreakdown: bookings.participantBreakdown,
				customerName: bookings.customerName,
				customerEmail: bookings.customerEmail,
				customerPhone: bookings.customerPhone,
				specialRequests: bookings.specialRequests,
				bookingReference: bookings.bookingReference,
				ticketQRCode: bookings.ticketQRCode,
				attendanceStatus: bookings.attendanceStatus,
				checkedInAt: bookings.checkedInAt,
				checkedInBy: bookings.checkedInBy,
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
				tourOwnerCurrency: users.currency,
				tourOwnerName: users.name
			})
			.from(bookings)
			.leftJoin(tours, eq(bookings.tourId, tours.id))
			.leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
			.leftJoin(users, eq(tours.userId, users.id))
			.where(eq(bookings.ticketQRCode, ticketCode))
			.limit(1);
		
		if (bookingData.length === 0) {
			throw error(404, 'Ticket not found. Please check the ticket code and try again.');
		}
		
		const booking = bookingData[0];
		
		console.log('Found booking:', booking.id, 'for tour:', booking.tourName);
		
		// Only show confirmed bookings
		if (booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') {
			throw error(400, 'Ticket is not valid or payment is incomplete');
		}
		
		// Check if current user is authorized to check in this booking
		if (currentUser.id !== booking.tourUserId) {
			throw error(403, 'You are not authorized to check in this booking. Only the tour guide can check in customers.');
		}
		
		// Check if the tour has already happened (past date)
		if (booking.timeSlotStartTime) {
			const tourDate = new Date(booking.timeSlotStartTime);
			const now = new Date();
			
			// If the tour ended more than 24 hours ago, show specific error
			if (booking.timeSlotEndTime) {
				const tourEndTime = new Date(booking.timeSlotEndTime);
				const hoursSinceTourEnd = (now.getTime() - tourEndTime.getTime()) / (1000 * 60 * 60);
				
				if (hoursSinceTourEnd > 24) {
					throw error(410, 'This tour has already taken place. Check-in is no longer available for past tours.');
				}
			}
		}
		
		// Transform to match expected format with expand structure
		const formattedBooking = {
			id: booking.id,
			status: booking.status,
			paymentStatus: booking.paymentStatus,
			totalAmount: booking.totalAmount,
			participants: booking.participants,
			participantBreakdown: booking.participantBreakdown,
			customerName: booking.customerName,
			customerEmail: booking.customerEmail,
			customerPhone: booking.customerPhone,
			specialRequests: booking.specialRequests,
			bookingReference: booking.bookingReference,
			ticketQRCode: booking.ticketQRCode,
			attendanceStatus: booking.attendanceStatus,
			checkedInAt: booking.checkedInAt?.toISOString(),
			checkedInBy: booking.checkedInBy,
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
		
		return {
			booking: formattedBooking,
			ticketCode,
			currentUser,
			tourOwnerCurrency: booking.tourOwnerCurrency || 'EUR',
			tourOwnerName: booking.tourOwnerName
		};
	} catch (err) {
		console.error('Error loading check-in page:', err);
		if ((err as any).status) throw err;
		throw error(500, 'Failed to load check-in information');
	}
};

export const actions: Actions = {
	checkin: async ({ params, locals }) => {
		if (!locals?.user) {
			return fail(401, { error: 'Authentication required' });
		}
		
		const ticketCode = params.code;
		const currentUser = locals.user;
		
		if (!ticketCode || !isValidTicketQRCode(ticketCode)) {
			return fail(400, { error: 'Invalid ticket code' });
		}
		
		try {
			// Find booking with tour information
			const bookingData = await db
				.select({
					id: bookings.id,
					tourUserId: tours.userId,
					attendanceStatus: bookings.attendanceStatus
				})
				.from(bookings)
				.leftJoin(tours, eq(bookings.tourId, tours.id))
				.where(eq(bookings.ticketQRCode, ticketCode))
				.limit(1);
			
			if (bookingData.length === 0) {
				return fail(404, { error: 'Booking not found' });
			}
			
			const booking = bookingData[0];
			
			// Verify authorization
			if (booking.tourUserId !== currentUser.id) {
				return fail(403, { error: 'Not authorized to check in this booking' });
			}
			
			// Check if already checked in
			if (booking.attendanceStatus === 'checked_in') {
				return fail(400, { error: 'Customer is already checked in' });
			}
			
			// Update attendance status
			const checkedInAt = new Date();
			await db
				.update(bookings)
				.set({
					attendanceStatus: 'checked_in',
					checkedInAt: checkedInAt,
					checkedInBy: currentUser.id,
					updatedAt: new Date()
				})
				.where(eq(bookings.id, booking.id));
			
			return { success: true, checkedInAt: checkedInAt.toISOString() };
		} catch (err) {
			console.error('Check-in error:', err);
			return fail(500, { error: 'Failed to check in customer' });
		}
	},
	
	noshow: async ({ params, locals }) => {
		if (!locals?.user) {
			return fail(401, { error: 'Authentication required' });
		}
		
		const ticketCode = params.code;
		const currentUser = locals.user;
		
		if (!ticketCode || !isValidTicketQRCode(ticketCode)) {
			return fail(400, { error: 'Invalid ticket code' });
		}
		
		try {
			// Find booking with tour information
			const bookingData = await db
				.select({
					id: bookings.id,
					tourUserId: tours.userId
				})
				.from(bookings)
				.leftJoin(tours, eq(bookings.tourId, tours.id))
				.where(eq(bookings.ticketQRCode, ticketCode))
				.limit(1);
			
			if (bookingData.length === 0) {
				return fail(404, { error: 'Booking not found' });
			}
			
			const booking = bookingData[0];
			
			// Verify authorization
			if (booking.tourUserId !== currentUser.id) {
				return fail(403, { error: 'Not authorized to update this booking' });
			}
			
			// Update attendance status
			await db
				.update(bookings)
				.set({
					attendanceStatus: 'no_show',
					checkedInBy: currentUser.id,
					updatedAt: new Date()
				})
				.where(eq(bookings.id, booking.id));
			
			return { success: true, noShow: true };
		} catch (err) {
			console.error('No-show marking error:', err);
			return fail(500, { error: 'Failed to mark as no-show' });
		}
	}
}; 