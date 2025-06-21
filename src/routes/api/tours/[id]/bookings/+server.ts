import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getTourAllBookings } from '$lib/utils/booking-helpers.js';

export const GET: RequestHandler = async ({ locals, params }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (!params.id) {
			return json({ error: 'Tour ID required' }, { status: 400 });
		}

		const tourId = params.id;
		const userId = locals.user.id;

		// Use the existing helper function to get tour bookings
		const data = await getTourAllBookings(userId, tourId);
		
		return json(data, {
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate', // Don't cache mutations
				'Pragma': 'no-cache',
				'Expires': '0'
			}
		});
	} catch (error) {
		console.error('Error fetching tour bookings:', error);
		return json({ error: 'Failed to fetch tour bookings' }, { status: 500 });
	}
}; 