import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getSharedStats, getToursSpecificStats } from '$lib/utils/shared-stats.js';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get shared stats first, then tours-specific stats
		const sharedStats = await getSharedStats(locals.user.id);
		const toursStats = await getToursSpecificStats(locals.user.id, sharedStats);
		
		return json(toursStats, {
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate', // Don't cache mutations
				'Pragma': 'no-cache',
				'Expires': '0'
			}
		});
	} catch (error) {
		console.error('Error fetching tours stats:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}; 