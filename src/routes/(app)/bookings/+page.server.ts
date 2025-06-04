import type { PageServerLoad } from './$types.js';
import { error, redirect } from '@sveltejs/kit';
import { fetchBookingsForTours } from '$lib/utils/booking-helpers.js';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	// Get parent layout data first
	const parentData = await parent();
	
	// Check if user is authenticated (should already be handled by layout)
	if (!locals.user) {
		console.log('Bookings page: User not authenticated, redirecting to login');
		const redirectTo = url.pathname + url.search;
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}
	
	try {
		const userId = locals.user.id;
		
		// Get all tours for this guide
		const tours = await locals.pb.collection('tours').getFullList({
			filter: `user = "${userId}"`,
			fields: 'id,name'
		});
		
		if (tours.length === 0) {
			return {
				...parentData,
				bookings: []
			};
		}
		
		// Get all bookings for the guide's tours using shared utility
		const tourIds = tours.map(t => t.id);
		const processedBookings = await fetchBookingsForTours(locals.pb, tourIds);
		
		// Return parent data merged with bookings data
		return {
			...parentData,
			bookings: processedBookings
		};
		
	} catch (err) {
		console.error('Error loading bookings:', err);
		
		// Return parent data with empty bookings on error
		return {
			...parentData,
			bookings: []
		};
	}
}; 