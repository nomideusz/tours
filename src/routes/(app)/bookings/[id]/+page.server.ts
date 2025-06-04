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
	
	// Check PocketBase connection is working
	if (!locals.pb) {
		console.error('PocketBase instance not available in booking detail');
		throw error(500, 'Database connection not available');
	}
	
	// Validate that booking ID is provided
	if (!params.id) {
		throw error(400, 'Booking ID is required');
	}
	
	try {
		const userId = locals.user.id;
		const bookingId = params.id;
		
		console.log(`Loading booking ${bookingId} for user ${userId}`);
		
		// Get the booking with expanded tour and timeSlot data - with timeout protection
		// Simplified query to avoid potential field selection issues in production
		const bookingPromise = locals.pb.collection('bookings').getOne(bookingId, {
			expand: 'tour,timeSlot'
		});
		
		const bookingTimeout = new Promise((_, reject) => 
			setTimeout(() => reject(new Error('Booking query timeout')), 8000)
		);
		
		const booking = await Promise.race([bookingPromise, bookingTimeout]) as any;
		
		// Check if the booking belongs to a tour owned by this user
		if (!booking.expand?.tour || booking.expand.tour.user !== userId) {
			throw error(403, 'You can only view bookings for your own tours');
		}
		
					// Get payment information if exists - with timeout protection
		let payment = null;
		if (booking.paymentId) {
			try {
				console.log(`Loading payment for booking ${bookingId} with paymentId: ${booking.paymentId}`);
				
				// The paymentId in booking is actually the Stripe payment ID, not PocketBase record ID
				// We need to expand 'booking' to satisfy the permission rule: booking.tour.user = @request.auth.id
				const paymentPromise = locals.pb.collection('payments').getFirstListItem(
					`stripePaymentIntentId = "${booking.paymentId}"`,
					{
						expand: 'booking'
					}
				);
				
				const paymentTimeout = new Promise((_, reject) => 
					setTimeout(() => reject(new Error('Payment query timeout')), 5000)
				);
				
				payment = await Promise.race([paymentPromise, paymentTimeout]) as any;
				console.log(`Payment loaded successfully for booking ${bookingId}`);
			} catch (paymentErr) {
				console.log('Payment not found or accessible for booking', bookingId, ':', paymentErr);
				// Payment record doesn't exist or isn't accessible - this is OK, continue without it
				payment = null;
			}
		}
		
		// Return parent data merged with booking data
		return {
			...parentData,
			booking: booking as any,
			payment: payment as any
		};
		
	} catch (err) {
		console.error('Error loading booking details for booking:', params.id);
		console.error('User ID:', locals.user?.id);
		console.error('Error details:', {
			message: err instanceof Error ? err.message : 'Unknown error',
			status: (err as any)?.status,
			stack: err instanceof Error ? err.stack : 'No stack trace'
		});
		
		if ((err as any).status === 404) {
			console.error('Booking not found - 404 error for booking:', params.id);
			throw error(404, 'Booking not found');
		}
		
		if ((err as any).status === 403) {
			console.error('Access denied - 403 error for booking:', params.id);
			throw error(403, 'You can only view bookings for your own tours');
		}
		
		// For any other error, including timeouts
		console.error('Server error (500) for booking:', params.id, 'Error:', err);
		throw error(500, 'Failed to load booking details');
	}
}; 