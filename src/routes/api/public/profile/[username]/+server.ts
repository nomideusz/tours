import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getUserByUsername } from '$lib/utils/username.js';
import { db } from '$lib/db/connection.js';
import { tours, timeSlots } from '$lib/db/schema/index.js';
import { eq, desc, and, gte } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const { username } = params;
	
	if (!username) {
		return json({ error: 'Username required' }, { status: 400 });
	}
	
	try {
		// Get the user by username
		const profileUser = await getUserByUsername(username);
		
		if (!profileUser) {
			return json({ error: 'User not found' }, { status: 404 });
		}
		
		// Get user's active tours
		const userTours = await db
			.select({
				id: tours.id,
				name: tours.name,
				description: tours.description,
				location: tours.location,
				price: tours.price,
				duration: tours.duration,
				capacity: tours.capacity,
				images: tours.images,
				qrCode: tours.qrCode,
				createdAt: tours.createdAt
			})
		.from(tours)
		.where(and(
			eq(tours.userId, profileUser.id),
			eq(tours.status, 'active'),
			eq(tours.publicListing, true)
		))
		.orderBy(desc(tours.createdAt));
		
		// Get available time slots for the next 30 days for all tours
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 30);
		const now = new Date();
		
		const availableTimeSlots = await db
			.select({
				id: timeSlots.id,
				tourId: timeSlots.tourId,
				startTime: timeSlots.startTime,
				endTime: timeSlots.endTime,
				availableSpots: timeSlots.availableSpots,
				bookedSpots: timeSlots.bookedSpots
			})
			.from(timeSlots)
			.innerJoin(tours, eq(timeSlots.tourId, tours.id))
		.where(and(
			eq(tours.userId, profileUser.id),
			eq(tours.status, 'active'),
			eq(tours.publicListing, true),
			gte(timeSlots.startTime, now),
			eq(timeSlots.status, 'available')
		))
			.orderBy(timeSlots.startTime)
			.limit(50);
		
		// Group time slots by tour and filter available ones
		const tourTimeSlots = availableTimeSlots.reduce((acc, slot) => {
			if (!acc[slot.tourId]) {
				acc[slot.tourId] = [];
			}
			
			// Only include slots that have available spots
			if ((slot.availableSpots || 0) > (slot.bookedSpots || 0)) {
				acc[slot.tourId].push({
					id: slot.id,
					startTime: slot.startTime.toISOString(),
					endTime: slot.endTime.toISOString(),
					availableSpots: slot.availableSpots,
					bookedSpots: slot.bookedSpots || 0
				});
			}
			
			return acc;
		}, {} as Record<string, any[]>);
		
		// Return customer-focused profile data
		return json({
			profile: {
				id: profileUser.id,
				name: profileUser.name,
				username: profileUser.username,
				businessName: profileUser.businessName,
				avatar: profileUser.avatar,
				description: profileUser.description,
				location: profileUser.location,
				website: profileUser.website,
				currency: profileUser.currency
			},
			tours: userTours.map(tour => ({
				...tour,
				images: tour.images || [],
				timeSlots: tourTimeSlots[tour.id] || [],
				createdAt: tour.createdAt.toISOString()
			})),
			totalTours: userTours.length
		});
		
	} catch (err) {
		console.error('Error loading public profile:', err);
		return json({ error: 'Failed to load profile' }, { status: 500 });
	}
}; 