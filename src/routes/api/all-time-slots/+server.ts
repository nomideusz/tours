import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { tours, timeSlots, bookings } from '$lib/db/schema/index.js';
import { eq, and, gte, lte, desc, count, sql, inArray } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = locals.user.id;
		
		// Get date range from query params
		const view = url.searchParams.get('view') || 'week'; // day | week | month
		const dateParam = url.searchParams.get('date') || new Date().toISOString();
		const baseDate = new Date(dateParam);
		
		// Calculate date range based on view
		let startDate: Date;
		let endDate: Date;
		
		switch (view) {
			case 'day':
				startDate = new Date(baseDate);
				startDate.setHours(0, 0, 0, 0);
				endDate = new Date(baseDate);
				endDate.setHours(23, 59, 59, 999);
				break;
			case 'week':
				// Start from Monday
				startDate = new Date(baseDate);
				const dayOfWeek = startDate.getDay();
				const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
				startDate.setDate(startDate.getDate() + diff);
				startDate.setHours(0, 0, 0, 0);
				endDate = new Date(startDate);
				endDate.setDate(endDate.getDate() + 6);
				endDate.setHours(23, 59, 59, 999);
				break;
			case 'month':
				startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
				endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
				endDate.setHours(23, 59, 59, 999);
				break;
			default:
				startDate = new Date(baseDate);
				endDate = new Date(baseDate);
				endDate.setDate(endDate.getDate() + 7);
		}

		// Step 1: Get all user's tours
		const userTours = await db
			.select({
				id: tours.id,
				name: tours.name,
				duration: tours.duration,
				status: tours.status,
				basePrice: tours.price,
				images: tours.images
			})
			.from(tours)
			.where(eq(tours.userId, userId));

		if (userTours.length === 0) {
			return json({ 
				timeSlots: [],
				stats: {
					totalSlots: 0,
					totalBookings: 0,
					totalCapacity: 0,
					totalRevenue: 0
				}
			});
		}

		const tourMap = new Map(userTours.map(t => [t.id, t]));
		const tourIds = userTours.map(t => t.id);

		// Step 2: Get all time slots in date range for user's tours
		const allTimeSlots = await db
			.select({
				id: timeSlots.id,
				tourId: timeSlots.tourId,
				startTime: timeSlots.startTime,
				endTime: timeSlots.endTime,
				availableSpots: timeSlots.availableSpots,
				bookedSpots: timeSlots.bookedSpots,
				status: timeSlots.status
			})
			.from(timeSlots)
			.where(and(
				inArray(timeSlots.tourId, tourIds),
				gte(timeSlots.startTime, startDate),
				lte(timeSlots.startTime, endDate)
			))
			.orderBy(timeSlots.startTime);

		// Debug: Check for duplicate time slots
		console.log('🔍 Total time slots found:', allTimeSlots.length);
		
		if (allTimeSlots.length === 0) {
			console.log('ℹ️ No time slots found for user tours:', tourIds);
			return json({ 
				timeSlots: [],
				stats: {
					totalSlots: 0,
					totalBookings: 0,
					totalCapacity: 0,
					totalRevenue: 0,
					upcomingSlots: 0,
					todaySlots: 0,
					averageUtilization: 0
				},
				dateRange: {
					start: startDate.toISOString(),
					end: endDate.toISOString(),
					view
				}
			});
		}

		// Only remove actual duplicates (same slot ID) - different tours can have same times
		const uniqueSlots = allTimeSlots.filter((slot, index, arr) => 
			arr.findIndex(s => s.id === slot.id) === index
		);
		
		if (uniqueSlots.length !== allTimeSlots.length) {
			console.log('🧹 Removed duplicate slot IDs:', allTimeSlots.length, '→', uniqueSlots.length);
		}

		// Step 3: Get booking counts for all slots
		const slotIds = uniqueSlots.map(s => s.id);
		const bookingCounts = slotIds.length > 0 ? await db
			.select({
				timeSlotId: bookings.timeSlotId,
				totalBookings: count(bookings.id),
				confirmedBookings: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.status} = 'confirmed' THEN 1 ELSE 0 END), 0)`,
				totalParticipants: sql<number>`COALESCE(SUM(${bookings.participants}), 0)`,
				totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.status} = 'confirmed' AND ${bookings.paymentStatus} = 'paid' THEN ${bookings.totalAmount} ELSE 0 END), 0)`
			})
			.from(bookings)
			.where(inArray(bookings.timeSlotId, slotIds))
			.groupBy(bookings.timeSlotId) : [];

		const bookingMap = new Map(
			bookingCounts.map(b => [
				b.timeSlotId,
				{
					totalBookings: Number(b.totalBookings || 0),
					confirmedBookings: Number(b.confirmedBookings || 0),
					totalParticipants: Number(b.totalParticipants || 0),
					totalRevenue: Number(b.totalRevenue || 0)
				}
			])
		);

		// Step 4: Process and combine data
		const now = new Date();
		const processedSlots = uniqueSlots.map(slot => {
			const tour = tourMap.get(slot.tourId);
			const booking = bookingMap.get(slot.id) || {
				totalBookings: 0,
				confirmedBookings: 0,
				totalParticipants: 0,
				totalRevenue: 0
			};

			const startTime = new Date(slot.startTime);
			const isPast = startTime < now;
			const capacity = slot.availableSpots || 0;
			const bookedSpots = slot.bookedSpots || booking.totalBookings;
			const available = Math.max(0, capacity - bookedSpots);
			const utilizationRate = capacity > 0 ? (bookedSpots / capacity) * 100 : 0;

			return {
				id: slot.id,
				tourId: slot.tourId,
				tourName: tour?.name || 'Unknown Tour',
				tourImage: tour?.images?.[0] || null,
				startTime: slot.startTime.toISOString(),
				endTime: slot.endTime.toISOString(),
				capacity,
				bookedSpots,
				available,
				utilizationRate,
				status: slot.status,
				isPast,
				isToday: startTime.toDateString() === now.toDateString(),
				isFull: available === 0,
				...booking
			};
		});

		// Calculate stats
		const stats = {
			totalSlots: processedSlots.length,
			totalBookings: processedSlots.reduce((sum, s) => sum + s.totalBookings, 0),
			totalCapacity: processedSlots.reduce((sum, s) => sum + s.capacity, 0),
			totalRevenue: processedSlots.reduce((sum, s) => sum + s.totalRevenue, 0),
			upcomingSlots: processedSlots.filter(s => !s.isPast).length,
			todaySlots: processedSlots.filter(s => s.isToday).length,
			averageUtilization: processedSlots.length > 0 
				? processedSlots.reduce((sum, s) => sum + s.utilizationRate, 0) / processedSlots.length
				: 0
		};

		return json({
			timeSlots: processedSlots,
			stats,
			dateRange: {
				start: startDate.toISOString(),
				end: endDate.toISOString(),
				view
			}
		});

	} catch (error) {
		console.error('All time slots API error:', error);
		return json({ error: 'Server error' }, { status: 500 });
	}
}; 