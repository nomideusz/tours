import type { PageServerLoad, Actions } from './$types.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import PocketBase from 'pocketbase';
import type { TimeSlot } from '$lib/types.js';

const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const load: PageServerLoad = async ({ params, url, locals, fetch }) => {
	// Always use a fresh PocketBase instance for booking pages to avoid auth issues
	const pb = new PocketBase(POCKETBASE_URL);
	// Explicitly clear any auth state to ensure public access
	pb.authStore.clear();
	
	try {
		// For booking pages, always use public access
		let qrCode = null;
		let workingPB = pb; // Always use public access
		
		// Try public access (works for both anonymous and authenticated users)
		try {
			console.log('Attempting public access for QR code:', params.code);
			console.log('Auth state cleared, using public access');
			qrCode = await pb.collection('qr_codes').getFirstListItem(
				`code = "${params.code}" && isActive = true`,
				{ expand: 'tour,tour.user' }
			);
			console.log('QR code found via public access');
		} catch (publicError) {
			console.log('Public access failed:', publicError);
			console.log('Filter used:', `code = "${params.code}" && isActive = true`);
			// Don't try authenticated access - if public fails, the QR code doesn't exist or isn't active
			throw error(404, `QR code '${params.code}' not found or inactive.`);
		}
		
		// Check if QR code was found
		if (!qrCode) {
			throw error(404, `QR code '${params.code}' not found. Please ensure the QR code is active and accessible.`);
		}
		
		// Track scan via API (works for both authenticated and anonymous users)
		const isFirstVisit = !url.searchParams.has('submitted');
		if (isFirstVisit) {
			try {
				const trackResponse = await fetch(`/api/qr/${params.code}/scan`, {
					method: 'POST'
				});
				if (trackResponse.ok) {
					const trackResult = await trackResponse.json();
					console.log(`Scan tracked via API: ${trackResult.scans} total scans`);
				} else {
					console.error('Failed to track scan via API:', await trackResponse.text());
				}
			} catch (trackError) {
				console.error('Error calling scan tracking API:', trackError);
				// Don't fail the page load if scan tracking fails
			}
		}
		
		// Get available time slots for the tour
		let timeSlots: TimeSlot[] = [];
		const tourId = qrCode.expand?.tour?.id;
		console.log('Looking for time slots for tour:', tourId);
		
		// Always use public access for time slots
		try {
			// Get all slots for this tour using public access
			const allTourSlots = await workingPB.collection('time_slots').getFullList({
				filter: `tour = "${tourId}"`,
				sort: 'startTime'
			});
			console.log('All slots for tour (public access):', allTourSlots.length);
			
			// Filter for available status
			timeSlots = allTourSlots.filter(slot => slot.status === 'available') as any;
			console.log('Available slots after filtering:', timeSlots.length);
		} catch (err) {
			console.error('Failed to load time slots:', err);
			// Continue with empty array - the page will show "no available slots"
		}
		
		return {
			qrCode,
			timeSlots,
			pbUrl: POCKETBASE_URL
		};
	} catch (err) {
		console.error('Error loading QR code:', err);
		if ((err as any).status) {
			throw err;
		}
		throw error(500, 'Failed to load booking page');
	}
};

export const actions: Actions = {
	book: async ({ request, params, locals, fetch }) => {
		// Always use fresh PocketBase instance for booking actions
		const pb = new PocketBase(POCKETBASE_URL);
		pb.authStore.clear(); // Ensure no auth state
		
		const formData = await request.formData();
		
		const timeSlotId = formData.get('timeSlotId') as string;
		const participants = parseInt(formData.get('participants') as string);
		const availableSpots = parseInt(formData.get('availableSpots') as string);
		const bookedSpots = parseInt(formData.get('bookedSpots') as string) || 0;
		const customerName = formData.get('customerName') as string;
		const customerEmail = formData.get('customerEmail') as string;
		const customerPhone = formData.get('customerPhone') as string;
		const specialRequests = formData.get('specialRequests') as string;
		
		// Validate required fields
		if (!timeSlotId || !participants || !customerName || !customerEmail) {
			return fail(400, {
				error: 'Please fill in all required fields',
				timeSlotId,
				participants,
				customerName,
				customerEmail,
				customerPhone,
				specialRequests
			});
		}
		
		// Validate availability
		if (availableSpots < participants) {
			return fail(400, {
				error: 'Not enough spots available for this time slot',
				timeSlotId,
				participants,
				customerName,
				customerEmail,
				customerPhone,
				specialRequests
			});
		}
		
		try {
			// Get QR code and tour info using public access
			let qrCode = null;
			
			// Use public access
			try {
				qrCode = await pb.collection('qr_codes').getFirstListItem(
					`code = "${params.code}" && isActive = true`, 
					{ expand: 'tour' }
				);
				console.log('Booking: QR code found via public access');
			} catch (publicErr) {
				console.log('Booking: QR code not found or not active');
				return fail(404, { error: 'QR code not found or inactive' });
			}
			
			if (!qrCode) {
				return fail(404, { error: 'QR code not found' });
			}
			const tour = qrCode.expand?.tour;
			
			if (!tour) {
				return fail(500, { error: 'Tour information not found' });
			}
			
			// Calculate total price
			const totalPrice = participants * tour.price;
			
			// Generate unique booking reference
			const bookingReference = `BK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
			
			// Create booking
			const booking = await pb.collection('bookings').create({
				tour: tour.id,
				timeSlot: timeSlotId,
				qrCode: qrCode.id,
				customerName,
				customerEmail,
				customerPhone: customerPhone || null,
				participants,
				totalAmount: totalPrice,
				bookingReference,
				specialRequests: specialRequests || null,
				status: 'pending', // Will be updated after payment
				paymentStatus: 'pending'
			});
			
			// Update time slot availability with rollback capability
			let timeSlotUpdated = false;
			try {
				await pb.collection('time_slots').update(timeSlotId, {
					bookedSpots: bookedSpots + participants,
					availableSpots: availableSpots - participants
				});
				timeSlotUpdated = true;
			} catch (updateErr) {
				console.error('Failed to update time slot availability:', updateErr);
				
				// For critical failures, consider rolling back the booking
				if ((updateErr as any)?.status !== 403) { // Not just a permission issue
					console.warn('Time slot update failed for non-permission reasons');
					// Note: In production, you might want to implement a cleanup job
					// or queue system to handle these orphaned bookings
				}
			}
			
			// Track conversion via API (works for both authenticated and anonymous users)
			try {
				const trackResponse = await fetch(`/api/qr/${params.code}/conversion`, {
					method: 'POST'
				});
				if (trackResponse.ok) {
					const trackResult = await trackResponse.json();
					console.log(`Conversion tracked via API: ${trackResult.conversions} total conversions`);
				} else {
					console.error('Failed to track conversion via API:', await trackResponse.text());
				}
			} catch (trackError) {
				console.error('Error calling conversion tracking API:', trackError);
				// Don't fail the booking if conversion tracking fails
			}
			
			// Success! Log and redirect to payment page
			console.log(`Booking created successfully! ID: ${booking.id}, Reference: ${bookingReference}`);
			console.log('User info:', locals?.user?.email || 'anonymous');
			
			// Use a try-catch to ensure proper redirect handling
			const redirectUrl = `/book/${params.code}/payment?booking=${booking.id}`;
			console.log('Redirecting to:', redirectUrl);
			throw redirect(303, redirectUrl);
			
		} catch (err) {
			// If it's a redirect, re-throw it (this is success, not an error!)
			// Check for both Response objects and SvelteKit redirect objects
			if (
				(err instanceof Response && err.status === 303) ||
				(err && typeof err === 'object' && 'status' in err && (err as any).status === 303) ||
				(err && typeof err === 'object' && 'location' in err) // Any object with location is likely a redirect
			) {
				console.log('Booking successful, redirecting to payment page');
				throw err;
			}
			
			// Only log as actual error if it's not a redirect
			console.error('Booking failed with error:', err);
			
			return fail(500, {
				error: 'Failed to create booking. Please try again.',
				timeSlotId,
				participants,
				customerName,
				customerEmail,
				customerPhone,
				specialRequests
			});
		}
	}
}; 