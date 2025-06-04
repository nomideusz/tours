// Optimized booking query strategies for PocketBase

import { getQueryConfig } from './query-config.js';

/**
 * Strategy 1: Use date-based filtering to reduce result set
 * Instead of fetching all bookings, focus on recent/relevant ones
 */
export async function fetchRecentBookingsForUser(pb: any, userId: string, days: number = 30) {
	const config = getQueryConfig();
	const dateFilter = new Date();
	dateFilter.setDate(dateFilter.getDate() - days);
	const dateString = dateFilter.toISOString();
	
	try {
		// Use a single query with date filter to reduce results
		const bookings = await pb.collection('bookings').getList(1, config.maxPageSize, {
			filter: `tour.user = "${userId}" && created >= "${dateString}"`,
			sort: '-created',
			expand: 'tour,timeSlot',
			skipTotal: true
		});
		
		return bookings.items;
	} catch (error) {
		console.error('Error fetching recent bookings:', error);
		return [];
	}
}

/**
 * Strategy 2: Fetch bookings count per tour without full data
 * Useful for dashboard statistics
 */
export async function fetchBookingStatsForTours(pb: any, tourIds: string[]) {
	const stats = new Map<string, number>();
	
	// Use minimal queries just to get counts
	for (const tourId of tourIds) {
		try {
			const result = await pb.collection('bookings').getList(1, 1, {
				filter: `tour = "${tourId}" && status = "confirmed"`,
				skipTotal: false // We need the total count
			});
			
			stats.set(tourId, result.totalItems || 0);
		} catch (error) {
			console.error(`Error fetching stats for tour ${tourId}:`, error);
			stats.set(tourId, 0);
		}
	}
	
	return stats;
}

/**
 * Strategy 3: Use server-side aggregation via custom endpoint
 * This is the most efficient approach for complex queries
 */
export async function fetchAggregatedBookingData(userId: string) {
	try {
		// Call a custom server endpoint that handles aggregation
		const response = await fetch(`/api/bookings/aggregate?userId=${userId}`);
		if (!response.ok) throw new Error('Failed to fetch aggregated data');
		
		return await response.json();
	} catch (error) {
		console.error('Error fetching aggregated booking data:', error);
		return null;
	}
}

/**
 * Strategy 4: Progressive loading for large datasets
 * Load data as needed rather than all at once
 */
export class ProgressiveBookingLoader {
	private pb: any;
	private tourIds: string[];
	private loadedTours: Set<string> = new Set();
	private bookingsCache: Map<string, any[]> = new Map();
	
	constructor(pb: any, tourIds: string[]) {
		this.pb = pb;
		this.tourIds = tourIds;
	}
	
	async loadBookingsForTour(tourId: string, limit: number = 50) {
		if (this.loadedTours.has(tourId)) {
			return this.bookingsCache.get(tourId) || [];
		}
		
		try {
			const bookings = await this.pb.collection('bookings').getList(1, limit, {
				filter: `tour = "${tourId}"`,
				sort: '-created',
				expand: 'timeSlot'
			});
			
			this.loadedTours.add(tourId);
			this.bookingsCache.set(tourId, bookings.items);
			
			return bookings.items;
		} catch (error) {
			console.error(`Error loading bookings for tour ${tourId}:`, error);
			return [];
		}
	}
	
	async loadNextBatch(batchSize: number = 5) {
		const unloadedTours = this.tourIds.filter(id => !this.loadedTours.has(id));
		const toLoad = unloadedTours.slice(0, batchSize);
		
		const results = await Promise.all(
			toLoad.map(tourId => this.loadBookingsForTour(tourId))
		);
		
		return results.flat();
	}
	
	getAllLoaded() {
		return Array.from(this.bookingsCache.values()).flat();
	}
} 