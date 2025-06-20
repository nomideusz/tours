/**
 * TanStack Query mutation utilities with automatic cache invalidation
 * Provides consistent mutation patterns that update UI immediately
 */

import { createMutation, useQueryClient } from '@tanstack/svelte-query';
import { queryKeys } from './shared-stats.js';
import { invalidatePublicTourData } from './public-queries.js';
import type { Tour } from '$lib/types.js';

/**
 * Helper to invalidate all related queries after a mutation
 * This ensures the UI updates immediately everywhere
 */
export function createInvalidationHelper(queryClient: any) {
	return {
		// Invalidate all tour-related queries
		async invalidateTourQueries(tourId?: string, qrCode?: string) {
			const promises = [
				// Main tour queries
				queryClient.invalidateQueries({ queryKey: queryKeys.userTours }),
				queryClient.invalidateQueries({ queryKey: queryKeys.toursStats }),
			];
			
			// Tour-specific queries
			if (tourId) {
				promises.push(
					queryClient.invalidateQueries({ queryKey: queryKeys.tourDetails(tourId) }),
					queryClient.invalidateQueries({ queryKey: queryKeys.tourSchedule(tourId) }),
					queryClient.invalidateQueries({ queryKey: ['tour-bookings', tourId] })
				);
			}
			
			// Public queries (booking pages)
			if (qrCode) {
				invalidatePublicTourData(queryClient, qrCode);
			}
			
			await Promise.all(promises);
		},
		
		// Invalidate all booking-related queries
		async invalidateBookingQueries(bookingId?: string, tourId?: string) {
			const promises = [
				// Dashboard and stats
				queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats }),
				queryClient.invalidateQueries({ queryKey: queryKeys.recentBookings() }),
				queryClient.invalidateQueries({ queryKey: queryKeys.toursStats }),
			];
			
			// Booking-specific
			if (bookingId) {
				promises.push(
					queryClient.invalidateQueries({ queryKey: ['booking', bookingId] })
				);
			}
			
			// Tour-specific bookings
			if (tourId) {
				promises.push(
					queryClient.invalidateQueries({ queryKey: ['tour-bookings', tourId] }),
					queryClient.invalidateQueries({ queryKey: queryKeys.tourDetails(tourId) }),
					queryClient.invalidateQueries({ queryKey: queryKeys.tourSchedule(tourId) })
				);
			}
			
			await Promise.all(promises);
		},
		
		// Invalidate schedule/time slot queries
		async invalidateScheduleQueries(tourId: string, qrCode?: string) {
			const promises = [
				queryClient.invalidateQueries({ queryKey: queryKeys.tourSchedule(tourId) }),
				queryClient.invalidateQueries({ queryKey: queryKeys.tourDetails(tourId) }),
				queryClient.invalidateQueries({ queryKey: queryKeys.userTours }),
				queryClient.invalidateQueries({ queryKey: queryKeys.toursStats }),
			];
			
			// Also invalidate public booking pages
			if (qrCode) {
				invalidatePublicTourData(queryClient, qrCode);
			}
			
			await Promise.all(promises);
		}
	};
}

/**
 * Create a tour mutation (for new tour creation)
 */
export function createTourMutation() {
	const queryClient = useQueryClient();
	const invalidate = createInvalidationHelper(queryClient);
	
	return createMutation({
		mutationFn: async (tourData: any) => {
			const response = await fetch('/api/tours', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(tourData)
			});
			
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to create tour');
			}
			
			return response.json();
		},
		onSuccess: async (data) => {
			console.log('✅ Create mutation: Tour created successfully:', data);
			
			// Optimistically add the new tour to the cache immediately
			if (data?.tour) {
				queryClient.setQueryData(queryKeys.userTours, (old: Tour[] | undefined) => {
					if (!old) return [data.tour];
					// Add the new tour to the beginning of the list
					const newTours = [data.tour, ...old];
					console.log('✅ Create mutation: Added new tour to cache, total tours:', newTours.length);
					return newTours;
				});
				
				// Update stats optimistically
				queryClient.setQueryData(queryKeys.toursStats, (old: any) => {
					if (!old) return old;
					const newStats = {
						...old,
						totalTours: (old.totalTours || 0) + 1,
						activeTours: data.tour.status === 'active' ? (old.activeTours || 0) + 1 : old.activeTours,
						draftTours: data.tour.status === 'draft' ? (old.draftTours || 0) + 1 : old.draftTours,
						monthlyTours: (old.monthlyTours || 0) + 1
					};
					console.log('✅ Create mutation: Updated stats optimistically');
					return newStats;
				});
				
				console.log('✅ Create mutation: Keeping optimistic updates as final state');
			}
		}
	});
}

/**
 * Update tour mutation
 */
export function updateTourMutation(tourId: string) {
	const queryClient = useQueryClient();
	const invalidate = createInvalidationHelper(queryClient);
	
	return createMutation({
		mutationFn: async (tourData: any) => {
			const response = await fetch(`/api/tours/${tourId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(tourData)
			});
			
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update tour');
			}
			
			return response.json();
		},
		onSuccess: async (data) => {
			// Get QR code for public invalidation
			const tour = queryClient.getQueryData(queryKeys.tourDetails(tourId)) as any;
			await invalidate.invalidateTourQueries(tourId, tour?.tour?.qrCode);
		}
	});
}

/**
 * Delete tour mutation
 */
export function deleteTourMutation() {
	const queryClient = useQueryClient();
	const invalidate = createInvalidationHelper(queryClient);
	
	return createMutation({
		mutationFn: async (tourId: string) => {
			console.log('🗑️ Delete mutation: Sending DELETE request for tour:', tourId);
			
			const response = await fetch(`/api/tours/${tourId}`, {
				method: 'DELETE'
			});
			
			console.log('🗑️ Delete mutation: Server response status:', response.status);
			
			if (!response.ok) {
				const error = await response.text();
				console.error('🗑️ Delete mutation: Server error:', error);
				throw new Error(error || 'Failed to delete tour');
			}
			
			const result = await response.json().catch(() => ({ success: true }));
			console.log('🗑️ Delete mutation: Server result:', result);
			return result;
		},
		onMutate: async (tourId: string) => {
			console.log('🗑️ Delete mutation: Starting optimistic update for tour:', tourId);
			
			// Cancel outgoing refetches for tours list only
			await queryClient.cancelQueries({ queryKey: queryKeys.userTours });
			await queryClient.cancelQueries({ queryKey: queryKeys.toursStats });
			
			// Snapshot previous values
			const previousTours = queryClient.getQueryData(queryKeys.userTours);
			const previousStats = queryClient.getQueryData(queryKeys.toursStats);
			
			// Get the tour being deleted for stats update
			const tourToDelete = (previousTours as Tour[] | undefined)?.find(t => t.id === tourId);
			console.log('🗑️ Delete mutation: Tour to delete:', tourToDelete ? `${tourToDelete.name} (${tourToDelete.status})` : 'Not found');
			
			// Optimistically remove the tour from the list
			queryClient.setQueryData(queryKeys.userTours, (old: Tour[] | undefined) => {
				if (!old) return old;
				const newTours = old.filter(tour => tour.id !== tourId);
				console.log('🗑️ Delete mutation: Updated tours list from', old.length, 'to', newTours.length);
				return newTours;
			});
			
			// Optimistically update stats
			if (tourToDelete) {
				queryClient.setQueryData(queryKeys.toursStats, (old: any) => {
					if (!old) return old;
					const newStats = {
						...old,
						totalTours: Math.max(0, (old.totalTours || 0) - 1),
						activeTours: tourToDelete.status === 'active' ? Math.max(0, (old.activeTours || 0) - 1) : old.activeTours,
						draftTours: tourToDelete.status === 'draft' ? Math.max(0, (old.draftTours || 0) - 1) : old.draftTours
					};
					console.log('🗑️ Delete mutation: Updated stats optimistically');
					return newStats;
				});
			}
			
			return { previousTours, previousStats, tourToDelete };
		},
		onError: (err, tourId, context) => {
			console.error('🗑️ Delete mutation: Failed to delete tour', tourId);
			console.error('🗑️ Delete mutation: Error details:', err);
			
			// Rollback optimistic updates
			if (context?.previousTours) {
				queryClient.setQueryData(queryKeys.userTours, context.previousTours);
				console.log('🗑️ Delete mutation: Rolled back tours list');
			}
			if (context?.previousStats) {
				queryClient.setQueryData(queryKeys.toursStats, context.previousStats);
				console.log('🗑️ Delete mutation: Rolled back stats');
			}
			
			// Also force a refetch to ensure we have correct data
			setTimeout(async () => {
				console.log('🗑️ Delete mutation: Force refetching after error');
				await queryClient.refetchQueries({ queryKey: queryKeys.userTours });
				await queryClient.refetchQueries({ queryKey: queryKeys.toursStats });
			}, 500);
		},
		onSuccess: async (data, tourId) => {
			console.log('🗑️ Delete mutation: Server deletion successful for tour:', tourId);
			console.log('🗑️ Delete mutation: Server response:', data);
			
			// Don't do any cache invalidation - let the optimistic update persist
			// The tour is confirmed deleted on the server, so the optimistic state is correct
			console.log('🗑️ Delete mutation: Keeping optimistic updates as final state');
			
			// Remove the sessionStorage activity flag to prevent competing invalidations
			if (typeof window !== 'undefined') {
				sessionStorage.removeItem('recentTourActivity');
			}
		}
	});
}

/**
 * Update tour status mutation (active/draft toggle)
 */
export function updateTourStatusMutation() {
	const queryClient = useQueryClient();
	const invalidate = createInvalidationHelper(queryClient);
	
	return createMutation({
		mutationFn: async ({ tourId, status }: { tourId: string; status: 'active' | 'draft' }) => {
			const response = await fetch(`/api/tours/${tourId}/status`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status })
			});
			
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update tour status');
			}
			
			return response.json();
		},
		onMutate: async ({ tourId, status }) => {
			console.log('🔄 Status mutation: Starting optimistic update for tour:', tourId, 'to status:', status);
			
			// Cancel outgoing refetches for tours list and stats
			await queryClient.cancelQueries({ queryKey: queryKeys.userTours });
			await queryClient.cancelQueries({ queryKey: queryKeys.toursStats });
			
			// Snapshot previous values
			const previousTours = queryClient.getQueryData(queryKeys.userTours);
			const previousStats = queryClient.getQueryData(queryKeys.toursStats);
			
			// Get current tour for stats calculation
			const currentTour = (previousTours as Tour[] | undefined)?.find(t => t.id === tourId);
			const oldStatus = currentTour?.status;
			
			// Optimistically update tours list only (not tour details)
			queryClient.setQueryData(queryKeys.userTours, (old: Tour[] | undefined) => {
				if (!old) return old;
				const updated = old.map(tour => 
					tour.id === tourId ? { ...tour, status } : tour
				);
				console.log('🔄 Status mutation: Updated tours list optimistically');
				return updated;
			});
			
			// Optimistically update stats if status actually changed
			if (oldStatus && oldStatus !== status) {
				queryClient.setQueryData(queryKeys.toursStats, (old: any) => {
					if (!old) return old;
					let activeDelta = 0;
					let draftDelta = 0;
					
					if (oldStatus === 'active' && status === 'draft') {
						activeDelta = -1;
						draftDelta = 1;
					} else if (oldStatus === 'draft' && status === 'active') {
						activeDelta = 1;
						draftDelta = -1;
					}
					
					const newStats = {
						...old,
						activeTours: Math.max(0, (old.activeTours || 0) + activeDelta),
						draftTours: Math.max(0, (old.draftTours || 0) + draftDelta)
					};
					console.log('🔄 Status mutation: Updated stats optimistically with deltas:', { activeDelta, draftDelta });
					return newStats;
				});
			}
			
			// Also store in sessionStorage as backup
			try {
				const recentUpdates = JSON.parse(sessionStorage.getItem('recentTourUpdates') || '{}');
				recentUpdates[tourId] = { status, timestamp: Date.now() };
				sessionStorage.setItem('recentTourUpdates', JSON.stringify(recentUpdates));
			} catch (e) {
				console.warn('🔄 Status mutation: Failed to store in sessionStorage:', e);
			}
			
			return { previousTours, previousStats, tourId, status, oldStatus };
		},
		onError: (err, variables, context) => {
			console.error('🔄 Status mutation: Failed to update tour status', variables.tourId, err);
			
			// Rollback tours list and stats
			if (context?.previousTours) {
				queryClient.setQueryData(queryKeys.userTours, context.previousTours);
				console.log('🔄 Status mutation: Rolled back tours list');
			}
			if (context?.previousStats) {
				queryClient.setQueryData(queryKeys.toursStats, context.previousStats);
				console.log('🔄 Status mutation: Rolled back stats');
			}
			
			// Remove failed update from sessionStorage
			try {
				const recentUpdates = JSON.parse(sessionStorage.getItem('recentTourUpdates') || '{}');
				delete recentUpdates[variables.tourId];
				sessionStorage.setItem('recentTourUpdates', JSON.stringify(recentUpdates));
			} catch (e) {
				console.warn('🔄 Status mutation: Failed to clean sessionStorage:', e);
			}
		},
		onSettled: async (data, error, variables) => {
			// Wait before refetching to let optimistic updates show
			setTimeout(async () => {
				const tour = queryClient.getQueryData(queryKeys.tourDetails(variables.tourId)) as any;
				await invalidate.invalidateTourQueries(variables.tourId, tour?.tour?.qrCode);
				console.log('🔄 Status mutation: Cache invalidated after delay');
			}, 300); // Shorter delay for status toggle
		}
	});
}

/**
 * Update booking status mutation
 */
export function updateBookingStatusMutation() {
	const queryClient = useQueryClient();
	const invalidate = createInvalidationHelper(queryClient);
	
	return createMutation({
		mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
			const response = await fetch(`/api/bookings/${bookingId}/update-status`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status })
			});
			
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update booking status');
			}
			
			return response.json();
		},
		onMutate: async ({ bookingId, status }) => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ['booking', bookingId] });
			
			// Snapshot previous value
			const previousBooking = queryClient.getQueryData(['booking', bookingId]);
			
			// Optimistically update booking
			queryClient.setQueryData(['booking', bookingId], (old: any) => {
				if (!old?.booking) return old;
				return {
					...old,
					booking: { ...old.booking, status }
				};
			});
			
			// Update in lists too
			queryClient.setQueriesData({ queryKey: ['recentBookings'], exact: false }, (old: any) => {
				if (!Array.isArray(old)) return old;
				return old.map((b: any) => 
					b.id === bookingId ? { ...b, status } : b
				);
			});
			
			queryClient.setQueriesData({ queryKey: ['tour-bookings'], exact: false }, (old: any) => {
				if (!old?.bookings) return old;
				return {
					...old,
					bookings: old.bookings.map((b: any) => 
						b.id === bookingId ? { ...b, status } : b
					)
				};
			});
			
			return { previousBooking };
		},
		onError: (err, variables, context) => {
			// Rollback on error
			if (context?.previousBooking) {
				queryClient.setQueryData(['booking', variables.bookingId], context.previousBooking);
			}
		},
		onSettled: async (data, error, variables) => {
			// Get tour ID from booking data
			const bookingData = queryClient.getQueryData(['booking', variables.bookingId]) as any;
			const tourId = bookingData?.booking?.tourId;
			
			// Always refetch after mutation
			await invalidate.invalidateBookingQueries(variables.bookingId, tourId);
		}
	});
}

/**
 * Create time slot mutation
 */
export function createTimeSlotMutation(tourId: string) {
	const queryClient = useQueryClient();
	const invalidate = createInvalidationHelper(queryClient);
	
	return createMutation({
		mutationFn: async (slotData: any) => {
			const response = await fetch(`/api/tours/${tourId}/schedule`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(slotData)
			});
			
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to create time slot');
			}
			
			return response.json();
		},
		onSuccess: async () => {
			// Get tour QR code for public invalidation
			const tour = queryClient.getQueryData(queryKeys.tourDetails(tourId)) as any;
			await invalidate.invalidateScheduleQueries(tourId, tour?.tour?.qrCode);
		}
	});
}

/**
 * Update time slot mutation
 */
export function updateTimeSlotMutation(tourId: string, slotId: string) {
	const queryClient = useQueryClient();
	const invalidate = createInvalidationHelper(queryClient);
	
	return createMutation({
		mutationFn: async (slotData: any) => {
			const response = await fetch(`/api/tours/${tourId}/schedule/${slotId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(slotData)
			});
			
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update time slot');
			}
			
			return response.json();
		},
		onSuccess: async () => {
			// Get tour QR code for public invalidation
			const tour = queryClient.getQueryData(queryKeys.tourDetails(tourId)) as any;
			await invalidate.invalidateScheduleQueries(tourId, tour?.tour?.qrCode);
		}
	});
}

/**
 * Delete time slot mutation
 */
export function deleteTimeSlotMutation(tourId: string) {
	const queryClient = useQueryClient();
	const invalidate = createInvalidationHelper(queryClient);
	
	return createMutation({
		mutationFn: async (slotId: string) => {
			const response = await fetch(`/api/tours/${tourId}/schedule/${slotId}`, {
				method: 'DELETE'
			});
			
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete time slot');
			}
			
			return { success: true };
		},
		onSuccess: async () => {
			// Get tour QR code for public invalidation
			const tour = queryClient.getQueryData(queryKeys.tourDetails(tourId)) as any;
			await invalidate.invalidateScheduleQueries(tourId, tour?.tour?.qrCode);
		}
	});
} 