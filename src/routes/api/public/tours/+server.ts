import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { tours, users, timeSlots } from '$lib/db/schema/index.js';
import { eq, and, gte, ilike, or, sql, desc, asc, inArray } from 'drizzle-orm';
import { getLocationGroups, matchesLocationGroup } from '$lib/utils/location-grouping.js';

export const GET: RequestHandler = async ({ url }) => {
	try {
		console.log('Public tours API called');
		
		// Get query parameters
		const search = url.searchParams.get('search') || '';
		const location = url.searchParams.get('location') || '';
		const category = url.searchParams.get('category') || '';
		const minPrice = url.searchParams.get('minPrice');
		const maxPrice = url.searchParams.get('maxPrice');
		const sortBy = url.searchParams.get('sortBy') || 'newest'; // newest, oldest, priceAsc, priceDesc, popular
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '12');
		const offset = (page - 1) * limit;

		console.log('Query params:', { search, location, category, sortBy, page, limit });

		// Build where conditions
		const conditions: any[] = [
			eq(tours.status, 'active')
		];
		
		// TODO: Add back when TypeScript issue is resolved
		// eq(tours.publicListing, true),

		// Search filter (searches in name, description, location)
		if (search) {
			conditions.push(
				or(
					ilike(tours.name, `%${search}%`),
					ilike(tours.description, `%${search}%`),
					ilike(tours.location, `%${search}%`)
				)!
			);
		}

		// Location filter will be handled after fetching tours
		// to support location grouping

		// Category filter - check if category exists in the categories JSON array
		if (category) {
			conditions.push(sql`${tours.categories}::jsonb ? ${category}`);
		}

		// Price range filters
		if (minPrice) {
			conditions.push(gte(tours.price, minPrice));
		}
		if (maxPrice) {
			conditions.push(sql`${tours.price} <= ${maxPrice}`);
		}

		// Build order by clause
		let orderByClause;
		switch (sortBy) {
			case 'oldest':
				orderByClause = asc(tours.createdAt);
				break;
			case 'priceAsc':
				orderByClause = asc(tours.price);
				break;
			case 'priceDesc':
				orderByClause = desc(tours.price);
				break;
			case 'popular':
				orderByClause = desc(tours.qrConversions);
				break;
			case 'newest':
			default:
				orderByClause = desc(tours.createdAt);
				break;
		}

		// Get total count for pagination will be calculated after location filtering

		// Get tours with user information (without location filter applied yet)
		const allPublicTours = await db
			.select({
				// Tour fields
				id: tours.id,
				name: tours.name,
				description: tours.description,
				price: tours.price,
				duration: tours.duration,
				capacity: tours.capacity,
				location: tours.location,
				images: tours.images,
				categories: tours.categories,
				qrCode: tours.qrCode,
				createdAt: tours.createdAt,
				
				// User fields for tour operator info
				userId: tours.userId,
				operatorName: users.name,
				operatorUsername: users.username,
				operatorCurrency: users.currency,
				operatorAvatar: users.avatar
			})
			.from(tours)
			.leftJoin(users, eq(tours.userId, users.id))
			.where(and(...conditions))
			.orderBy(orderByClause);

		// Apply location group filtering
		const locationFilteredTours = location 
			? allPublicTours.filter(tour => matchesLocationGroup(tour.location || '', location))
			: allPublicTours;

		// Calculate total count after filtering
		const totalCount = locationFilteredTours.length;

		// Apply pagination after location filtering
		const publicTours = locationFilteredTours.slice(offset, offset + limit);

		// Get upcoming availability for each tour
		const tourIds = publicTours.map(tour => tour.id);
		const now = new Date();
		
		// Get next available slot for each tour
		let availabilityData: any[] = [];
		if (tourIds.length > 0) {
			availabilityData = await db
				.select({
					tourId: timeSlots.tourId,
					nextSlot: sql<string>`min(${timeSlots.startTime})`.as('nextSlot'),
					availableSlots: sql<number>`count(*)`.as('availableSlots')
				})
				.from(timeSlots)
				.where(and(
					inArray(timeSlots.tourId, tourIds),
					eq(timeSlots.status, 'available'),
					gte(timeSlots.startTime, now),
					sql`${timeSlots.availableSpots} > ${timeSlots.bookedSpots}`
				))
				.groupBy(timeSlots.tourId);
		}

		// Create availability map
		const availabilityMap = new Map(
			availabilityData.map(item => [
				item.tourId, 
				{ 
					nextSlot: item.nextSlot,
					availableSlots: Number(item.availableSlots)
				}
			])
		);

		// Format response
		const formattedTours = publicTours.map(tour => ({
			id: tour.id,
			name: tour.name,
			description: tour.description,
			price: tour.price,
			duration: tour.duration,
			capacity: tour.capacity,
			location: tour.location,
			images: tour.images || [],
			categories: tour.categories || [],
			qrCode: tour.qrCode,
			operator: {
				id: tour.userId,
				name: tour.operatorName,
				username: tour.operatorUsername,
				currency: tour.operatorCurrency,
				avatar: tour.operatorAvatar
			},
			availability: availabilityMap.get(tour.id) || { nextSlot: null, availableSlots: 0 },
			createdAt: tour.createdAt.toISOString()
		}));

		// Get unique categories for filters - extract from JSON arrays
		const categoriesResult = await db
			.select({ categories: tours.categories })
			.from(tours)
			.where(and(
				eq(tours.status, 'active'),
				sql`${tours.categories} IS NOT NULL AND jsonb_array_length(${tours.categories}::jsonb) > 0`
			));
		
		// Flatten all categories from all tours
		const allCategories = categoriesResult
			.flatMap(r => r.categories || [])
			.filter(Boolean);
		
		// Get unique categories and sort them
		const categories = Array.from(new Set(allCategories)).sort();

		// Get unique locations for filters and group them
		const locationsResult = await db
			.selectDistinct({ location: tours.location })
			.from(tours)
			.where(and(
				eq(tours.status, 'active'),
				sql`${tours.location} IS NOT NULL`
			));
		
		const rawLocations = locationsResult
			.map(r => r.location)
			.filter((location): location is string => Boolean(location));
			
		// Group locations into manageable categories
		const locations = getLocationGroups(rawLocations);

		return json({
			tours: formattedTours,
			pagination: {
				total: totalCount,
				page,
				limit,
				totalPages: Math.ceil(totalCount / limit)
			},
			filters: {
				categories,
				locations
			}
		});

	} catch (err) {
		console.error('Error fetching public tours:', err);
		console.error('Error details:', {
			message: err instanceof Error ? err.message : 'Unknown error',
			stack: err instanceof Error ? err.stack : undefined
		});
		return json({ error: 'Failed to load tours' }, { status: 500 });
	}
}; 