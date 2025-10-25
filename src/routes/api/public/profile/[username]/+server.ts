import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getUserByUsername } from '$lib/utils/username.js';
import { db } from '$lib/db/connection.js';
import { tours, timeSlots } from '$lib/db/schema/index.js';
import { eq, desc, and, gte } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
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
		
		// Check if the requesting user is viewing their own profile
		const isOwnProfile = locals.user?.id === profileUser.id;
		
		// Build query conditions based on viewer
		const whereConditions = [eq(tours.userId, profileUser.id)];
		
		if (!isOwnProfile) {
			// Public visitors only see active, public tours
			whereConditions.push(eq(tours.status, 'active'));
			whereConditions.push(eq(tours.publicListing, true));
		}
		// If viewing own profile, show all tours (no status/publicListing filter)
		
		// Get user's tours
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
				status: tours.status,
				publicListing: tours.publicListing,
				categories: tours.categories,
				pricingModel: tours.pricingModel,
				createdAt: tours.createdAt
			})
		.from(tours)
		.where(and(...whereConditions))
		.orderBy(desc(tours.createdAt));
		
		// Get available time slots for the next 30 days for all tours
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 30);
		const now = new Date();
		
	// Build time slots query conditions
	const timeSlotsWhereConditions = [
		eq(tours.userId, profileUser.id),
		gte(timeSlots.startTime, now),
		eq(timeSlots.status, 'available')
	];
	
	if (!isOwnProfile) {
		// Public visitors only see time slots for active, public tours
		timeSlotsWhereConditions.push(eq(tours.status, 'active'));
		timeSlotsWhereConditions.push(eq(tours.publicListing, true));
	}
	
	const availableTimeSlots = await db
		.select({
			id: timeSlots.id,
			tourId: timeSlots.tourId,
			tourPricingModel: tours.pricingModel,
			startTime: timeSlots.startTime,
			endTime: timeSlots.endTime,
			availableSpots: timeSlots.availableSpots,
			bookedSpots: timeSlots.bookedSpots
		})
		.from(timeSlots)
		.innerJoin(tours, eq(timeSlots.tourId, tours.id))
		.where(and(...timeSlotsWhereConditions))
		.orderBy(timeSlots.startTime)
		.limit(50);
	
	// Group time slots by tour and filter available ones
	// For private tours: only show slots with no bookings (exclusive)
	// For regular tours: show slots with available capacity
	const tourTimeSlots = availableTimeSlots.reduce((acc, slot) => {
		if (!acc[slot.tourId]) {
			acc[slot.tourId] = [];
		}
		
		const isPrivateTour = slot.tourPricingModel === 'private_tour';
		const bookedSpots = slot.bookedSpots || 0;
		const availableSpots = slot.availableSpots || 0;
		
		// Private tours: only show if no bookings yet (exclusive)
		// Regular tours: show if capacity available
		const isAvailable = isPrivateTour 
			? bookedSpots === 0 
			: availableSpots > bookedSpots;
		
		if (isAvailable) {
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
			categories: tour.categories || [],
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