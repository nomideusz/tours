import type { PageServerLoad, Actions } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { isValidTicketQRCode } from '$lib/ticket-qr.js';
import { tryCreateAuthenticatedPB } from '$lib/admin-auth.server.js';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';

const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const load: PageServerLoad = async ({ params, locals }) => {
	const pb = locals?.pb || new PocketBase(POCKETBASE_URL);
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
		
		// Check if current user is authorized to check in this booking
		const currentUser = locals?.pb?.authStore?.record;
		const tourOwner = booking.expand?.tour?.user;
		
		if (!currentUser || currentUser.id !== tourOwner) {
			throw error(403, 'You are not authorized to check in this booking');
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