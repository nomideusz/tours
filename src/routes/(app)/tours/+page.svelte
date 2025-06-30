<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { 
		formatDuration,
		getImageUrl,
		getTourDisplayPriceFormatted
	} from '$lib/utils/tour-helpers-client.js';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import TourStatusToggle from '$lib/components/TourStatusToggle.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import StyledQRCode from '$lib/components/StyledQRCode.svelte';
	import PageContainer from '$lib/components/PageContainer.svelte';
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
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Clock from 'lucide-svelte/icons/clock';
	import Edit from 'lucide-svelte/icons/edit';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Copy from 'lucide-svelte/icons/copy';
	import Search from 'lucide-svelte/icons/search';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import X from 'lucide-svelte/icons/x';
	import MoreVertical from 'lucide-svelte/icons/more-vertical';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import Check from 'lucide-svelte/icons/check';
	import CircleDot from 'lucide-svelte/icons/circle-dot';
	import Baby from 'lucide-svelte/icons/baby';
	import CheckCircle from 'lucide-svelte/icons/check-circle';

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
	let copiedQRCode = $state<string | null>(null);
	
	// Delete modal state
	let showDeleteModal = $state(false);
	let tourToDelete = $state<Tour | null>(null);
	
	// Timeline view state
	let showTimeline = $state(false);
	let timelineView = $state<'day' | 'week' | 'month'>('week');
	let timelineCurrentDate = $state(new Date());
	
	// Feedback state
	let recentlyUpdated = $state<string | null>(null);
	let deletingTourIds = $state<Set<string>>(new Set());
	
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
		try {
			paymentStatus.loading = true;
			const response = await fetch('/api/payments/connect/status');
			const data = await response.json();
			paymentStatus = { 
				isSetup: data.isSetup || false, 
				loading: false 
			};
		} catch (error) {
			console.error('Failed to check payment status:', error);
			paymentStatus = { isSetup: false, loading: false };
		}
	}
	
	// Check if user can activate tours based on onboarding completion
	let activationCheck = $derived(canActivateTours(profile, hasConfirmedLocation, paymentStatus));
	let canActivate = $derived(activationCheck.canActivate);
	let missingSteps = $derived(activationCheck.missingSteps);
	let onboardingMessage = $derived(getOnboardingMessage(missingSteps));
	let nextStep = $derived(getNextOnboardingStep(missingSteps));
	
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
		const dropdownHeight = 250; // Approximate height of dropdown menu
		
		return spaceBelow < dropdownHeight;
	}

	let dropdownOpenUpwards = $state<{ [key: string]: boolean }>({});

	// Track timeouts for proper cleanup
	let copyTimeouts: NodeJS.Timeout[] = [];
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

	async function copyQRUrl(tour: Tour) {
		if (!browser || !tour.qrCode) return;
		try {
			const bookingUrl = `${window.location.origin}/book/${tour.qrCode}`;
			await navigator.clipboard.writeText(bookingUrl);
			copiedQRCode = tour.qrCode;
			const timeoutId = setTimeout(() => {
				copiedQRCode = null;
			}, 2000);
			copyTimeouts.push(timeoutId);
		} catch (err) {
			console.error('Failed to copy URL:', err);
		}
	}

	// Mutations
	const updateStatusMutation = updateTourStatusMutation();
	
	// Custom delete mutation without optimistic updates
	const deleteMutation = createMutation({
		mutationFn: async (tourId: string) => {
			const response = await fetch(`/api/tours/${tourId}`, {
				method: 'DELETE'
			});
			
			if (!response.ok) {
				const error = await response.text();
				throw new Error(error || 'Failed to delete tour');
			}
			
			return response.json().catch(() => ({ success: true }));
		},
		// No onMutate = no optimistic updates
		onSuccess: () => {
			// Invalidate queries to refetch data
			queryClient.invalidateQueries({ queryKey: queryKeys.userTours });
			queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });
		}
	});
	
	async function confirmDeleteTour() {
		if (!tourToDelete) return;
		
		const tourIdToDelete = tourToDelete.id;
		const tourNameToDelete = tourToDelete.name;
		
		try {
			// Add to deleting set
			deletingTourIds.add(tourIdToDelete);
			showDeleteModal = false;
			tourToDelete = null; // Clear immediately
			
			// Force update of the set to trigger reactivity
			deletingTourIds = deletingTourIds;
			
			await $deleteMutation.mutateAsync(tourIdToDelete);
			
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
			
			// Check if it's a structured error with booking details
			if (error?.message) {
				try {
					const errorData = JSON.parse(error.message);
					if (errorData.details && errorData.details.activeBookings > 0) {
						let message = `Cannot delete "${tourNameToDelete}"\n\n`;
						message += `This tour has ${errorData.details.activeBookings} active booking${errorData.details.activeBookings !== 1 ? 's' : ''}.\n\n`;
						if (errorData.details.revenue > 0) {
							message += `• Revenue at risk: €${errorData.details.revenue.toFixed(2)}\n`;
						}
						message += `• Total bookings: ${errorData.details.totalBookings}\n`;
						message += `\nPlease cancel all active bookings before deleting this tour.`;
						alert(message);
					} else {
						alert(errorData.error || 'Failed to delete tour');
					}
				} catch {
					alert(error.message || 'Failed to delete tour');
				}
			} else {
				console.error('Failed to delete tour:', error);
				alert('Failed to delete tour. Please try again.');
			}
		}
	}
	
	async function updateTourStatus(tourId: string, newStatus: 'active' | 'draft') {
		try {
			// Check onboarding completion before allowing activation
			if (newStatus === 'active' && !canActivate) {
				alert(`Complete onboarding first:\n\n${onboardingMessage}\n\nNext step: ${nextStep}`);
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

	// Cleanup timeouts on component destruction
	onDestroy(() => {
		copyTimeouts.forEach(timeout => clearTimeout(timeout));
		statusTimeouts.forEach(timeout => clearTimeout(timeout));
	});
</script>

<svelte:head>
	<title>Tours - Zaur</title>
</svelte:head>

<PageContainer class="py-4 sm:py-8">
	<!-- Header -->
	<div class="mb-6 sm:mb-8">
		<!-- Mobile Header -->
		<MobilePageHeader
			title="Tours"
			secondaryInfo="{filteredTours.length} tours"
			quickActions={[
				{
					label: 'Create',
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
					<button onclick={() => goto('/tours/new')} class="button-primary button--gap">
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
					goto(`/tours/${slot.tourId}`);
				}}
			/>
		</div>
	{/if}

	<!-- Search and Filters -->
	<div class="mb-6 space-y-3">
		<!-- Mobile Search and Filter Tabs -->
		<div class="sm:hidden">
			<div class="relative mb-3">
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
			
			<!-- Mobile Filter Tabs -->
			<div class="flex gap-1 p-1 rounded-lg" style="background: var(--bg-secondary);">
				<button
					onclick={() => statusFilter = 'all'}
					class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors {statusFilter === 'all' ? 'active-filter' : ''}"
					style="color: {statusFilter === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)'}; background: {statusFilter === 'all' ? 'var(--bg-primary)' : 'transparent'}; {statusFilter === 'all' ? 'box-shadow: var(--shadow-sm);' : ''}"
				>
					All ({tours.length})
				</button>
				<button
					onclick={() => statusFilter = 'active'}
					class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors {statusFilter === 'active' ? 'active-filter' : ''}"
					style="color: {statusFilter === 'active' ? 'var(--text-primary)' : 'var(--text-secondary)'}; background: {statusFilter === 'active' ? 'var(--bg-primary)' : 'transparent'}; {statusFilter === 'active' ? 'box-shadow: var(--shadow-sm);' : ''}"
				>
					Active ({tours.filter(t => t.status === 'active').length})
				</button>
				<button
					onclick={() => statusFilter = 'draft'}
					class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors {statusFilter === 'draft' ? 'active-filter' : ''}"
					style="color: {statusFilter === 'draft' ? 'var(--text-primary)' : 'var(--text-secondary)'}; background: {statusFilter === 'draft' ? 'var(--bg-primary)' : 'transparent'}; {statusFilter === 'draft' ? 'box-shadow: var(--shadow-sm);' : ''}"
				>
					Draft ({tours.filter(t => t.status === 'draft').length})
				</button>
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
					class="{showTimeline ? 'button-primary' : 'button-secondary'} button--small button--gap"
				>
					<Calendar class="h-4 w-4" />
					Timeline
				</button>
				<button
					onclick={() => statusFilter = 'all'}
					class="{statusFilter === 'all' ? 'button-primary' : 'button-secondary'} button--small"
				>
					All ({tours.length})
				</button>
				<button
					onclick={() => statusFilter = 'active'}
					class="{statusFilter === 'active' ? 'button-primary' : 'button-secondary'} button--small"
				>
					Active ({tours.filter(t => t.status === 'active').length})
				</button>
				<button
					onclick={() => statusFilter = 'draft'}
					class="{statusFilter === 'draft' ? 'button-primary' : 'button-secondary'} button--small"
				>
					Draft ({tours.filter(t => t.status === 'draft').length})
				</button>
			</div>
		</div>
	</div>

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
				<button onclick={() => goto('/tours/new')} class="button-primary button--gap">
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
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredTours as tour (tour.id)}
				<div 
					in:fade={{ duration: 200 }}
					out:fade={{ duration: deletingTourIds.has(tour.id) ? 300 : 200 }}
					class="rounded-xl transition-all hover:shadow-md tour-card cursor-pointer {recentlyUpdated === tour.id ? 'recently-updated' : ''} {deletingTourIds.has(tour.id) ? 'deleting' : ''}"
					style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
					onmouseenter={(e) => e.currentTarget.style.borderColor = 'var(--border-secondary)'}
					onmouseleave={(e) => e.currentTarget.style.borderColor = 'var(--border-primary)'}
					onclick={(e) => {
						// Don't navigate if clicking on buttons or QR code
						if (!(e.target as HTMLElement).closest('button, a, .qr-button')) {
							goto(`/tours/${tour.id}`);
						}
					}}
					role="button"
					tabindex="0"
					onkeydown={(e) => {
						if (e.key === 'Enter' && !(e.target as HTMLElement).closest('button, a, .qr-button')) {
							goto(`/tours/${tour.id}`);
						}
					}}
				>
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
						
						<!-- QR Code -->
						{#if tour.qrCode}
							<div class="absolute bottom-3 right-3">
								<Tooltip text="Click to copy booking URL" position="top-left">
									<div class="qr-button">
										<StyledQRCode
											qrCode={tour.qrCode}
											tourName={tour.name}
											size={100}
											style="modern"
											onclick={(e) => { e.stopPropagation(); copyQRUrl(tour); }}
										/>
										{#if copiedQRCode === tour.qrCode}
											<div class="absolute top-1 right-1 rounded-full p-1 shadow-sm z-10" style="background: var(--bg-primary); box-shadow: var(--shadow-sm);">
												<Check class="h-3 w-3" style="color: var(--color-success);" />
											</div>
										{/if}
									</div>
								</Tooltip>
							</div>
						{/if}
					</div>
					
					<!-- Tour Info -->
					<div class="p-4 sm:p-6">
						<h3 class="text-lg font-semibold mb-2 hover:underline" style="color: var(--text-primary);">
							{tour.name}
						</h3>
						
						<!-- Details -->
						<div class="space-y-2 mb-4">
							<div class="flex items-center gap-2 text-sm" style="color: var(--text-secondary);">
								<MapPin class="h-3 w-3" />
								{tour.location || 'Location not set'}
							</div>
							<div class="flex items-center gap-4 text-sm" style="color: var(--text-secondary);">
								<div class="flex items-center gap-1">
									<Clock class="h-3 w-3" />
									{formatDuration(tour.duration)}
								</div>
								<div class="flex items-center gap-1">
									<Users class="h-3 w-3" />
									{tour.capacity} max
								</div>
							</div>
							<div class="min-h-[2.5rem] flex items-center">
								<div class="flex items-baseline gap-2 flex-wrap">
									<span class="text-lg font-semibold" style="color: var(--color-primary-600);">
										{getTourDisplayPriceFormatted(tour)}
									</span>
									{#if tour.enablePricingTiers && tour.pricingTiers?.child !== undefined}
										<span class="text-xs" style="color: var(--text-secondary);">
											<Baby class="inline h-3 w-3 -mt-0.5 mr-0.5" />
											{$globalCurrencyFormatter(tour.pricingTiers.child)}
										</span>
									{/if}
								</div>
							</div>
						</div>
						

						
						<!-- Desktop Stats (like tour details page) -->
						<div class="hidden sm:grid grid-cols-4 gap-1 text-center mb-4 p-2 rounded-lg" style="background: var(--bg-secondary);">
							<div>
								<p class="text-xs font-medium" style="color: var(--text-primary);">{tour.qrScans || 0}</p>
								<p class="text-xs" style="color: var(--text-tertiary);">Scans</p>
							</div>
							<div>
								<p class="text-xs font-medium" style="color: var(--text-primary);">{tour.qrConversions || 0}</p>
								<p class="text-xs" style="color: var(--text-tertiary);">Bookings</p>
							</div>
							<div>
								<p class="text-xs font-medium" style="color: var(--text-primary);">{tour.capacity}</p>
								<p class="text-xs" style="color: var(--text-tertiary);">Capacity</p>
							</div>
							<div>
								<p class="text-xs font-medium" style="color: var(--text-primary);">{tour.upcomingSlots || 0}</p>
								<p class="text-xs" style="color: var(--text-tertiary);">Time slots</p>
							</div>
						</div>
						
						<!-- Actions -->
						<div class="flex gap-2 items-center">
							<div class="flex gap-2 flex-1">
								<Tooltip text="Manage tour details & schedule" position="top">
									<button onclick={(e) => { e.stopPropagation(); goto(`/tours/${tour.id}`); }} class="button-secondary button--small button--gap">
										<Settings class="h-4 w-4" />
										<span class="hidden sm:inline">Manage</span>
									</button>
								</Tooltip>
								{#if tour.status === 'draft'}
									{#if canActivate}
										<button 
											onclick={(e) => { e.stopPropagation(); updateTourStatus(tour.id, 'active'); }}
											class="button-primary button--small button--gap"
										>
											<CheckCircle class="h-4 w-4" />
											<span>Activate</span>
										</button>
									{:else}
										<Tooltip text={`Complete onboarding first: ${onboardingMessage}`} position="top">
											<button 
												class="button-secondary button--small button--gap opacity-50 cursor-not-allowed"
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
										class="button-secondary button--small button--icon"
									>
										<MoreVertical class="h-4 w-4" />
									</button>
								</Tooltip>
								
								{#if actionMenuOpen === tour.id}
									<div 
										class="absolute right-0 w-48 rounded-lg shadow-lg"
										style="z-index: var(--z-dropdown); background: var(--bg-primary); border: 1px solid var(--border-primary); {dropdownOpenUpwards[tour.id] ? 'bottom: 100%; margin-bottom: 0.5rem;' : 'top: 100%; margin-top: 0.5rem;'}"
										onclick={(e) => e.stopPropagation()}
										onkeydown={(e) => e.stopPropagation()}
										role="menu"
										tabindex="0"
									>
										<button
											onclick={() => { actionMenuOpen = null; dropdownOpenUpwards = {}; goto(`/tours/${tour.id}/edit`); }}
											class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors rounded-t-lg"
											style="color: var(--text-primary); background: transparent;"
											onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
											onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
										>
											<Edit class="h-4 w-4" />
											<span class="sm:hidden">Edit</span>
											<span class="hidden sm:inline">Edit Tour</span>
										</button>
										<button
											onclick={() => { actionMenuOpen = null; dropdownOpenUpwards = {}; goto(`/tours/${tour.id}/bookings`); }}
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
												<span class="sm:hidden">Draft</span>
												<span class="hidden sm:inline">Set to Draft</span>
											</button>
										{:else}
											<button
												onclick={() => {
													actionMenuOpen = null;
													dropdownOpenUpwards = {};
													updateTourStatus(tour.id, 'active');
												}}
												class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors {!canActivate ? 'opacity-50 cursor-not-allowed' : ''}"
												style="color: {!canActivate ? 'var(--text-tertiary)' : 'var(--text-primary)'}; background: transparent;"
												onmouseenter={(e) => canActivate && (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
												onmouseleave={(e) => canActivate && (e.currentTarget.style.backgroundColor = 'transparent')}
												disabled={!canActivate}
												title={!canActivate ? `Complete onboarding first: ${onboardingMessage}` : ''}
											>
												<CheckCircle class="h-4 w-4" />
												<span class="sm:hidden">Activate</span>
												<span class="hidden sm:inline">Activate Tour</span>
											</button>
										{/if}
										<hr style="border-color: var(--border-primary);" />
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
	message="Are you sure you want to delete '{tourToDelete?.name}'? This action cannot be undone."
	confirmText={$deleteMutation.isPending ? "Deleting..." : "Delete"}
	cancelText="Cancel"
	variant="danger"
	icon={AlertTriangle}
	onConfirm={confirmDeleteTour}
/>

<style>
	.tour-card {
		/* Don't use overflow-hidden so dropdown can extend outside */
		position: relative;
		transition: opacity 0.3s ease-out;
	}
	
	.tour-card > div:first-child {
		/* Only the image container needs overflow hidden */
		overflow: hidden;
		border-radius: 0.75rem 0.75rem 0 0;
	}
	
	/* QR button container */
	.qr-button {
		position: relative;
		display: inline-block;
	}
	
	/* Ensure dropdown has proper contrast in dark mode */
	:global(.dark) .dropdown-container button {
		color: var(--text-primary) !important;
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
</style> 