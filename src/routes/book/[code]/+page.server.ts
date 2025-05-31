import type { PageServerLoad, Actions } from './$types.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import PocketBase from 'pocketbase';
import type { TimeSlot } from '$lib/types.js';

const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const pb = new PocketBase(POCKETBASE_URL);
	
	try {
		// Use authenticated PB instance if available for better access
		let authenticatedPB = pb;
		if (locals?.pb?.authStore?.isValid) {
			authenticatedPB = locals.pb;
		}
		
		// Try to get QR code by searching through all accessible QR codes
		let qrCode = null;
		
		try {
			// Direct approach: get all QR codes (will work if user is authenticated)
			const qrCodes = await authenticatedPB.collection('qr_codes').getFullList({
				expand: 'tour,tour.user'
			});
			
			qrCode = qrCodes.find(qr => qr.code === params.code && qr.isActive);
		} catch (authError) {
			console.log('Authenticated access failed, trying public filter approach');
			
			// Alternative: Try to get QR code using public filter approach
			try {
				qrCode = await pb.collection('qr_codes').getFirstListItem(
					`code = "${params.code}" && isActive = true`,
					{ expand: 'tour,tour.user' }
				);
				// If we found it via public access, we'll use pb instance for updates
				authenticatedPB = pb;
			} catch (publicError) {
				console.log('Public access also failed');
				throw error(404, `QR code '${params.code}' not found. The QR code might exist but access is restricted. Please ensure the QR code is active and try again.`);
			}
		}
		
		// Check if QR code was found
		if (!qrCode) {
			throw error(404, `QR code '${params.code}' not found or not active`);
		}
		
		// Increment scan count (only if this isn't a form submission or refresh)
		const isFirstVisit = !url.searchParams.has('submitted');
		if (isFirstVisit) {
			try {
				await authenticatedPB.collection('qr_codes').update(qrCode.id, {
					scans: (qrCode.scans || 0) + 1
				});
			} catch (err) {
				console.error('Failed to increment scan count:', err);
				// Don't fail the page load if scan tracking fails
			}
		}
		
		// Get available time slots for the tour
		let timeSlots: TimeSlot[] = [];
		try {
			timeSlots = await authenticatedPB.collection('time_slots').getFullList({
				filter: `tour = "${qrCode.expand?.tour?.id}" && status = "available"`,
				sort: 'startTime'
			});
		} catch (err) {
			console.error('Failed to load time slots:', err);
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
		
		// Use authenticated PB instance if available for better access
		let authenticatedPB = pb;
		if (locals?.pb?.authStore?.isValid) {
			authenticatedPB = locals.pb;
		}
		
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
			// Get QR code and tour info - try authenticated first, then public
			let qrCode = null;
			try {
				qrCode = await authenticatedPB.collection('qr_codes').getFirstListItem(`code = "${params.code}"`, {
					expand: 'tour'
				});
			} catch (err) {
				// Try public access if authenticated fails
				qrCode = await pb.collection('qr_codes').getFirstListItem(
					`code = "${params.code}" && isActive = true`, 
					{ expand: 'tour' }
				).catch(() => null);
				// Use pb instance for subsequent operations if found via public access
				if (qrCode) {
					authenticatedPB = pb;
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
			const timeSlot = await authenticatedPB.collection('time_slots').getOne(timeSlotId);
			
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
			const booking = await authenticatedPB.collection('bookings').create({
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
			await authenticatedPB.collection('time_slots').update(timeSlotId, {
				bookedSpots: timeSlot.bookedSpots + participants,
				availableSpots: timeSlot.availableSpots - participants
			});
			
			// Increment QR code conversion count
			await authenticatedPB.collection('qr_codes').update(qrCode.id, {
				conversions: (qrCode.conversions || 0) + 1
			});
			
			// In a real app, you would redirect to payment processing here
			// For now, we'll just show a success message
			return {
				success: true,
				bookingId: booking.id,
				bookingReference,
				totalPrice
			};
			
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