import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';

const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const load: PageServerLoad = async ({ url }) => {
	const pb = new PocketBase(POCKETBASE_URL);
	const bookingId = url.searchParams.get('booking');
	
	if (!bookingId) {
		throw error(400, 'Booking ID is required');
	}
	
	try {
		// Get booking details with all related data
		const booking = await pb.collection('bookings').getOne(bookingId, {
			expand: 'tour,timeSlot,tour.user'
		});
		
		// Verify booking is confirmed
		if (booking.status !== 'confirmed' && booking.paymentStatus !== 'paid') {
			throw error(400, 'Booking is not confirmed');
		}
		
		return {
			booking
		};
	} catch (err) {
		console.error('Error loading success page:', err);
		if ((err as any).status) throw err;
		throw error(500, 'Failed to load booking confirmation');
	}
}; 