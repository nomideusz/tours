<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { 
		formatDuration,
		formatCategoryName,
		getImageUrl,
		getTourDisplayPriceFormatted
	} from '$lib/utils/tour-helpers-client.js';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	
	// Components
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/layout/MobilePageHeader.svelte';
	import ConfirmationModal from '$lib/components/modals/ConfirmationModal.svelte';
	import TourStatusToggle from '$lib/components/TourStatusToggle.svelte';
	import Tooltip from '$lib/components/ui/feedback/Tooltip.svelte';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import TourTimeline from '$lib/components/TourTimeline.svelte';
	import type { Tour } from '$lib/types.js';
	
	// TanStack Query
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { updateTourStatusMutation } from '$lib/queries/mutations.js';
	
	// Onboarding utilities
	import { canActivateTours, getOnboardingMessage, getNextOnboardingStep } from '$lib/utils/onboarding.js';
	
	// Icons
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Eye from 'lucide-svelte/icons/eye';
	import Settings from 'lucide-svelte/icons/settings';
	import Plus from 'lucide-svelte/icons/plus';
	import Clock from 'lucide-svelte/icons/clock';
	import Edit from 'lucide-svelte/icons/edit';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Search from 'lucide-svelte/icons/search';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import X from 'lucide-svelte/icons/x';
import MoreVertical from 'lucide-svelte/icons/more-vertical';
import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
import CircleDot from 'lucide-svelte/icons/circle-dot';
import CheckCircle from 'lucide-svelte/icons/check-circle';
import Copy from 'lucide-svelte/icons/copy';

	const queryClient = useQueryClient();
	
	// Get data from props (profile should be available from layout)
	let { data } = $props();
	let profile = $derived(data?.user);

	// Query
	const userToursQuery = createQuery({
		queryKey: queryKeys.userTours,
		queryFn: queryFunctions.fetchUserTours,
		staleTime: 0, // Always consider data potentially stale for immediate updates
		gcTime: 2 * 60 * 1000, // 2 minutes
		refetchOnWindowFocus: true,
		refetchOnMount: true,
	});
	
	// Subscription usage query
	const usageQuery = createQuery({
		queryKey: ['subscriptionUsage'],
		queryFn: async () => {
			const response = await fetch('/api/subscriptions/usage');
			if (!response.ok) throw new Error('Failed to fetch usage');
			return response.json();
		},
		staleTime: 5 * 60 * 1000, // 5 minutes - reduce excessive refetching
		gcTime: 10 * 60 * 1000, // 10 minutes
		refetchOnWindowFocus: false, // Disable window focus refetching
	});

	// Derived data
	let tours = $derived(($userToursQuery.data as Tour[]) || []);
	let isLoading = $derived($userToursQuery.isLoading);
	let isError = $derived($userToursQuery.isError);
	let usage = $derived($usageQuery.data);
	
	// Search and filter state
	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'active' | 'draft'>('all');
	let actionMenuOpen = $state<string | null>(null);
	
	// Delete modal state
	let showDeleteModal = $state(false);
	let tourToDelete = $state<Tour | null>(null);
	
	// Delete error modal state
	let showDeleteErrorModal = $state(false);
	let deleteErrorData = $state<{
		tourName: string;
		activeBookings: number;
		totalBookings: number;
		revenue: number;
	} | null>(null);
	
	// Timeline view state
	let showTimeline = $state(false);
	let timelineView = $state<'day' | 'week' | 'month'>('week');
	let timelineCurrentDate = $state(new Date());
	
	// Feedback state
	let recentlyUpdated = $state<string | null>(null);
	let deletingTourIds = $state<Set<string>>(new Set());
	let copyingTourId = $state<string | null>(null);
	let copyError = $state<string | null>(null);
	
	// Onboarding modal state
	let showOnboardingModal = $state(false);
	let onboardingModalMessage = $state('');
	
	// Onboarding status
	let hasConfirmedLocation = $state(false);
	let paymentStatus = $state({ isSetup: false, loading: true });
	
	// Initialize onboarding status
	$effect(() => {
		if (browser && profile) {
			// Check if location is confirmed from localStorage
			hasConfirmedLocation = localStorage.getItem('locationConfirmed') === 'true';
			
			// Also consider location confirmed if user has country+currency or stripe account
			if ((profile.country && profile.currency) || profile.stripeAccountId) {
				hasConfirmedLocation = true;
				localStorage.setItem('locationConfirmed', 'true');
			}
			
			// Check payment status
			checkPaymentStatus();
		}
	});
	
	// Check payment status
	async function checkPaymentStatus() {
		if (!profile?.stripeAccountId) {
			paymentStatus = { isSetup: false, loading: false };
			return;
		}

		try {
			const response = await fetch('/api/payments/connect/status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: profile.id })
			});

			if (response.ok) {
				const data = await response.json();
				paymentStatus = {
					isSetup: data.canReceivePayments || false,
					loading: false
				};
			} else {
				paymentStatus = { isSetup: false, loading: false };
			}
		} catch (error) {
			console.error('Error checking payment status:', error);
			paymentStatus = { isSetup: false, loading: false };
		}
	}
	
	// Helper function to check if a specific tour can be activated
	function canActivateTour(tour: Tour) {
		const price = parseFloat(tour.price) || 0;
		const check = canActivateTours(profile, hasConfirmedLocation, paymentStatus, price);
		return check.canActivate;
	}
	
	// Helper function to get onboarding message for a specific tour
	function getTourOnboardingMessage(tour: Tour) {
		const price = parseFloat(tour.price) || 0;
		const check = canActivateTours(profile, hasConfirmedLocation, paymentStatus, price);
		return getOnboardingMessage(check.missingSteps, price === 0);
	}
	
	// Filtered and sorted tours
	let filteredTours = $derived(tours
		.filter(tour => {
			// Don't filter out tours being deleted - let them animate out
			// The mutation will handle the actual removal
			
			// Search filter
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				const matchesSearch = 
					tour.name.toLowerCase().includes(query) ||
					tour.description?.toLowerCase().includes(query) ||
					tour.location?.toLowerCase().includes(query);
				if (!matchesSearch) return false;
			}
			
			// Status filter
			if (statusFilter !== 'all' && tour.status !== statusFilter) {
				return false;
			}
			
			return true;
		})
		.sort((a, b) => {
			// Sort by creation date (newest first) for stable ordering
			// This prevents tours from jumping around when status changes
			const dateA = new Date(a.createdAt || 0).getTime();
			const dateB = new Date(b.createdAt || 0).getTime();
			return dateB - dateA; // Newest first
		})
	);

	// Close dropdown when clicking outside
	onMount(() => {
		function handleClickOutside(event: MouseEvent) {
			if (actionMenuOpen && !(event.target as HTMLElement).closest('.dropdown-container')) {
				actionMenuOpen = null;
				dropdownOpenUpwards = {};
			}
		}
		
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});

	// Check if dropdown should open upwards
	function checkDropdownPosition(event: MouseEvent) {
		const button = event.currentTarget as HTMLElement;
		const rect = button.getBoundingClientRect();
		const spaceBelow = window.innerHeight - rect.bottom;
		// Mobile dropdowns are taller due to more padding (px-4 py-3)
		const dropdownHeight = window.innerWidth < 640 ? 400 : 250;
		
		return spaceBelow < dropdownHeight;
	}

	let dropdownOpenUpwards = $state<{ [key: string]: boolean }>({});

	// Track timeouts for proper cleanup
	let statusTimeouts: NodeJS.Timeout[] = [];

	// Helper functions
	function getQRImageUrl(tour: Tour, size: number = 200): string {
		if (!tour.qrCode) return '';
		const baseURL = browser ? window.location.origin : 'https://zaur.app';
		return generateQRImageURL(tour.qrCode, {
			size,
			baseURL
		});
	}

	function getTourImageUrl(tour: Tour): string {
		if (!tour.images || !tour.images[0]) return '';
		return getImageUrl(tour, tour.images[0]);
	}

	// Generate color for tour based on tour ID/name (same algorithm as calendar)
	function getTourCalendarColor(tourId: string | undefined, tourName: string | undefined): string {
		if (!tourId || !tourName) {
			// Fallback color if data is missing
			return '#3B82F6';
		}
		
		// Use a hash function to generate consistent colors
		let hash = 0;
		const str = tourId + tourName;
		for (let i = 0; i < str.length; i++) {
			hash = ((hash << 5) - hash) + str.charCodeAt(i);
			hash = hash & hash; // Convert to 32-bit integer
		}
		
		// Generate HSL values
		const hue = Math.abs(hash) % 360;
		const saturation = 65 + (Math.abs(hash >> 8) % 20); // 65-85%
		const lightness = 45 + (Math.abs(hash >> 16) % 15); // 45-60%
		
		// Convert HSL to RGB for better browser compatibility
		const h = hue / 360;
		const s = saturation / 100;
		const l = lightness / 100;
		
		let r, g, b;
		
		if (s === 0) {
			r = g = b = l; // achromatic
		} else {
			const hue2rgb = (p: number, q: number, t: number) => {
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1/6) return p + (q - p) * 6 * t;
				if (t < 1/2) return q;
				if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
				return p;
			};
			
			const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			const p = 2 * l - q;
			r = hue2rgb(p, q, h + 1/3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1/3);
		}
		
		// Convert to hex
		const toHex = (x: number) => {
			const hex = Math.round(x * 255).toString(16);
			return hex.length === 1 ? '0' + hex : hex;
		};
		
		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	}



	// Mutations
	const updateStatusMutation = updateTourStatusMutation();
	
	// Custom copy mutation
	const copyMutation = createMutation({
		mutationFn: async (tourId: string) => {
			const response = await fetch(`/api/tours/${tourId}/copy`, {
				method: 'POST'
			});
			
			if (!response.ok) {
				const error = await response.text();
				throw new Error(error || 'Failed to copy tour');
			}
			
			return response.json();
		},
		onSuccess: (data) => {
			// Clear loading state
			copyingTourId = null;
			
			// Invalidate queries to refetch data
			queryClient.invalidateQueries({ queryKey: queryKeys.userTours });
			queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });
			queryClient.invalidateQueries({ queryKey: ['subscriptionUsage'] });
			
			// Navigate to the new tour's edit page
			if (data.id) {
				goto(`/tours/${data.id}/edit`);
			}
		},
		onError: (error: any) => {
			// Error is already handled in the copyTour function
			console.error('Copy mutation error:', error);
		}
	});
	
	// Custom delete mutation without optimistic updates
	const deleteMutation = createMutation({
		mutationFn: async (tourId: string) => {
			const response = await fetch(`/api/tours/${tourId}`, {
				method: 'DELETE'
			});
			
			if (!response.ok) {
				let errorData: any = {};
				
				try {
					// Parse the error response as JSON
					errorData = await response.json();
				} catch (e) {
					// If JSON parsing fails, use text
					const errorText = await response.text();
					errorData = { error: errorText || 'Failed to delete tour' };
				}
				
				// Throw error with parsed data
				const error = new Error(errorData.error || 'Failed to delete tour');
				(error as any).data = errorData;
				throw error;
			}
			
			return response.json().catch(() => ({ success: true }));
		},
		// No onMutate = no optimistic updates
		onSuccess: () => {
			// Invalidate queries to refetch data
			queryClient.invalidateQueries({ queryKey: queryKeys.userTours });
			queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });
			// Invalidate usage query to update tour count display
			queryClient.invalidateQueries({ queryKey: ['subscriptionUsage'] });
		}
	});
	
	async function confirmDeleteTour() {
		if (!tourToDelete) return;
		
		const tourIdToDelete = tourToDelete.id;
		const tourNameToDelete = tourToDelete.name;
		const tourForError = tourToDelete; // Keep reference for error handling
		
		try {
			// Add to deleting set
			deletingTourIds.add(tourIdToDelete);
			showDeleteModal = false;
			// Don't clear tourToDelete yet - we need it for error handling
			
			// Force update of the set to trigger reactivity
			deletingTourIds = deletingTourIds;
			
			await $deleteMutation.mutateAsync(tourIdToDelete);
			
			// Clear tourToDelete on success
			tourToDelete = null;
			
			// Remove from deleting set after animation completes
			const timeoutId = setTimeout(() => {
				deletingTourIds.delete(tourIdToDelete);
				deletingTourIds = deletingTourIds; // Force reactivity
			}, 600); // Slightly longer than fade out to ensure smooth animation
			statusTimeouts.push(timeoutId);
		} catch (error: any) {
			// Remove from deleting set on error
			deletingTourIds.delete(tourIdToDelete);
			deletingTourIds = deletingTourIds;
			
			// This should be rare now with the new UX, but keep as fallback
			const errorData = error?.data || {};
			
			// Check if it's a structured error with booking details (fallback)
			if (errorData?.details?.activeBookings > 0) {
				deleteErrorData = {
					tourName: tourNameToDelete,
					activeBookings: errorData.details.activeBookings,
					totalBookings: errorData.details.totalBookings,
					revenue: errorData.details.revenue || 0
				};
				tourToDelete = tourForError;
				showDeleteErrorModal = true;
			} else {
				// Generic error - just log and clear
				console.error('Delete error:', errorData?.error || error?.message || 'Failed to delete tour');
				tourToDelete = null;
			}
		}
	}
	
	async function updateTourStatus(tourId: string, newStatus: 'active' | 'draft') {
		try {
			// Find the tour
			const tour = tours.find(t => t.id === tourId);
			if (!tour) return;
			
			// Check onboarding completion before allowing activation
			if (newStatus === 'active' && !canActivateTour(tour)) {
				const message = getTourOnboardingMessage(tour);
				const price = parseFloat(tour.price) || 0;
				const check = canActivateTours(profile, hasConfirmedLocation, paymentStatus, price);
				const nextStep = getNextOnboardingStep(check.missingSteps);
				onboardingModalMessage = `${message}\n\n${nextStep ? `Next: ${nextStep.action}` : ''}`;
				showOnboardingModal = true;
				return;
			}
			
			// Show subtle highlight on the tour being updated
			recentlyUpdated = tourId;
			
			// Execute the mutation - it handles optimistic updates automatically
			await $updateStatusMutation.mutateAsync({ tourId, status: newStatus });
			
			// For extra reliability, force refetch of tours after a short delay
			const refetchTimeoutId = setTimeout(async () => {
				await queryClient.refetchQueries({ 
					queryKey: queryKeys.userTours,
					type: 'active'
				});
			}, 500);
			statusTimeouts.push(refetchTimeoutId);
			
			// Keep the highlight for a moment then clear it
			const highlightTimeoutId = setTimeout(() => {
				recentlyUpdated = null;
			}, 1500);
			statusTimeouts.push(highlightTimeoutId);
		} catch (error) {
			recentlyUpdated = null;
			console.error('Failed to update tour status:', error);
		}
	}
	
	async function copyTour(tourId: string) {
		try {
			copyingTourId = tourId;
			copyError = null;
			console.log('Starting tour copy for:', tourId);
			const result = await $copyMutation.mutateAsync(tourId);
			console.log('Copy successful:', result);
		} catch (error: any) {
			console.error('Failed to copy tour:', error);
			copyingTourId = null;
			
			// Show error message
			if (error.message?.includes('Tour limit reached')) {
				copyError = 'Tour limit reached. Please upgrade your subscription to create more tours.';
			} else {
				copyError = error.message || 'Failed to copy tour. Please try again.';
			}
			
			// Clear error after 5 seconds
			setTimeout(() => {
				copyError = null;
			}, 5000);
		}
	}
	
	function handleOnboardingModalConfirm() {
		showOnboardingModal = false;
			// Redirect to calendar for onboarding
	goto('/calendar');
	}
	
	function handleDeleteErrorViewBookings() {
		showDeleteErrorModal = false;
		if (deleteErrorData && tourToDelete) {
			// Navigate to tour bookings page
							goto(`/bookings?tour=${tourToDelete.id}`);
		}
		deleteErrorData = null;
		tourToDelete = null;
	}
	
	function handleDeleteErrorClose() {
		showDeleteErrorModal = false;
		deleteErrorData = null;
		tourToDelete = null;
	}

	// Cleanup timeouts on component destruction
	onDestroy(() => {
		statusTimeouts.forEach(timeout => clearTimeout(timeout));
	});
</script>

<svelte:head>
	<title>Tours - Zaur</title>
</svelte:head>

<PageContainer class="py-4 sm:py-8">
	<!-- Header -->
	<div class="mb-6 sm:mb-8">
		<!-- Compact Mobile Header -->
		<MobilePageHeader
			title="Tours"
			secondaryInfo={statusFilter === 'all' ? 
				(tours.length > 0 ? `${tours.filter(t => t.status === 'active').length} active • ${tours.filter(t => t.status === 'draft').length} draft` : '0 tours') :
				`${filteredTours.length} ${statusFilter}`
			}
			primaryAction={{
				label: usage?.tours?.limit !== null ? `${usage?.tours?.used || 0}/${usage?.tours?.limit} Limit` : 'Unlimited',
				icon: Settings,
				onclick: () => goto('/subscription'),
				variant: (usage?.tours?.used >= (usage?.tours?.limit || Infinity)) ? 'accent' : 'secondary',
				disabled: false
			}}
			quickActions={[
				{
					label: 'New Tour',
					icon: Plus,
					onclick: () => goto('/tours/new'),
					variant: 'primary'
				}
			]}
		/>
		
		<!-- Desktop Header -->
		<div class="hidden sm:block">
			<PageHeader 
				title="Tours"
				subtitle="Manage your tour offerings"
			>
				<div class="flex items-center gap-4">
					{#if usage?.tours}
						<div class="text-sm" style="color: var(--text-secondary);">
							{#if usage.tours.limit !== null}
								<span class="{usage.tours.used >= usage.tours.limit ? 'text-orange-600 font-medium' : ''}">
									{usage.tours.used}/{usage.tours.limit} tours
								</span>
								{#if usage.tours.used >= usage.tours.limit}
									<a href="/subscription" class="ml-2 text-sm font-medium text-blue-600 hover:underline">
										Upgrade
									</a>
								{/if}
							{:else}
								<span>{usage.tours.used} tours</span>
							{/if}
						</div>
					{/if}
					<button onclick={() => goto('/tours/new')} class="button-primary button-gap">
						<Plus class="h-4 w-4" />
						Create Tour
					</button>
				</div>
			</PageHeader>
		</div>
	</div>

	<!-- Optional Timeline View -->
	{#if showTimeline}
		<div class="mb-6">
			<TourTimeline 
				bind:view={timelineView}
				bind:currentDate={timelineCurrentDate}
				compact={false}
				onSlotClick={(slot) => {
					// Navigate to tour details page when clicking a slot
					// On mobile, go directly to schedule tab
					if (window.innerWidth < 768) {
						goto(`/tours/${slot.tourId}?tab=schedule`);
					} else {
						goto(`/tours/${slot.tourId}`);
					}
				}}
			/>
		</div>
	{/if}

	<!-- Search and Filters -->
	<div class="mb-6 space-y-3">
		<!-- Mobile Search Bar -->
		<div class="sm:hidden">
			<div class="relative">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
				<input
					type="search"
					bind:value={searchQuery}
					placeholder="Search tours..."
					class="form-input pl-10 pr-10"
				/>
				{#if searchQuery}
					<button
						onclick={() => searchQuery = ''}
						class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
						style="background: transparent;"
						onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
						onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
					>
						<X class="h-4 w-4" style="color: var(--text-tertiary);" />
					</button>
				{/if}
			</div>
		</div>
		
		<!-- Desktop Search and Filters -->
		<div class="hidden sm:flex gap-3">
			<!-- Search -->
			<div class="flex-1 relative">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
				<input
					type="search"
					bind:value={searchQuery}
					placeholder="Search tours..."
					class="form-input pl-10 pr-10"
				/>
				{#if searchQuery}
					<button
						onclick={() => searchQuery = ''}
						class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
						style="background: transparent;"
						onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
						onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
					>
						<X class="h-4 w-4" style="color: var(--text-tertiary);" />
					</button>
				{/if}
			</div>
			
			<!-- Status Filter -->
			<div class="flex gap-2">
				<button
					onclick={() => showTimeline = !showTimeline}
					class="{showTimeline ? 'button-primary' : 'button-secondary'} button-small button-gap"
				>
					<Calendar class="h-4 w-4" />
					Timeline
				</button>
				<button
					onclick={() => statusFilter = 'all'}
					class="{statusFilter === 'all' ? 'button-primary' : 'button-secondary'} button-small"
				>
					All ({tours.length})
				</button>
				<button
					onclick={() => statusFilter = 'active'}
					class="{statusFilter === 'active' ? 'button-primary' : 'button-secondary'} button-small"
				>
					Active ({tours.filter(t => t.status === 'active').length})
				</button>
				<button
					onclick={() => statusFilter = 'draft'}
					class="{statusFilter === 'draft' ? 'button-primary' : 'button-secondary'} button-small"
				>
					Draft ({tours.filter(t => t.status === 'draft').length})
				</button>
			</div>
		</div>
	</div>

	<!-- Copy Error Alert -->
	{#if copyError}
		<div class="mb-4 rounded-xl p-4 alert-error animate-fade-in">
			<div class="flex items-center gap-3">
				<AlertTriangle class="h-5 w-5" />
				<p>{copyError}</p>
			</div>
		</div>
	{/if}
	
	<!-- Tours List -->
	{#if isLoading}
		<div class="flex justify-center py-12">
			<div class="text-center">
				<div class="animate-spin h-8 w-8 mx-auto mb-4 rounded-full border-2" style="border-color: var(--border-secondary); border-top-color: var(--text-secondary);"></div>
				<p class="text-sm" style="color: var(--text-secondary);">Loading tours...</p>
			</div>
		</div>
	{:else if isError}
		<div class="alert-error rounded-xl p-6">
			<div class="flex items-center gap-3">
				<AlertTriangle class="h-5 w-5" />
				<p>Failed to load tours. Please refresh the page.</p>
			</div>
		</div>
	{:else if filteredTours.length === 0}
		<div class="rounded-xl p-12 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			{#if tours.length === 0}
				<Plus class="h-12 w-12 mx-auto mb-4 rounded-full p-3" style="color: var(--text-tertiary); background: var(--bg-secondary);" />
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">No tours yet</h3>
				<p class="text-sm mb-6" style="color: var(--text-secondary);">Create your first tour to start accepting bookings</p>
				<button onclick={() => goto('/tours/new')} class="button-primary button-gap">
					<Plus class="h-4 w-4" />
					Create Your First Tour
				</button>
			{:else}
				<Search class="h-12 w-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">No tours found</h3>
				<p class="text-sm mb-6" style="color: var(--text-secondary);">Try adjusting your search or filters</p>
				<button onclick={() => { searchQuery = ''; statusFilter = 'all'; }} class="button-secondary">
					Clear filters
				</button>
			{/if}
		</div>
	{:else}
		<!-- Mobile: Full-width horizontal cards -->
		<div class="sm:hidden space-y-3">
			{#each filteredTours as tour (tour.id)}
				<div 
					in:fade={{ duration: 200 }}
					out:fade={{ duration: deletingTourIds.has(tour.id) ? 300 : 200 }}
					class="rounded-xl transition-all tour-card-mobile cursor-pointer {recentlyUpdated === tour.id ? 'recently-updated' : ''} {deletingTourIds.has(tour.id) ? 'deleting' : ''}"
					style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
					onclick={(e) => {
						// Don't navigate if clicking on buttons
						if (!(e.target as HTMLElement).closest('button, a')) {
							goto(`/tours/${tour.id}`);
						}
					}}
					role="button"
					tabindex="0"
					onkeydown={(e) => {
						if (e.key === 'Enter' && !(e.target as HTMLElement).closest('button, a')) {
							goto(`/tours/${tour.id}`);
						}
					}}
				>
					<!-- Calendar Color Strip -->
					<div class="tour-color-strip-mobile" style="background-color: {getTourCalendarColor(tour.id, tour.name)}"></div>

					<div class="flex gap-3 p-3">
						<!-- Tour Image - Left side -->
						<div class="w-24 h-24 flex-shrink-0 rounded-lg relative tour-image-container" style="background: var(--bg-secondary); overflow: hidden;">
							{#if tour.images && tour.images[0]}
								<img 
									src={getTourImageUrl(tour)} 
									alt={tour.name}
									class="w-full h-full object-cover"
									loading="lazy"
								/>
							{:else}
								<div class="w-full h-full flex items-center justify-center">
									<MapPin class="h-8 w-8" style="color: var(--text-tertiary);" />
								</div>
							{/if}
							
							<!-- Status Badge on image -->
							<div class="absolute bottom-1 left-1">
								<span class="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full border transition-all duration-300 {recentlyUpdated === tour.id ? 'scale-110' : ''} {tour.status === 'active' ? 'status-confirmed' : 'status-default'}">
									<CircleDot class="h-2.5 w-2.5" />
									{tour.status === 'active' ? 'Active' : 'Draft'}
								</span>
							</div>
						</div>

						<!-- Tour Info - Right side -->
						<div class="flex-1 min-w-0 flex flex-col">
							<!-- Tour Name -->
							<h3 class="font-semibold text-base mb-1 line-clamp-1" style="color: var(--text-primary);">
								{tour.name}
							</h3>
							
							<!-- Location -->
							<div class="text-xs mb-2 line-clamp-1" style="color: var(--text-secondary);">
								<MapPin class="inline h-3 w-3 -mt-0.5" />
								<span>{tour.location || 'Location not set'}</span>
							</div>
							
							<!-- Price & Duration -->
							<div class="flex items-center gap-2 mb-2 flex-wrap">
								<span class="font-semibold text-sm" style="color: var(--color-primary-600);">
									{getTourDisplayPriceFormatted(tour)}
								</span>
								<span class="text-xs" style="color: var(--text-tertiary);">
									•
								</span>
								<span class="text-xs" style="color: var(--text-tertiary);">
									<Clock class="inline h-3 w-3 -mt-0.5" />
									{formatDuration(tour.duration)}
								</span>
							</div>
							
							<!-- Stats -->
							<div class="text-xs mb-2" style="color: var(--text-tertiary);">
								<Eye class="inline h-3 w-3 -mt-0.5" />
								<span>{tour.qrScans || 0}</span>
								<span class="mx-1.5">•</span>
								<Users class="inline h-3 w-3 -mt-0.5" />
								<span>{tour.qrConversions || 0}</span>
								{#if tour.hasFutureBookings}
									<span class="mx-1.5">•</span>
									<Calendar class="inline h-3 w-3 -mt-0.5" style="color: var(--color-warning-600);" />
								{/if}
							</div>
							
							<!-- Actions -->
							<div class="flex gap-2 mt-auto">
								{#if tour.status === 'draft'}
									{#if canActivateTour(tour)}
										<button 
											onclick={(e) => { e.stopPropagation(); updateTourStatus(tour.id, 'active'); }}
											class="flex-1 button-primary button-small text-xs py-2"
										>
											<CheckCircle class="h-3.5 w-3.5" />
											<span>Activate</span>
										</button>
									{:else}
										<button 
											onclick={(e) => { e.stopPropagation(); }}
											class="flex-1 button-secondary button-small text-xs py-2 opacity-50 cursor-not-allowed"
											disabled
										>
											<AlertTriangle class="h-3.5 w-3.5" />
											<span>Setup Required</span>
										</button>
									{/if}
								{:else}
									<button 
										onclick={(e) => { e.stopPropagation(); goto(`/tours/${tour.id}/edit`); }}
										class="flex-1 button-secondary button-small text-xs py-2"
									>
										<Edit class="h-3.5 w-3.5" />
										<span>Edit</span>
									</button>
								{/if}
								
								<!-- More Actions Dropdown -->
								<div class="relative dropdown-container">
									<button
										onclick={(e) => { 
											e.stopPropagation(); 
											if (actionMenuOpen !== tour.id) {
												dropdownOpenUpwards[tour.id] = checkDropdownPosition(e);
											}
											actionMenuOpen = actionMenuOpen === tour.id ? null : tour.id; 
										}}
										class="button-secondary button-small button-icon py-2 px-3"
										style="position: relative; z-index: 1;"
									>
										<MoreVertical class="h-4 w-4" />
									</button>
									
									{#if actionMenuOpen === tour.id}
										<div 
											class="absolute right-0 w-52 rounded-lg shadow-xl mobile-dropdown-menu"
											style="{dropdownOpenUpwards[tour.id] ? 'bottom: 100%; margin-bottom: 0.5rem;' : 'top: 100%; margin-top: 0.5rem;'} background: var(--bg-primary); border: 1px solid var(--border-primary); z-index: 10;"
											onclick={(e) => e.stopPropagation()}
											onkeydown={(e) => e.stopPropagation()}
											role="menu"
											tabindex="0"
										>
											<button
												onclick={() => { actionMenuOpen = null; goto(`/tours/${tour.id}`); }}
												class="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors rounded-t-lg"
												style="color: var(--text-primary); background: transparent;"
												onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
												onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
											>
												<Settings class="h-4 w-4" />
												<span>Manage Tour</span>
											</button>
											{#if tour.status === 'draft' && canActivateTour(tour)}
												<!-- Show Edit option when Activate button is on card -->
												<button
													onclick={() => { actionMenuOpen = null; goto(`/tours/${tour.id}/edit`); }}
													class="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors"
													style="color: var(--text-primary); background: transparent;"
													onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
													onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
												>
													<Edit class="h-4 w-4" />
													<span>Edit Tour</span>
												</button>
											{/if}
											<button
												onclick={() => { actionMenuOpen = null; goto(`/bookings?tour=${tour.id}`); }}
												class="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors"
												style="color: var(--text-primary); background: transparent;"
												onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
												onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
											>
												<Calendar class="h-4 w-4" />
												<span>View Bookings</span>
											</button>
											{#if tour.qrCode}
												<button
													onclick={() => { actionMenuOpen = null; window.open(`/book/${tour.qrCode}`, '_blank'); }}
													class="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors"
													style="color: var(--text-primary); background: transparent;"
													onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
													onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
												>
													<ExternalLink class="h-4 w-4" />
													<span>Preview Page</span>
												</button>
											{/if}
											<button
												onclick={() => { actionMenuOpen = null; copyTour(tour.id); }}
												class="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors"
												style="color: var(--text-primary); background: transparent;"
												onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
												onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
												disabled={copyingTourId === tour.id}
											>
												{#if copyingTourId === tour.id}
													<div class="animate-spin h-4 w-4 rounded-full border-2" style="border-color: var(--border-secondary); border-top-color: var(--text-secondary);"></div>
													<span>Copying...</span>
												{:else}
													<Copy class="h-4 w-4" />
													<span>Duplicate Tour</span>
												{/if}
											</button>
											{#if tour.status === 'active'}
												<button
													onclick={() => { actionMenuOpen = null; updateTourStatus(tour.id, 'draft'); }}
													class="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors"
													style="color: var(--text-primary); background: transparent;"
													onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
													onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
												>
													<CircleDot class="h-4 w-4" />
													<span>Set to Draft</span>
												</button>
											{/if}
											<hr style="border-color: var(--border-primary); margin: 0;" />
											{#if tour.hasFutureBookings}
												<button
													class="w-full px-4 py-2 text-left text-sm flex items-center gap-3 cursor-not-allowed opacity-50 rounded-b-lg"
													style="color: var(--text-tertiary); background: transparent;"
													disabled
												>
													<Calendar class="h-4 w-4" />
													<span>Has Upcoming Bookings</span>
												</button>
											{:else}
												<button
													onclick={() => { actionMenuOpen = null; tourToDelete = tour; showDeleteModal = true; }}
													class="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors rounded-b-lg"
													style="color: var(--color-error); background: transparent;"
													onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger-light)'}
													onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
												>
													<Trash2 class="h-4 w-4" />
													<span>Delete Tour</span>
												</button>
											{/if}
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Desktop: Grid layout -->
		<div class="hidden sm:grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredTours as tour, i (tour.id)}
				<div 
					in:fade={{ duration: 200 }}
					out:fade={{ duration: deletingTourIds.has(tour.id) ? 300 : 200 }}
					class="rounded-xl transition-all hover:shadow-md tour-card cursor-pointer flex flex-col {recentlyUpdated === tour.id ? 'recently-updated' : ''} {deletingTourIds.has(tour.id) ? 'deleting' : ''}"
					style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
					onmouseenter={(e) => e.currentTarget.style.borderColor = 'var(--border-secondary)'}
					onmouseleave={(e) => e.currentTarget.style.borderColor = 'var(--border-primary)'}
					onclick={(e) => {
						// Don't navigate if clicking on buttons
						if (!(e.target as HTMLElement).closest('button, a')) {
							goto(`/tours/${tour.id}`);
						}
					}}
					role="button"
					tabindex="0"
					onkeydown={(e) => {
						if (e.key === 'Enter' && !(e.target as HTMLElement).closest('button, a')) {
							goto(`/tours/${tour.id}`);
						}
					}}
				>
					<!-- Calendar Color Strip -->
					<div class="tour-color-strip" style="background-color: {getTourCalendarColor(tour.id, tour.name)}">
						<div class="tour-color-strip-inner"></div>
					</div>

					<!-- Tour Image -->
					<div class="h-48 relative" style="background: var(--bg-secondary);">
						{#if tour.images && tour.images[0]}
							<img 
								src={getTourImageUrl(tour)} 
								alt={tour.name}
								class="w-full h-full object-cover"
								loading="lazy"
							/>
						{:else}
							<div class="w-full h-full flex items-center justify-center">
								<MapPin class="h-12 w-12" style="color: var(--text-tertiary);" />
							</div>
						{/if}
						
						<!-- Status Badge -->
						<div class="absolute top-3 left-3">
							<span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-all duration-300 {recentlyUpdated === tour.id ? 'scale-110' : ''} {tour.status === 'active' ? 'status-confirmed' : 'status-default'}">
								<CircleDot class="h-3 w-3" />
								{tour.status === 'active' ? 'Active' : 'Draft'}
							</span>
						</div>
					</div>
					
					<!-- Tour Info -->
					<div class="p-6 flex flex-col flex-grow">
						<div class="flex-grow">
							<h3 class="flex font-semibold mb-2 hover:underline line-clamp-2 items-center gap-2 text-lg" style="color: var(--text-primary);">
								<span class="tour-color-dot" style="background-color: {getTourCalendarColor(tour.id, tour.name)}"></span>
								{tour.name}
							</h3>
							
							<!-- Details -->
							<div class="space-y-2 mb-4">
								<div class="flex items-center gap-2 line-clamp-1" style="color: var(--text-secondary);">
									<MapPin class="h-4 w-4 flex-shrink-0" />
									<span class="text-sm">{tour.location || 'Location not set'}</span>
								</div>
								{#if tour.categories && tour.categories.length > 0}
									<div class="flex flex-wrap gap-1 mt-2">
										{#each tour.categories.slice(0, 3) as category}
											<span class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border"
												style="
													background: var(--color-primary-50);
													border-color: var(--color-primary-200);
													color: var(--color-primary-700);
												"
											>
												{formatCategoryName(category)}
											</span>
										{/each}
										{#if tour.categories.length > 3}
											<span class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border"
												style="
													background: var(--bg-secondary);
													border-color: var(--border-primary);
													color: var(--text-tertiary);
												"
											>
												+{tour.categories.length - 3}
											</span>
										{/if}
									</div>
								{/if}
								
								<div class="space-y-1">
									<div class="flex items-center gap-2 text-sm" style="color: var(--text-secondary);">
										<Clock class="h-4 w-4" />
										{formatDuration(tour.duration)}
									</div>
									<div class="flex items-baseline gap-2 flex-wrap">
										<span class="text-lg font-semibold" style="color: var(--color-primary-600);">
											{getTourDisplayPriceFormatted(tour)}
										</span>
									</div>
								</div>
							</div>
						</div>
						
						<!-- Desktop Stats -->
						<div class="grid grid-cols-3 gap-1 text-center mb-4 p-2 rounded-lg" style="background: var(--bg-secondary);">
							<div>
								<p class="text-xs font-medium" style="color: var(--text-primary);">{tour.qrScans || 0}</p>
								<p class="text-xs" style="color: var(--text-tertiary);">Views</p>
							</div>
							<div class="relative">
								<p class="text-xs font-medium flex items-center justify-center gap-1" style="color: var(--text-primary);">
									{tour.qrConversions || 0}
									{#if tour.hasFutureBookings}
										<Tooltip text="Has upcoming bookings" position="top">
											<Calendar class="h-3 w-3" style="color: var(--color-warning-600);" />
										</Tooltip>
									{/if}
								</p>
								<p class="text-xs" style="color: var(--text-tertiary);">Bookings</p>
							</div>
							<div>
								<p class="text-xs font-medium" style="color: var(--text-primary);">{tour.upcomingSlots || 0}</p>
								<p class="text-xs" style="color: var(--text-tertiary);">Upcoming</p>
							</div>
						</div>
						
						<!-- Actions -->
						<div class="flex gap-2 items-center mt-auto">
							<div class="flex gap-2 flex-1">
								<Tooltip text="Manage tour details & schedule" position="top">
									<button onclick={(e) => { e.stopPropagation(); goto(`/tours/${tour.id}`); }} class="flex button-secondary button-small button-gap text-xs sm:text-sm">
										<Settings class="h-4 w-4" />
										<span>Manage</span>
									</button>
								</Tooltip>
								<Tooltip text="Edit tour information" position="top">
									<button onclick={(e) => { e.stopPropagation(); goto(`/tours/${tour.id}/edit`); }} class="flex button-secondary button-small button-gap text-xs sm:text-sm">
										<Edit class="h-4 w-4" />
										<span>Edit</span>
									</button>
								</Tooltip>
								{#if tour.status === 'draft'}
									{#if canActivateTour(tour)}
										<button 
											onclick={(e) => { e.stopPropagation(); updateTourStatus(tour.id, 'active'); }}
											class="flex button-primary button-small button-gap text-xs sm:text-sm"
										>
											<CheckCircle class="h-4 w-4" />
											<span>Activate</span>
										</button>
									{:else}
										<Tooltip text={`Complete onboarding first: ${getTourOnboardingMessage(tour)}`} position="top">
											<button 
												class="flex button-secondary button-small button-gap opacity-50 cursor-not-allowed text-xs sm:text-sm"
												disabled
											>
												<CheckCircle class="h-4 w-4" />
												<span>Activate</span>
											</button>
										</Tooltip>
									{/if}
								{/if}
							</div>
							
							<!-- More Actions -->
							<div class="relative dropdown-container">
								<Tooltip text="More actions" position="top">
									<button
										onclick={(e) => { 
											e.stopPropagation(); 
											if (actionMenuOpen !== tour.id) {
												dropdownOpenUpwards[tour.id] = checkDropdownPosition(e);
											}
											actionMenuOpen = actionMenuOpen === tour.id ? null : tour.id; 
										}}
										class="button-secondary button-small button-icon"
									>
										<MoreVertical class="h-4 w-4" />
									</button>
								</Tooltip>
								
								{#if actionMenuOpen === tour.id}
									<div 
										class="absolute w-44 sm:w-48 rounded-lg shadow-lg {(i % 2 === 0) ? 'left-0 sm:right-0 sm:left-auto' : 'right-0'}"
										style="z-index: var(--z-dropdown); background: var(--bg-primary); border: 1px solid var(--border-primary); {dropdownOpenUpwards[tour.id] ? 'bottom: 100%; margin-bottom: 0.5rem;' : 'top: 100%; margin-top: 0.5rem;'}"
										onclick={(e) => e.stopPropagation()}
										onkeydown={(e) => e.stopPropagation()}
										role="menu"
										tabindex="0"
									>
										<button
											onclick={() => { actionMenuOpen = null; dropdownOpenUpwards = {}; copyTour(tour.id); }}
											class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors rounded-t-lg"
											style="color: var(--text-primary); background: transparent;"
											onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
											onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
											disabled={copyingTourId === tour.id}
										>
											{#if copyingTourId === tour.id}
												<div class="animate-spin h-4 w-4 rounded-full border-2" style="border-color: var(--border-secondary); border-top-color: var(--text-secondary);"></div>
												<span>Duplicating...</span>
											{:else}
												<Copy class="h-4 w-4" />
												<span>Duplicate Tour</span>
											{/if}
										</button>
										<button
											onclick={() => { actionMenuOpen = null; dropdownOpenUpwards = {}; goto(`/bookings?tour=${tour.id}`); }}
											class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors"
											style="color: var(--text-primary); background: transparent;"
											onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
											onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
										>
											<Calendar class="h-4 w-4" />
											<span class="sm:hidden">Bookings</span>
											<span class="hidden sm:inline">Tour Bookings</span>
										</button>
										{#if tour.qrCode}
												<button
													onclick={() => { actionMenuOpen = null; dropdownOpenUpwards = {}; window.open(`/book/${tour.qrCode}`, '_blank'); }}
													class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors"
													style="color: var(--text-primary); background: transparent; text-decoration: none;"
													onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
													onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
												>
													<ExternalLink class="h-4 w-4" />
													<span class="sm:hidden">Preview</span>
													<span class="hidden sm:inline">Preview Booking Page</span>
												</button>
										{/if}
										{#if tour.status === 'active'}
											<button
												onclick={() => {
													actionMenuOpen = null;
													dropdownOpenUpwards = {};
													updateTourStatus(tour.id, 'draft');
												}}
												class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors"
												style="color: var(--text-primary); background: transparent;"
												onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
												onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
											>
												<CircleDot class="h-4 w-4" />
												<span>Set to Draft</span>
											</button>
										{/if}
										<hr style="border-color: var(--border-primary); margin: 0;" />
										{#if tour.hasFutureBookings}
											<Tooltip text="Cannot delete tour with upcoming bookings" position="top">
												<button
													class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 cursor-not-allowed opacity-50 rounded-b-lg"
													style="color: var(--text-tertiary); background: transparent;"
													disabled
												>
													<Calendar class="h-4 w-4" />
													Has Upcoming Bookings
												</button>
											</Tooltip>
										{:else}
											<button
												onclick={() => { actionMenuOpen = null; dropdownOpenUpwards = {}; tourToDelete = tour; showDeleteModal = true; }}
												class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors rounded-b-lg"
												style="color: var(--color-error); background: transparent;"
												onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger-light)'}
												onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
											>
												<Trash2 class="h-4 w-4" />
												Delete
											</button>
										{/if}
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</PageContainer>

<!-- Delete Confirmation Modal -->
<ConfirmationModal
	bind:isOpen={showDeleteModal}
	title="Delete tour?"
	message="Are you sure you want to delete '{tourToDelete?.name}'? This will permanently delete the tour and all associated data, including historical bookings and analytics. This action cannot be undone."
	confirmText={$deleteMutation.isPending ? "Deleting..." : "Delete"}
	cancelText="Cancel"
	variant="danger"
	icon={AlertTriangle}
	onConfirm={confirmDeleteTour}
/>

<!-- Onboarding Required Modal -->
<ConfirmationModal
	bind:isOpen={showOnboardingModal}
	title="Complete Onboarding First"
	message={onboardingModalMessage}
	confirmText="Go to Dashboard"
	cancelText="Cancel"
	variant="info"
	icon={AlertTriangle}
	onConfirm={handleOnboardingModalConfirm}
/>

<!-- Delete Error Modal - Tours with Active Bookings -->
{#if deleteErrorData}
	<ConfirmationModal
		bind:isOpen={showDeleteErrorModal}
		title="Cannot Delete Tour"
		message={`Cannot delete "${deleteErrorData.tourName}" because it has ${deleteErrorData.activeBookings} upcoming booking${deleteErrorData.activeBookings !== 1 ? 's' : ''}.\n\nUpcoming bookings: ${deleteErrorData.activeBookings}\nTotal bookings: ${deleteErrorData.totalBookings}${deleteErrorData.revenue > 0 ? `\nRevenue at risk: ${$globalCurrencyFormatter(deleteErrorData.revenue)}` : ''}\n\nYou must cancel or refund all upcoming bookings before deleting this tour.`}
		variant="warning"
		icon={AlertTriangle}
		confirmText="View Bookings"
		cancelText="Close"
		onConfirm={handleDeleteErrorViewBookings}
		onCancel={handleDeleteErrorClose}
	/>
{/if}

<style>
	/* Desktop tour cards */
	.tour-card {
		/* Don't use overflow-hidden so dropdown can extend outside */
		position: relative;
		transition: opacity 0.3s ease-out;
		/* Remove overflow: hidden to allow dropdown to show */
	}
	
	/* Mobile tour cards - horizontal layout */
	.tour-card-mobile {
		position: relative;
		transition: opacity 0.3s ease-out;
		/* Don't use overflow-hidden so dropdown can extend outside */
	}
	
	/* Calendar color strip at top of card (desktop) */
	.tour-color-strip {
		height: 6px;
		position: relative;
		overflow: hidden;
		border-radius: 0.75rem 0.75rem 0 0; /* Round top corners only */
	}
	
	/* Calendar color strip for mobile (left side) */
	.tour-color-strip-mobile {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		border-radius: 0.75rem 0 0 0.75rem;
	}
	
	.tour-color-strip-inner {
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, rgba(255,255,255,0.2), transparent);
	}
	
	/* Color dot next to tour name */
	.tour-color-dot {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
		box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
	}
	
	/* Dark mode adjustments */
	:global(.dark) .tour-color-strip-inner {
		background: linear-gradient(to bottom, rgba(0,0,0,0.2), transparent);
	}
	
	:global(.dark) .tour-color-dot {
		box-shadow: 0 0 0 2px rgba(255,255,255,0.1);
	}
	
	/* Tour image container adjustment */
	.tour-card > div:nth-child(2) {
		/* The image container */
		overflow: hidden;
	}
	
	/* Ensure dropdown has proper contrast in dark mode */
	:global(.dark) .dropdown-container button {
		color: var(--text-primary) !important;
	}
	
	/* Dropdown menu - ensure it appears above other cards */
	.dropdown-container {
		position: relative;
	}
	
	/* When dropdown is open, increase the entire card z-index */
	.tour-card:has(.dropdown-container > div),
	.tour-card-mobile:has(.dropdown-container > div) {
		z-index: 100;
		position: relative;
	}
	
	/* Dropdown menu itself */
	.dropdown-container > div {
		z-index: 101;
	}
	
	/* Subtle feedback animation when tour is updated */
	.recently-updated {
		animation: subtleHighlight 1.5s ease-out;
	}
	
	@keyframes subtleHighlight {
		0% {
			box-shadow: 0 0 0 0 var(--color-primary-200);
			border-color: var(--color-primary-300);
		}
		50% {
			box-shadow: 0 0 0 3px var(--color-primary-200);
			border-color: var(--color-primary-400);
		}
		100% {
			box-shadow: 0 0 0 0 transparent;
			border-color: var(--border-primary);
		}
	}
	
	/* Visual feedback for deleting tours */
	.deleting {
		opacity: 0.5;
		filter: blur(1px);
		pointer-events: none;
		transform: scale(0.98);
	}
	
	/* Fade in animation */
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.animate-fade-in {
		animation: fadeIn 0.3s ease-out;
	}
</style> 