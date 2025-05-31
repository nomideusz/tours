import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import type { Tour } from '$lib/types.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user || !locals.pb) {
		throw error(401, 'Unauthorized');
	}

	try {
		const tour = await locals.pb.collection('tours').getOne<Tour>(params.id, {
			expand: 'user'
		});
		
		if (!tour) {
			throw error(404, 'Tour not found');
		}
		
		// Check if user owns this tour
		if (tour.user !== locals.user.id) {
			throw error(403, 'You do not have permission to manage QR codes for this tour');
		}
		
		return {
			tour
		};
	} catch (err) {
		console.error('Error loading tour:', err);
		if ((err as any).status === 404) {
			throw error(404, 'Tour not found');
		}
		if ((err as any).status) {
			throw err;
		}
		throw error(500, 'Failed to load tour data');
	}
}; 