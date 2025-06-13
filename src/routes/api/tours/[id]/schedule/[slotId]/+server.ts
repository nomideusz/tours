import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { tours, timeSlots, bookings } from '$lib/db/schema/index.js';
import { eq, and, gte, lte, ne } from 'drizzle-orm';

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (!params.id || !params.slotId) {
			return json({ error: 'Tour ID and Slot ID required' }, { status: 400 });
		}

		const tourId = params.id;
		const slotId = params.slotId;
		const userId = locals.user.id;

		// Verify tour ownership
		const [tour] = await db
			.select({ id: tours.id, capacity: tours.capacity })
			.from(tours)
			.where(and(
				eq(tours.id, tourId),
				eq(tours.userId, userId)
			))
			.limit(1);

		if (!tour) {
			return json({ error: 'Tour not found' }, { status: 404 });
		}

		// Get current slot
		const [currentSlot] = await db
			.select()
			.from(timeSlots)
			.where(eq(timeSlots.id, slotId))
			.limit(1);

		if (!currentSlot) {
			return json({ error: 'Time slot not found' }, { status: 404 });
		}

		const data = await request.json();
		const { startTime, endTime, capacity, status, notes } = data;

		// Validate required fields
		if (!startTime || !endTime) {
			return json({ error: 'Start time and end time are required' }, { status: 400 });
		}

		// Parse and validate times
		const slotStart = new Date(startTime);
		const slotEnd = new Date(endTime);

		if (isNaN(slotStart.getTime()) || isNaN(slotEnd.getTime())) {
			return json({ error: 'Invalid date/time format' }, { status: 400 });
		}

		if (slotEnd <= slotStart) {
			return json({ error: 'End time must be after start time' }, { status: 400 });
		}

		// Validate capacity
		const slotCapacity = parseInt(capacity) || currentSlot.availableSpots;
		if (slotCapacity < currentSlot.bookedSpots) {
			return json({ 
				error: `Capacity cannot be less than ${currentSlot.bookedSpots} (already booked)` 
			}, { status: 400 });
		}

		if (slotCapacity < 1 || slotCapacity > 100) {
			return json({ error: 'Capacity must be between 1 and 100' }, { status: 400 });
		}

		// Check for conflicts with other slots (excluding current slot)
		const conflictingSlots = await db
			.select({ id: timeSlots.id })
			.from(timeSlots)
			.where(and(
				eq(timeSlots.tourId, tourId),
				ne(timeSlots.id, slotId),
				lte(timeSlots.startTime, slotEnd),
				gte(timeSlots.endTime, slotStart)
			));

		if (conflictingSlots.length > 0) {
			return json({ error: 'Time slot conflicts with existing slots' }, { status: 409 });
		}

		// Map status to correct enum values
		const slotStatus: 'available' | 'cancelled' = status === 'cancelled' ? 'cancelled' : 'available';

		// Update the time slot
		const [updatedSlot] = await db
			.update(timeSlots)
			.set({
				startTime: slotStart,
				endTime: slotEnd,
				availableSpots: slotCapacity,
				status: slotStatus,
				updatedAt: new Date()
			})
			.where(eq(timeSlots.id, slotId))
			.returning();

		return json({
			success: true,
			slot: {
				...updatedSlot,
				startTime: updatedSlot.startTime.toISOString(),
				endTime: updatedSlot.endTime.toISOString(),
				createdAt: updatedSlot.createdAt.toISOString(),
				updatedAt: updatedSlot.updatedAt.toISOString()
			}
		});

	} catch (error) {
		console.error('Update time slot error:', error);
		return json({ error: 'Server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (!params.id || !params.slotId) {
			return json({ error: 'Tour ID and Slot ID required' }, { status: 400 });
		}

		const tourId = params.id;
		const slotId = params.slotId;
		const userId = locals.user.id;

		// Verify tour ownership
		const [tour] = await db
			.select({ id: tours.id })
			.from(tours)
			.where(and(
				eq(tours.id, tourId),
				eq(tours.userId, userId)
			))
			.limit(1);

		if (!tour) {
			return json({ error: 'Tour not found' }, { status: 404 });
		}

		// Get current slot with booking count
		const [currentSlot] = await db
			.select()
			.from(timeSlots)
			.where(eq(timeSlots.id, slotId))
			.limit(1);

		if (!currentSlot) {
			return json({ error: 'Time slot not found' }, { status: 404 });
		}

		// Check if slot has bookings
		if (currentSlot.bookedSpots > 0) {
			// Cancel all bookings for this slot
			await db
				.update(bookings)
				.set({
					status: 'cancelled',
					updatedAt: new Date()
				})
				.where(eq(bookings.timeSlotId, slotId));
		}

		// Delete the time slot
		await db
			.delete(timeSlots)
			.where(eq(timeSlots.id, slotId));

		return json({
			success: true,
			message: currentSlot.bookedSpots > 0 
				? `Time slot deleted and ${currentSlot.bookedSpots} booking(s) cancelled`
				: 'Time slot deleted successfully'
		});

	} catch (error) {
		console.error('Delete time slot error:', error);
		return json({ error: 'Server error' }, { status: 500 });
	}
}; 