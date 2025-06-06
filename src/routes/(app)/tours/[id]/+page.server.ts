import type { PageServerLoad, Actions } from './$types.js';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours, bookings, timeSlots, qrCodes } from '$lib/db/schema/index.js';
import { eq, and, desc, count, sum, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Get tour with owner check
		const tourData = await db
			.select()
			.from(tours)
			.where(and(
				eq(tours.id, params.id),
				eq(tours.userId, locals.user.id)
			))
			.limit(1);
		
		if (tourData.length === 0) {
			throw error(404, 'Tour not found or access denied');
		}
		
		const tour = tourData[0];

		// Load recent bookings with time slot information (last 200)
		const allBookingsData = await db
			.select({
				id: bookings.id,
				status: bookings.status,
				paymentStatus: bookings.paymentStatus,
				totalAmount: bookings.totalAmount,
				participants: bookings.participants,
				createdAt: bookings.createdAt,
				timeSlotId: bookings.timeSlotId,
				timeSlotStartTime: timeSlots.startTime,
				timeSlotEndTime: timeSlots.endTime
			})
			.from(bookings)
			.leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
			.where(eq(bookings.tourId, params.id))
			.orderBy(desc(bookings.createdAt))
			.limit(200);

		// Transform to match expected format
		const allBookings = allBookingsData.map(booking => ({
			id: booking.id,
			status: booking.status,
			paymentStatus: booking.paymentStatus,
			totalAmount: booking.totalAmount,
			participants: booking.participants,
			created: booking.createdAt.toISOString(),
			expand: {
				timeSlot: booking.timeSlotId ? {
					startTime: booking.timeSlotStartTime?.toISOString(),
					endTime: booking.timeSlotEndTime?.toISOString()
				} : null
			}
		}));

		// Load QR codes (first 50)
		const qrCodesData = await db
			.select()
			.from(qrCodes)
			.where(eq(qrCodes.tourId, params.id))
			.orderBy(desc(qrCodes.createdAt))
			.limit(50);

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
			qrCodes: qrCodesData.length,
			activeQRCodes: qrCodesData.filter((qr: any) => qr.isActive).length,
			totalQRScans: qrCodesData.reduce((sum: number, qr: any) => sum + (qr.scans || 0), 0),
			totalQRConversions: qrCodesData.reduce((sum: number, qr: any) => sum + (qr.conversions || 0), 0),
			totalBookings: allBookings.length,
			confirmedBookings: confirmedBookings.length,
			pendingBookings: allBookings.filter((b: any) => b.status === 'pending').length,
			cancelledBookings: allBookings.filter((b: any) => b.status === 'cancelled').length,
			completedBookings: allBookings.filter((b: any) => b.status === 'completed').length,
			revenue: confirmedBookings.reduce((sum: number, b: any) => sum + (Number(b.totalAmount) || 0), 0),
			totalParticipants: confirmedBookings.reduce((sum: number, b: any) => sum + (b.participants || 0), 0),
			thisWeekBookings: thisWeekBookings.length,
			averageBookingValue: confirmedBookings.length > 0 
				? confirmedBookings.reduce((sum: number, b: any) => sum + (Number(b.totalAmount) || 0), 0) / confirmedBookings.length 
				: 0,
			conversionRate: qrCodesData.reduce((sum: number, qr: any) => sum + (qr.scans || 0), 0) > 0 
				? (qrCodesData.reduce((sum: number, qr: any) => sum + (qr.conversions || 0), 0) / qrCodesData.reduce((sum: number, qr: any) => sum + (qr.scans || 0), 0)) * 100
				: 0
		};

		return {
			tour,
			bookings: upcomingBookings, // Only upcoming bookings for today's check-ins section
			allBookings: allBookings, // All bookings for potential use
			qrCodes: qrCodesData,
			stats,
			pbUrl: 'https://z.xeon.pl' // Keep for now for any remaining image URLs
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

export const actions: Actions = {
	delete: async ({ params, locals }) => {
		if (!locals.user) {
			throw error(401, 'Unauthorized');
		}

		try {
			// Verify ownership before deletion
			const tourData = await db
				.select()
				.from(tours)
				.where(and(
					eq(tours.id, params.id),
					eq(tours.userId, locals.user.id)
				))
				.limit(1);
			
			if (tourData.length === 0) {
				throw error(404, 'Tour not found or access denied');
			}

			// Delete tour (cascade will handle related records)
			await db
				.delete(tours)
				.where(and(
					eq(tours.id, params.id),
					eq(tours.userId, locals.user.id)
				));

		} catch (err) {
			console.error('Error deleting tour:', err);
			throw error(500, 'Failed to delete tour');
		}

		throw redirect(303, '/tours');
	}
}; 