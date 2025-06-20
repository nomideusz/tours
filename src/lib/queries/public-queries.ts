/**
 * TanStack Query utilities for public routes
 * Provides consistent data fetching between (app) and (public) routes
 */

import { createQuery } from '@tanstack/svelte-query';
import type { TimeSlot } from '$lib/types.js';

/**
 * Query for public tour data by QR code
 * Used in booking pages and QR scan flows
 */
export function createPublicTourQuery(qrCode: string, options?: { 
	refetchInterval?: number;
	refetchOnWindowFocus?: boolean;
}) {
	return createQuery({
		queryKey: ['public', 'tour', qrCode],
		queryFn: async () => {
			const response = await fetch(`/api/public/tour/${qrCode}?visited=true`);
			if (!response.ok) {
				const error = await response.json().catch(() => ({ error: 'Failed to load tour' }));
				throw new Error(error.error || 'Failed to load tour');
			}
			return response.json();
		},
		refetchInterval: options?.refetchInterval || 30000, // 30 seconds
		refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
		staleTime: 10000 // 10 seconds
	});
}

/**
 * Query for public user profile data
 * Used in public profile pages
 */
export function createPublicProfileQuery(username: string) {
	return createQuery({
		queryKey: ['public', 'profile', username],
		queryFn: async () => {
			const response = await fetch(`/api/public/profile/${username}`);
			if (!response.ok) {
				const error = await response.json().catch(() => ({ error: 'Failed to load profile' }));
				throw new Error(error.error || 'Failed to load profile');
			}
			return response.json();
		},
		refetchInterval: 60000, // 1 minute
		refetchOnWindowFocus: true,
		staleTime: 30000 // 30 seconds
	});
}

/**
 * Real-time availability check for time slots
 * Used to prevent booking fully booked slots
 */
export function createTimeSlotAvailabilityQuery(qrCode: string, timeSlotId: string) {
	return createQuery({
		queryKey: ['public', 'availability', qrCode, timeSlotId],
		queryFn: async () => {
			const response = await fetch(`/api/public/tour/${qrCode}`);
			if (!response.ok) {
				throw new Error('Failed to check availability');
			}
			const data = await response.json();
			const slot = data.timeSlots.find((s: TimeSlot) => s.id === timeSlotId);
			if (!slot) {
				throw new Error('Time slot not found');
			}
			return {
				available: slot.availableSpots > slot.bookedSpots,
				availableSpots: slot.availableSpots - slot.bookedSpots,
				slot
			};
		},
		refetchInterval: 5000, // 5 seconds - very frequent for booking form
		refetchOnWindowFocus: true,
		staleTime: 2000 // 2 seconds - short stale time for availability
	});
}

/**
 * Helper to invalidate public tour data
 * Used after bookings are made to refresh availability
 */
export function invalidatePublicTourData(queryClient: any, qrCode: string) {
	queryClient.invalidateQueries({ 
		queryKey: ['public', 'tour', qrCode] 
	});
	queryClient.invalidateQueries({ 
		queryKey: ['public', 'availability', qrCode] 
	});
}

/**
 * Query for public ticket data by ticket code
 * Used in ticket display pages for real-time status updates
 */
export function createPublicTicketQuery(ticketCode: string) {
	return createQuery({
		queryKey: ['public', 'ticket', ticketCode],
		queryFn: async () => {
			console.log(`TanStack Query fetching ticket: ${ticketCode}`);
			const response = await fetch(`/api/public/ticket/${ticketCode}`);
			console.log(`Ticket API response status: ${response.status}`);
			
			if (!response.ok) {
				const error = await response.json().catch(() => ({ error: 'Failed to load ticket' }));
				console.log(`Ticket API error:`, error);
				throw new Error(error.error || `Failed to parse URL from /api/public/ticket/${ticketCode}`);
			}
			const data = await response.json();
			console.log(`Ticket API success:`, data);
			return data;
		},
		refetchInterval: 10000, // 10 seconds - frequent for attendance status updates
		refetchOnWindowFocus: true,
		staleTime: 5000 // 5 seconds
	});
}

/**
 * Query for booking status by booking ID
 * Used in success pages for payment processing updates
 */
export function createBookingStatusQuery(bookingId: string) {
	return createQuery({
		queryKey: ['public', 'booking', 'status', bookingId],
		queryFn: async () => {
			const response = await fetch(`/api/public/booking/${bookingId}/status`);
			if (!response.ok) {
				const error = await response.json().catch(() => ({ error: 'Failed to load booking status' }));
				throw new Error(error.error || 'Failed to load booking status');
			}
			return response.json();
		},
		refetchInterval: 3000, // 3 seconds - very frequent for payment processing
		refetchOnWindowFocus: true,
		staleTime: 0, // No stale time - always refetch for payment status
		gcTime: 30000 // Keep in cache for 30 seconds
	});
}

/**
 * Helper to prefetch tour data for better UX
 */
export function prefetchPublicTourData(queryClient: any, qrCode: string) {
	return queryClient.prefetchQuery({
		queryKey: ['public', 'tour', qrCode],
		queryFn: async () => {
			const response = await fetch(`/api/public/tour/${qrCode}?visited=true`);
			if (!response.ok) {
				const error = await response.json().catch(() => ({ error: 'Failed to load tour' }));
				throw new Error(error.error || 'Failed to load tour');
			}
			return response.json();
		},
		staleTime: 10000, // 10 seconds
		gcTime: 30000 // Keep in cache for 30 seconds
	});
} 