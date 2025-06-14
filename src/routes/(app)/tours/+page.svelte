<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types.js';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { 
		formatDuration,
		getTourStatusColor,
		getTourStatusDot,
		getImageUrl,
		toggleTourStatus
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

	// Use TanStack Query data with fallbacks - make mutable for local updates
	let tours = $state<Tour[]>([]);
	let stats = $state({
		totalTours: 0,
		activeTours: 0,
		draftTours: 0,
		monthlyTours: 0,
		totalRevenue: 0,
		todayBookings: 0,
		weekBookings: 0,
		monthRevenue: 0,
		totalBookings: 0,
		confirmedBookings: 0,
		totalParticipants: 0
	});
	
	// Update local state when query data changes
	$effect(() => {
		if ($userToursQuery.data) {
			tours = ($userToursQuery.data as unknown as Tour[]) || [];
		}
	});
	
	$effect(() => {
		if ($toursStatsQuery.data) {
			stats = $toursStatsQuery.data || stats;
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
		if (actionMenuOpen && !(event.target as HTMLElement).closest('.action-menu-container')) {
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
				// Update local state immediately - this triggers reactivity
				tours = tours.map(t => 
					t.id === tour.id 
						? { ...t, status: newStatus }
						: t
				);
				
				// Update stats locally too
				if (newStatus === 'active') {
					stats = { ...stats, activeTours: stats.activeTours + 1, draftTours: Math.max(0, stats.draftTours - 1) };
				} else {
					stats = { ...stats, activeTours: Math.max(0, stats.activeTours - 1), draftTours: stats.draftTours + 1 };
				}
				
				// Show brief success state
				statusSuccess = tour.id;
				setTimeout(() => {
					statusSuccess = null;
				}, 1500);
				
				// Optionally refetch in background to ensure consistency
				setTimeout(() => {
					queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });
					queryClient.invalidateQueries({ queryKey: queryKeys.userTours });
				}, 100);
			}
		} catch (error) {
			console.error('Failed to toggle tour status:', error);
			showTourFeedback(tour.id, 'error', parseErrorMessage(error));
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
			
			// Immediately update local state for instant UI feedback
			tours = tours.filter(t => t.id !== tourToDeleteId);
			
			// Update stats immediately
			stats = {
				...stats,
				totalTours: Math.max(0, stats.totalTours - 1),
				activeTours: tourToDeleteStatus === 'active' ? Math.max(0, stats.activeTours - 1) : stats.activeTours,
				draftTours: tourToDeleteStatus === 'draft' ? Math.max(0, stats.draftTours - 1) : stats.draftTours
			};
			
			showDeleteModal = false;
			tourToDelete = null;
			
			// Show success feedback inline instead of toast
			deletedTourName = tourToDeleteName;
			
			// Invalidate queries in background to ensure consistency
			setTimeout(() => {
				queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });
				queryClient.invalidateQueries({ queryKey: queryKeys.userTours });
			}, 100);
			
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

	function calculateConversionRate(qrScans: number, qrConversions: number): number {
		if (qrScans === 0 || qrConversions === 0) return 0;
		return (qrConversions / qrScans) * 100;
	}

	function toggleActionMenu(tourId: string) {
		actionMenuOpen = actionMenuOpen === tourId ? null : tourId;
	}

	// Force refetch when page is mounted or when coming from tour creation
	onMount(() => {
		// Check if we're coming from tour creation or need a refresh
		const shouldRefresh = $page.url.searchParams.get('refresh') === 'true' || 
							 $page.url.searchParams.get('created') === 'true';
		
		if (shouldRefresh || !$userToursQuery.data) {
			// Force immediate refetch of both queries
			queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });
			queryClient.invalidateQueries({ queryKey: queryKeys.userTours });
		}
	});

	// Also refetch when navigating to this page
	$effect(() => {
		if (browser && $page.url.pathname === '/tours') {
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
					class="rounded-xl relative" 
					style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
				>
					<!-- Error Feedback Only (Success is shown in button) -->
					{#if tourFeedback[tour.id] && tourFeedback[tour.id].type === 'error'}
						<div 
							transition:fly={{ y: -10, duration: 200 }}
							class="absolute top-3 right-3 z-30 px-3 py-2 text-sm font-medium flex items-center gap-2 rounded-lg shadow-lg text-red-800 bg-red-50 border border-red-200"
						>
							<AlertCircle class="h-4 w-4 text-red-600" />
							<span class="text-xs font-medium">{tourFeedback[tour.id].message}</span>
						</div>
					{/if}
					
					<!-- Mobile Layout -->
					<div class="sm:hidden">
						<div class="p-4 space-y-4">
							<!-- Tour Image & Header -->
							<div class="flex gap-3">
								<!-- Tour Image -->
								<div class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden" style="background: var(--bg-secondary);">
									{#if tour.images && tour.images[0]}
										<img 
											src={getTourImageUrl(tour)} 
											alt={tour.name}
											class="w-full h-full object-cover"
											loading="lazy"
										/>
									{:else}
										<div class="w-full h-full flex items-center justify-center">
											<MapPin class="h-6 w-6" style="color: var(--text-tertiary);" />
										</div>
									{/if}
								</div>
								
								<!-- Header with Status and Actions -->
								<div class="flex-1 min-w-0">
									<div class="flex items-start justify-between mb-1">
										<h3 class="text-lg font-semibold truncate" style="color: var(--text-primary);">{tour.name}</h3>
										<div class="flex items-center gap-1 ml-2">
											<button
												onclick={() => handleTourStatusToggle(tour)}
												disabled={statusUpdating === tour.id}
												class="group relative inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 {
													statusSuccess === tour.id 
														? 'bg-green-100 text-green-700 border-green-300' 
														: getTourStatusColor(tour.status)
												}"
											>
												{#if statusUpdating === tour.id}
													<div class="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
													<span>...</span>
												{:else if statusSuccess === tour.id}
													<CheckCircle class="w-2.5 h-2.5 text-green-600" />
													<span>✓</span>
												{:else}
													<span class="w-1.5 h-1.5 rounded-full {getTourStatusDot(tour.status)} transition-colors duration-200"></span>
													<span class="transition-colors duration-200">
														{tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
													</span>
												{/if}
											</button>
											<div class="relative action-menu-container">
												<button
													class="p-1 rounded-md hover:bg-gray-100 transition-colors"
													onclick={() => toggleActionMenu(tour.id)}
												>
													<MoreVertical class="h-3 w-3" style="color: var(--text-tertiary);" />
												</button>
												{#if actionMenuOpen === tour.id}
													<div 
														transition:scale={{ duration: 200, start: 0.95 }}
														class="absolute right-0 mt-1 w-40 rounded-lg shadow-lg z-40 overflow-hidden" 
														style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
													>
														<button
															onclick={() => goto(`/tours/${tour.id}/edit`)}
															class="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors"
															style="color: var(--text-primary);"
														>
															<Edit class="h-3 w-3" />
															Edit
														</button>
														<button
															onclick={() => handleDeleteTour(tour)}
															class="w-full px-3 py-2 text-left text-xs hover:bg-red-50 flex items-center gap-2 transition-colors"
															style="color: var(--color-danger-600);"
														>
															<Trash2 class="h-3 w-3" />
															Delete
														</button>
													</div>
												{/if}
											</div>
										</div>
									</div>
									{#if tour.location}
										<p class="text-sm flex items-center gap-1 truncate" style="color: var(--text-secondary);">
											<MapPin class="h-3 w-3 flex-shrink-0" />
											{tour.location}
										</p>
									{/if}
									<p class="text-sm font-medium mt-1" style="color: var(--text-primary);">{$globalCurrencyFormatter(tour.price)}</p>
								</div>
							</div>

							<!-- Quick Stats -->
							<div class="grid grid-cols-3 gap-3">
								<div class="text-center p-2 rounded-lg" style="background: var(--bg-secondary);">
									<p class="text-sm font-semibold" style="color: var(--text-primary);">{formatDuration(tour.duration)}</p>
									<p class="text-xs" style="color: var(--text-tertiary);">duration</p>
								</div>
								<div class="text-center p-2 rounded-lg" style="background: var(--bg-secondary);">
									<p class="text-sm font-semibold" style="color: var(--text-primary);">{tour.capacity}</p>
									<p class="text-xs" style="color: var(--text-tertiary);">max guests</p>
								</div>
								<div class="text-center p-2 rounded-lg" style="background: var(--bg-secondary);">
									<p class="text-sm font-semibold text-green-600">{calculateConversionRate(tour.qrScans || 0, tour.qrConversions || 0).toFixed(0)}%</p>
									<p class="text-xs" style="color: var(--text-tertiary);">conversion</p>
								</div>
							</div>

							<!-- QR Code & Quick Actions -->
							{#if tour.qrCode}
								<div class="flex items-center gap-3 p-3 rounded-lg" style="background: var(--bg-secondary);">
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
									<div class="flex-1">
										<p class="text-sm font-medium" style="color: var(--text-primary);">QR Code</p>
										<p class="text-xs" style="color: var(--text-tertiary);">Tap to copy booking URL</p>
									</div>
									<div class="flex gap-2">
										<Tooltip text="Share" position="top">
											<button onclick={() => shareQR(tour)} class="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center">
												<Share2 class="h-4 w-4" style="color: var(--text-tertiary);" />
											</button>
										</Tooltip>
										<Tooltip text="Preview" position="top">
											<a
												href="/book/{tour.qrCode}"
												target="_blank"
												rel="noopener noreferrer"
												class="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
											>
												<ExternalLink class="h-4 w-4" style="color: var(--text-tertiary);" />
											</a>
										</Tooltip>
									</div>
								</div>
							{/if}

							<!-- Performance Stats -->
							{#if (tour.qrScans && tour.qrScans > 0) || (tour.qrConversions && tour.qrConversions > 0)}
								<div class="grid grid-cols-2 gap-3">
									<div class="text-center p-3 rounded-lg" style="background: var(--bg-secondary);">
										<p class="text-lg font-bold" style="color: var(--text-primary);">{tour.qrScans || 0}</p>
										<p class="text-xs" style="color: var(--text-tertiary);">QR scans</p>
									</div>
									<div class="text-center p-3 rounded-lg" style="background: var(--bg-secondary);">
										<p class="text-lg font-bold text-green-600">{calculateConversionRate(tour.qrScans || 0, tour.qrConversions || 0).toFixed(0)}%</p>
										<p class="text-xs" style="color: var(--text-tertiary);">conversion</p>
									</div>
								</div>
							{/if}

							<!-- Action Buttons -->
							<div class="grid grid-cols-3 gap-2">
								<button onclick={() => goto(`/tours/${tour.id}`)} class="button-primary button--small button--gap">
									<Eye class="h-4 w-4" />
									Details
								</button>
								<button onclick={() => goto(`/tours/${tour.id}/schedule`)} class="button-secondary button--small button--gap">
									<Calendar class="h-4 w-4" />
									Schedule
								</button>
								<button onclick={() => goto(`/tours/${tour.id}/bookings`)} class="button-secondary button--small button--gap">
									<Users class="h-4 w-4" />
									Bookings
								</button>
							</div>
						</div>
					</div>

					<!-- Desktop Layout -->
					<div class="hidden sm:block">
						<div class="p-6">
							<div class="flex gap-4 mb-4">
								<!-- Tour Image -->
								<div class="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden" style="background: var(--bg-secondary);">
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
								</div>
								
								<!-- Tour Info -->
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-3 mb-2">
										<h3 class="text-xl font-semibold" style="color: var(--text-primary);">{tour.name}</h3>
										<button
											onclick={() => handleTourStatusToggle(tour)}
											disabled={statusUpdating === tour.id}
											class="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 {
												statusSuccess === tour.id 
													? 'bg-green-100 text-green-700 border-green-300' 
													: getTourStatusColor(tour.status)
											}"
										>
											{#if statusUpdating === tour.id}
												<div class="w-2 h-2 rounded-full bg-current animate-pulse"></div>
												<span>Updating...</span>
											{:else if statusSuccess === tour.id}
												<CheckCircle class="w-3 h-3 text-green-600" />
												<span>Updated!</span>
											{:else}
												<span class="w-2 h-2 rounded-full {getTourStatusDot(tour.status)} transition-colors duration-200"></span>
												<span class="transition-colors duration-200">
													{tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
												</span>
												<span class="text-xs opacity-60 group-hover:opacity-100 transition-opacity duration-200">
													{tour.status === 'active' ? '→ Draft' : '→ Active'}
												</span>
											{/if}
										</button>
									</div>
									<div class="flex items-center gap-4 text-sm mb-2" style="color: var(--text-secondary);">
										{#if tour.location}
											<div class="flex items-center gap-1">
												<MapPin class="h-4 w-4" />
												{tour.location}
											</div>
										{/if}
										<div class="flex items-center gap-1">
											<DollarSign class="h-4 w-4" />
											{$globalCurrencyFormatter(tour.price)}
										</div>
										<div class="flex items-center gap-1">
											<Clock class="h-4 w-4" />
											{formatDuration(tour.duration)}
										</div>
										<div class="flex items-center gap-1">
											<Users class="h-4 w-4" />
											{tour.capacity} max
										</div>
									</div>
									{#if tour.description}
										<p class="text-sm line-clamp-1" style="color: var(--text-secondary);">
											{tour.description}
										</p>
									{/if}
								</div>
								
								<!-- QR Code Section -->
								{#if tour.qrCode}
									<div class="flex items-center gap-3">
										<button
											onclick={() => copyQRUrl(tour)}
											class="w-16 h-16 rounded-lg overflow-hidden border transition-colors {copiedQRCode === tour.qrCode ? 'border-green-500' : 'border-gray-200'}"
										>
											{#if copiedQRCode === tour.qrCode}
												<div class="w-full h-full flex items-center justify-center" style="background: var(--color-success-light);">
													<CheckCircle class="h-6 w-6" style="color: var(--color-success);" />
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
													<QrCode class="h-6 w-6" style="color: var(--text-tertiary);" />
												</div>
											{/if}
										</button>
										<div class="flex gap-2">
											<Tooltip text="Share" position="top">
												<button onclick={() => shareQR(tour)} class="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center">
													<Share2 class="h-4 w-4" style="color: var(--text-tertiary);" />
												</button>
											</Tooltip>
											<Tooltip text="Preview" position="top">
												<a
													href="/book/{tour.qrCode}"
													target="_blank"
													rel="noopener noreferrer"
													class="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
												>
													<ExternalLink class="h-4 w-4" style="color: var(--text-tertiary);" />
												</a>
											</Tooltip>
										</div>
									</div>
								{/if}
							</div>

							<!-- Performance Metrics -->
							<div class="grid grid-cols-3 gap-4 mb-4">
								<div class="text-center p-3 rounded-lg" style="background: var(--bg-secondary);">
									<BarChart3 class="h-5 w-5 mx-auto mb-1" style="color: var(--text-tertiary);" />
									<p class="text-lg font-semibold text-green-600">{calculateConversionRate(tour.qrScans || 0, tour.qrConversions || 0).toFixed(0)}%</p>
									<p class="text-xs" style="color: var(--text-tertiary);">conversion rate</p>
								</div>
								<div class="text-center p-3 rounded-lg" style="background: var(--bg-secondary);">
									<QrCode class="h-5 w-5 mx-auto mb-1" style="color: var(--text-tertiary);" />
									<p class="text-lg font-semibold" style="color: var(--text-primary);">{tour.qrScans || 0}</p>
									<p class="text-xs" style="color: var(--text-tertiary);">QR scans</p>
								</div>
								<div class="text-center p-3 rounded-lg" style="background: var(--bg-secondary);">
									<Users class="h-5 w-5 mx-auto mb-1" style="color: var(--text-tertiary);" />
									<p class="text-lg font-semibold" style="color: var(--text-primary);">{tour.qrConversions || 0}</p>
									<p class="text-xs" style="color: var(--text-tertiary);">bookings</p>
								</div>
							</div>

							<!-- Action Buttons -->
							<div class="flex items-center gap-2">
								<button onclick={() => goto(`/tours/${tour.id}`)} class="button-primary button--small button--gap">
									<Eye class="h-4 w-4" />
									Details
								</button>
								<button onclick={() => goto(`/tours/${tour.id}/bookings`)} class="button-secondary button--small button--gap">
									<Users class="h-4 w-4" />
									Bookings
								</button>
								<button onclick={() => goto(`/tours/${tour.id}/schedule`)} class="button-secondary button--small button--gap">
									<Calendar class="h-4 w-4" />
									Schedule
								</button>
								<button onclick={() => goto(`/tours/${tour.id}/edit`)} class="button-secondary button--small button--gap">
									<Edit class="h-4 w-4" />
									Edit
								</button>
								<button onclick={() => handleDeleteTour(tour)} class="button--danger button--small button--gap">
									<Trash2 class="h-4 w-4" />
									Delete
								</button>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

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