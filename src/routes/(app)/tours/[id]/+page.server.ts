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

		// Load recent bookings with time slot information (REDUCED LIMIT TO PREVENT 502)
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
				timeSlotEndTime: timeSlots.endTime,
				customerName: bookings.customerName,
				customerEmail: bookings.customerEmail,
				ticketQRCode: bookings.ticketQRCode,
				bookingReference: bookings.bookingReference,
				attendanceStatus: bookings.attendanceStatus
			})
			.from(bookings)
			.leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
			.where(eq(bookings.tourId, params.id))
			.orderBy(desc(bookings.createdAt))
			.limit(20); // REDUCED FROM 200 TO 20 TO PREVENT TIMEOUT

		// Transform to match expected format
		const allBookings = allBookingsData.map(booking => ({
			id: booking.id,
			status: booking.status,
			paymentStatus: booking.paymentStatus,
			totalAmount: booking.totalAmount ? parseFloat(booking.totalAmount) : 0,
			participants: booking.participants || 0,
			created: booking.createdAt.toISOString(),
			customerName: booking.customerName || '',
			customerEmail: booking.customerEmail || '',
			ticketQRCode: booking.ticketQRCode || null,
			bookingReference: booking.bookingReference || '',
			attendanceStatus: booking.attendanceStatus || null,
			expand: {
				timeSlot: booking.timeSlotId ? {
					startTime: booking.timeSlotStartTime?.toISOString() || null,
					endTime: booking.timeSlotEndTime?.toISOString() || null
				} : null
			}
		}));

		// Load QR codes
		const qrCodesData = await db
			.select()
			.from(qrCodes)
			.where(eq(qrCodes.tourId, params.id))
			.orderBy(desc(qrCodes.createdAt));

		// Calculate statistics
		const confirmedBookings = allBookings.filter(b => 
			b.status === 'confirmed' && b.paymentStatus === 'paid'
		);
		
		// Calculate this week's bookings
		const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		const thisWeekBookings = allBookings.filter(b => 
			new Date(b.created) >= oneWeekAgo && 
			(b.status === 'confirmed' || b.status === 'pending')
		);

		// Filter for upcoming bookings (for check-ins)
		const now = new Date();
		const upcomingBookings = allBookings.filter(b => {
			if (!b.expand?.timeSlot?.startTime) return false;
			const tourDate = new Date(b.expand.timeSlot.startTime);
			const isUpcoming = tourDate > now || tourDate.toDateString() === now.toDateString();
			return isUpcoming && b.status === 'confirmed' && b.paymentStatus === 'paid';
		});

		// Calculate statistics
		const stats = {
			qrCodes: qrCodesData.length,
			activeQRCodes: qrCodesData.filter(qr => qr.isActive).length,
			totalQRScans: qrCodesData.reduce((sum, qr) => sum + qr.scans, 0),
			totalQRConversions: qrCodesData.reduce((sum, qr) => sum + qr.conversions, 0),
			totalBookings: allBookings.length,
			confirmedBookings: confirmedBookings.length,
			pendingBookings: allBookings.filter(b => b.status === 'pending').length,
			cancelledBookings: allBookings.filter(b => b.status === 'cancelled').length,
			completedBookings: allBookings.filter(b => b.status === 'completed').length,
			revenue: confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0),
			totalParticipants: confirmedBookings.reduce((sum, b) => sum + b.participants, 0),
			thisWeekBookings: thisWeekBookings.length,
			averageBookingValue: confirmedBookings.length > 0 
				? confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0) / confirmedBookings.length 
				: 0,
			conversionRate: qrCodesData.reduce((sum, qr) => sum + qr.scans, 0) > 0 
				? (qrCodesData.reduce((sum, qr) => sum + qr.conversions, 0) / qrCodesData.reduce((sum, qr) => sum + qr.scans, 0)) * 100
				: 0
		};

		return {
			tour: {
				...tour,
				price: tour.price ? parseFloat(tour.price) : 0,
				createdAt: tour.createdAt.toISOString(),
				updatedAt: tour.updatedAt.toISOString()
			},
			bookings: upcomingBookings,
			allBookings: allBookings,
			qrCodes: qrCodesData,
			stats
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
	},
	
	toggleStatus: async ({ params, locals }) => {
		if (!locals.user) {
			throw error(401, 'Unauthorized');
		}

		try {
			// Get current tour status
			const tourData = await db
				.select({ status: tours.status })
				.from(tours)
				.where(and(
					eq(tours.id, params.id),
					eq(tours.userId, locals.user.id)
				))
				.limit(1);
			
			if (tourData.length === 0) {
				throw error(404, 'Tour not found or access denied');
			}

			// Toggle status
			const currentStatus = tourData[0].status;
			const newStatus = currentStatus === 'active' ? 'draft' : 'active';

			// Update tour status
			await db
				.update(tours)
				.set({ 
					status: newStatus,
					updatedAt: new Date()
				})
				.where(and(
					eq(tours.id, params.id),
					eq(tours.userId, locals.user.id)
				));

			return { success: true };
		} catch (err) {
			console.error('Error updating tour status:', err);
			throw error(500, 'Failed to update tour status');
		}
	}
}; 