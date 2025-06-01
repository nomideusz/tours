import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';

const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const GET: RequestHandler = async ({ params }) => {
	const pb = new PocketBase(POCKETBASE_URL);
	const bookingId = params.id;
	
	if (!bookingId) {
		return json({ error: 'Booking ID is required' }, { status: 400 });
	}
	
	try {
		// Get booking with expanded data
		const booking = await pb.collection('bookings').getOne(bookingId, {
			expand: 'tour,timeSlot,tour.user'
		});
		
		return json(booking);
	} catch (err) {
		console.error('Error fetching booking status:', err);
		if ((err as any).status === 404) {
			return json({ error: 'Booking not found' }, { status: 404 });
		}
		return json({ error: 'Failed to fetch booking status' }, { status: 500 });
	}
}; 