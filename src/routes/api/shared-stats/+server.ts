import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getSharedStats } from '$lib/utils/shared-stats.js';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const stats = await getSharedStats(locals.user.id);
		
		return json(stats, {
			headers: {
				'Cache-Control': 'max-age=300, stale-while-revalidate=60' // 5 min cache, 1 min stale
			}
		});
	} catch (error) {
		console.error('Error fetching shared stats:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}; 