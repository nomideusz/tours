/**
 * Booking helper utilities for Drizzle/PostgreSQL data
 */

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
	attendanceStatus?: string;
	ticketQRCode?: string;
	checkedInAt?: string;
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
 * Validates and returns a consistent date value from booking data
 */
export function validateDate(booking: any): string {
	let dateValue: string;
	
	// Priority order for date selection
	if (booking.expand?.timeSlot?.startTime) {
		dateValue = booking.expand.timeSlot.startTime;
	} else if (booking.timeSlotStartTime) {
		dateValue = booking.timeSlotStartTime;
	} else if (booking.updated) {
		dateValue = booking.updated;
	} else if (booking.created) {
		dateValue = booking.created;
	} else {
		dateValue = new Date().toISOString(); // Fallback to current time
	}
	
	return dateValue;
}

/**
 * Processes a raw booking into a consistent structure
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
	
	// Sort by time and format
	return todayBookings
		.sort((a, b) => {
			const timeA = new Date(a.expand!.timeSlot!.startTime).getTime();
			const timeB = new Date(b.expand!.timeSlot!.startTime).getTime();
			return timeA - timeB;
		})
		.map(booking => ({
			tourName: booking.expand!.tour!.name,
			time: new Date(booking.expand!.timeSlot!.startTime).toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit'
			}),
			participants: booking.participants
		}));
}

/**
 * Calculates booking statistics from an array of bookings
 */
export function calculateBookingStats(bookings: ProcessedBooking[]) {
	const stats = {
		total: bookings.length,
		confirmed: 0,
		pending: 0,
		cancelled: 0,
		totalRevenue: 0,
		totalParticipants: 0
	};
	
	bookings.forEach(booking => {
		switch (booking.status) {
			case 'confirmed':
				stats.confirmed++;
				break;
			case 'pending':
				stats.pending++;
				break;
			case 'cancelled':
				stats.cancelled++;
				break;
		}
		
		if (booking.status === 'confirmed' && booking.paymentStatus === 'paid') {
			stats.totalRevenue += Number(booking.totalAmount) || 0;
		}
		
		stats.totalParticipants += booking.participants;
	});
	
	return stats;
} 