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
			qrCode = await pb.collection('qr_codes').getFirstListItem(
				`code = "${params.code}" && isActive = true`,
				{ expand: 'tour,tour.user' }
			);
			console.log('QR code found via public access');
		} catch (publicError) {
			console.log('Public access failed:', publicError);
			console.log('Looking for QR code:', params.code);
			
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
		
		// Get available time slots for the tour (try public access first)
		let timeSlots: TimeSlot[] = [];
		try {
			timeSlots = await pb.collection('time_slots').getFullList({
				filter: `tour = "${qrCode.expand?.tour?.id}" && status = "available"`,
				sort: 'startTime'
			});
		} catch (err) {
			console.error('Failed to load time slots via public access:', err);
			// Try authenticated access if public fails and auth is available
			if (locals?.pb?.authStore?.isValid) {
				try {
					timeSlots = await locals.pb.collection('time_slots').getFullList({
						filter: `tour = "${qrCode.expand?.tour?.id}" && status = "available"`,
						sort: 'startTime'
					});
				} catch (authErr) {
					console.error('Failed to load time slots via authenticated access:', authErr);
				}
			}
			// Continue without time slots - we'll generate demo ones
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
			
			// Get time slot to check availability
			const timeSlot = await workingPB.collection('time_slots').getOne(timeSlotId);
			
			if (timeSlot.availableSpots < participants) {
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
			
			// Update time slot availability
			await workingPB.collection('time_slots').update(timeSlotId, {
				bookedSpots: timeSlot.bookedSpots + participants,
				availableSpots: timeSlot.availableSpots - participants
			});
			
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
			
			// Redirect to payment page
			throw redirect(303, `/book/${params.code}/payment?booking=${booking.id}`);
			
		} catch (err) {
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