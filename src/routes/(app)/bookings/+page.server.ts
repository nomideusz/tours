import type { PageServerLoad } from './$types.js';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Check if user is authenticated
	if (!locals.user) {
		console.log('Bookings page: User not authenticated, redirecting to login');
		// Store the current URL to redirect back after login
		const redirectTo = url.pathname + url.search;
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}
	
	try {
		// Get all tours for this guide
		const tours = await locals.pb.collection('tours').getFullList({
			filter: `user = "${locals.user.id}"`,
			fields: 'id'
		});
		
		if (tours.length === 0) {
			return {
				bookings: []
			};
		}
		
		// Get all bookings for the guide's tours
		const tourIds = tours.map(t => t.id);
		const bookings = await locals.pb.collection('bookings').getFullList({
			filter: tourIds.map(id => `tour = "${id}"`).join(' || '),
			expand: 'tour,timeSlot',
			sort: '-created'
		});
		
		return {
			bookings: bookings as any[]
		};
	} catch (err) {
		console.error('Error loading bookings:', err);
		throw error(500, 'Failed to load bookings');
	}
}; 