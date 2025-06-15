import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getBookingConstraints } from '$lib/utils/tour-helpers-server.js';

export const GET: RequestHandler = async ({ locals, params }) => {
	// Check authentication
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (!params.id) {
		throw error(400, 'Tour ID is required');
	}

	try {
		// Get booking constraints for the current capacity
		// Note: We pass 0 as currentCapacity since we're fetching constraints
		// before knowing what the new capacity will be
		const constraints = await getBookingConstraints(params.id, 0);
		
		return json(constraints);
	} catch (err) {
		console.error('Error fetching booking constraints:', err);
		throw error(500, 'Failed to fetch booking constraints');
	}
}; 