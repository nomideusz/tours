import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getSharedStats, getDashboardSpecificStats } from '$lib/utils/shared-stats.js';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get shared stats first, then dashboard-specific stats
		const sharedStats = await getSharedStats(locals.user.id);
		const dashboardStats = await getDashboardSpecificStats(locals.user.id, sharedStats);
		
		return json(dashboardStats, {
			headers: {
				'Cache-Control': 'max-age=120, stale-while-revalidate=30' // 2 min cache, 30s stale
			}
		});
	} catch (error) {
		console.error('Error fetching dashboard stats:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}; 