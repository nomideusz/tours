import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { db } from '$lib/db/connection.js';
import { tours, timeSlots } from '$lib/db/schema/index.js';
import { eq, and, gte, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const load: PageServerLoad = async ({ locals, url, params, parent }) => {
	// Get parent layout data first
	const parentData = await parent();
	
	// Check if user is authenticated
	if (!locals.user) {
		const redirectTo = url.pathname + url.search;
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	// Validate that tour ID is provided
	if (!params.id) {
		throw error(400, 'Tour ID is required');
	}

	try {
		const userId = locals.user.id;
		const tourId = params.id;

		// Load tour data and verify ownership
		const [tour] = await db
			.select()
			.from(tours)
			.where(and(
				eq(tours.id, tourId),
				eq(tours.userId, userId)
			))
			.limit(1);

		if (!tour) {
			throw error(404, 'Tour not found or you do not have permission to view it');
		}

		// Load all time slots for this tour
		const tourTimeSlots = await db
			.select()
			.from(timeSlots)
			.where(eq(timeSlots.tourId, tourId))
			.orderBy(timeSlots.startTime);

		return {
			...parentData,
			tour: {
				...tour,
				price: parseFloat(tour.price),
				created: tour.createdAt.toISOString(),
				updated: tour.updatedAt.toISOString()
			},
			timeSlots: tourTimeSlots.map(slot => ({
				...slot,
				startTime: slot.startTime.toISOString(),
				endTime: slot.endTime.toISOString(),
				createdAt: slot.createdAt.toISOString(),
				updatedAt: slot.updatedAt.toISOString()
			}))
		};
	} catch (err) {
		console.error('Error loading tour schedule page:', err);
		
		// Re-throw SvelteKit errors (like 404, 403)
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		
		throw error(500, 'Failed to load tour schedule');
	}
};

export const actions: Actions = {
	'create-slot': async ({ request, locals, params }) => {
		if (!locals.user || !params.id) {
			throw error(401, 'Unauthorized');
		}

		try {
			const formData = await request.formData();
			const slotData = JSON.parse(formData.get('slot') as string);

			// Verify tour ownership
			const [tour] = await db
				.select()
				.from(tours)
				.where(and(
					eq(tours.id, params.id),
					eq(tours.userId, locals.user.id)
				))
				.limit(1);

			if (!tour) {
				throw error(404, 'Tour not found');
			}

			// Create new time slot - default to tour capacity if not specified
			const newSlot = {
				id: createId(),
				tourId: params.id,
				startTime: new Date(slotData.startTime),
				endTime: new Date(slotData.endTime),
				availableSpots: slotData.availableSpots || tour.capacity,
				bookedSpots: 0,
				status: 'available' as const,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			await db.insert(timeSlots).values(newSlot);

			return { success: true, slot: newSlot };
		} catch (err) {
			console.error('Error creating time slot:', err);
			throw error(500, 'Failed to create time slot');
		}
	},

	'update-slot': async ({ request, locals, params }) => {
		if (!locals.user || !params.id) {
			throw error(401, 'Unauthorized');
		}

		try {
			const formData = await request.formData();
			const slotData = JSON.parse(formData.get('slot') as string);

			// Verify tour ownership
			const [tour] = await db
				.select()
				.from(tours)
				.where(and(
					eq(tours.id, params.id),
					eq(tours.userId, locals.user.id)
				))
				.limit(1);

			if (!tour) {
				throw error(404, 'Tour not found');
			}

			// Update time slot
			const updatedSlot = await db
				.update(timeSlots)
				.set({
					startTime: new Date(slotData.startTime),
					endTime: new Date(slotData.endTime),
					availableSpots: slotData.availableSpots,
					updatedAt: new Date()
				})
				.where(and(
					eq(timeSlots.id, slotData.id),
					eq(timeSlots.tourId, params.id)
				))
				.returning();

			if (updatedSlot.length === 0) {
				throw error(404, 'Time slot not found');
			}

			return { success: true, slot: updatedSlot[0] };
		} catch (err) {
			console.error('Error updating time slot:', err);
			throw error(500, 'Failed to update time slot');
		}
	},

	'delete-slot': async ({ request, locals, params }) => {
		if (!locals.user || !params.id) {
			throw error(401, 'Unauthorized');
		}

		try {
			const formData = await request.formData();
			const slotId = formData.get('slotId') as string;

			// Verify tour ownership and that slot has no bookings
			const [slot] = await db
				.select({
					id: timeSlots.id,
					bookedSpots: timeSlots.bookedSpots,
					tourUserId: tours.userId
				})
				.from(timeSlots)
				.innerJoin(tours, eq(timeSlots.tourId, tours.id))
				.where(and(
					eq(timeSlots.id, slotId),
					eq(timeSlots.tourId, params.id)
				))
				.limit(1);

			if (!slot) {
				throw error(404, 'Time slot not found');
			}

			if (slot.tourUserId !== locals.user.id) {
				throw error(403, 'Access denied');
			}

			if (slot.bookedSpots > 0) {
				throw error(400, 'Cannot delete time slot with existing bookings');
			}

			// Delete the time slot
			await db
				.delete(timeSlots)
				.where(eq(timeSlots.id, slotId));

			return { success: true };
		} catch (err) {
			console.error('Error deleting time slot:', err);
			if (err && typeof err === 'object' && 'status' in err) {
				throw err;
			}
			throw error(500, 'Failed to delete time slot');
		}
	},

	'bulk-create': async ({ request, locals, params }) => {
		if (!locals.user || !params.id) {
			throw error(401, 'Unauthorized');
		}

		try {
			const formData = await request.formData();
			const slotsData = JSON.parse(formData.get('slots') as string);

			// Verify tour ownership
			const [tour] = await db
				.select()
				.from(tours)
				.where(and(
					eq(tours.id, params.id),
					eq(tours.userId, locals.user.id)
				))
				.limit(1);

			if (!tour) {
				throw error(404, 'Tour not found');
			}

			// Create multiple time slots - default to tour capacity if not specified
			const newSlots = slotsData.map((slotData: any) => ({
				id: createId(),
				tourId: params.id,
				startTime: new Date(slotData.startTime),
				endTime: new Date(slotData.endTime),
				availableSpots: slotData.availableSpots || tour.capacity,
				bookedSpots: 0,
				status: 'available' as const,
				createdAt: new Date(),
				updatedAt: new Date()
			}));

			await db.insert(timeSlots).values(newSlots);

			return { success: true, slots: newSlots, count: newSlots.length };
		} catch (err) {
			console.error('Error bulk creating time slots:', err);
			throw error(500, 'Failed to create time slots');
		}
	}
}; 