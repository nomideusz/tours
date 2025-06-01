import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';
import { isValidTicketQRCode } from '$lib/ticket-qr.js';

const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const load: PageServerLoad = async ({ params }) => {
	const pb = new PocketBase(POCKETBASE_URL);
	const ticketCode = params.code;
	
	if (!ticketCode || !isValidTicketQRCode(ticketCode)) {
		throw error(400, 'Invalid ticket code format');
	}
	
	try {
		// Find booking by ticket QR code
		const booking = await pb.collection('bookings').getFirstListItem(
			`ticketQRCode = "${ticketCode}"`,
			{ expand: 'tour,timeSlot,tour.user' }
		);
		
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
	} catch (err) {
		console.error('Error loading ticket:', err);
		if ((err as any).status) throw err;
		throw error(500, 'Failed to load ticket information');
	}
}; 