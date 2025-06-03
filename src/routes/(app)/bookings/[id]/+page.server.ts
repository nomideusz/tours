import type { PageServerLoad } from './$types.js';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url, params, parent }) => {
	// Get parent layout data first
	const parentData = await parent();
	
	// Check if user is authenticated (should already be handled by layout)
	if (!locals.user) {
		console.log('Booking detail: User not authenticated, redirecting to login');
		const redirectTo = url.pathname + url.search;
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}
	
	// Validate that booking ID is provided
	if (!params.id) {
		throw error(400, 'Booking ID is required');
	}
	
	try {
		const userId = locals.user.id;
		const bookingId = params.id;
		
		// Get the booking with expanded tour and timeSlot data
		const booking = await locals.pb.collection('bookings').getOne(bookingId, {
			expand: 'tour,timeSlot',
			fields: '*,expand.tour.name,expand.tour.description,expand.tour.location,expand.tour.price,expand.tour.user,expand.timeSlot.startTime,expand.timeSlot.endTime,expand.timeSlot.date'
		});
		
		// Check if the booking belongs to a tour owned by this user
		if (booking.expand?.tour?.user !== userId) {
			throw error(403, 'You can only view bookings for your own tours');
		}
		
		// Get payment information if exists
		let payment = null;
		try {
			if (booking.paymentId) {
				payment = await locals.pb.collection('payments').getOne(booking.paymentId);
			}
		} catch (paymentErr) {
			console.log('Payment not found or accessible:', paymentErr);
		}
		
		// Return parent data merged with booking data
		return {
			...parentData,
			booking: booking as any,
			payment: payment as any
		};
		
	} catch (err) {
		console.error('Error loading booking details:', err);
		
		if ((err as any).status === 404) {
			throw error(404, 'Booking not found');
		}
		
		if ((err as any).status === 403) {
			throw error(403, 'You can only view bookings for your own tours');
		}
		
		throw error(500, 'Failed to load booking details');
	}
}; 