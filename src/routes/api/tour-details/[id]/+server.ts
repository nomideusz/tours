import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getTourBookingData } from '$lib/utils/booking-helpers.js';
import { getUpcomingTimeSlots, getTimeSlotStats } from '$lib/utils/tour-helpers-server.js';

export const GET: RequestHandler = async ({ locals, params }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (!params.id) {
			return json({ error: 'Tour ID is required' }, { status: 400 });
		}

		// Use the safe booking-helpers function that handles dates properly
		const tourData = await getTourBookingData(locals.user.id, params.id);
		
		// Get upcoming slots with safe date handling
		const upcomingSlots = await getUpcomingTimeSlots(params.id, 10);
		
		// Get time slot stats
		const timeSlotStats = await getTimeSlotStats(params.id);
		
		// Safely format the response
		const response = {
			tour: tourData.tour,
			stats: {
				...tourData.stats,
				totalSlots: timeSlotStats.total,
				upcomingSlots: timeSlotStats.upcoming,
				qrScans: tourData.tour.qrScans || 0,
				qrConversions: tourData.tour.qrConversions || 0,
				// Add additional stats that might be expected
				todayBookings: tourData.stats.thisWeekBookings || 0,
				weekBookings: tourData.stats.thisWeekBookings || 0
			},
			upcomingSlots: upcomingSlots.map(slot => {
				// Safe date handling for slots
				const startDate = slot.startTime ? new Date(slot.startTime) : null;
				const endDate = slot.endTime ? new Date(slot.endTime) : null;
				
				return {
					...slot,
					startTime: startDate && !isNaN(startDate.getTime()) 
						? startDate.toISOString() 
						: null,
					endTime: endDate && !isNaN(endDate.getTime()) 
						? endDate.toISOString() 
						: null
				};
			}),
			recentBookings: tourData.bookings.slice(0, 10)
		};
		
		return json(response, {
			headers: {
				'Cache-Control': 'max-age=60, stale-while-revalidate=30' // 1 min cache
			}
		});
	} catch (error) {
		console.error('Error fetching tour details:', error);
		
		if (error instanceof Error && error.message.includes('not found')) {
			return json({ error: 'Tour not found' }, { status: 404 });
		}
		
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}; 