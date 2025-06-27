import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { tours, bookings } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	// Check authentication
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (!params.id) {
		throw error(400, 'Tour ID is required');
	}

	try {
		const { status } = await request.json();

		// Validate status value
		if (!status || !['active', 'draft'].includes(status)) {
			throw error(400, 'Invalid status. Must be "active" or "draft"');
		}

		// Check if tour exists and belongs to user
		const existingTourResults = await db
			.select()
			.from(tours)
			.where(and(
				eq(tours.id, params.id),
				eq(tours.userId, locals.user.id)
			))
			.limit(1);

		if (existingTourResults.length === 0) {
			throw error(404, 'Tour not found');
		}

		const existingTour = existingTourResults[0];
		
		// If changing from active to draft, check for active bookings
		let warningInfo = null;
		if (existingTour.status === 'active' && status === 'draft') {
			// Get active bookings for this tour
			const activeBookings = await db
				.select({
					id: bookings.id,
					status: bookings.status,
					totalAmount: bookings.totalAmount,
					paymentStatus: bookings.paymentStatus
				})
				.from(bookings)
				.where(and(
					eq(bookings.tourId, params.id),
					eq(bookings.status, 'confirmed')
				));
			
			if (activeBookings.length > 0) {
				const revenue = activeBookings
					.filter(b => b.paymentStatus === 'paid')
					.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);
				
				warningInfo = {
					hasActiveBookings: true,
					activeBookingsCount: activeBookings.length,
					revenue: revenue,
					message: `This tour has ${activeBookings.length} confirmed booking${activeBookings.length !== 1 ? 's' : ''}. Setting to draft will prevent new bookings but existing bookings will remain active.`
				};
				
				console.warn(`⚠️ Tour ${params.id} being set to draft with ${activeBookings.length} active bookings`);
			}
		}

		// Update tour status
		const updatedTours = await db
			.update(tours)
			.set({
				status,
				updatedAt: new Date()
			})
			.where(and(
				eq(tours.id, params.id),
				eq(tours.userId, locals.user.id)
			))
			.returning();

		if (updatedTours.length === 0) {
			throw error(500, 'Failed to update tour status');
		}

		const updatedTour = updatedTours[0];

		return json({
			success: true,
			tour: {
				id: updatedTour.id,
				status: updatedTour.status,
				updatedAt: updatedTour.updatedAt
			},
			warning: warningInfo
		});

	} catch (err) {
		console.error('Error updating tour status:', err);
		if (err instanceof Response) {
			throw err;
		}
		throw error(500, 'Failed to update tour status');
	}
}; 