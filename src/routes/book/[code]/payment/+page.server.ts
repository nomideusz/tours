import type { PageServerLoad } from './$types.js';
import { error, redirect } from '@sveltejs/kit';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';

const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const load: PageServerLoad = async ({ params, url }) => {
	const pb = new PocketBase(POCKETBASE_URL);
	const bookingId = url.searchParams.get('booking');
	
	if (!bookingId) {
		throw error(400, 'Booking ID is required');
	}
	
	try {
		// Get booking details
		const booking = await pb.collection('bookings').getOne(bookingId, {
			expand: 'tour,timeSlot'
		});
		
		// Verify booking is pending payment
		if (booking.paymentStatus !== 'pending') {
			throw redirect(302, `/book/${params.code}/success?booking=${bookingId}`);
		}
		
		// Get QR code
		const qrCode = await pb.collection('qr_codes').getFirstListItem(
			`code = "${params.code}" && isActive = true`
		);
		
		return {
			booking,
			qrCode,
			pbUrl: POCKETBASE_URL
		};
	} catch (err) {
		console.error('Error loading payment page:', err);
		if ((err as any).status === 302) throw err;
		throw error(500, 'Failed to load payment information');
	}
}; 