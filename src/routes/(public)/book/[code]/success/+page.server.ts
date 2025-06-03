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
		
		// Check if this is a valid booking for success page
		// Allow confirmed/paid (webhook processed) OR pending payment (payment processing)
		const isValidForSuccess = (
			// Booking is fully confirmed and paid (webhook processed)
			(booking.status === 'confirmed' && booking.paymentStatus === 'paid') ||
			// OR booking has payment in progress (user just paid, webhook hasn't processed yet)
			(booking.status === 'pending' && booking.paymentStatus === 'pending' && booking.paymentId)
		);
		
		if (!isValidForSuccess) {
			// Only fail if booking is clearly not payment-related (no paymentId) or has failed
			if (!booking.paymentId || booking.paymentStatus === 'failed') {
				throw error(400, 'Booking is not valid for confirmation page');
			}
		}
		
		// Determine if payment is still processing
		const isPaymentProcessing = booking.status === 'pending' && booking.paymentStatus === 'pending' && booking.paymentId;
		
		return {
			booking,
			isPaymentProcessing
		};
	} catch (err) {
		console.error('Error loading success page:', err);
		if ((err as any).status) throw err;
		throw error(500, 'Failed to load booking confirmation');
	}
}; 