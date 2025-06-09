import type { PageServerLoad, Actions } from './$types.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours, timeSlots, bookings } from '$lib/db/schema/index.js';
import { eq, and, gte, desc, asc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(303, '/auth/login');
	}

	try {
		// Get tour details and verify ownership
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

		// Get existing time slots for this tour, including future bookings count
		const currentDate = new Date();
		const existingSlots = await db
			.select({
				id: timeSlots.id,
				startTime: timeSlots.startTime,
				endTime: timeSlots.endTime,
				availableSpots: timeSlots.availableSpots,
				bookedSpots: timeSlots.bookedSpots,
				status: timeSlots.status,
				isRecurring: timeSlots.isRecurring,
				recurringPattern: timeSlots.recurringPattern,
				recurringEnd: timeSlots.recurringEnd,
				createdAt: timeSlots.createdAt,
				updatedAt: timeSlots.updatedAt
			})
			.from(timeSlots)
			.where(and(
				eq(timeSlots.tourId, tour.id),
				gte(timeSlots.startTime, currentDate)
			))
			.orderBy(asc(timeSlots.startTime));

		return {
			tour: {
				...tour,
				price: parseFloat(tour.price),
				created: tour.createdAt.toISOString(),
				updated: tour.updatedAt.toISOString()
			},
			timeSlots: existingSlots.map(slot => ({
				...slot,
				startTime: slot.startTime.toISOString(),
				endTime: slot.endTime.toISOString(),
				recurringEnd: slot.recurringEnd?.toISOString() || null,
				created: slot.createdAt.toISOString(),
				updated: slot.updatedAt.toISOString()
			}))
		};
	} catch (err) {
		console.error('Error loading schedule page:', err);
		throw error(500, 'Failed to load schedule');
	}
};

export const actions: Actions = {
	create: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		try {
			const formData = await request.formData();
			const startDate = formData.get('startDate') as string;
			const startTime = formData.get('startTime') as string;
			const endTime = formData.get('endTime') as string;
			const availableSpots = parseInt(formData.get('availableSpots') as string);

			// Validation
			if (!startDate || !startTime || !endTime || !availableSpots) {
				return fail(400, { error: 'All fields are required' });
			}

			if (availableSpots < 1 || availableSpots > 100) {
				return fail(400, { error: 'Available spots must be between 1 and 100' });
			}

			// Verify tour ownership
			const [tour] = await db
				.select({ id: tours.id })
				.from(tours)
				.where(and(
					eq(tours.id, params.id),
					eq(tours.userId, locals.user.id)
				))
				.limit(1);

			if (!tour) {
				return fail(404, { error: 'Tour not found' });
			}

			// Create combined datetime strings
			const startDateTime = new Date(`${startDate}T${startTime}`);
			const endDateTime = new Date(`${startDate}T${endTime}`);

			// Validate times
			if (startDateTime >= endDateTime) {
				return fail(400, { error: 'End time must be after start time' });
			}

			if (startDateTime < new Date()) {
				return fail(400, { error: 'Cannot create time slots in the past' });
			}

			// Create time slot
			await db.insert(timeSlots).values({
				id: createId(),
				tourId: tour.id,
				startTime: startDateTime,
				endTime: endDateTime,
				availableSpots,
				bookedSpots: 0,
				status: 'available',
				isRecurring: false,
				recurringPattern: null,
				recurringEnd: null
			});

			return { success: true };
		} catch (err) {
			console.error('Error creating time slot:', err);
			return fail(500, { error: 'Failed to create time slot' });
		}
	},

	delete: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		try {
			const formData = await request.formData();
			const slotId = formData.get('slotId') as string;

			if (!slotId) {
				return fail(400, { error: 'Time slot ID is required' });
			}

			// Check if time slot exists and verify ownership through tour
			const [timeSlot] = await db
				.select({
					id: timeSlots.id,
					bookedSpots: timeSlots.bookedSpots,
					tourUserId: tours.userId
				})
				.from(timeSlots)
				.innerJoin(tours, eq(timeSlots.tourId, tours.id))
				.where(eq(timeSlots.id, slotId))
				.limit(1);

			if (!timeSlot) {
				return fail(404, { error: 'Time slot not found' });
			}

			if (timeSlot.tourUserId !== locals.user.id) {
				return fail(403, { error: 'Not authorized' });
			}

			// Check if there are existing bookings
			if (timeSlot.bookedSpots > 0) {
				return fail(400, { error: 'Cannot delete time slot with existing bookings' });
			}

			// Delete the time slot
			await db.delete(timeSlots).where(eq(timeSlots.id, slotId));

			return { success: true };
		} catch (err) {
			console.error('Error deleting time slot:', err);
			return fail(500, { error: 'Failed to delete time slot' });
		}
	},

	updateCapacity: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		try {
			const formData = await request.formData();
			const slotId = formData.get('slotId') as string;
			const newCapacity = parseInt(formData.get('newCapacity') as string);

			if (!slotId || !newCapacity) {
				return fail(400, { error: 'Slot ID and capacity are required' });
			}

			if (newCapacity < 1 || newCapacity > 100) {
				return fail(400, { error: 'Capacity must be between 1 and 100' });
			}

			// Check if time slot exists and verify ownership through tour
			const [timeSlot] = await db
				.select({
					id: timeSlots.id,
					bookedSpots: timeSlots.bookedSpots,
					availableSpots: timeSlots.availableSpots,
					tourUserId: tours.userId
				})
				.from(timeSlots)
				.innerJoin(tours, eq(timeSlots.tourId, tours.id))
				.where(eq(timeSlots.id, slotId))
				.limit(1);

			if (!timeSlot) {
				return fail(404, { error: 'Time slot not found' });
			}

			if (timeSlot.tourUserId !== locals.user.id) {
				return fail(403, { error: 'Not authorized' });
			}

			// Check if new capacity is sufficient for existing bookings
			if (newCapacity < timeSlot.bookedSpots) {
				return fail(400, { error: `Cannot set capacity to ${newCapacity}. There are already ${timeSlot.bookedSpots} bookings.` });
			}

			// Update the time slot capacity
			await db.update(timeSlots)
				.set({
					availableSpots: newCapacity,
					updatedAt: new Date()
				})
				.where(eq(timeSlots.id, slotId));

			return { success: true };
		} catch (err) {
			console.error('Error updating time slot capacity:', err);
			return fail(500, { error: 'Failed to update time slot capacity' });
		}
	}
}; 