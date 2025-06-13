/**
 * Tour helpers re-export
 * 
 * This file re-exports from both client and server tour helpers for backward compatibility.
 * 
 * IMPORTANT: 
 * - For client-side code (Svelte components), import from 'tour-helpers-client.js' directly
 * - For server-side code (+page.server.ts, +server.ts), import from 'tour-helpers-server.js' directly
 * - This file should only be used for backward compatibility
 */

// Client-side exports
export {
	// Formatting functions
	formatDuration,
	formatTourPrice,
	
	// UI helper functions
	getTourStatusColor,
	getTourStatusDot,
	getBookingStatusColor,
	getSlotStatusColor,
	
	// Image utilities
	getTourImageUrl,
	getImageUrl,
	
	// Calculation utilities
	calculateConversionRate,
	getCapacityUtilization,
	isTourBookable,
	
	// Client-side API functions
	toggleTourStatus
} from './tour-helpers-client.js';

// Server-side exports
export {
	// Database functions
	loadTourWithOwnership,
	getMaxBookedSpots,
	getBookingConstraints,
	validateCapacityChange,
	updateTimeSlotsCapacity,
	getUpcomingTimeSlots,
	getTimeSlotStats
} from './tour-helpers-server.js'; 