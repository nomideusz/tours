import type { PageServerLoad, Actions } from './$types.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import PocketBase from 'pocketbase';
import type { TimeSlot } from '$lib/types.js';

const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const load: PageServerLoad = async ({ params, getClientAddress, url }) => {
	const pb = new PocketBase(POCKETBASE_URL);
	
	try {
		// Get QR code by code
		const qrCodes = await pb.collection('qr_codes').getFullList({
			filter: `code = "${params.code}"`,
			expand: 'tour,tour.user'
		});
		
		if (qrCodes.length === 0) {
			throw error(404, 'QR code not found');
		}
		
		const qrCode = qrCodes[0];
		
		// Check if QR code is active
		if (!qrCode.isActive) {
			throw error(403, 'This QR code is no longer active');
		}
		
		// Increment scan count (only if this isn't a form submission or refresh)
		const isFirstVisit = !url.searchParams.has('submitted');
		if (isFirstVisit) {
			try {
				await pb.collection('qr_codes').update(qrCode.id, {
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
			timeSlots = await pb.collection('time_slots').getFullList({
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
	book: async ({ request, params }) => {
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
			// Get QR code and tour info
			const qrCodes = await pb.collection('qr_codes').getFullList({
				filter: `code = "${params.code}"`,
				expand: 'tour'
			});
			
			if (qrCodes.length === 0) {
				return fail(404, { error: 'QR code not found' });
			}
			
			const qrCode = qrCodes[0];
			const tour = qrCode.expand?.tour;
			
			if (!tour) {
				return fail(500, { error: 'Tour information not found' });
			}
			
			// Get time slot to check availability
			const timeSlot = await pb.collection('time_slots').getOne(timeSlotId);
			
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
			
			// Create booking
			const booking = await pb.collection('bookings').create({
				tour: tour.id,
				timeSlot: timeSlotId,
				qrCode: qrCode.id,
				customerName,
				customerEmail,
				customerPhone: customerPhone || null,
				participants,
				totalPrice,
				specialRequests: specialRequests || null,
				status: 'pending', // Will be updated after payment
				paymentStatus: 'pending'
			});
			
			// Update time slot availability
			await pb.collection('time_slots').update(timeSlotId, {
				bookedSpots: timeSlot.bookedSpots + participants,
				availableSpots: timeSlot.availableSpots - participants
			});
			
			// Increment QR code conversion count
			await pb.collection('qr_codes').update(qrCode.id, {
				conversions: (qrCode.conversions || 0) + 1
			});
			
			// In a real app, you would redirect to payment processing here
			// For now, we'll just show a success message
			return {
				success: true,
				bookingId: booking.id,
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