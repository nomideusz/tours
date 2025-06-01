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
	let pb = null;
	
	// Try authenticated user access first
	if (locals?.pb?.authStore?.isValid) {
		try {
			console.log('Trying authenticated user access for ticket:', ticketCode);
			booking = await locals.pb.collection('bookings').getFirstListItem(
				`ticketQRCode = "${ticketCode}"`,
				{ expand: 'tour,timeSlot,tour.user' }
			);
			pb = locals.pb;
		} catch (authErr) {
			console.log('User authenticated access failed:', authErr);
		}
	}
	
	// If user access failed, try admin access for public ticket viewing
	if (!booking) {
		try {
			console.log('Trying admin access for ticket:', ticketCode);
			const adminPb = await tryCreateAuthenticatedPB();
			if (adminPb) {
				booking = await adminPb.collection('bookings').getFirstListItem(
					`ticketQRCode = "${ticketCode}"`,
					{ expand: 'tour,timeSlot,tour.user' }
				);
				pb = adminPb;
			}
		} catch (adminErr) {
			console.error('Admin access failed:', adminErr);
		}
	}
	
	// Last resort: try public PocketBase instance
	if (!booking) {
		try {
			console.log('Trying public access for ticket:', ticketCode);
			pb = new PocketBase(POCKETBASE_URL);
			booking = await pb.collection('bookings').getFirstListItem(
				`ticketQRCode = "${ticketCode}"`,
				{ expand: 'tour,timeSlot,tour.user' }
			);
		} catch (publicErr) {
			console.error('All access methods failed for ticket:', ticketCode, publicErr);
			throw error(404, 'Ticket not found. Please ensure the ticket code is valid.');
		}
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