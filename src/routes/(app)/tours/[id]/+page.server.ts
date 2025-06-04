import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import type { Tour } from '$lib/types.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user || !locals.pb) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Add timeout protection for database queries
		const tourPromise = locals.pb.collection('tours').getOne<Tour>(params.id, {
			expand: 'user'
		});
		const tourTimeout = new Promise((_, reject) => 
			setTimeout(() => reject(new Error('Tour query timeout')), 8000)
		);
		
		const tour = await Promise.race([tourPromise, tourTimeout]) as Tour;
		
		if (!tour) {
			throw error(404, 'Tour not found');
		}
		
		// Check if user owns this tour
		if (tour.user !== locals.user.id) {
			throw error(403, 'You do not have permission to view this tour');
		}
		
		// EMERGENCY FIX: Use pagination to prevent timeouts
		// Load recent bookings for statistics (last 200 should be enough)
		const bookingsResult = await locals.pb.collection('bookings').getList(1, 200, {
			filter: `tour = "${params.id}"`,
			expand: 'timeSlot',
			sort: '-created'
		});
		const allBookings = bookingsResult.items;

		// Load QR codes with pagination (first 50)
		const qrResult = await locals.pb.collection('qr_codes').getList(1, 50, {
			filter: `tour = "${params.id}"`,
			sort: '-created'
		});
		const qrCodes = qrResult.items;

		// Calculate statistics
		const now = new Date();
		const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		
		// Filter confirmed/paid bookings for revenue calculation
		const confirmedBookings = allBookings.filter((b: any) => 
			b.status === 'confirmed' && b.paymentStatus === 'paid'
		);
		
		// Calculate this week's bookings
		const thisWeekBookings = allBookings.filter((b: any) => 
			new Date(b.created) >= oneWeekAgo && 
			(b.status === 'confirmed' || b.status === 'pending')
		);

		// Filter for today's check-ins (upcoming confirmed bookings)
		const upcomingBookings = allBookings.filter((b: any) => {
			if (!b.expand?.timeSlot?.startTime) return false;
			const tourDate = new Date(b.expand.timeSlot.startTime);
			const today = new Date();
			const isToday = tourDate.toDateString() === today.toDateString();
			const isUpcoming = tourDate > today || isToday;
			return isUpcoming && b.status === 'confirmed' && b.paymentStatus === 'paid';
		});

		// Calculate statistics
		const stats = {
			qrCodes: qrCodes.length,
			activeQRCodes: qrCodes.filter((qr: any) => qr.isActive).length,
			totalQRScans: qrCodes.reduce((sum: number, qr: any) => sum + (qr.scans || 0), 0),
			totalQRConversions: qrCodes.reduce((sum: number, qr: any) => sum + (qr.conversions || 0), 0),
			totalBookings: allBookings.length,
			confirmedBookings: confirmedBookings.length,
			pendingBookings: allBookings.filter((b: any) => b.status === 'pending').length,
			cancelledBookings: allBookings.filter((b: any) => b.status === 'cancelled').length,
			completedBookings: allBookings.filter((b: any) => b.status === 'completed').length,
			revenue: confirmedBookings.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0),
			totalParticipants: confirmedBookings.reduce((sum: number, b: any) => sum + (b.participants || 0), 0),
			thisWeekBookings: thisWeekBookings.length,
			averageBookingValue: confirmedBookings.length > 0 
				? confirmedBookings.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0) / confirmedBookings.length 
				: 0,
			conversionRate: qrCodes.reduce((sum: number, qr: any) => sum + (qr.scans || 0), 0) > 0 
				? (qrCodes.reduce((sum: number, qr: any) => sum + (qr.conversions || 0), 0) / qrCodes.reduce((sum: number, qr: any) => sum + (qr.scans || 0), 0)) * 100
				: 0
		};

		return {
			tour,
			bookings: upcomingBookings, // Only upcoming bookings for today's check-ins section
			allBookings: allBookings, // All bookings for potential use
			qrCodes: qrCodes,
			stats,
			pbUrl: 'https://z.xeon.pl' // Pass PocketBase URL for image construction
		};
	} catch (err) {
		console.error('Error loading tour:', err);
		if ((err as any).status === 404) {
			throw error(404, 'Tour not found');
		}
		if ((err as any).status) {
			throw err;
		}
		throw error(500, 'Failed to load tour details');
	}
}; 