// Shared utilities for booking data processing

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
	
	const fields = additionalFields ? `${BOOKING_FIELDS},${additionalFields}` : BOOKING_FIELDS;
	
	const query: any = {
		filter: tourIds.map(id => `tour = "${id}"`).join(' || '),
		expand: 'tour,timeSlot',
		sort,
		fields
	};
	
	if (limit) {
		query.perPage = limit;
	}
	
	const allBookings = await pb.collection('bookings').getFullList(query);
	
	// Debug: Log sample booking data
	if (allBookings.length > 0) {
		console.log('Sample booking data:', {
			id: allBookings[0].id,
			created: allBookings[0].created,
			hasTimeSlot: !!allBookings[0].expand?.timeSlot,
			timeSlotStartTime: allBookings[0].expand?.timeSlot?.startTime,
			tourName: allBookings[0].expand?.tour?.name
		});
	}
	
	// Process all bookings for consistent structure
	return allBookings.map(processBooking);
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