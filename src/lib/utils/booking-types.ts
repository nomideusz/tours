/**
 * Shared type definitions for stats and bookings
 */

export interface SharedStats {
	totalTours: number;
	activeTours: number;
	monthlyTours: number;
}

export interface DashboardStats extends SharedStats {
	todayBookings: number;
	weeklyRevenue: number;
	upcomingTours: number;
	totalCustomers: number;
}

export interface ToursStats extends SharedStats {
	draftTours: number;
	totalRevenue: number;
	todayBookings: number;
	weekBookings: number;
	monthRevenue: number;
	totalBookings: number;
	confirmedBookings: number;
	totalParticipants: number;
}

// Define the ProcessedBooking interface here (moved from booking-helpers.js)
export interface ProcessedBooking {
	id: string;
	customerName: string;
	customerEmail: string;
	participants: number;
	status: string;
	paymentStatus?: string;
	created: string;
	updated: string;
	tour: string;
	totalAmount: number;
	bookingReference?: string;
	ticketQRCode?: string | null;
	attendanceStatus?: string | null;
	effectiveDate: string;
	expand?: {
		tour?: {
			id?: string;
			name?: string;
			[key: string]: any;
		};
		timeSlot?: {
			id?: string;
			startTime?: string | null;
			endTime?: string | null;
			[key: string]: any;
		};
	};
} 