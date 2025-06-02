import type { PageServerLoad } from './$types.js';
import { error, redirect } from '@sveltejs/kit';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';

const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	// Use authenticated PB instance if available, otherwise create a new one
	const pb = locals?.pb || new PocketBase(POCKETBASE_URL);
	const bookingId = url.searchParams.get('booking');
	
	console.log('Payment page loading for booking:', bookingId, 'User:', locals?.user?.email || 'anonymous');
	
	if (!bookingId) {
		throw error(400, 'Booking ID is required');
	}
	
	try {
		// Get booking details - try with timeout
		const bookingPromise = pb.collection('bookings').getOne(bookingId, {
			expand: 'tour,timeSlot'
		});
		const timeoutPromise = new Promise((_, reject) => 
			setTimeout(() => reject(new Error('Booking fetch timeout')), 10000)
		);
		
		const booking = await Promise.race([bookingPromise, timeoutPromise]).catch(err => {
			console.error('Failed to fetch booking:', err);
			throw err;
		}) as any;
		
		// Verify booking is pending payment
		if (booking.paymentStatus !== 'pending') {
			console.log('Booking already paid, redirecting to success page');
			throw redirect(302, `/book/${params.code}/success?booking=${bookingId}`);
		}
		
		// Get QR code with timeout
		const qrPromise = pb.collection('qr_codes').getFirstListItem(
			`code = "${params.code}" && isActive = true`
		);
		const qrTimeoutPromise = new Promise((_, reject) => 
			setTimeout(() => reject(new Error('QR code fetch timeout')), 10000)
		);
		
		const qrCode = await Promise.race([qrPromise, qrTimeoutPromise]).catch(err => {
			console.error('Failed to fetch QR code:', err);
			throw err;
		});
		
		return {
			booking,
			qrCode,
			pbUrl: POCKETBASE_URL
		};
	} catch (err) {
		console.error('Error loading payment page:', err);
		if ((err as any).status === 302 || (err as any).status === 303) throw err;
		throw error(500, 'Failed to load payment information');
	}
}; 