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
		
		// STEP 2: Get high-quality tours for featuring
		// Priority: Beta 1 tours, then any tour with Beta 2 discount, then any quality tour
		const qualityTours = await db
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
				betaGroup: users.betaGroup,
				subscriptionDiscountPercentage: users.subscriptionDiscountPercentage,
				isLifetimeDiscount: users.isLifetimeDiscount
			})
			.from(tours)
			.leftJoin(users, eq(tours.userId, users.id))
			.where(
				and(
					eq(tours.status, 'active'),
					eq(tours.publicListing, true),
					// Must have at least one image
					sql`jsonb_array_length(${tours.images}::jsonb) > 0`,
					// Exclude the demo tour (we already have it)
					DEMO_TOUR_ID ? sql`${tours.id} != ${DEMO_TOUR_ID}` : sql`true`
				)
			)
			.orderBy(
				// Prioritize Beta 1 users (30% lifetime discount)
				desc(sql`CASE WHEN ${users.betaGroup} = 'beta_1' OR (${users.subscriptionDiscountPercentage} = 30 AND ${users.isLifetimeDiscount} = true) THEN 1 ELSE 0 END`),
				desc(tours.qrConversions), // Most popular first
				desc(tours.createdAt) // Then newest
			)
			.limit(10); // Get more to filter for time slots
		
		// STEP 3: Filter quality tours to only include those with upcoming time slots
		const toursWithSlots = [];
		
		for (const tour of qualityTours) {
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
				toursWithSlots.push(tour);
			}
			
			// Stop once we have 5 tours with time slots
			if (toursWithSlots.length >= 5) {
				break;
			}
		}
		
		// STEP 4: Combine demo tour + featured tours
		const featuredTours = [
			...(demoTour.length > 0 ? demoTour : []),
			...toursWithSlots
		];
		
		// Count Beta 1 tours specifically
		const beta1Count = toursWithSlots.filter(t => 
			t.betaGroup === 'beta_1' || 
			(t.subscriptionDiscountPercentage === 30 && t.isLifetimeDiscount === true)
		).length;
		
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
				beta1ToursCount: beta1Count
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

