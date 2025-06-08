import { db } from '$lib/db/connection.js';
import { tours, bookings, timeSlots } from '$lib/db/schema/index.js';
import { eq, and, desc, gte, count } from 'drizzle-orm';

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

// Import the shared ProcessedBooking interface
import { type ProcessedBooking } from '$lib/utils/booking-helpers.js';

/**
 * Get shared stats that are used across multiple pages
 * This is cached-friendly and TanStack Query compatible
 */
export async function getSharedStats(userId: string): Promise<SharedStats> {
	try {
		// Fetch user's tours
		const userTours = await db.select({
			id: tours.id,
			name: tours.name,
			status: tours.status,
			createdAt: tours.createdAt
		})
		.from(tours)
		.where(eq(tours.userId, userId))
		.limit(100); // Reasonable limit for shared stats
		
		// Calculate shared stats
		const totalTours = userTours.length;
		const activeTours = userTours.filter(t => t.status === 'active').length;
		
		// Tours created this month
		const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
		const monthlyTours = userTours.filter(tour => {
			const tourDate = new Date(tour.createdAt);
			return tourDate >= monthStart;
		}).length;
		
		return {
			totalTours,
			activeTours,
			monthlyTours
		};
	} catch (error) {
		console.error('Error fetching shared stats:', error);
		return {
			totalTours: 0,
			activeTours: 0,
			monthlyTours: 0
		};
	}
}

/**
 * Get dashboard-specific stats that extend shared stats
 * This is designed to be compatible with future TanStack Query implementation
 */
export async function getDashboardSpecificStats(userId: string, sharedStats: SharedStats): Promise<DashboardStats> {
	try {
		// Get tour IDs for this user
		const userTours = await db.select({ id: tours.id })
			.from(tours)
			.where(eq(tours.userId, userId))
			.limit(100);
		
		const tourIds = userTours.map(t => t.id);
		
		if (tourIds.length === 0) {
			return {
				...sharedStats,
				todayBookings: 0,
				weeklyRevenue: 0,
				upcomingTours: 0,
				totalCustomers: 0
			};
		}
		
		// Fetch recent bookings for stats calculation
		const recentBookingsData = await db.select({
			id: bookings.id,
			customerName: bookings.customerName,
			customerEmail: bookings.customerEmail,
			participants: bookings.participants,
			status: bookings.status,
			createdAt: bookings.createdAt,
			totalAmount: bookings.totalAmount,
			paymentStatus: bookings.paymentStatus,
			tourName: tours.name,
			timeSlotStartTime: timeSlots.startTime
		})
		.from(bookings)
		.innerJoin(tours, eq(bookings.tourId, tours.id))
		.innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
		.where(eq(tours.userId, userId))
		.orderBy(desc(bookings.createdAt))
		.limit(50); // Reasonable limit for stats calculation
		
		// Calculate dashboard-specific stats
		const today = new Date();
		const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
		
		const todayBookings = recentBookingsData.filter(b => {
			const created = new Date(b.createdAt);
			return created >= todayStart;
		}).length;
		
		const weeklyRevenue = recentBookingsData
			.filter(b => {
				const created = new Date(b.createdAt);
				return created >= weekAgo && b.status === 'confirmed' && b.paymentStatus === 'paid';
			})
			.reduce((sum, b) => {
				const amount = typeof b.totalAmount === 'string' ? parseFloat(b.totalAmount) : (b.totalAmount || 0);
				return sum + amount;
			}, 0);
		
		const upcomingTours = recentBookingsData.filter(b => b.status === 'confirmed').length;
		const totalCustomers = recentBookingsData.reduce((sum, b) => sum + (b.participants || 0), 0);
		
		return {
			...sharedStats,
			todayBookings,
			weeklyRevenue,
			upcomingTours,
			totalCustomers
		};
	} catch (error) {
		console.error('Error fetching dashboard-specific stats:', error);
		return {
			...sharedStats,
			todayBookings: 0,
			weeklyRevenue: 0,
			upcomingTours: 0,
			totalCustomers: 0
		};
	}
}

/**
 * Get tours-specific stats that extend shared stats
 * This is designed to be compatible with future TanStack Query implementation
 */
export async function getToursSpecificStats(userId: string, sharedStats: SharedStats): Promise<ToursStats> {
	try {
		// Get user's tours with status info
		const userTours = await db.select({
			id: tours.id,
			status: tours.status
		})
		.from(tours)
		.where(eq(tours.userId, userId))
		.limit(100);
		
		const draftTours = userTours.filter(t => t.status === 'draft').length;
		
		const tourIds = userTours.map(t => t.id);
		
		if (tourIds.length === 0) {
			return {
				...sharedStats,
				draftTours,
				totalRevenue: 0,
				todayBookings: 0,
				weekBookings: 0,
				monthRevenue: 0,
				totalBookings: 0,
				confirmedBookings: 0,
				totalParticipants: 0
			};
		}
		
		// Fetch booking stats (limited for performance)
		const recentBookingsData = await db.select({
			id: bookings.id,
			status: bookings.status,
			createdAt: bookings.createdAt,
			totalAmount: bookings.totalAmount,
			paymentStatus: bookings.paymentStatus,
			participants: bookings.participants
		})
		.from(bookings)
		.innerJoin(tours, eq(bookings.tourId, tours.id))
		.where(eq(tours.userId, userId))
		.orderBy(desc(bookings.createdAt))
		.limit(100); // Limit for performance
		
		// Calculate time periods
		const today = new Date();
		const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
		const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
		
		// Calculate stats
		let totalRevenue = 0;
		let todayBookings = 0;
		let weekBookings = 0;
		let monthRevenue = 0;
		let totalBookings = recentBookingsData.length;
		let confirmedBookings = 0;
		let totalParticipants = 0;
		
		for (const booking of recentBookingsData) {
			const bookingDate = new Date(booking.createdAt);
			const amount = typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) : (booking.totalAmount || 0);
			
			if (booking.status === 'confirmed' && booking.paymentStatus === 'paid') {
				confirmedBookings++;
				totalRevenue += amount;
				totalParticipants += booking.participants || 0;
			}
			
			if (bookingDate >= todayStart) {
				if (booking.status === 'confirmed' || booking.status === 'pending') {
					todayBookings++;
				}
			}
			
			if (bookingDate >= weekAgo) {
				if (booking.status === 'confirmed' || booking.status === 'pending') {
					weekBookings++;
				}
			}
			
			if (bookingDate >= monthAgo && booking.status === 'confirmed' && booking.paymentStatus === 'paid') {
				monthRevenue += amount;
			}
		}
		
		// Apply estimation factor if we hit the limit (indicating there might be more data)
		const estimationFactor = recentBookingsData.length >= 100 ? 1.3 : 1;
		
		return {
			...sharedStats,
			draftTours,
			totalRevenue: totalRevenue * estimationFactor,
			todayBookings, // Don't estimate time-based stats
			weekBookings,
			monthRevenue,
			totalBookings: Math.round(totalBookings * estimationFactor),
			confirmedBookings: Math.round(confirmedBookings * estimationFactor),
			totalParticipants: Math.round(totalParticipants * estimationFactor)
		};
	} catch (error) {
		console.error('Error fetching tours-specific stats:', error);
		return {
			...sharedStats,
			draftTours: 0,
			totalRevenue: 0,
			todayBookings: 0,
			weekBookings: 0,
			monthRevenue: 0,
			totalBookings: 0,
			confirmedBookings: 0,
			totalParticipants: 0
		};
	}
}

/**
 * Get recent bookings for dashboard display
 * This is designed to be compatible with future TanStack Query implementation
 */
export async function getRecentBookings(userId: string, limit: number = 10): Promise<ProcessedBooking[]> {
	try {
		const recentBookingsData = await db.select({
			id: bookings.id,
			customerName: bookings.customerName,
			customerEmail: bookings.customerEmail,
			participants: bookings.participants,
			status: bookings.status,
			createdAt: bookings.createdAt,
			totalAmount: bookings.totalAmount,
			paymentStatus: bookings.paymentStatus,
			tourName: tours.name,
			timeSlotStartTime: timeSlots.startTime
		})
		.from(bookings)
		.innerJoin(tours, eq(bookings.tourId, tours.id))
		.innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
		.where(eq(tours.userId, userId))
		.orderBy(desc(bookings.createdAt))
		.limit(limit);
		
		// Process for display - convert to ProcessedBooking format
		return recentBookingsData.map((booking: any) => ({
			id: booking.id,
			customerName: booking.customerName,
			customerEmail: booking.customerEmail,
			participants: booking.participants || 1,
			status: booking.status,
			created: booking.createdAt.toISOString(),
			updated: booking.createdAt.toISOString(), // Use created as fallback
			tour: booking.tourName,
			totalAmount: typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) : (booking.totalAmount || 0),
			paymentStatus: booking.paymentStatus,
			effectiveDate: booking.timeSlotStartTime?.toISOString() || booking.createdAt.toISOString(),
			expand: {
				tour: { 
					id: '', // We don't have tour ID in this query, but name is available
					name: booking.tourName 
				},
				timeSlot: booking.timeSlotStartTime ? { 
					id: '',
					startTime: booking.timeSlotStartTime.toISOString(),
					endTime: booking.timeSlotStartTime.toISOString() // Fallback
				} : undefined
			}
		}));
	} catch (error) {
		console.error('Error fetching recent bookings:', error);
		return [];
	}
} 