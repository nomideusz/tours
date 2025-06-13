/**
 * Re-exports from split modules for backward compatibility
 * 
 * This file has been split into:
 * - booking-types.ts: Type definitions
 * - stats-helpers.ts: Stats calculation functions
 * - booking-helpers.ts: Booking data functions
 */

// Re-export all types
export type { 
	SharedStats, 
	DashboardStats, 
	ToursStats, 
	ProcessedBooking 
} from './booking-types.js';

// Re-export stats functions
export { 
	getSharedStats, 
	getDashboardSpecificStats, 
	getToursSpecificStats 
} from './stats-helpers.js';

// Re-export booking functions
export { 
	getRecentBookings, 
	getTourBookingData, 
	getTourAllBookings, 
	getBookingDetails,
	formatRecentBooking,
	createTodaysSchedule 
} from './booking-helpers.js'; 