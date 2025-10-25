import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours, users, timeSlots } from '$lib/db/schema/index.js';
import { eq, and, gte, sql, desc } from 'drizzle-orm';

/**
 * Featured Tours API - Shows demo tour + Beta 1 tours
 * 
 * IMPORTANT: After creating the demo tour in production, update the DEMO_TOUR_ID below
 * You can find the tour ID by running:
 * SELECT id FROM tours WHERE name = 'Historic Berlin Walking Tour' LIMIT 1;
 * 
 * Or set it to null if you don't want to feature a specific demo tour.
 */
const DEMO_TOUR_ID = 'LxWtfg3iqy1o2RqAe1ig'; // TODO: Set this to your demo tour ID after creation

export const GET: RequestHandler = async () => {
	try {
		// Get current date for time slot filtering
		const now = new Date();
		
		// STEP 1: Always get the demo tour first (if configured)
		const demoTour = DEMO_TOUR_ID ? await db
			.select({
				// Tour fields
				id: tours.id,
				name: tours.name,
				description: tours.description,
				price: tours.price,
				duration: tours.duration,
				capacity: tours.capacity,
				minCapacity: tours.minCapacity,
				maxCapacity: tours.maxCapacity,
				location: tours.location,
				images: tours.images,
				categories: tours.categories,
				qrCode: tours.qrCode,
				createdAt: tours.createdAt,
				// Pricing configuration
				pricingModel: tours.pricingModel,
				enablePricingTiers: tours.enablePricingTiers,
				pricingTiers: tours.pricingTiers,
				groupPricingTiers: tours.groupPricingTiers,
				optionalAddons: tours.optionalAddons,
				participantCategories: tours.participantCategories,
				privateTour: tours.privateTour,
				groupDiscounts: tours.groupDiscounts,
				guidePaysStripeFee: tours.guidePaysStripeFee,
				countInfantsTowardCapacity: tours.countInfantsTowardCapacity,
				qrConversions: tours.qrConversions,
				
				// User fields
				userId: tours.userId,
				operatorName: users.name,
				operatorUsername: users.username,
				operatorCurrency: users.currency,
				operatorAvatar: users.avatar,
				betaGroup: users.betaGroup
			})
			.from(tours)
			.leftJoin(users, eq(tours.userId, users.id))
			.where(
				and(
					eq(tours.id, DEMO_TOUR_ID),
					eq(tours.status, 'active'),
					eq(tours.publicListing, true)
				)
			)
			.limit(1) : [];
		
		// STEP 2: Get Beta 1 tours with quality criteria
		const beta1Tours = await db
			.select({
				// Tour fields
				id: tours.id,
				name: tours.name,
				description: tours.description,
				price: tours.price,
				duration: tours.duration,
				capacity: tours.capacity,
				minCapacity: tours.minCapacity,
				maxCapacity: tours.maxCapacity,
				location: tours.location,
				images: tours.images,
				categories: tours.categories,
				qrCode: tours.qrCode,
				createdAt: tours.createdAt,
				// Pricing configuration
				pricingModel: tours.pricingModel,
				enablePricingTiers: tours.enablePricingTiers,
				pricingTiers: tours.pricingTiers,
				groupPricingTiers: tours.groupPricingTiers,
				optionalAddons: tours.optionalAddons,
				participantCategories: tours.participantCategories,
				privateTour: tours.privateTour,
				groupDiscounts: tours.groupDiscounts,
				guidePaysStripeFee: tours.guidePaysStripeFee,
				countInfantsTowardCapacity: tours.countInfantsTowardCapacity,
				qrConversions: tours.qrConversions,
				
				// User fields
				userId: tours.userId,
				operatorName: users.name,
				operatorUsername: users.username,
				operatorCurrency: users.currency,
				operatorAvatar: users.avatar,
				betaGroup: users.betaGroup
			})
			.from(tours)
			.leftJoin(users, eq(tours.userId, users.id))
			.where(
				and(
					eq(tours.status, 'active'),
					eq(tours.publicListing, true),
					eq(users.betaGroup, 'beta_1'),
					// Must have at least one image
					sql`jsonb_array_length(${tours.images}::jsonb) > 0`
				)
			)
			.orderBy(
				desc(tours.qrConversions), // Most popular first
				desc(tours.createdAt) // Then newest
			)
			.limit(10); // Get more to filter for time slots
		
		// STEP 3: Filter Beta 1 tours to only include those with upcoming time slots
		const beta1ToursWithSlots = [];
		
		for (const tour of beta1Tours) {
			// Check if tour has any upcoming time slots
			const upcomingSlots = await db
				.select({ id: timeSlots.id })
				.from(timeSlots)
				.where(
					and(
						eq(timeSlots.tourId, tour.id),
						gte(timeSlots.startTime, now),
						eq(timeSlots.status, 'available')
					)
				)
				.limit(1);
			
			if (upcomingSlots.length > 0) {
				beta1ToursWithSlots.push(tour);
			}
			
			// Stop once we have 5 Beta 1 tours with time slots
			if (beta1ToursWithSlots.length >= 5) {
				break;
			}
		}
		
		// STEP 4: Combine demo tour + Beta 1 tours
		const featuredTours = [
			...(demoTour.length > 0 ? demoTour : []),
			...beta1ToursWithSlots
		];
		
		// If we don't have enough Beta 1 tours, check if demo tour has slots
		if (featuredTours.length === 0 && demoTour.length > 0) {
			// Just include the demo tour anyway
			featuredTours.push(...demoTour);
		}
		
		// STEP 5: Format response
		return json({
			tours: featuredTours.map(tour => ({
				id: tour.id,
				name: tour.name,
				description: tour.description,
				price: tour.price,
				duration: tour.duration,
				capacity: tour.capacity,
				minCapacity: tour.minCapacity,
				maxCapacity: tour.maxCapacity,
				location: tour.location,
				images: tour.images || [],
				categories: tour.categories || [],
				qrCode: tour.qrCode,
				createdAt: tour.createdAt?.toISOString(),
				// Pricing
				pricingModel: tour.pricingModel,
				enablePricingTiers: tour.enablePricingTiers,
				pricingTiers: tour.pricingTiers,
				groupPricingTiers: tour.groupPricingTiers,
				optionalAddons: tour.optionalAddons,
				participantCategories: tour.participantCategories,
				privateTour: tour.privateTour,
				groupDiscounts: tour.groupDiscounts,
				guidePaysStripeFee: tour.guidePaysStripeFee,
				countInfantsTowardCapacity: tour.countInfantsTowardCapacity,
				qrConversions: tour.qrConversions || 0,
				// Operator info
				operator: {
					name: tour.operatorName,
					username: tour.operatorUsername,
					currency: tour.operatorCurrency,
					avatar: tour.operatorAvatar,
					betaGroup: tour.betaGroup
				}
			})),
			count: featuredTours.length,
			meta: {
				demoTourIncluded: demoTour.length > 0,
				beta1ToursCount: beta1ToursWithSlots.length
			}
		});
		
	} catch (error) {
		console.error('Error fetching featured tours:', error);
		return json({
			tours: [],
			count: 0,
			error: 'Failed to fetch featured tours'
		}, { status: 500 });
	}
};

