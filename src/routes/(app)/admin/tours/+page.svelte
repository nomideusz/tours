<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import TableSort from '$lib/components/TableSort.svelte';
	import { formatDate } from '$lib/utils/date-helpers.js';
	import { formatCurrency } from '$lib/utils/currency.js';
	import { isAdmin, isLoading as authLoading } from '$lib/stores/auth.js';
	import { formatDuration } from '$lib/utils/tour-helpers-client.js';
	
	// Icons
	import Search from 'lucide-svelte/icons/search';
	import Filter from 'lucide-svelte/icons/filter';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Calendar from 'lucide-svelte/icons/calendar';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import FileText from 'lucide-svelte/icons/file-text';
	import Settings from 'lucide-svelte/icons/settings';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Eye from 'lucide-svelte/icons/eye';
	import EyeOff from 'lucide-svelte/icons/eye-off';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import MoreVertical from 'lucide-svelte/icons/more-vertical';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import X from 'lucide-svelte/icons/x';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import Package from 'lucide-svelte/icons/package';
	import Activity from 'lucide-svelte/icons/activity';

	const queryClient = useQueryClient();

	// Check admin access
	$effect(() => {
		if (browser && !$authLoading && !$isAdmin) {
			goto('/dashboard');
		}
	});

	// State from URL params
	let searchQuery = $state($page.url.searchParams.get('search') || '');
	let statusFilter = $state($page.url.searchParams.get('status') || 'all');
	let locationFilter = $state($page.url.searchParams.get('location') || '');
	let categoryFilter = $state($page.url.searchParams.get('category') || '');
	let sortBy = $state($page.url.searchParams.get('sortBy') || 'newest');
	let currentPage = $state(parseInt($page.url.searchParams.get('page') || '1'));

	// Local state
	let showFilters = $state(false);
	let searchInput = $state(searchQuery);
	let searchTimeout: NodeJS.Timeout | null = null;
	let actionMenuOpen = $state<string | null>(null);

	// Modal states
	let showDeleteModal = $state(false);
	let tourToDelete = $state<any>(null);

	// Build query params
	let queryParams = $derived({
		search: searchQuery,
		status: statusFilter,
		location: locationFilter,
		category: categoryFilter,
		sortBy,
		page: currentPage,
		limit: 20
	});

	// Main tours query
	const toursQuery = createQuery({
		queryKey: ['admin', 'tours', queryParams],
		queryFn: async () => {
			const params = new URLSearchParams();
			Object.entries(queryParams).forEach(([key, value]) => {
				if (value && value !== 'all') params.set(key, String(value));
			});
			
			const response = await fetch(`/api/admin/tours?${params}`);
			if (!response.ok) throw new Error('Failed to fetch tours');
			return response.json();
		},
		staleTime: 30 * 1000, // 30 seconds
		gcTime: 5 * 60 * 1000, // 5 minutes
	});

	// Mutation for updating tour status
	const updateTourMutation = createMutation({
		mutationFn: async ({ tourId, updates }: { tourId: string; updates: any }) => {
			const response = await fetch(`/api/admin/tours/${tourId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates)
			});
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update tour');
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['admin', 'tours'] });
		}
	});

	// Mutation for deleting tour
	const deleteTourMutation = createMutation({
		mutationFn: async (tourId: string) => {
			const response = await fetch(`/api/admin/tours/${tourId}`, {
				method: 'DELETE'
			});
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete tour');
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['admin', 'tours'] });
			showDeleteModal = false;
			tourToDelete = null;
		}
	});

	// Derived data
	let tours = $derived($toursQuery.data?.tours || []);
	let pagination = $derived($toursQuery.data?.pagination || { total: 0, totalPages: 0 });
	let filters = $derived($toursQuery.data?.filters || { categories: [], locations: [] });
	let isLoading = $derived($toursQuery.isLoading);
	let isError = $derived($toursQuery.isError);

	// Handle search with debouncing
	function handleSearchInput(value: string) {
		searchInput = value;
		if (searchTimeout) clearTimeout(searchTimeout);
		
		if (value.length === 0) {
			searchQuery = '';
			currentPage = 1;
			updateUrl();
		} else if (value.length >= 3) {
			searchTimeout = setTimeout(() => {
				searchQuery = value;
				currentPage = 1;
				updateUrl();
			}, 500);
		}
	}

	// Update URL when filters change
	function updateUrl() {
		const params = new URLSearchParams();
		if (searchQuery) params.set('search', searchQuery);
		if (statusFilter !== 'all') params.set('status', statusFilter);
		if (locationFilter) params.set('location', locationFilter);
		if (categoryFilter) params.set('category', categoryFilter);
		if (sortBy !== 'newest') params.set('sortBy', sortBy);
		if (currentPage > 1) params.set('page', currentPage.toString());
		
		const newUrl = `/admin/tours?${params.toString()}`;
		if (typeof window !== 'undefined' && window.location.pathname + window.location.search !== newUrl) {
			window.history.replaceState({}, '', newUrl);
		}
	}

	// Filter handlers
	function handleFilterChange(key: string, value: string) {
		switch (key) {
			case 'status':
				statusFilter = value;
				break;
			case 'location':
				locationFilter = value;
				break;
			case 'category':
				categoryFilter = value;
				break;
			case 'sortBy':
				sortBy = value;
				break;
		}
		currentPage = 1;
		updateUrl();
	}

	// Clear filters
	function clearFilters() {
		searchQuery = '';
		searchInput = '';
		statusFilter = 'all';
		locationFilter = '';
		categoryFilter = '';
		sortBy = 'newest';
		currentPage = 1;
		updateUrl();
	}

	// Pagination
	function goToPage(page: number) {
		currentPage = page;
		updateUrl();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	// Tour actions
	async function toggleTourStatus(tour: any) {
		const newStatus = tour.status === 'active' ? 'draft' : 'active';
		try {
			await $updateTourMutation.mutateAsync({
				tourId: tour.id,
				updates: { status: newStatus }
			});
		} catch (error) {
			console.error('Failed to update tour status:', error);
		}
		actionMenuOpen = null;
	}

	async function togglePublicListing(tour: any) {
		try {
			await $updateTourMutation.mutateAsync({
				tourId: tour.id,
				updates: { publicListing: !tour.publicListing }
			});
		} catch (error) {
			console.error('Failed to update public listing:', error);
		}
		actionMenuOpen = null;
	}

	function handleDeleteTour(tour: any) {
		tourToDelete = tour;
		showDeleteModal = true;
		actionMenuOpen = null;
	}

	async function confirmDeleteTour() {
		if (!tourToDelete) return;
		try {
			await $deleteTourMutation.mutateAsync(tourToDelete.id);
		} catch (error) {
			console.error('Failed to delete tour:', error);
		}
	}

	// Active filters count
	let activeFiltersCount = $derived.by(() => {
		let count = 0;
		if (searchQuery) count++;
		if (statusFilter !== 'all') count++;
		if (locationFilter) count++;
		if (categoryFilter) count++;
		if (sortBy !== 'newest') count++;
		return count;
	});

	// Click outside handler
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.action-menu-container')) {
			actionMenuOpen = null;
		}
	}

	$effect(() => {
		if (browser) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<svelte:head>
	<title>Tour Management - Admin - Zaur</title>
</svelte:head>

<div class="min-h-screen" style="background: var(--bg-secondary);">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
		<!-- Header -->
		<div class="mb-6 sm:mb-8">
			<!-- Mobile Header -->
			<MobilePageHeader
				title="Tour Management"
				secondaryInfo={isLoading ? 'Loading...' : `${pagination.total} tours`}
				showBackButton={true}
				onBackClick={() => goto('/admin')}
			/>
			
			<!-- Desktop Header -->
			<div class="hidden sm:block">
				<PageHeader 
					title="Tour Management"
					subtitle="Manage tours across the platform"
					breadcrumbs={[
						{ label: 'Admin', href: '/admin' },
						{ label: 'Tour Management' }
					]}
				>
					<div class="flex items-center gap-3">
						{#if !isLoading}
							<span class="text-sm" style="color: var(--text-secondary);">
								{pagination.total} tours total
							</span>
						{/if}
					</div>
				</PageHeader>
			</div>
		</div>

		<!-- Search and Filters -->
		<div class="mb-6">
			<div class="flex flex-col lg:flex-row gap-4">
				<!-- Search Bar -->
				<div class="flex-1">
					<div class="relative">
						<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
						<input
							type="search"
							value={searchInput}
							oninput={(e) => handleSearchInput(e.currentTarget.value)}
							placeholder="Search tours, operators, or locations..."
							class="form-input pl-10 pr-4"
						/>
					</div>
				</div>

				<!-- Filter Toggle (Mobile) -->
				<button
					onclick={() => showFilters = !showFilters}
					class="lg:hidden button-secondary button--gap"
				>
					<Filter class="h-4 w-4" />
					Filters
					{#if activeFiltersCount > 0}
						<span class="ml-auto px-2 py-0.5 text-xs rounded-full" style="background: var(--bg-accent); color: var(--text-on-accent);">
							{activeFiltersCount}
						</span>
					{/if}
				</button>

				<!-- Desktop Filters -->
				<div class="hidden lg:flex items-center gap-3">
					<select
						value={statusFilter}
						onchange={(e) => handleFilterChange('status', e.currentTarget.value)}
						class="form-select cursor-pointer"
					>
						<option value="all">All Status</option>
						<option value="active">Active</option>
						<option value="draft">Draft</option>
					</select>

					<select
						value={sortBy}
						onchange={(e) => handleFilterChange('sortBy', e.currentTarget.value)}
						class="form-select cursor-pointer"
					>
						<option value="newest">Newest First</option>
						<option value="oldest">Oldest First</option>
						<option value="name">Name A-Z</option>
						<option value="revenue">Revenue High-Low</option>
						<option value="bookings">Most Bookings</option>
					</select>

					{#if activeFiltersCount > 0}
						<button onclick={clearFilters} class="button-secondary button--small">
							Clear
						</button>
					{/if}
				</div>
			</div>

			<!-- Mobile Filters -->
			{#if showFilters}
				<div class="lg:hidden mt-4 space-y-3 p-4 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="grid grid-cols-2 gap-3">
						<select
							value={statusFilter}
							onchange={(e) => handleFilterChange('status', e.currentTarget.value)}
							class="form-select cursor-pointer"
						>
							<option value="all">All Status</option>
							<option value="active">Active</option>
							<option value="draft">Draft</option>
						</select>

						<select
							value={sortBy}
							onchange={(e) => handleFilterChange('sortBy', e.currentTarget.value)}
							class="form-select cursor-pointer"
						>
							<option value="newest">Newest First</option>
							<option value="oldest">Oldest First</option>
							<option value="name">Name A-Z</option>
							<option value="revenue">Revenue High-Low</option>
							<option value="bookings">Most Bookings</option>
						</select>
					</div>

					{#if filters.locations.length > 0}
						<select
							value={locationFilter}
							onchange={(e) => handleFilterChange('location', e.currentTarget.value)}
							class="form-select cursor-pointer"
						>
							<option value="">All Locations</option>
							{#each filters.locations as location}
								<option value={location}>{location}</option>
							{/each}
						</select>
					{/if}

					{#if filters.categories.length > 0}
						<select
							value={categoryFilter}
							onchange={(e) => handleFilterChange('category', e.currentTarget.value)}
							class="form-select cursor-pointer"
						>
							<option value="">All Categories</option>
							{#each filters.categories as category}
								<option value={category}>{category}</option>
							{/each}
						</select>
					{/if}

					{#if activeFiltersCount > 0}
						<button onclick={clearFilters} class="button-secondary button--small w-full">
							Clear All Filters
						</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Loading State -->
		{#if isLoading}
			<div class="rounded-xl p-8 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<Loader2 class="h-8 w-8 mx-auto mb-4 animate-spin" style="color: var(--text-accent);" />
				<p style="color: var(--text-secondary);">Loading tours...</p>
			</div>
		
		<!-- Error State -->
		{:else if isError}
			<div class="rounded-xl p-8 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<AlertCircle class="h-12 w-12 mx-auto mb-4" style="color: var(--text-error);" />
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Failed to load tours</h3>
				<p style="color: var(--text-secondary);">Please try again later.</p>
			</div>
		
		<!-- Empty State -->
		{:else if tours.length === 0}
			<div class="rounded-xl p-12 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<Package class="h-12 w-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">No tours found</h3>
				<p class="mb-4" style="color: var(--text-secondary);">
					{activeFiltersCount > 0 ? 'Try adjusting your filters' : 'No tours have been created yet'}
				</p>
				{#if activeFiltersCount > 0}
					<button onclick={clearFilters} class="button-secondary cursor-pointer">
						Clear filters
					</button>
				{/if}
			</div>
		
		<!-- Tours List -->
		{:else}
			<!-- Desktop Table -->
			<div class="hidden lg:block rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
								<th class="text-left px-6 py-4 font-medium" style="color: var(--text-primary);">Tour</th>
								<th class="text-left px-6 py-4 font-medium" style="color: var(--text-primary);">Operator</th>
								<th class="text-left px-6 py-4 font-medium" style="color: var(--text-primary);">Status</th>
								<th class="text-left px-6 py-4 font-medium" style="color: var(--text-primary);">Stats</th>
								<th class="text-left px-6 py-4 font-medium" style="color: var(--text-primary);">Revenue</th>
								<th class="text-left px-6 py-4 font-medium" style="color: var(--text-primary);">Created</th>
								<th class="text-right px-6 py-4 font-medium" style="color: var(--text-primary);">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each tours as tour, i}
								<tr style="border-bottom: 1px solid var(--border-primary);" class="hover:bg-opacity-50 transition-colors" 
									onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
									onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
								>
									<!-- Tour Info -->
									<td class="px-6 py-4">
										<div class="flex items-start gap-3">
											{#if tour.images && tour.images.length > 0}
												<img 
													src="/api/images/{tour.id}/{tour.images[0]}?size=small"
													alt={tour.name}
													class="w-12 h-12 rounded-lg object-cover flex-shrink-0"
												/>
											{:else}
												<div class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style="background: var(--bg-tertiary);">
													<MapPin class="w-6 h-6" style="color: var(--text-tertiary);" />
												</div>
											{/if}
											<div class="min-w-0 flex-1">
												<h3 class="font-medium text-sm line-clamp-1" style="color: var(--text-primary);">{tour.name}</h3>
												<div class="flex items-center gap-4 mt-1 text-xs" style="color: var(--text-secondary);">
													{#if tour.location}
														<span class="flex items-center gap-1">
															<MapPin class="w-3 h-3" />
															{tour.location}
														</span>
													{/if}
													<span class="flex items-center gap-1">
														<Clock class="w-3 h-3" />
														{formatDuration(tour.duration)}
													</span>
													<span class="flex items-center gap-1">
														<Users class="w-3 h-3" />
														{tour.capacity}
													</span>
												</div>
											</div>
										</div>
									</td>

									<!-- Operator -->
									<td class="px-6 py-4">
										<div class="flex items-center gap-2">
											{#if tour.user.avatar}
												<img 
													src={tour.user.avatar.startsWith('/api/') ? tour.user.avatar : `/api/avatars/${tour.user.id}/${tour.user.avatar}`}
													alt={tour.user.name || tour.user.email}
													class="w-8 h-8 rounded-full"
													onerror={(e) => {
														(e.currentTarget as HTMLImageElement).style.display = 'none';
														const fallback = e.currentTarget.nextElementSibling as HTMLElement;
														if (fallback) fallback.style.display = 'flex';
													}}
												/>
												<div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" 
													style="background: var(--bg-secondary); color: var(--text-secondary); display: none;">
													{(tour.user.name || tour.user.email).charAt(0).toUpperCase()}
												</div>
											{:else}
												<div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" 
													style="background: var(--bg-secondary); color: var(--text-secondary);">
													{(tour.user.name || tour.user.email).charAt(0).toUpperCase()}
												</div>
											{/if}
											<div class="min-w-0">
												<p class="text-sm font-medium line-clamp-1" style="color: var(--text-primary);">
													{tour.user.name || tour.user.email}
												</p>
												<p class="text-xs line-clamp-1" style="color: var(--text-secondary);">
													{tour.user.email}
												</p>
											</div>
										</div>
									</td>

									<!-- Status -->
									<td class="px-6 py-4">
										<div class="flex flex-col gap-1">
											<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit
												{tour.status === 'active' ? 'status-confirmed' : 'status-pending'}">
												{#if tour.status === 'active'}
													<CheckCircle class="w-3 h-3" />
												{:else}
													<FileText class="w-3 h-3" />
												{/if}
												{tour.status}
											</span>
											<div class="flex items-center gap-1 text-xs" style="color: var(--text-secondary);">
												{#if tour.publicListing}
													<Eye class="w-3 h-3" />
													<span>Public</span>
												{:else}
													<EyeOff class="w-3 h-3" />
													<span>Private</span>
												{/if}
											</div>
										</div>
									</td>

									<!-- Stats -->
									<td class="px-6 py-4">
										<div class="text-sm space-y-1">
											<div class="flex items-center gap-1" style="color: var(--text-primary);">
												<Calendar class="w-3 h-3" />
												<span>{tour.stats.totalBookings} bookings</span>
											</div>
											<div class="flex items-center gap-1 text-xs" style="color: var(--text-secondary);">
												<Activity class="w-3 h-3" />
												<span>{tour.qrScans} QR scans</span>
											</div>
										</div>
									</td>

									<!-- Revenue -->
									<td class="px-6 py-4">
										<div class="text-sm font-medium" style="color: var(--text-primary);">
											{formatCurrency(tour.stats.totalRevenue, tour.user.currency || 'EUR')}
										</div>
									</td>

									<!-- Created -->
									<td class="px-6 py-4">
										<div class="text-sm" style="color: var(--text-secondary);">
											{formatDate(tour.createdAt)}
										</div>
									</td>

									<!-- Actions -->
									<td class="px-6 py-4">
										<div class="flex items-center justify-end">
											<div class="action-menu-container relative">
												<button
													onclick={(e) => {
														e.stopPropagation();
														actionMenuOpen = actionMenuOpen === tour.id ? null : tour.id;
													}}
													class="p-1.5 rounded-lg hover:bg-opacity-50 transition-colors cursor-pointer"
													style="color: var(--text-secondary); background: transparent;"
													onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
													onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
												>
													<MoreVertical class="w-4 h-4" />
												</button>

												{#if actionMenuOpen === tour.id}
													<div class="absolute right-0 top-full mt-1 w-48 py-1 rounded-lg shadow-lg z-50" 
														style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
														
														<button
															onclick={() => window.open(`/book/${tour.qrCode}`, '_blank')}
															class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors"
															style="color: var(--text-primary); background: transparent;"
															onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
															onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
														>
															<ExternalLink class="h-4 w-4" />
															View Public Page
														</button>

														<button
															onclick={() => toggleTourStatus(tour)}
															class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors"
															style="color: var(--text-primary); background: transparent;"
															onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
															onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
														>
															{#if tour.status === 'active'}
																<FileText class="h-4 w-4" />
																Set to Draft
															{:else}
																<CheckCircle class="h-4 w-4" />
																Activate Tour
															{/if}
														</button>

														<button
															onclick={() => togglePublicListing(tour)}
															class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors"
															style="color: var(--text-primary); background: transparent;"
															onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
															onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
														>
															{#if tour.publicListing}
																<EyeOff class="h-4 w-4" />
																Hide from Discovery
															{:else}
																<Eye class="h-4 w-4" />
																Show in Discovery
															{/if}
														</button>

														<button
															onclick={() => handleDeleteTour(tour)}
															class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors rounded-b-lg"
															style="color: var(--text-error); background: transparent;"
															onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
															onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
														>
															<Trash2 class="h-4 w-4" />
															Delete Tour
														</button>
													</div>
												{/if}
											</div>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Mobile Cards -->
			<div class="lg:hidden space-y-4">
				{#each tours as tour}
					<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<!-- Tour Header -->
						<div class="flex items-start gap-3 mb-4">
							{#if tour.images && tour.images.length > 0}
								<img 
									src="/api/images/{tour.id}/{tour.images[0]}?size=small"
									alt={tour.name}
									class="w-16 h-16 rounded-lg object-cover flex-shrink-0"
								/>
							{:else}
								<div class="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style="background: var(--bg-tertiary);">
									<MapPin class="w-8 h-8" style="color: var(--text-tertiary);" />
								</div>
							{/if}
							
							<div class="flex-1 min-w-0">
								<h3 class="font-semibold text-lg line-clamp-2 mb-1" style="color: var(--text-primary);">{tour.name}</h3>
								<div class="flex items-center gap-1 mb-2">
									<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
										{tour.status === 'active' ? 'status-confirmed' : 'status-pending'}">
										{#if tour.status === 'active'}
											<CheckCircle class="w-3 h-3" />
										{:else}
											<FileText class="w-3 h-3" />
										{/if}
										{tour.status}
									</span>
									
									{#if tour.publicListing}
										<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs" style="background: var(--bg-secondary); color: var(--text-secondary);">
											<Eye class="w-3 h-3" />
											Public
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs" style="background: var(--bg-secondary); color: var(--text-secondary);">
											<EyeOff class="w-3 h-3" />
											Private
										</span>
									{/if}
								</div>
								
								<div class="grid grid-cols-3 gap-2 text-xs" style="color: var(--text-secondary);">
									{#if tour.location}
										<span class="flex items-center gap-1">
											<MapPin class="w-3 h-3" />
											{tour.location}
										</span>
									{/if}
									<span class="flex items-center gap-1">
										<Clock class="w-3 h-3" />
										{formatDuration(tour.duration)}
									</span>
									<span class="flex items-center gap-1">
										<Users class="w-3 h-3" />
										{tour.capacity}
									</span>
								</div>
							</div>

							<!-- Mobile Actions Menu -->
							<div class="action-menu-container relative">
								<button
									onclick={(e) => {
										e.stopPropagation();
										actionMenuOpen = actionMenuOpen === tour.id ? null : tour.id;
									}}
									class="p-2 rounded-lg hover:bg-opacity-50 transition-colors cursor-pointer"
									style="color: var(--text-secondary); background: transparent;"
									onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
									onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
								>
									<MoreVertical class="w-4 h-4" />
								</button>

								{#if actionMenuOpen === tour.id}
									<div class="absolute right-0 top-full mt-1 w-48 py-1 rounded-lg shadow-lg z-50" 
										style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
										
										<button
											onclick={() => window.open(`/book/${tour.qrCode}`, '_blank')}
											class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors"
											style="color: var(--text-primary); background: transparent;"
											onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
											onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
										>
											<ExternalLink class="h-4 w-4" />
											View Public Page
										</button>

										<button
											onclick={() => toggleTourStatus(tour)}
											class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors"
											style="color: var(--text-primary); background: transparent;"
											onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
											onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
										>
											{#if tour.status === 'active'}
												<FileText class="h-4 w-4" />
												Set to Draft
											{:else}
												<CheckCircle class="h-4 w-4" />
												Activate Tour
											{/if}
										</button>

										<button
											onclick={() => togglePublicListing(tour)}
											class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors"
											style="color: var(--text-primary); background: transparent;"
											onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
											onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
										>
											{#if tour.publicListing}
												<EyeOff class="h-4 w-4" />
												Hide from Discovery
											{:else}
												<Eye class="h-4 w-4" />
												Show in Discovery
											{/if}
										</button>

										<button
											onclick={() => handleDeleteTour(tour)}
											class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors rounded-b-lg"
											style="color: var(--text-error); background: transparent;"
											onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
											onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
										>
											<Trash2 class="h-4 w-4" />
											Delete Tour
										</button>
									</div>
								{/if}
							</div>
						</div>

						<!-- Operator Info -->
						<div class="flex items-center gap-2 mb-3 pb-3" style="border-bottom: 1px solid var(--border-primary);">
							{#if tour.user.avatar}
								<img 
									src={tour.user.avatar.startsWith('/api/') ? tour.user.avatar : `/api/avatars/${tour.user.id}/${tour.user.avatar}`}
									alt={tour.user.name || tour.user.email}
									class="w-6 h-6 rounded-full"
								/>
							{:else}
								<div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium" 
									style="background: var(--bg-secondary); color: var(--text-secondary);">
									{(tour.user.name || tour.user.email).charAt(0).toUpperCase()}
								</div>
							{/if}
							<span class="text-sm" style="color: var(--text-secondary);">
								by {tour.user.name || tour.user.email}
							</span>
						</div>

						<!-- Stats -->
						<div class="grid grid-cols-3 gap-4 text-center">
							<div>
								<div class="text-lg font-semibold" style="color: var(--text-primary);">
									{tour.stats.totalBookings}
								</div>
								<div class="text-xs" style="color: var(--text-secondary);">Bookings</div>
							</div>
							<div>
								<div class="text-lg font-semibold" style="color: var(--text-primary);">
									{tour.qrScans}
								</div>
								<div class="text-xs" style="color: var(--text-secondary);">QR Scans</div>
							</div>
							<div>
								<div class="text-lg font-semibold" style="color: var(--text-primary);">
									{formatCurrency(tour.stats.totalRevenue, tour.user.currency || 'EUR')}
								</div>
								<div class="text-xs" style="color: var(--text-secondary);">Revenue</div>
							</div>
						</div>

						<!-- Created Date -->
						<div class="mt-3 pt-3 text-xs text-center" style="border-top: 1px solid var(--border-primary); color: var(--text-tertiary);">
							Created {formatDate(tour.createdAt)}
						</div>
					</div>
				{/each}
			</div>

			<!-- Pagination -->
			{#if pagination.totalPages > 1}
				<div class="mt-8 flex items-center justify-center gap-2">
					<!-- Previous -->
					<button
						onclick={() => goToPage(currentPage - 1)}
						disabled={currentPage === 1}
						class="button-secondary button--small"
						class:opacity-50={currentPage === 1}
						class:cursor-not-allowed={currentPage === 1}
						class:cursor-pointer={currentPage > 1}
					>
						Previous
					</button>
					
					<!-- Page Numbers -->
					<div class="flex items-center gap-1">
						{#each Array(Math.min(5, pagination.totalPages)) as _, i}
							{@const pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2}
							{#if pageNum > 0 && pageNum <= pagination.totalPages}
								<button
									onclick={() => goToPage(pageNum)}
									class="w-10 h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer
										{pageNum === currentPage ? 'button-primary' : 'button-secondary'}"
								>
									{pageNum}
								</button>
							{/if}
						{/each}
					</div>
					
					<!-- Next -->
					<button
						onclick={() => goToPage(currentPage + 1)}
						disabled={currentPage === pagination.totalPages}
						class="button-secondary button--small"
						class:opacity-50={currentPage === pagination.totalPages}
						class:cursor-not-allowed={currentPage === pagination.totalPages}
						class:cursor-pointer={currentPage < pagination.totalPages}
					>
						Next
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && tourToDelete}
	<ConfirmationModal
		title="Delete Tour"
		message="Are you sure you want to delete '{tourToDelete.name}'? This action cannot be undone and will delete all associated bookings and time slots."
		confirmText="Delete Tour"
		cancelText="Cancel"
		variant="danger"
		loading={$deleteTourMutation.isPending}
		onConfirm={confirmDeleteTour}
		onCancel={() => { showDeleteModal = false; tourToDelete = null; }}
	/>
{/if} 