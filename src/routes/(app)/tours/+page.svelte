<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { PageData } from './$types.js';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { 
		formatDuration,
		getTourStatusColor,
		getTourStatusDot,
		getImageUrl,
		toggleTourStatus,
		getTourBookingStatus,
		calculateConversionRate,
		getConversionRateText,
		getTourDisplayPrice,
		getTourDisplayPriceFormatted
	} from '$lib/utils/tour-helpers-client.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import type { Tour } from '$lib/types.js';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	import { browser } from '$app/environment';
	import { fade, fly, scale } from 'svelte/transition';
	import { onMount } from 'svelte';
	
	// TanStack Query
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { invalidatePublicTourData } from '$lib/queries/public-queries.js';
	
	// Icons
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import Eye from 'lucide-svelte/icons/eye';
	import Plus from 'lucide-svelte/icons/plus';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Clock from 'lucide-svelte/icons/clock';
	import Edit from 'lucide-svelte/icons/edit';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Copy from 'lucide-svelte/icons/copy';
	import Share2 from 'lucide-svelte/icons/share-2';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import Search from 'lucide-svelte/icons/search';
	import Filter from 'lucide-svelte/icons/filter';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import X from 'lucide-svelte/icons/x';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import MoreVertical from 'lucide-svelte/icons/more-vertical';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Star from 'lucide-svelte/icons/star';
	import Activity from 'lucide-svelte/icons/activity';
	import Package from 'lucide-svelte/icons/package';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import PlusCircle from 'lucide-svelte/icons/plus-circle';

	// TanStack Query client for invalidation
	const queryClient = useQueryClient();

	// TanStack Query queries
	const toursStatsQuery = createQuery({
		queryKey: queryKeys.toursStats,
		queryFn: queryFunctions.fetchToursStats,
		staleTime: 0, // Always fresh - refetch on every mount
		gcTime: 5 * 60 * 1000,    // 5 minutes
		refetchOnWindowFocus: true, // Refetch when user returns to tab
		refetchOnMount: 'always', // Always refetch when component mounts
	});

	const userToursQuery = createQuery({
		queryKey: queryKeys.userTours,
		queryFn: queryFunctions.fetchUserTours,
		staleTime: 0, // Always fresh - refetch on every mount
		gcTime: 5 * 60 * 1000,    // 5 minutes
		refetchOnWindowFocus: true, // Refetch when user returns to tab
		refetchOnMount: 'always', // Always refetch when component mounts
	});

	let copiedQRCode = $state<string | null>(null);
	let statusUpdating = $state<string | null>(null);
	let statusSuccess = $state<string | null>(null); // Track successful status changes
	
	// Search and filter state
	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'active' | 'draft'>('all');
	
	// Delete modal state
	let showDeleteModal = $state(false);
	let tourToDelete = $state<any>(null);
	let isDeleting = $state(false);
	
	// Enhanced feedback states
	let tourFeedback = $state<Record<string, { type: 'success' | 'error', message: string }>>({});
	let actionMenuOpen = $state<string | null>(null);
	let deletedTourName = $state<string | null>(null);

	// Initialize state variables (like tour details page pattern)
	let tours = $state<Tour[]>([]);
	let stats = $state({
		totalTours: 0,
		activeTours: 0,
		draftTours: 0,
		totalBookings: 0,
		pendingBookings: 0,
		confirmedBookings: 0,
		totalParticipants: 0,
		monthlyTours: 0,
		monthRevenue: 0
	});

	// Track manual updates to prevent $effect overrides
	let lastManualUpdateTime = $state(0);

	// Sync with query data but don't override recent manual updates
	$effect(() => {
		if ($userToursQuery.data) {
			const timeSinceManualUpdate = Date.now() - lastManualUpdateTime;
			// Only update if no recent manual changes (1 second protection window)
			if (timeSinceManualUpdate > 1000) {
				tours = ($userToursQuery.data as unknown as Tour[]) || [];
			}
		}
	});
	
	$effect(() => {
		if ($toursStatsQuery.data) {
			const timeSinceManualUpdate = Date.now() - lastManualUpdateTime;
			// Only update if no recent manual changes (1 second protection window)
			if (timeSinceManualUpdate > 1000) {
				stats = $toursStatsQuery.data || stats;
			}
		}
	});

	// Loading states
	let isLoading = $derived($toursStatsQuery.isLoading || $userToursQuery.isLoading);
	let isError = $derived($toursStatsQuery.isError || $userToursQuery.isError);
	
	// Filtered tours based on search and status
	let filteredTours = $derived(() => {
		let result = [...tours];
		
		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(tour => 
				tour.name.toLowerCase().includes(query) ||
				tour.description?.toLowerCase().includes(query) ||
				tour.location?.toLowerCase().includes(query) ||
				tour.qrCode?.toLowerCase().includes(query)
			);
		}
		
		// Status filter
		if (statusFilter !== 'all') {
			result = result.filter(tour => tour.status === statusFilter);
		}
		
		return result;
	});

	// Enhanced error parsing function
	function parseErrorMessage(error: any): string {
		if (typeof error === 'string') {
			try {
				const parsed = JSON.parse(error);
				return parsed.message || parsed.error || error;
			} catch (e) {
				return error;
			}
		}
		
		if (error?.message) {
			return error.message;
		}
		
		if (error instanceof Response) {
			return `Request failed with status ${error.status}`;
		}
		
		return 'An unexpected error occurred';
	}
	
	// Enhanced feedback function with better timing
	function showTourFeedback(tourId: string, type: 'success' | 'error', message: string) {
		tourFeedback[tourId] = { type, message };
		setTimeout(() => {
			delete tourFeedback[tourId];
			tourFeedback = tourFeedback;
		}, type === 'success' ? 2500 : 5000); // Shorter success feedback
	}

	// Close action menus when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (actionMenuOpen && !(event.target as HTMLElement).closest('.action-menu-container') && !(event.target as HTMLElement).closest('.dropdown-menu')) {
			actionMenuOpen = null;
		}
	}

	$effect(() => {
		if (browser) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});

	// Position dropdown relative to menu button with viewport boundary checks
	function positionDropdown(node: HTMLElement, tourId: string) {
		const menuButton = document.getElementById(`menu-${tourId}`);
		if (!menuButton) return { destroy() {} };
		
		// Wait for next frame to ensure node is in DOM
		requestAnimationFrame(() => {
			const rect = menuButton.getBoundingClientRect();
			const nodeRect = node.getBoundingClientRect();
			const dropdownHeight = nodeRect.height || 200; // Use actual height or fallback
			const dropdownWidth = nodeRect.width || 192; // Use actual width or fallback
			
			const viewportHeight = window.innerHeight;
			const viewportWidth = window.innerWidth;
			const padding = 8; // Safe padding from edges
			
			// Reset positioning
			node.style.top = 'auto';
			node.style.bottom = 'auto';
			node.style.left = 'auto';
			node.style.right = 'auto';
			
			// Vertical positioning with mobile-specific logic
			const spaceBelow = viewportHeight - rect.bottom - padding;
			const spaceAbove = rect.top - padding;
			
			if (spaceBelow >= dropdownHeight) {
				// Enough space below
				node.style.top = `${rect.bottom + 4}px`;
			} else if (spaceAbove >= dropdownHeight) {
				// Not enough space below, but enough above
				node.style.bottom = `${viewportHeight - rect.top + 4}px`;
			} else {
				// Not enough space in either direction, position to fit best
				if (spaceBelow > spaceAbove) {
					// More space below, position at bottom with max height
					node.style.top = `${rect.bottom + 4}px`;
					node.style.maxHeight = `${spaceBelow}px`;
					node.style.overflowY = 'auto';
				} else {
					// More space above, position at top with max height
					node.style.bottom = `${viewportHeight - rect.top + 4}px`;
					node.style.maxHeight = `${spaceAbove}px`;
					node.style.overflowY = 'auto';
				}
			}
			
			// Horizontal positioning - prioritize staying on screen
			const spaceRight = viewportWidth - rect.right;
			const spaceLeft = rect.left;
			
			// Try to align dropdown's right edge with button's right edge
			const desiredLeft = rect.right - dropdownWidth;
			
			if (desiredLeft >= padding) {
				// Enough space to right-align dropdown with button
				node.style.left = `${desiredLeft}px`;
			} else if (rect.left + dropdownWidth <= viewportWidth - padding) {
				// Not enough space for right-align, try left-align with button
				node.style.left = `${rect.left}px`;
			} else {
				// Not enough space on either side, position from right edge with padding
				node.style.right = `${padding}px`;
				node.style.left = 'auto';
				node.style.width = `${Math.min(dropdownWidth, viewportWidth - (2 * padding))}px`;
			}
		});
		
		return {
			destroy() {}
		};
	}

	function getQRImageUrl(tour: Tour): string {
		if (!tour.qrCode) return '';
		const baseURL = browser ? window.location.origin : 'https://zaur.app';
		return generateQRImageURL(tour.qrCode, {
			size: 150,
			baseURL
		});
	}

	// Fixed image URL function
	function getTourImageUrl(tour: Tour): string {
		if (!tour.images || !tour.images[0]) return '';
		return getImageUrl(tour, tour.images[0]);
	}

	function copyQRUrl(tour: Tour) {
		if (!browser || !tour.qrCode) return;
		const baseURL = window.location.origin;
		const bookingUrl = `${baseURL}/book/${tour.qrCode}`;
		navigator.clipboard.writeText(bookingUrl);
		
		// Show feedback
		copiedQRCode = tour.qrCode;
		showTourFeedback(tour.id, 'success', 'Booking URL copied to clipboard');
		setTimeout(() => {
			copiedQRCode = null;
		}, 2000);
	}

	async function shareQR(tour: Tour) {
		if (!browser || !tour.qrCode) return;
		const baseURL = window.location.origin;
		const bookingUrl = `${baseURL}/book/${tour.qrCode}`;
		
		if (navigator.share) {
			try {
				await navigator.share({
					title: `Book ${tour.name}`,
					text: `Book your tour: ${tour.name}`,
					url: bookingUrl
				});
				showTourFeedback(tour.id, 'success', 'Tour link shared successfully');
			} catch (err) {
				// User cancelled or error - fallback to copy
				if ((err as Error).name !== 'AbortError') {
					copyQRUrl(tour);
				}
			}
		} else {
			// Fallback to copy
			copyQRUrl(tour);
		}
	}

	// Simple, reliable status toggle using the same approach as tour details page
	async function handleTourStatusToggle(tour: Tour) {
		if (!browser || statusUpdating === tour.id) return;
		statusUpdating = tour.id;
		
		try {
			const newStatus = await toggleTourStatus(tour);
			
			if (newStatus) {
				// Set timestamp to prevent $effect overrides
				lastManualUpdateTime = Date.now();
				
				// Update local state directly (like tour details page)
				tours = tours.map(t => t.id === tour.id ? { ...t, status: newStatus } : t);
				
				// Update stats too
				if (newStatus === 'active') {
					stats = { ...stats, activeTours: stats.activeTours + 1, draftTours: Math.max(0, stats.draftTours - 1) };
				} else {
					stats = { ...stats, activeTours: Math.max(0, stats.activeTours - 1), draftTours: stats.draftTours + 1 };
				}
				
				// Update TanStack Query caches directly to avoid "stale" status
				queryClient.setQueryData(queryKeys.userTours, tours);
				queryClient.setQueryData(queryKeys.toursStats, stats);
				
				// Update tour details cache if it exists  
				const currentTourDetails = queryClient.getQueryData(queryKeys.tourDetails(tour.id)) as any;
				if (currentTourDetails?.tour) {
					queryClient.setQueryData(queryKeys.tourDetails(tour.id), {
						...currentTourDetails,
						tour: { ...currentTourDetails.tour, status: newStatus }
					});
				}
				
				// Also invalidate public data if tour has QR code
				if (tour.qrCode) {
					invalidatePublicTourData(queryClient, tour.qrCode);
				}
			}
		} finally {
			statusUpdating = null;
		}
	}
	
	function handleDeleteTour(tour: Tour) {
		tourToDelete = tour;
		showDeleteModal = true;
		actionMenuOpen = null;
	}

	// Enhanced delete function with proper error handling
	async function confirmDeleteTour() {
		if (!tourToDelete) return;
		
		const tourToDeleteId = tourToDelete.id;
		const tourToDeleteStatus = tourToDelete.status;
		const tourToDeleteName = tourToDelete.name;
		
		isDeleting = true;
		try {
			const response = await fetch(`/api/tours/${tourToDeleteId}`, {
				method: 'DELETE'
			});
			
			if (!response.ok) {
				const errorData = await response.text();
				throw new Error(parseErrorMessage(errorData));
			}
			
			showDeleteModal = false;
			tourToDelete = null;
			
			// Show success feedback inline instead of toast
			deletedTourName = tourToDeleteName;
			
			// Immediately invalidate queries to refresh data
			queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });
			queryClient.invalidateQueries({ queryKey: queryKeys.userTours });
			
		} catch (error) {
			console.error('Failed to delete tour:', error);
			showTourFeedback(tourToDeleteId, 'error', parseErrorMessage(error));
		} finally {
			isDeleting = false;
		}
	}

	function handleRefresh() {
		Promise.all([
			queryClient.invalidateQueries({ queryKey: queryKeys.toursStats }),
			queryClient.invalidateQueries({ queryKey: queryKeys.userTours })
		]);
	}

	function toggleActionMenu(tourId: string) {
		actionMenuOpen = actionMenuOpen === tourId ? null : tourId;
	}

	// Force refetch when page is mounted or when coming from tour creation
	onMount(() => {
		// Check if we're coming from tour creation or need a refresh
		const shouldRefresh = page.url.searchParams.get('refresh') === 'true' || 
							 page.url.searchParams.get('created') === 'true';
		
		if (shouldRefresh || !$userToursQuery.data) {
			// Force immediate refetch of both queries
			queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });
			queryClient.invalidateQueries({ queryKey: queryKeys.userTours });
		}
	});

	// Also refetch when navigating to this page
	$effect(() => {
		if (browser && page.url.pathname === '/tours') {
			// Small delay to ensure navigation is complete
			setTimeout(() => {
				queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });
				queryClient.invalidateQueries({ queryKey: queryKeys.userTours });
			}, 50);
		}
	});

</script>

<svelte:head>
	<title>Tours Management - Zaur</title>
	<meta name="description" content="Manage your tour catalog, track performance, and grow your business" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Loading and Error States -->
	{#if isError}
		<div class="rounded-xl p-6 mb-6" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 rounded-full flex items-center justify-center" style="background: var(--color-danger-100);">
						<AlertTriangle class="h-4 w-4" style="color: var(--color-danger-600);" />
					</div>
					<div>
						<p class="font-medium" style="color: var(--color-danger-900);">Failed to load data</p>
						<p class="text-sm" style="color: var(--color-danger-700);">There was an error loading your tours and statistics.</p>
					</div>
				</div>
				<button
					onclick={handleRefresh}
					class="button-secondary button--small button--gap"
				>
					<RefreshCw class="h-4 w-4" />
					Retry
				</button>
			</div>
		</div>
	{/if}

	<!-- Header Section -->
	<div class="mb-6 sm:mb-8 {isLoading ? 'opacity-75' : ''}">
		<!-- Mobile Compact Header -->
		<MobilePageHeader
			title="Tours Management"
			secondaryInfo="{filteredTours().length} of {tours.length} tours"
			quickActions={[
				{
					label: 'New Tour',
					icon: Plus,
					onclick: () => goto('/tours/new'),
					variant: 'primary'
				}
			]}
			infoItems={[
				{
					icon: MapPin,
					label: 'Total',
					value: `${stats.totalTours} tours`
				},
				{
					icon: Activity,
					label: 'Active',
					value: `${stats.activeTours} active`
				},
				{
					icon: DollarSign,
					label: 'Revenue',
					value: $globalCurrencyFormatter(stats.monthRevenue)
				},
				{
					icon: Users,
					label: 'Bookings',
					value: `${stats.totalBookings} total`
				}
			]}
		/>

		<!-- Desktop Header -->
		<div class="hidden sm:block">
			<PageHeader 
				title="Tours Management"
				subtitle="Manage your tour catalog, track performance, and grow your business"
			>
				<div class="flex gap-3">
					<button 
						onclick={handleRefresh}
						class="button-secondary button--small button--gap"
						disabled={isLoading}
					>
						<RefreshCw class="h-4 w-4 {isLoading ? 'animate-spin' : ''}" />
						{isLoading ? 'Loading...' : 'Refresh'}
					</button>
					<button onclick={() => goto('/tours/new')} class="button-primary button--gap">
						<Plus class="h-4 w-4" />
						Create Tour
					</button>
				</div>
			</PageHeader>
		</div>
	</div>

	<!-- Success Banner for Deleted Tours -->
	{#if deletedTourName}
		<div class="mb-6 rounded-xl p-4" style="background: var(--color-success-light); border: 1px solid var(--color-success-200);">
			<div class="flex items-center gap-3">
				<CheckCircle class="h-5 w-5 flex-shrink-0" style="color: var(--color-success);" />
				<div class="flex-1">
					<p class="font-medium" style="color: var(--color-success-900);">
						Tour deleted successfully!
					</p>
					<p class="text-sm mt-1" style="color: var(--color-success-700);">
						"{deletedTourName}" has been removed from your tours.
					</p>
				</div>
				<button
					onclick={() => deletedTourName = null}
					class="p-1 rounded-md hover:bg-green-200 transition-colors"
				>
					<X class="h-4 w-4" style="color: var(--color-success-700);" />
				</button>
			</div>
		</div>
	{/if}

	<!-- Search and Filters -->
	<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="p-4 space-y-4">
			<!-- Search Bar -->
			<div class="relative">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
				<input
					type="search"
					bind:value={searchQuery}
					placeholder="Search tours by name, location, or QR code..."
					class="form-input pl-10"
				/>
				{#if searchQuery}
					<button
						onclick={() => searchQuery = ''}
						class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 transition-colors"
						transition:scale={{ duration: 200 }}
					>
						<X class="h-4 w-4" style="color: var(--text-tertiary);" />
					</button>
				{/if}
			</div>

			<!-- Status Filter Pills -->
			<div class="flex items-center gap-3 flex-wrap">
				<span class="text-sm font-medium" style="color: var(--text-secondary);">Filter:</span>
				<div class="flex gap-2 flex-wrap">
					{#each [
						{ key: 'all', label: 'All Tours' },
						{ key: 'active', label: 'Active' },
						{ key: 'draft', label: 'Draft' }
					] as filterOption}
						<button
							onclick={() => statusFilter = filterOption.key as 'all' | 'active' | 'draft'}
							class="{
								statusFilter === filterOption.key 
									? 'button-primary button--small' 
									: 'button-secondary button--small'
							}"
						>
							{filterOption.label}
							{#if filterOption.key !== 'all'}
								<span class="ml-1.5 text-xs opacity-75">
									({tours.filter(t => t.status === filterOption.key).length})
								</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Tours Section -->
	{#if filteredTours().length === 0}
		<!-- Empty State -->
		<div in:fade={{ duration: 300 }} class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-8 text-center">
				{#if tours.length === 0}
					<div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style="background: var(--color-primary-50);">
						<Package class="h-8 w-8" style="color: var(--color-primary-600);" />
					</div>
					<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">
						Create your first tour
					</h3>
					<p class="text-sm mb-6 max-w-md mx-auto" style="color: var(--text-secondary);">
						Start building your tour business by creating your first tour. Add details, set pricing, and start accepting bookings.
					</p>
					<button onclick={() => goto('/tours/new')} class="button-primary button--gap">
						<Plus class="h-4 w-4" />
						Create Your First Tour
					</button>
				{:else}
					<div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style="background: var(--bg-tertiary);">
						<Search class="h-8 w-8" style="color: var(--text-tertiary);" />
					</div>
					<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">
						No tours found
					</h3>
					<p class="text-sm mb-6 max-w-md mx-auto" style="color: var(--text-secondary);">
						Try adjusting your search terms or filters to find what you're looking for.
					</p>
					<button onclick={() => { searchQuery = ''; statusFilter = 'all'; }} class="button-secondary">
						Clear all filters
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Performance Overview - Using StatsCard for consistency -->
		<div class="hidden sm:block mb-8">
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
				<StatsCard
					title="Total Tours"
					value={stats.totalTours}
					subtitle="{stats.activeTours} active"
					icon={MapPin}
					trend={stats.monthlyTours > 0 ? { value: `+${stats.monthlyTours} this month`, positive: true } : undefined}
					variant="small"
				/>

				<StatsCard
					title="Total Bookings"
					value={stats.totalBookings}
					subtitle="all time"
					icon={BarChart3}
					variant="small"
				/>

				<StatsCard
					title="Monthly Revenue"
											value={$globalCurrencyFormatter(stats.monthRevenue)}
					subtitle="this month"
					icon={DollarSign}
					trend={stats.monthRevenue > 0 ? { value: "This month", positive: true } : undefined}
					variant="small"
				/>

				<StatsCard
					title="Total Participants"
					value={stats.totalParticipants}
					subtitle="all guests served"
					icon={Users}
					variant="small"
				/>
			</div>
		</div>

		<!-- Tours List -->
		<div class="space-y-4">
			{#each filteredTours() as tour, index (tour.id)}
				<div 
					in:fly={{ y: 20, duration: 300, delay: index * 50 }}
					class="rounded-xl transition-all duration-200 {tour.status === 'draft' ? 'opacity-75' : ''}" 
					style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
				>
					<!-- Error Feedback -->
					{#if tourFeedback[tour.id] && tourFeedback[tour.id].type === 'error'}
						<div 
							transition:fly={{ y: -10, duration: 200 }}
							class="absolute top-3 right-3 z-30 px-3 py-2 text-sm font-medium flex items-center gap-2 rounded-lg shadow-lg text-red-800 bg-red-50 border border-red-200"
						>
							<AlertCircle class="h-4 w-4 text-red-600" />
							<span class="text-xs font-medium">{tourFeedback[tour.id].message}</span>
						</div>
					{/if}
					
					<div class="p-4 sm:p-6">
						<!-- Header Row -->
						<div class="flex items-start gap-4 mb-4">
							<!-- Tour Image -->
							<div class="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden" style="background: var(--bg-secondary);">
								{#if tour.images && tour.images[0]}
									<img 
										src={getTourImageUrl(tour)} 
										alt={tour.name}
										class="w-full h-full object-cover"
										loading="lazy"
									/>
								{:else}
									<div class="w-full h-full flex items-center justify-center">
										<MapPin class="h-6 w-6 sm:h-8 sm:w-8" style="color: var(--text-tertiary);" />
									</div>
								{/if}
							</div>
							
							<!-- Tour Info -->
							<div class="flex-1 min-w-0">
								<div class="flex items-start justify-between gap-3 mb-2">
									<div class="flex-1 min-w-0">
										<h3 class="text-lg sm:text-xl font-semibold mb-1" style="color: var(--text-primary);">{tour.name}</h3>
										
										<!-- Status Indicator -->
										<div class="flex items-center gap-2 mb-2">
											{#if tour.status === 'draft'}
												<div class="w-2 h-2 rounded-full bg-gray-400"></div>
												<span class="text-sm" style="color: var(--text-secondary);">Draft</span>
											{:else if getTourBookingStatus(tour).status === 'no-slots'}
												<div class="w-2 h-2 rounded-full bg-orange-400"></div>
												<span class="text-sm" style="color: var(--text-secondary);">Active • No time slots</span>
											{:else}
												<div class="w-2 h-2 rounded-full bg-green-400"></div>
												<span class="text-sm" style="color: var(--text-secondary);">Active • {tour.upcomingSlots} slot{tour.upcomingSlots !== 1 ? 's' : ''}</span>
											{/if}
										</div>
										
										<!-- Tour Details -->
										<div class="flex items-center gap-4 text-sm" style="color: var(--text-secondary);">
											{#if tour.location}
												<div class="flex items-center gap-1">
													<MapPin class="h-3 w-3" />
													<span class="truncate">{tour.location}</span>
												</div>
											{/if}
											<div class="flex items-center gap-1">
												<DollarSign class="h-3 w-3" />
												<span>{getTourDisplayPriceFormatted(tour)}</span>
											</div>
											<div class="flex items-center gap-1">
												<Clock class="h-3 w-3" />
												<span>{formatDuration(tour.duration)}</span>
											</div>
											<div class="flex items-center gap-1">
												<Users class="h-3 w-3" />
												<span>{tour.capacity}</span>
											</div>
										</div>
									</div>
									
									<!-- QR Code (Desktop) -->
									{#if tour.qrCode}
										<div class="hidden sm:block flex-shrink-0">
											<button
												onclick={() => copyQRUrl(tour)}
												class="w-12 h-12 rounded-lg overflow-hidden border transition-colors {copiedQRCode === tour.qrCode ? 'border-green-500' : 'border-gray-200'}"
											>
												{#if copiedQRCode === tour.qrCode}
													<div class="w-full h-full flex items-center justify-center" style="background: var(--color-success-light);">
														<CheckCircle class="h-5 w-5" style="color: var(--color-success);" />
													</div>
												{:else if browser}
													<img 
														src={getQRImageUrl(tour)} 
														alt="QR Code for {tour.name}"
														class="w-full h-full object-cover"
														loading="lazy"
													/>
												{:else}
													<div class="w-full h-full flex items-center justify-center" style="background: var(--bg-tertiary);">
														<QrCode class="h-5 w-5" style="color: var(--text-tertiary);" />
													</div>
												{/if}
											</button>
										</div>
									{/if}
								</div>
							</div>
						</div>

						<!-- Stats Row (Mobile: 2 cols, Desktop: 4 cols) -->
						<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
							<div class="text-center p-2 rounded-lg" style="background: var(--bg-secondary);">
								<p class="text-sm font-semibold" style="color: var(--text-primary);">{tour.qrScans || 0}</p>
								<p class="text-xs" style="color: var(--text-tertiary);">QR scans</p>
							</div>
							<div class="text-center p-2 rounded-lg" style="background: var(--bg-secondary);">
								<p class="text-sm font-semibold text-green-600">{getConversionRateText(tour.qrScans || 0, tour.qrConversions || 0)}</p>
								<p class="text-xs" style="color: var(--text-tertiary);">conversion</p>
							</div>
							<div class="text-center p-2 rounded-lg" style="background: var(--bg-secondary);">
								<p class="text-sm font-semibold" style="color: var(--text-primary);">{tour.qrConversions || 0}</p>
								<p class="text-xs" style="color: var(--text-tertiary);">bookings</p>
							</div>
							<div class="text-center p-2 rounded-lg" style="background: var(--bg-secondary);">
								<p class="text-sm font-semibold" style="color: var(--text-primary);">{tour.capacity}</p>
								<p class="text-xs" style="color: var(--text-tertiary);">capacity</p>
							</div>
						</div>

						<!-- Actions Row -->
						<div class="flex items-center justify-between gap-3">
							<!-- Primary Action -->
							<div class="flex items-center gap-2">
								{#if tour.status === 'draft'}
									<button
										onclick={() => handleTourStatusToggle(tour)}
										disabled={statusUpdating === tour.id}
										class="button-success button--small button--gap"
									>
										{#if statusUpdating === tour.id}
											<div class="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
											<span>Activating...</span>
										{:else}
											<CheckCircle class="w-4 h-4" />
											<span>Activate</span>
										{/if}
									</button>
								{:else if getTourBookingStatus(tour).status === 'no-slots'}
									<button 
										onclick={() => goto(`/tours/${tour.id}/schedule?new=true`)}
										class="button-primary button--small button--gap"
									>
										<Plus class="w-4 h-4" />
										<span>Add Slots</span>
									</button>
								{:else}
									<button 
										onclick={() => goto(`/tours/${tour.id}/schedule`)}
										class="button-secondary button--small button--gap"
									>
										<Calendar class="w-4 h-4" />
										<span>Schedule</span>
									</button>
								{/if}
								
								<!-- Secondary Actions -->
								<button onclick={() => goto(`/tours/${tour.id}`)} class="button-secondary button--small button--gap">
									<Eye class="h-4 w-4" />
									<span class="hidden sm:inline">Details</span>
								</button>
								<button onclick={() => goto(`/tours/${tour.id}/bookings`)} class="button-secondary button--small button--gap">
									<Users class="h-4 w-4" />
									<span class="hidden sm:inline">Bookings</span>
								</button>
							</div>
							
							<!-- Menu -->
							<div class="relative action-menu-container" id="menu-{tour.id}">
								<button
									class="button-secondary button--small button--icon"
									onclick={() => toggleActionMenu(tour.id)}
								>
									<MoreVertical class="h-4 w-4" />
								</button>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Dropdown Menus (positioned outside cards to avoid opacity inheritance) -->
{#each filteredTours() as tour (tour.id)}
	{#if actionMenuOpen === tour.id}
		<div 
			transition:scale={{ duration: 200, start: 0.95 }}
			class="fixed w-48 rounded-lg shadow-lg z-50 overflow-hidden dropdown-menu" 
			style="background: var(--bg-primary); border: 1px solid var(--border-primary); max-width: calc(100vw - 16px);"
			use:positionDropdown={tour.id}
		>
			<button
				onclick={() => {
					actionMenuOpen = null;
					goto(`/tours/${tour.id}/edit`);
				}}
				class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
				style="color: var(--text-primary);"
			>
				<Edit class="h-4 w-4" />
				Edit Tour
			</button>
			{#if tour.qrCode}
				<button
					onclick={() => {
						actionMenuOpen = null;
						shareQR(tour);
					}}
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
					style="color: var(--text-primary);"
				>
					<Share2 class="h-4 w-4" />
					Share QR Code
				</button>
				<a
					href="/book/{tour.qrCode}"
					target="_blank"
					rel="noopener noreferrer"
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
					style="color: var(--text-primary);"
				>
					<ExternalLink class="h-4 w-4" />
					Preview Booking Page
				</a>
			{/if}
			{#if tour.status === 'active'}
				<button
					onclick={() => {
						actionMenuOpen = null;
						handleTourStatusToggle(tour);
					}}
					disabled={statusUpdating === tour.id}
					class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors"
					class:opacity-50={statusUpdating === tour.id}
					class:hover:bg-gray-50={statusUpdating !== tour.id}
					style="color: var(--text-secondary);"
				>
					{#if statusUpdating === tour.id}
						<div class="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin"></div>
					{:else}
						<Package class="h-4 w-4" />
					{/if}
					Set to Draft
				</button>
			{/if}
			<hr style="border-color: var(--border-primary);" />
			<button
				onclick={() => {
					actionMenuOpen = null;
					handleDeleteTour(tour);
				}}
				class="w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 transition-colors"
				style="color: var(--color-danger-600);"
			>
				<Trash2 class="h-4 w-4" />
				Delete Tour
			</button>
		</div>
	{/if}
{/each}

<!-- Enhanced Delete Confirmation Modal -->
<ConfirmationModal
	bind:isOpen={showDeleteModal}
	title="Delete tour permanently?"
	message="Are you sure you want to delete '{tourToDelete?.name}'? This action cannot be undone and will delete all related bookings and time slots."
	confirmText={isDeleting ? "Deleting..." : "Delete Tour"}
	cancelText="Cancel"
	variant="danger"
	icon={AlertTriangle}
	onConfirm={confirmDeleteTour}
/>

<style>
	/* Line clamp utility */
	.line-clamp-1 {
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 1;
		line-clamp: 1;
		-webkit-box-orient: vertical;
	}
	
	/* Action menu container */
	.action-menu-container {
		position: relative;
	}
</style> 