import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import type { Tour } from '$lib/types.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user || !locals.pb) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Load the tour and verify ownership
		const tour = await locals.pb.collection('tours').getOne<Tour>(params.id, {
			expand: 'user'
		});
		
		if (!tour) {
			throw error(404, 'Tour not found');
		}
		
		// Check if user owns this tour
		if (tour.user !== locals.user.id) {
			throw error(403, 'You do not have permission to view bookings for this tour');
		}

		// Load bookings for this specific tour
		const bookings = await locals.pb.collection('bookings').getFullList({
			filter: `tour = "${params.id}"`,
			expand: 'tour,timeSlot,qrCode',
			sort: '-created'
		});

		return {
			tour,
			bookings: bookings as any[]
		};
	} catch (err) {
		console.error('Error loading tour bookings:', err);
		if ((err as any).status === 404) {
			throw error(404, 'Tour not found');
		}
		if ((err as any).status) {
			throw err;
		}
		throw error(500, 'Failed to load tour bookings');
	}
}; 