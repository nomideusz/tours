import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { isValidTicketQRCode } from '$lib/ticket-qr.js';
import { tryCreateAuthenticatedPB } from '$lib/admin-auth.server.js';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';

const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const load: PageServerLoad = async ({ params, locals }) => {
	const ticketCode = params.code;
	
	if (!ticketCode || !isValidTicketQRCode(ticketCode)) {
		throw error(400, 'Invalid ticket code format');
	}
	
	let booking = null;
	
	// Always use admin-authenticated PB for ticket viewing (tickets need to be publicly viewable)
	try {
		console.log('Using admin access for public ticket viewing:', ticketCode);
		const pb = await tryCreateAuthenticatedPB();
		if (pb) {
			booking = await pb.collection('bookings').getFirstListItem(
				`ticketQRCode = "${ticketCode}"`,
				{ expand: 'tour,timeSlot,tour.user' }
			);
		} else {
			// Fallback to public PB instance if admin auth not configured
			console.log('Admin auth not available, using public access');
			const publicPb = new PocketBase(POCKETBASE_URL);
			publicPb.authStore.clear();
			booking = await publicPb.collection('bookings').getFirstListItem(
				`ticketQRCode = "${ticketCode}"`,
				{ expand: 'tour,timeSlot,tour.user' }
			);
		}
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