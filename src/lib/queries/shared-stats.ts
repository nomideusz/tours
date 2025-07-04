// Future TanStack Query integration example
// This file shows how to convert our shared stats to TanStack Query patterns

import { browser } from '$app/environment';
import type { SharedStats, DashboardStats, ToursStats } from '$lib/utils/shared-stats.js';

// Query keys for consistent caching
export const queryKeys = {
	dashboardStats: ['dashboardStats'] as const,
	toursStats: ['toursStats'] as const,
	recentBookings: (limit: number) => ['recentBookings', limit] as const,
	userTours: ['userTours'] as const,
	tourDetails: (id: string) => ['tourDetails', id] as const,
	tourSchedule: (id: string) => ['tourSchedule', id] as const,
	tourBookings: (tourId: string) => ['tourBookings', tourId] as const,
	tourBookingConstraints: (tourId: string) => ['tourBookingConstraints', tourId] as const,
	profile: ['profile'] as const,
	profileStats: ['profileStats'] as const,
	allTimeSlots: (view: string, date: string) => ['allTimeSlots', view, date] as const,
	customers: ['customers'] as const,
} as const;

// Query functions that call our API endpoints
export const queryFunctions = {
	// Fetch dashboard-specific stats
	async fetchDashboardStats(signal?: AbortSignal) {
		if (!browser) throw new Error('Client-side only');
		
		const response = await fetch('/api/dashboard-stats', { signal });
		if (!response.ok) {
			throw new Error(`Failed to fetch dashboard stats: ${response.status} ${response.statusText}`);
		}
		return response.json();
	},

	// Fetch tours-specific stats
	async fetchToursStats(signal?: AbortSignal) {
		if (!browser) throw new Error('Client-side only');
		
		const response = await fetch('/api/tours-stats', { signal });
		if (!response.ok) {
			throw new Error(`Failed to fetch tours stats: ${response.status} ${response.statusText}`);
		}
		return response.json();
	},

	// Fetch recent bookings
	async fetchRecentBookings(limit: number = 10, signal?: AbortSignal) {
		if (!browser) throw new Error('Client-side only');
		
		// Use full endpoint for complete data structure
		const response = await fetch(`/api/recent-bookings?limit=${limit}`, { signal });
		if (!response.ok) {
			throw new Error(`Failed to fetch recent bookings: ${response.status} ${response.statusText}`);
		}
		return response.json();
	},

	// Fetch user tours
	async fetchUserTours() {
		if (!browser) throw new Error('Client-side only');
		
		const response = await fetch('/api/tours');
		if (!response.ok) {
			throw new Error(`Failed to fetch tours: ${response.status} ${response.statusText}`);
		}
		return response.json();
	},
	
	// Fetch tour details
	async fetchTourDetails(tourId: string, timeRange: string = 'all') {
		if (!browser) throw new Error('Client-side only');
		
		const response = await fetch(`/api/tour-details/${tourId}?range=${timeRange}`);
		if (!response.ok) {
			throw new Error(`Failed to fetch tour details: ${response.status} ${response.statusText}`);
		}
		return response.json();
	},

	// Fetch profile data
	async fetchProfile() {
		if (!browser) throw new Error('Client-side only');
		
		const response = await fetch('/api/profile');
		if (!response.ok) {
			throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
		}
		return response.json();
	},

	// Fetch profile stats (using dashboard stats for now)
	async fetchProfileStats() {
		if (!browser) throw new Error('Client-side only');
		
		const response = await fetch('/api/dashboard-stats');
		if (!response.ok) {
			throw new Error(`Failed to fetch profile stats: ${response.status} ${response.statusText}`);
		}
		return response.json();
	},

	// Fetch tour schedule
	async fetchTourSchedule(tourId: string) {
		if (!browser) throw new Error('Client-side only');
		
		const response = await fetch(`/api/tour-schedule/${tourId}`);
		if (!response.ok) {
			throw new Error(`Failed to fetch tour schedule: ${response.status} ${response.statusText}`);
		}
		return response.json();
	},

	// Fetch tour bookings
	async fetchTourBookings(tourId: string) {
		if (!browser) throw new Error('Client-side only');
		
		const response = await fetch(`/api/tours/${tourId}/bookings`);
		if (!response.ok) {
			throw new Error(`Failed to fetch tour bookings: ${response.status} ${response.statusText}`);
		}
		return response.json();
	},

	// Fetch tour booking constraints (for capacity validation)
	async fetchTourBookingConstraints(tourId: string) {
		if (!browser) throw new Error('Client-side only');
		
		const response = await fetch(`/api/tours/${tourId}/booking-constraints`);
		if (!response.ok) {
			throw new Error(`Failed to fetch booking constraints: ${response.status} ${response.statusText}`);
		}
		return response.json();
	},

	// Fetch all time slots
	async fetchAllTimeSlots(view: string, date: string) {
		if (!browser) throw new Error('Client-side only');
		
		const response = await fetch(`/api/all-time-slots?view=${view}&date=${date}`);
		if (!response.ok) {
			throw new Error(`Failed to fetch all time slots: ${response.status} ${response.statusText}`);
		}
		return response.json();
	},

	// Fetch customers
	async fetchCustomers() {
		if (!browser) throw new Error('Client-side only');
		
		const response = await fetch('/api/customers');
		if (!response.ok) {
			throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`);
		}
		return response.json();
	},
};

/* 
Future usage with TanStack Query:

import { createQuery } from '@tanstack/svelte-query';
import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';

// Shared stats (used in layout)
const sharedStatsQuery = createQuery({
	queryKey: queryKeys.sharedStats,
	queryFn: queryFunctions.fetchSharedStats,
	staleTime: 5 * 60 * 1000, // 5 minutes
	gcTime: 10 * 60 * 1000,   // 10 minutes
});

// Tours page specific
const toursStatsQuery = createQuery({
	queryKey: queryKeys.toursStats,
	queryFn: queryFunctions.fetchToursStats,
	staleTime: 2 * 60 * 1000, // 2 minutes
	gcTime: 5 * 60 * 1000,    // 5 minutes
});

const userToursQuery = createQuery({
	queryKey: queryKeys.userTours,
	queryFn: queryFunctions.fetchUserTours,
	staleTime: 1 * 60 * 1000, // 1 minute
	gcTime: 5 * 60 * 1000,    // 5 minutes
});

// Access data reactively:
$: sharedStats = $sharedStatsQuery.data;
$: toursStats = $toursStatsQuery.data;
$: tours = $userToursQuery.data;
$: isLoading = $sharedStatsQuery.isLoading || $toursStatsQuery.isLoading;

*/ 