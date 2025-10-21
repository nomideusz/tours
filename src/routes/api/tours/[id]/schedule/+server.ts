import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { tours, timeSlots } from '$lib/db/schema/index.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (!params.id) {
			return json({ error: 'Tour ID required' }, { status: 400 });
		}

		const tourId = params.id;
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

		const data = await request.json();
		const { date, startTime, endTime, capacity, status, notes, recurring, recurringType, recurringEnd, recurringCount } = data;

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
		const slotCapacity = parseInt(capacity) || tour.capacity;
		if (slotCapacity < 1 || slotCapacity > 200) {
			return json({ error: 'Capacity must be between 1 and 200' }, { status: 400 });
		}

		// Note: We allow overlapping time slots for the same tour
		// This supports scenarios like:
		// - Multiple guides leading the same tour
		// - Different capacity tiers at the same time
		// - Offering the same time slot with different options

		// Map status to correct enum values
		const slotStatus: 'available' | 'cancelled' = status === 'cancelled' ? 'cancelled' : 'available';

		// Create the time slot(s)
		const slotsToCreate = [];

		if (recurring && recurringType && (recurringEnd || recurringCount)) {
			// Handle recurring slots
			let currentDate = new Date(slotStart);
			const endDate = recurringEnd ? new Date(recurringEnd) : null;
			let count = 0;
			
			// If we have an end date, ignore count limit and create until end date
			// If no end date, use count limit (default to reasonable number)
			const maxCount = endDate ? 365 : (parseInt(recurringCount) || 2); // Safety limit of 365 for end date mode

			while ((endDate ? currentDate <= endDate : count < maxCount) && count < 365) {
				const slotStartTime = new Date(currentDate);
				const slotEndTime = new Date(currentDate.getTime() + (slotEnd.getTime() - slotStart.getTime()));

				slotsToCreate.push({
					tourId,
					startTime: slotStartTime,
					endTime: slotEndTime,
					availableSpots: slotCapacity,
					bookedSpots: 0,
					status: slotStatus,
					isRecurring: true,
					recurringPattern: recurringType as 'daily' | 'weekly' | 'monthly',
					recurringEnd: recurringEnd ? new Date(recurringEnd) : null
				});

				// Increment date based on recurring type
				switch (recurringType) {
					case 'daily':
						currentDate.setDate(currentDate.getDate() + 1);
						break;
					case 'weekly':
						currentDate.setDate(currentDate.getDate() + 7);
						break;
					case 'monthly':
						currentDate.setMonth(currentDate.getMonth() + 1);
						break;
				}

				count++;
			}
		} else {
			// Single slot
			slotsToCreate.push({
				tourId,
				startTime: slotStart,
				endTime: slotEnd,
				availableSpots: slotCapacity,
				bookedSpots: 0,
				status: slotStatus,
				isRecurring: false,
				recurringPattern: null,
				recurringEnd: null
			});
		}

		// Insert all slots
		const createdSlots = await db.insert(timeSlots).values(slotsToCreate).returning();

		return json({
			success: true,
			slots: createdSlots.map(slot => ({
				...slot,
				startTime: slot.startTime.toISOString(),
				endTime: slot.endTime.toISOString(),
				createdAt: slot.createdAt.toISOString(),
				updatedAt: slot.updatedAt.toISOString()
			}))
		});

	} catch (error) {
		console.error('Create time slot error:', error);
		return json({ error: 'Server error' }, { status: 500 });
	}
}; 