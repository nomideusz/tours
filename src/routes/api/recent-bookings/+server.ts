import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getRecentBookings } from '$lib/utils/shared-stats.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get limit from query params, default to 10
		const limitParam = url.searchParams.get('limit');
		const limit = limitParam ? parseInt(limitParam, 10) : 10;
		
		// Validate limit - allow higher limits for comprehensive stats
		if (isNaN(limit) || limit < 1 || limit > 1000) {
			return json({ error: 'Invalid limit parameter' }, { status: 400 });
		}

		const bookings = await getRecentBookings(locals.user.id, limit);
		
		return json(bookings, {
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate', // Don't cache mutations
				'Pragma': 'no-cache',
				'Expires': '0'
			}
		});
	} catch (error) {
		console.error('Error fetching recent bookings:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}; 