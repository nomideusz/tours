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

export const DELETE: RequestHandler = async ({ locals, params, url }) => {
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

		// Get all bookings for this slot before cancelling
		const affectedBookings = await db
			.select({
				id: bookings.id,
				customerEmail: bookings.customerEmail,
				customerName: bookings.customerName
			})
			.from(bookings)
			.where(eq(bookings.timeSlotId, slotId));

		// Check if slot has bookings
		if (currentSlot.bookedSpots > 0 || affectedBookings.length > 0) {
			// Cancel all bookings for this slot
			await db
				.update(bookings)
				.set({ 
					status: 'cancelled',
					updatedAt: new Date()
				})
				.where(eq(bookings.timeSlotId, slotId));
			
			console.log(`Cancelled ${affectedBookings.length} bookings for time slot ${slotId}`);

			// Send cancellation emails to all affected customers
			const origin = url.origin;
			const emailPromises = affectedBookings.map(async (booking) => {
				try {
					const emailResponse = await fetch(`${origin}/api/send-booking-email`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							bookingId: booking.id,
							emailType: 'cancelled',
							cancellationReason: 'other',
							customMessage: 'The time slot for this tour has been cancelled by the tour guide.',
							isBulkCancellation: true
						})
					});

					if (!emailResponse.ok) {
						console.warn(`Failed to send cancellation email to ${booking.customerEmail}:`, await emailResponse.text());
					} else {
						console.log(`Sent cancellation email to ${booking.customerEmail}`);
					}
				} catch (emailError) {
					console.error(`Error sending cancellation email to ${booking.customerEmail}:`, emailError);
					// Continue with other emails even if one fails
				}
			});
			
			// Wait for all emails to be sent
			await Promise.all(emailPromises);
		}

		if (currentSlot.bookedSpots > 0 || affectedBookings.length > 0) {
			// If there were bookings, mark as cancelled to preserve audit trail
			await db
				.update(timeSlots)
				.set({
					status: 'cancelled',
					updatedAt: new Date()
				})
				.where(eq(timeSlots.id, slotId));

			return json({
				success: true,
				message: `Time slot cancelled and ${affectedBookings.length} booking(s) cancelled. Cancellation emails sent to affected customers.`,
				affectedBookings: affectedBookings.length,
				action: 'cancelled'
			});
		} else {
			// If no bookings, actually delete the slot
			await db
				.delete(timeSlots)
				.where(eq(timeSlots.id, slotId));

			return json({
				success: true,
				message: 'Time slot deleted successfully',
				affectedBookings: 0,
				action: 'deleted'
			});
		}

	} catch (error) {
		console.error('Delete time slot error:', error);
		return json({ error: 'Server error' }, { status: 500 });
	}
}; 