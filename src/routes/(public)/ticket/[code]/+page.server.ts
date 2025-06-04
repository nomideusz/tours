import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { isValidTicketQRCode } from '$lib/ticket-qr.js';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';

const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const load: PageServerLoad = async ({ params, locals }) => {
	const ticketCode = params.code;
	
	if (!ticketCode || !isValidTicketQRCode(ticketCode)) {
		throw error(400, 'Invalid ticket code format');
	}
	
	let booking = null;
	
	// Bookings have empty viewRule, so they're publicly viewable
	// This allows customers to view their tickets without authentication
	try {
		console.log('Fetching public ticket:', ticketCode);
		// Use a public PocketBase instance for ticket viewing
		const publicPb = new PocketBase(POCKETBASE_URL);
		publicPb.authStore.clear(); // Ensure no auth is used
		
		booking = await publicPb.collection('bookings').getFirstListItem(
			`ticketQRCode = "${ticketCode}"`,
			{ expand: 'tour,timeSlot,tour.user' }
		);
	} catch (err) {
		console.error('Failed to fetch ticket:', ticketCode, err);
		throw error(404, 'Ticket not found. Please ensure the ticket code is valid.');
	}
	
	if (!booking) {
		throw error(404, 'Ticket not found');
	}
	
	// Only show confirmed bookings
	if (booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') {
		throw error(400, 'Ticket is not valid or payment is incomplete');
	}
	
	return {
		booking,
		ticketCode,
		pbUrl: POCKETBASE_URL
	};
}; 