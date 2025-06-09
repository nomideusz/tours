import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { tours } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	// Check authentication
	if (!locals.user) {
		return error(401, 'Unauthorized');
	}

	if (!params.id) {
		return error(400, 'Tour ID is required');
	}

	try {
		const { status } = await request.json();

		// Validate status value
		if (!status || !['active', 'draft'].includes(status)) {
			return error(400, 'Invalid status. Must be "active" or "draft"');
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
			return error(404, 'Tour not found');
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
			return error(500, 'Failed to update tour status');
		}

		const updatedTour = updatedTours[0];

		return json({
			success: true,
			tour: {
				id: updatedTour.id,
				status: updatedTour.status,
				updatedAt: updatedTour.updatedAt
			}
		});

	} catch (err) {
		console.error('Error updating tour status:', err);
		return error(500, 'Failed to update tour status');
	}
}; 