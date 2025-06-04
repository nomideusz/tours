import type { PageServerLoad, Actions } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { isValidTicketQRCode } from '$lib/ticket-qr.js';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';

const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const load: PageServerLoad = async ({ params, locals }) => {
	const ticketCode = params.code;
	
	if (!ticketCode || !isValidTicketQRCode(ticketCode)) {
		throw error(400, 'Invalid ticket code format');
	}
	
	// Check if user is authenticated
	if (!locals?.pb?.authStore?.isValid || !locals?.user) {
		throw error(401, 'Authentication required. Please log in to access check-in functionality.');
	}
	
	const pb = locals.pb;
	const currentUser = locals.user;
	
	try {
		console.log('Looking for booking with ticket code:', ticketCode);
		
		// Find booking by ticket QR code
		// Note: Bookings are viewable without authentication according to the schema rules
		// This allows tour guides to see any booking for check-in purposes
		let booking;
		try {
			booking = await pb.collection('bookings').getFirstListItem(
				`ticketQRCode = "${ticketCode}"`,
				{ expand: 'tour,timeSlot,tour.user' }
			);
		} catch (bookingErr) {
			console.log('Booking not found:', bookingErr);
			throw error(404, 'Ticket not found. Please check the ticket code and try again.');
		}
		
		if (!booking) {
			throw error(404, 'Ticket not found. Please check the ticket code and try again.');
		}
		
		console.log('Found booking:', booking.id, 'for tour:', booking.expand?.tour?.name);
		
		// Only show confirmed bookings
		if (booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') {
			throw error(400, 'Ticket is not valid or payment is incomplete');
		}
		
		// Check if current user is authorized to check in this booking
		const tourOwner = booking.expand?.tour?.user;
		
		if (currentUser.id !== tourOwner) {
			throw error(403, 'You are not authorized to check in this booking. Only the tour guide can check in customers.');
		}
		
		return {
			booking,
			ticketCode,
			currentUser,
			pbUrl: POCKETBASE_URL
		};
	} catch (err) {
		console.error('Error loading check-in page:', err);
		if ((err as any).status) throw err;
		throw error(500, 'Failed to load check-in information');
	}
};

export const actions: Actions = {
	checkin: async ({ params, locals }) => {
		const pb = locals?.pb;
		if (!pb?.authStore?.isValid) {
			return fail(401, { error: 'Authentication required' });
		}
		
		const ticketCode = params.code;
		const currentUser = pb.authStore.record;
		
		if (!ticketCode || !isValidTicketQRCode(ticketCode)) {
			return fail(400, { error: 'Invalid ticket code' });
		}
		
		try {
			// Find booking
			const booking = await pb.collection('bookings').getFirstListItem(
				`ticketQRCode = "${ticketCode}"`,
				{ expand: 'tour' }
			);
			
			// Verify authorization
			if (booking.expand?.tour?.user !== currentUser?.id) {
				return fail(403, { error: 'Not authorized to check in this booking' });
			}
			
			// Check if already checked in
			if (booking.attendanceStatus === 'checked_in') {
				return fail(400, { error: 'Customer is already checked in' });
			}
			
			// Update attendance status
			await pb.collection('bookings').update(booking.id, {
				attendanceStatus: 'checked_in',
				checkedInAt: new Date().toISOString(),
				checkedInBy: currentUser?.id
			});
			
			return { success: true, checkedInAt: new Date().toISOString() };
		} catch (err) {
			console.error('Check-in error:', err);
			return fail(500, { error: 'Failed to check in customer' });
		}
	},
	
	noshow: async ({ params, locals }) => {
		const pb = locals?.pb;
		if (!pb?.authStore?.isValid) {
			return fail(401, { error: 'Authentication required' });
		}
		
		const ticketCode = params.code;
		const currentUser = pb.authStore.record;
		
		if (!ticketCode || !isValidTicketQRCode(ticketCode)) {
			return fail(400, { error: 'Invalid ticket code' });
		}
		
		try {
			// Find booking
			const booking = await pb.collection('bookings').getFirstListItem(
				`ticketQRCode = "${ticketCode}"`,
				{ expand: 'tour' }
			);
			
			// Verify authorization
			if (booking.expand?.tour?.user !== currentUser?.id) {
				return fail(403, { error: 'Not authorized to update this booking' });
			}
			
			// Update attendance status
			await pb.collection('bookings').update(booking.id, {
				attendanceStatus: 'no_show',
				checkedInBy: currentUser?.id
			});
			
			return { success: true, noShow: true };
		} catch (err) {
			console.error('No-show marking error:', err);
			return fail(500, { error: 'Failed to mark as no-show' });
		}
	}
}; 