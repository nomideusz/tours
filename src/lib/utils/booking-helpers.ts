// Shared utilities for booking data processing

import { getQueryConfig } from './query-config.js';

export interface ProcessedBooking {
	id: string;
	customerName: string;
	customerEmail: string;
	customerPhone?: string;
	participants: number;
	status: string;
	created: string;
	updated: string;
	tour: string;
	timeSlot?: string;
	totalAmount: number;
	paymentStatus?: string;
	bookingReference?: string;
	specialRequests?: string;
	effectiveDate: string; // Validated date for consistent access
	expand?: {
		tour?: {
			id: string;
			name: string;
			description?: string;
			location?: string;
			price?: number;
			[key: string]: any;
		};
		timeSlot?: {
			id: string;
			startTime: string;
			endTime: string;
			[key: string]: any;
		};
	};
}

/**
 * Validates and normalizes a date value with fallbacks
 */
export function validateDate(booking: any): string {
	let dateValue: string;
	
	if (booking.expand?.timeSlot?.startTime) {
		dateValue = booking.expand.timeSlot.startTime;
	} else if (booking.created) {
		dateValue = booking.created;
	} else if (booking.updated) {
		dateValue = booking.updated;
	} else {
		dateValue = new Date().toISOString();
	}
	
	// Validate the date
	const testDate = new Date(dateValue);
	if (isNaN(testDate.getTime())) {
		console.warn('Invalid date found for booking:', {
			bookingId: booking.id,
			dateValue,
			timeSlotData: booking.expand?.timeSlot,
			created: booking.created,
			updated: booking.updated
		});
		dateValue = new Date().toISOString(); // Fallback to current time
	}
	
	return dateValue;
}

/**
 * Processes a raw booking from PocketBase into a consistent structure
 */
export function processBooking(booking: any): ProcessedBooking {
	return {
		...booking,
		// Add consistent date field for easier access
		effectiveDate: validateDate(booking),
		// Ensure numeric fields are properly typed
		totalAmount: booking.totalAmount || 0,
		participants: booking.participants || 1
	};
}

/**
 * Standard fields for booking queries
 */
export const BOOKING_FIELDS = 'id,customerName,customerEmail,customerPhone,participants,status,created,updated,tour,timeSlot,totalAmount,paymentStatus,bookingReference,specialRequests,expand.tour.name,expand.tour.description,expand.tour.location,expand.tour.price,expand.timeSlot.startTime,expand.timeSlot.endTime';

/**
 * Fetches bookings for given tour IDs with standard processing
 * Implements pagination and reduced query complexity to avoid timeouts
 */
export async function fetchBookingsForTours(pb: any, tourIds: string[], options: { 
	sort?: string;
	limit?: number;
	additionalFields?: string;
} = {}): Promise<ProcessedBooking[]> {
	if (tourIds.length === 0) {
		return [];
	}
	
	const {
		sort = '-created',
		limit,
		additionalFields = ''
	} = options;
	
	// Get query configuration based on environment
	const config = getQueryConfig();
	
	// Use minimal fields for initial fetch to reduce query complexity
	const minimalFields = 'id,customerName,customerEmail,participants,status,created,tour,timeSlot,totalAmount,paymentStatus';
	
	// Use environment-specific page size
	const PAGE_SIZE = config.maxPageSize;
	const MAX_PAGES = limit ? Math.ceil(limit / PAGE_SIZE) : Math.ceil(config.maxTotalRecords / PAGE_SIZE);
	
	const allBookings: any[] = [];
	
	console.log(`Fetching bookings for ${tourIds.length} tours using pagination`);
	
	try {
		// First approach: Try to get all bookings with a single filter
		// but with pagination and minimal fields
		const filter = tourIds.map(id => `tour = "${id}"`).join(' || ');
		
		let page = 1;
		let hasMore = true;
		
		while (hasMore && page <= MAX_PAGES && (!limit || allBookings.length < limit)) {
			try {
				const response = await pb.collection('bookings').getList(page, PAGE_SIZE, {
					filter,
					sort,
					fields: minimalFields,
					skipTotal: true // Skip counting total records for performance
				});
				
				allBookings.push(...response.items);
				hasMore = response.items.length === PAGE_SIZE;
				page++;
				
				console.log(`Page ${page - 1}: fetched ${response.items.length} bookings (total: ${allBookings.length})`);
			} catch (pageError) {
				console.error(`Error fetching page ${page}:`, pageError);
				hasMore = false; // Stop pagination on error
			}
		}
		
		// If we got some results, expand the necessary relations for the fetched bookings
		if (allBookings.length > 0) {
			// Batch expand the relations to avoid large queries
			const bookingIds = allBookings.slice(0, limit || allBookings.length).map(b => b.id);
			const expandedBookings = await batchExpandBookings(pb, bookingIds, BOOKING_FIELDS);
			
			// Map expanded data back to our bookings
			const expandedMap = new Map(expandedBookings.map(b => [b.id, b]));
			const finalBookings = bookingIds
				.map(id => expandedMap.get(id))
				.filter(Boolean);
			
			return finalBookings.map(processBooking);
		}
		
	} catch (error) {
		console.error('Error with paginated approach, falling back to tour-by-tour:', error);
		
		// Fallback: Fetch bookings tour by tour with very small limits
		for (const tourId of tourIds) {
			if (limit && allBookings.length >= limit) break;
			
			try {
				const tourBookings = await pb.collection('bookings').getList(1, 20, {
					filter: `tour = "${tourId}"`,
					sort,
					expand: 'tour,timeSlot',
					fields: BOOKING_FIELDS
				});
				
				allBookings.push(...tourBookings.items);
				console.log(`Tour ${tourId}: fetched ${tourBookings.items.length} bookings`);
			} catch (tourError) {
				console.error(`Error fetching bookings for tour ${tourId}:`, tourError);
				// Continue with other tours
			}
		}
		
		// Apply final limit and sort
		if (sort && allBookings.length > 0) {
			const field = sort.startsWith('-') ? sort.slice(1) : sort;
			const order = sort.startsWith('-') ? -1 : 1;
			allBookings.sort((a, b) => order * (a[field] > b[field] ? 1 : -1));
		}
		
		const finalBookings = limit ? allBookings.slice(0, limit) : allBookings;
		return finalBookings.map(processBooking);
	}
	
	return [];
}

/**
 * Batch expand bookings with full fields to avoid large queries
 */
async function batchExpandBookings(pb: any, bookingIds: string[], fields: string): Promise<any[]> {
	const config = getQueryConfig();
	const BATCH_SIZE = config.batchSize;
	const results: any[] = [];
	
	for (let i = 0; i < bookingIds.length; i += BATCH_SIZE) {
		const batchIds = bookingIds.slice(i, i + BATCH_SIZE);
		
		try {
			const filter = batchIds.map(id => `id = "${id}"`).join(' || ');
			const expandedBatch = await pb.collection('bookings').getFullList({
				filter,
				expand: 'tour,timeSlot',
				fields
			});
			
			results.push(...expandedBatch);
		} catch (error) {
			console.error(`Error expanding batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
		}
	}
	
	return results;
}

/**
 * Formats booking data for dashboard recent bookings
 */
export function formatRecentBooking(booking: ProcessedBooking) {
	return {
		id: booking.id,
		customerName: booking.customerName,
		tourName: booking.expand?.tour?.name || 'Unknown Tour',
		date: booking.effectiveDate,
		participants: booking.participants,
		amount: booking.totalAmount,
		status: booking.status
	};
}

/**
 * Creates today's schedule from bookings
 */
export function createTodaysSchedule(bookings: ProcessedBooking[]): Array<{
	tourName: string;
	time: string;
	participants: number;
}> {
	const today = new Date();
	const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
	
	// Filter today's confirmed bookings
	const todayBookings = bookings.filter(booking => {
		if (!booking.expand?.timeSlot?.startTime) return false;
		const bookingDate = new Date(booking.expand.timeSlot.startTime);
		return bookingDate >= todayStart && bookingDate < todayEnd && booking.status === 'confirmed';
	});
	
	// Group by tour and time
	const scheduleMap = new Map();
	todayBookings.forEach(booking => {
		const startTime = booking.expand?.timeSlot?.startTime;
		if (!startTime) return; // Skip bookings without valid time slots
		
		const key = `${booking.expand?.tour?.name}-${startTime}`;
		if (!scheduleMap.has(key)) {
			// Extract just the time part from the datetime
			const timeOnly = new Date(startTime).toTimeString().substring(0, 5); // HH:MM format
			scheduleMap.set(key, {
				tourName: booking.expand?.tour?.name || 'Unknown Tour',
				time: timeOnly,
				participants: 0
			});
		}
		scheduleMap.get(key).participants += booking.participants;
	});
	
	return Array.from(scheduleMap.values())
		.sort((a, b) => a.time.localeCompare(b.time));
} 