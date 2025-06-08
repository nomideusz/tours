import type { PageServerLoad, Actions } from './$types.js';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { getTourBookingData } from '$lib/utils/shared-stats.js';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
	console.log('Tour detail page load started for tour:', params.id);
	
	if (!locals.user) {
		console.log('Tour detail: User not authenticated');
		throw error(401, 'Unauthorized');
	}

	console.log('Tour detail: User authenticated:', locals.user.email);

	// Get parent layout data first
	const parentData = await parent();

	try {
		// Use the shared stats approach to get tour data, bookings, and stats
		console.log('Loading tour booking data using shared-stats approach');
		const tourBookingData = await getTourBookingData(locals.user.id, params.id);
		
		console.log('Tour detail page load completed successfully');

		return {
			...parentData, // Include shared stats and user data from layout
			...tourBookingData // Include tour, bookings, and stats
		};
	} catch (err) {
		console.error('CRITICAL ERROR loading tour detail:', err);
		console.error('Error type:', err instanceof Error ? err.constructor.name : typeof err);
		console.error('Error message:', err instanceof Error ? err.message : String(err));
		console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
		
		if (err instanceof Error && err.message.includes('not found')) {
			throw error(404, 'Tour not found or access denied');
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

			const newStatus = tourData[0].status === 'active' ? 'draft' : 'active';

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

			return { success: true, newStatus };
		} catch (err) {
			console.error('Error toggling tour status:', err);
			throw error(500, 'Failed to update tour status');
		}
	}
}; 