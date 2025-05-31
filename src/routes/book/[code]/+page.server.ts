import type { PageServerLoad, Actions } from './$types.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import PocketBase from 'pocketbase';
import type { TimeSlot } from '$lib/types.js';

const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const pb = new PocketBase(POCKETBASE_URL);
	
	try {
		// For booking pages, prioritize public access to ensure anonymous users can book
		let qrCode = null;
		let workingPB = pb; // Default to public access
		
		// Try public access first (works for anonymous users)
		try {
			console.log('Attempting public access for QR code:', params.code);
			qrCode = await pb.collection('qr_codes').getFirstListItem(
				`code = "${params.code}" && isActive = true`,
				{ expand: 'tour,tour.user' }
			);
			console.log('QR code found via public access');
		} catch (publicError) {
			console.log('Public access failed:', publicError);
			console.log('Filter used:', `code = "${params.code}" && isActive = true`);
			
			// Fallback to authenticated access if available and public fails
			if (locals?.pb?.authStore?.isValid) {
				try {
					const qrCodes = await locals.pb.collection('qr_codes').getFullList({
						expand: 'tour,tour.user'
					});
					qrCode = qrCodes.find(qr => qr.code === params.code && qr.isActive);
					if (qrCode) {
						workingPB = locals.pb;
						console.log('QR code found via authenticated access');
					}
				} catch (authError) {
					console.log('Authenticated access also failed');
				}
			}
		}
		
		// Check if QR code was found
		if (!qrCode) {
			throw error(404, `QR code '${params.code}' not found. Please ensure the QR code is active and accessible.`);
		}
		
		// Increment scan count (only if this isn't a form submission or refresh)
		const isFirstVisit = !url.searchParams.has('submitted');
		if (isFirstVisit && locals?.pb?.authStore?.isValid) {
			try {
				// Only try to update if we have an authenticated instance
				await locals.pb.collection('qr_codes').update(qrCode.id, {
					scans: (qrCode.scans || 0) + 1
				});
			} catch (err) {
				console.error('Failed to increment scan count:', err);
				// Don't fail the page load if scan tracking fails
			}
		}
		
		// Get available time slots for the tour
		let timeSlots: TimeSlot[] = [];
		const tourId = qrCode.expand?.tour?.id;
		console.log('Looking for time slots for tour:', tourId);
		
		// Try authenticated access first if available, then fall back to public
		const pbInstance = locals?.pb?.authStore?.isValid ? locals.pb : pb;
		const accessType = locals?.pb?.authStore?.isValid ? 'authenticated' : 'public';
		
		try {
			// Get all slots for this tour
			const allTourSlots = await pbInstance.collection('time_slots').getFullList({
				filter: `tour = "${tourId}"`,
				sort: 'startTime'
			});
			console.log(`All slots for tour (${accessType}):`, allTourSlots.length);
			
			// Filter for available status
			timeSlots = allTourSlots.filter(slot => slot.status === 'available') as any;
			console.log(`Available slots after filtering (${accessType}):`, timeSlots.length);
			
			// If no slots found and we used public access, try authenticated
			if (timeSlots.length === 0 && accessType === 'public' && locals?.pb?.authStore?.isValid) {
				console.log('No public slots found, trying authenticated access...');
				const authSlots = await locals.pb.collection('time_slots').getFullList({
					filter: `tour = "${tourId}"`,
					sort: 'startTime'
				});
				console.log('All slots for tour (authenticated fallback):', authSlots.length);
				timeSlots = authSlots.filter(slot => slot.status === 'available') as any;
				console.log('Available slots after filtering (authenticated fallback):', timeSlots.length);
			}
		} catch (err) {
			console.error(`Failed to load time slots via ${accessType} access:`, err);
		}
		
		// Debug: Try to get all time slots without filter to see what's there
		if (timeSlots.length === 0 && locals?.pb?.authStore?.isValid) {
			try {
				const allSlots = await locals.pb.collection('time_slots').getFullList({
					expand: 'tour',
					sort: '-created'
				});
				console.log('All time slots in database:', allSlots.length);
				console.log('First few slots:', allSlots.slice(0, 3).map(s => ({
					id: s.id,
					tour: s.tour,
					tourName: s.expand?.tour?.name,
					status: s.status,
					startTime: s.startTime
				})));
			} catch (debugErr) {
				console.log('Could not fetch all slots for debugging');
			}
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
	book: async ({ request, params, locals }) => {
		const pb = new PocketBase(POCKETBASE_URL);
		
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
			// Get QR code and tour info - prioritize public access for anonymous users
			let qrCode = null;
			let workingPB = pb; // Default to public access
			
			// Try public access first
			try {
				qrCode = await pb.collection('qr_codes').getFirstListItem(
					`code = "${params.code}" && isActive = true`, 
					{ expand: 'tour' }
				);
				console.log('Booking: QR code found via public access');
			} catch (publicErr) {
				console.log('Booking: Public access failed, trying authenticated');
				// Fallback to authenticated if available
				if (locals?.pb?.authStore?.isValid) {
					try {
						qrCode = await locals.pb.collection('qr_codes').getFirstListItem(`code = "${params.code}"`, {
							expand: 'tour'
						});
						workingPB = locals.pb;
						console.log('Booking: QR code found via authenticated access');
					} catch (authErr) {
						console.log('Booking: Authenticated access also failed');
					}
				}
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
			const booking = await workingPB.collection('bookings').create({
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
			
			// Update time slot availability (only if we have write access)
			// For anonymous users, this might fail but the booking is already created
			try {
				await workingPB.collection('time_slots').update(timeSlotId, {
					bookedSpots: bookedSpots + participants,
					availableSpots: availableSpots - participants
				});
			} catch (updateErr) {
				console.error('Failed to update time slot availability:', updateErr);
				// Don't fail the booking if we can't update the time slot
				// This might happen for anonymous users who don't have write permissions
			}
			
			// Increment QR code conversion count (only if we have write access)
			if (locals?.pb?.authStore?.isValid) {
				try {
					await locals.pb.collection('qr_codes').update(qrCode.id, {
						conversions: (qrCode.conversions || 0) + 1
					});
				} catch (err) {
					console.error('Failed to update QR conversions:', err);
				}
			}
			
			// Success! Log and redirect to payment page
			console.log(`Booking created successfully! ID: ${booking.id}, Reference: ${bookingReference}`);
			throw redirect(303, `/book/${params.code}/payment?booking=${booking.id}`);
			
		} catch (err) {
			// If it's a redirect, re-throw it (this is success, not an error!)
			if (err instanceof Response && err.status === 303) {
				throw err;
			}
			
			console.error('Booking error:', err);
			
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