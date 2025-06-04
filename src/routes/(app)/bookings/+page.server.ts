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
		
		// EMERGENCY FIX: Use pagination to prevent timeouts
		const toursResult = await locals.pb.collection('tours').getList(1, 100, {
			filter: `user = "${userId}"`,
			fields: 'id,name'
		});
		const tours = toursResult.items;
		
		if (tours.length === 0) {
			return {
				...parentData,
				bookings: []
			};
		}
		
		// Get recent bookings only - don't fetch ALL bookings
		// Fetch last 100 bookings across all tours
		const tourIds = tours.map(t => t.id);
		const bookingsResult = await locals.pb.collection('bookings').getList(1, 100, {
			filter: tourIds.slice(0, 20).map(id => `tour = "${id}"`).join(' || '), // Max 20 tours
			expand: 'tour,timeSlot',
			sort: '-created',
			fields: '*,expand.tour.name,expand.tour.location,expand.timeSlot.startTime,expand.timeSlot.endTime'
		});
		
		// Process bookings to match expected format
		const processedBookings = bookingsResult.items.map((booking: any) => ({
			...booking,
			effectiveDate: booking.expand?.timeSlot?.startTime || booking.created,
			totalAmount: booking.totalAmount || 0,
			participants: booking.participants || 1
		}));
		
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