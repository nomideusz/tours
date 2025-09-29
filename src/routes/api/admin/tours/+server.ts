import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users, tours, bookings, timeSlots } from '$lib/db/schema/index.js';
import { sql, count, sum, eq, and, or, ilike, desc, asc, gte } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Parse query parameters
	const search = url.searchParams.get('search') || '';
	const status = url.searchParams.get('status') || 'all'; // all, active, draft
	const location = url.searchParams.get('location') || '';
	const category = url.searchParams.get('category') || '';
	const sortBy = url.searchParams.get('sortBy') || 'newest'; // newest, oldest, name, revenue, bookings
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '20');
	const offset = (page - 1) * limit;

	try {
		// Build where conditions
		const whereConditions = [];

		// Search across tour name, description, location, and user name
		if (search) {
			whereConditions.push(
				or(
					ilike(tours.name, `%${search}%`),
					ilike(tours.description, `%${search}%`),
					ilike(tours.location, `%${search}%`),
					ilike(users.name, `%${search}%`),
					ilike(users.email, `%${search}%`)
				)
			);
		}

		// Status filter
		if (status && status !== 'all') {
			whereConditions.push(eq(tours.status, status as 'active' | 'draft'));
		}

		// Location filter
		if (location) {
			whereConditions.push(ilike(tours.location, `%${location}%`));
		}

		// Category filter - check if category exists in the categories JSON array
		if (category) {
			whereConditions.push(sql`JSON_SEARCH(${tours.categories}, 'one', ${category}) IS NOT NULL`);
		}

		const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

		// Build order by clause
		let orderBy;
		switch (sortBy) {
			case 'oldest':
				orderBy = asc(tours.createdAt);
				break;
			case 'name':
				orderBy = asc(tours.name);
				break;
			case 'revenue':
				orderBy = desc(sql`COALESCE(tour_revenue.total_revenue, 0)`);
				break;
			case 'bookings':
				orderBy = desc(sql`COALESCE(tour_bookings.booking_count, 0)`);
				break;
			case 'newest':
			default:
				orderBy = desc(tours.createdAt);
				break;
		}

		// Main query with subqueries for stats
		const toursWithStats = await db
			.select({
				// Tour fields
				id: tours.id,
				name: tours.name,
				description: tours.description,
				price: tours.price,
				duration: tours.duration,
				capacity: tours.capacity,
				status: tours.status,
				categories: tours.categories,
				location: tours.location,
				qrCode: tours.qrCode,
				qrScans: tours.qrScans,
				qrConversions: tours.qrConversions,
				publicListing: tours.publicListing,
				createdAt: tours.createdAt,
				updatedAt: tours.updatedAt,
				// User fields
				userId: users.id,
				userName: users.name,
				userEmail: users.email,
				userRole: users.role,
				userCountry: users.country,
				userCurrency: users.currency,
				userCreatedAt: users.createdAt,
				// Stats from subqueries
				totalBookings: sql<number>`COALESCE(tour_bookings.booking_count, 0)`,
				totalRevenue: sql<number>`COALESCE(tour_revenue.total_revenue, 0)`,
				upcomingSlots: sql<number>`COALESCE(upcoming_slots.slot_count, 0)`,
			})
			.from(tours)
			.innerJoin(users, eq(tours.userId, users.id))
			// Subquery for booking count
			.leftJoin(
				sql`(
					SELECT 
						tour_id,
						COUNT(*) as booking_count
					FROM bookings 
					WHERE status = 'confirmed'
					GROUP BY tour_id
				) as tour_bookings`,
				sql`tour_bookings.tour_id = ${tours.id}`
			)
			// Subquery for revenue
			.leftJoin(
				sql`(
					SELECT 
						tour_id,
						COALESCE(SUM(total_amount), 0) as total_revenue
					FROM bookings 
					WHERE status = 'confirmed'
					GROUP BY tour_id
				) as tour_revenue`,
				sql`tour_revenue.tour_id = ${tours.id}`
			)
			// Subquery for upcoming slots
			.leftJoin(
				sql`(
					SELECT 
						tour_id,
						COUNT(*) as slot_count
					FROM time_slots 
					WHERE start_time > NOW() AND status = 'available'
					GROUP BY tour_id
				) as upcoming_slots`,
				sql`upcoming_slots.tour_id = ${tours.id}`
			)
			.where(whereClause)
			.orderBy(orderBy)
			.limit(limit)
			.offset(offset);

		// Get total count for pagination
		const totalCountResult = await db
			.select({ count: count() })
			.from(tours)
			.innerJoin(users, eq(tours.userId, users.id))
			.where(whereClause);

		const totalCount = totalCountResult[0]?.count || 0;
		const totalPages = Math.ceil(totalCount / limit);

		// Get filter options
		const [categoriesResult, locationsResult] = await Promise.all([
			// Get unique categories from JSON arrays
			db.select({ categories: tours.categories })
				.from(tours)
				.where(sql`${tours.categories} IS NOT NULL AND JSON_LENGTH(${tours.categories}) > 0`),
			
			// Get unique locations
			db.select({ location: tours.location })
				.from(tours)
				.where(sql`${tours.location} IS NOT NULL AND ${tours.location} != ''`)
				.groupBy(tours.location)
				.orderBy(tours.location)
		]);

		// Flatten all categories from all tours
		const allCategories = categoriesResult
			.flatMap(r => r.categories || [])
			.filter(Boolean);
		
		// Get unique categories and sort them
		const categories = Array.from(new Set(allCategories)).sort();
		const locations = locationsResult.map(r => r.location).filter(Boolean);

		return json({
			tours: toursWithStats.map(tour => ({
				id: tour.id,
				name: tour.name,
				description: tour.description,
				price: parseFloat(tour.price),
				duration: tour.duration,
				capacity: tour.capacity,
				status: tour.status,
				categories: tour.categories || [],
				location: tour.location,
				qrCode: tour.qrCode,
				qrScans: tour.qrScans || 0,
				qrConversions: tour.qrConversions || 0,
				publicListing: tour.publicListing,
				createdAt: tour.createdAt,
				updatedAt: tour.updatedAt,
				user: {
					id: tour.userId,
					name: tour.userName,
					email: tour.userEmail,
					role: tour.userRole,
					country: tour.userCountry,
					currency: tour.userCurrency,
					createdAt: tour.userCreatedAt,
				},
				stats: {
					totalBookings: Number(tour.totalBookings || 0),
					totalRevenue: Number(tour.totalRevenue || 0),
					upcomingSlots: Number(tour.upcomingSlots || 0),
				}
			})),
			pagination: {
				page,
				limit,
				total: totalCount,
				totalPages
			},
			filters: {
				categories,
				locations
			}
		});

	} catch (error) {
		console.error('Admin tours fetch error:', error);
		return json({ error: 'Failed to fetch tours' }, { status: 500 });
	}
}; 