<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { formatEuro } from '$lib/utils/currency.js';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import type { Tour } from '$lib/types.js';
	import type { PageData, ActionData } from './$types.js';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Plus from 'lucide-svelte/icons/plus';
	import Search from 'lucide-svelte/icons/search';
	import Filter from 'lucide-svelte/icons/filter';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Eye from 'lucide-svelte/icons/eye';
	import Edit from 'lucide-svelte/icons/edit';
	import Copy from 'lucide-svelte/icons/copy';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import MoreVertical from 'lucide-svelte/icons/more-vertical';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import UserCheck from 'lucide-svelte/icons/user-check';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let tours = $state<Tour[]>((data.tours as unknown as Tour[]) || []);
	let isLoading = $state(false);
	let isDeletingId = $state<string | null>(null);
	let isDuplicatingId = $state<string | null>(null);
	let error = $state<string | null>(form?.error || null);
	let selectedStatus = $state('all');
	let searchQuery = $state('');
	let showFilters = $state(false);
	let selectedCategory = $state('all');
	let sortBy = $state('recent');
	let openDropdownId = $state<string | null>(null);
	let isFiltering = $state(false);

	// Categories for filtering
	const tourCategories = [
		'City Tours',
		'Nature & Adventure',
		'Food & Wine',
		'Cultural & Historical',
		'Day Trips',
		'Multi-day Tours',
		'Private Tours',
		'Group Tours'
	];

	// Update tours when data changes
	$effect(() => {
		tours = (data.tours as unknown as Tour[]) || [];
	});

	// Close dropdown when clicking outside
	$effect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (!event.target || !(event.target as Element).closest('.dropdown-container')) {
				openDropdownId = null;
			}
		};

		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	function getStatusColor(status: Tour['status']) {
		switch (status) {
			case 'active':
				return 'bg-green-50 text-green-700 border-green-200';
			case 'draft':
				return 'bg-gray-50 text-gray-700 border-gray-200';
			default:
				return 'bg-gray-50 text-gray-700 border-gray-200';
		}
	}

	function getStatusDot(status: Tour['status']) {
		switch (status) {
			case 'active':
				return 'bg-green-500';
			case 'draft':
				return 'bg-gray-500';
			default:
				return 'bg-gray-500';
		}
	}

	// Debounced search query
	let debouncedSearchQuery = $state('');
	
	$effect(() => {
		const timer = setTimeout(() => {
			debouncedSearchQuery = searchQuery;
			isFiltering = false;
		}, 300);
		
		if (searchQuery !== debouncedSearchQuery) {
			isFiltering = true;
		}
		
		return () => {
			clearTimeout(timer);
			isFiltering = false;
		};
	});

	// Filter and sort tours
	let filteredTours = $derived.by(() => {
		let filtered = tours;

		// Status filter
		if (selectedStatus !== 'all') {
			filtered = filtered.filter((tour) => tour.status === selectedStatus);
		}

		// Category filter
		if (selectedCategory !== 'all') {
			filtered = filtered.filter((tour) => tour.category === selectedCategory);
		}

		// Search filter (debounced)
		if (debouncedSearchQuery.trim()) {
			const query = debouncedSearchQuery.toLowerCase();
			filtered = filtered.filter(
				(tour) =>
					tour.name.toLowerCase().includes(query) ||
					tour.description?.toLowerCase().includes(query) ||
					tour.location?.toLowerCase().includes(query)
			);
		}

		// Sorting
		switch (sortBy) {
			case 'name':
				filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
				break;
			case 'price-low':
				filtered = [...filtered].sort((a, b) => a.price - b.price);
				break;
			case 'price-high':
				filtered = [...filtered].sort((a, b) => b.price - a.price);
				break;
			case 'recent':
			default:
				filtered = [...filtered].sort((a, b) => 
					new Date(b.updated).getTime() - new Date(a.updated).getTime()
				);
		}

		return filtered;
	});

	// Use statistics from server
	let stats = $state(data.stats || {
		total: 0,
		active: 0,
		draft: 0,
		totalRevenue: 0,
		todayBookings: 0,
		weekBookings: 0,
		monthRevenue: 0,
		totalBookings: 0,
		confirmedBookings: 0,
		totalParticipants: 0
	});

	function toggleDropdown(tourId: string) {
		openDropdownId = openDropdownId === tourId ? null : tourId;
	}

	function getImageUrl(tour: Tour | null | undefined, imagePath: string | null | undefined): string {
		if (!tour?.id || !imagePath || typeof imagePath !== 'string') return '';
		
		try {
			// Handle old PocketBase URLs
			if (imagePath.startsWith('http')) {
				return imagePath; // Return old URL as-is for backward compatibility
			}
			// Handle new local storage
			return `/uploads/tours/${encodeURIComponent(tour.id)}/${encodeURIComponent(imagePath)}`;
		} catch (error) {
			console.warn('Error generating image URL:', error);
			return '';
		}
	}
</script>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<div class="mb-6 sm:mb-8">
		<PageHeader 
			title="Tours"
			subtitle="Manage and track your tour offerings"
		>
			<button onclick={() => goto('/tours/new')} class="hidden sm:flex button-primary button--gap">
				<Plus class="h-4 w-4 sm:h-5 sm:w-5" />
				Create Tour
			</button>
		</PageHeader>
	</div>

	{#if error}
		<div class="mb-6">
			<ErrorAlert title="Error" message={error} />
		</div>
	{/if}

	<!-- Mobile Quick Actions -->
	<div class="lg:hidden mb-6">
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<h3 class="text-base font-semibold text-gray-900 mb-3">Quick Actions</h3>
			<div class="grid grid-cols-2 gap-3">
				<button
					onclick={() => goto('/tours/new')}
					class="button-primary button--gap button--small justify-center py-3"
				>
					<Plus class="h-4 w-4" />
					New Tour
				</button>
				<button
					onclick={() => goto('/checkin-scanner')}
					class="button-primary button--gap button--small justify-center py-3"
				>
					<UserCheck class="h-4 w-4" />
					QR Scanner
				</button>
			</div>
		</div>
	</div>

	<!-- Quick Stats Dashboard -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8 items-stretch">
		<StatsCard
			title="Today's Bookings"
			value={stats.todayBookings || 0}
			subtitle="bookings for today"
			icon={Calendar}
			variant="small"
		/>

		<StatsCard
			title="Weekly Bookings"
			value={stats.weekBookings || 0}
			subtitle="{stats.totalBookings || 0} total bookings"
			icon={BarChart3}
			trend={stats.weekBookings > 0 ? { value: "This week", positive: true } : undefined}
			variant="small"
		/>

		<StatsCard
			title="Monthly Revenue"
			value={formatEuro(stats.monthRevenue || 0)}
			subtitle="{stats.totalParticipants || 0} total guests"
			icon={DollarSign}
			trend={stats.monthRevenue > 0 ? { value: "This month", positive: true } : undefined}
			variant="small"
		/>

		<StatsCard
			title="Active Tours"
			value="{stats.active || 0}/{stats.total || 0}"
			subtitle="of total tours"
			icon={Eye}
			variant="small"
		/>
	</div>

	<!-- Search and Filters -->
	<div class="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
		<div class="space-y-4">
			<!-- Search -->
			<div class="w-full">
				<div class="relative">
					{#if isFiltering}
						<div class="absolute left-3 top-1/2 -translate-y-1/2">
							<LoadingSpinner size="small" />
						</div>
					{:else}
						<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
					{/if}
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search tours by name, location, or description..."
						class="form-input w-full pl-10 sm:pl-12"
					/>
				</div>
			</div>

			<!-- Filter Controls -->
			<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
				<!-- Filter Toggle & Clear Buttons -->
				<div class="flex items-center gap-3">
					<button
						onclick={() => showFilters = !showFilters}
						class="button-secondary button--gap button--small {showFilters ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}"
					>
						<Filter class="h-4 w-4" />
						<span class="hidden sm:inline">Filters</span>
						<span class="sm:hidden">Filter</span>
						{#if selectedCategory !== 'all' || selectedStatus !== 'all'}
							<span class="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
								{(selectedCategory !== 'all' ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0)}
							</span>
						{/if}
					</button>

					{#if selectedCategory !== 'all' || selectedStatus !== 'all'}
						<button
							onclick={() => { selectedCategory = 'all'; selectedStatus = 'all'; }}
							class="button-secondary button--gap button--small text-red-600 border-red-200 hover:bg-red-50"
						>
							<span class="hidden sm:inline">Clear Filters</span>
							<span class="sm:hidden">Clear</span>
						</button>
					{/if}
				</div>

				<!-- Sort Dropdown -->
				<div class="flex items-center gap-2 sm:ml-auto">
					<span class="text-sm text-gray-600 hidden sm:inline">Sort:</span>
					<select
						bind:value={sortBy}
						class="form-select form-select--small min-w-0"
					>
						<option value="recent">Most Recent</option>
						<option value="name">Name (A-Z)</option>
						<option value="price-low">Price (Low to High)</option>
						<option value="price-high">Price (High to Low)</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Expanded Filters -->
		{#if showFilters}
			<div class="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<div class="block text-sm font-medium text-gray-700 mb-2">Status</div>
					<div class="flex flex-wrap gap-2">
						<button
							onclick={() => selectedStatus = 'all'}
							class="{selectedStatus === 'all' ? 'button-primary' : 'button-secondary'} button--small"
						>
							All Status
						</button>
						<button
							onclick={() => selectedStatus = 'active'}
							class="{selectedStatus === 'active' ? 'button-primary' : 'button-secondary'} button--small"
						>
							Active
						</button>
						<button
							onclick={() => selectedStatus = 'draft'}
							class="{selectedStatus === 'draft' ? 'button-primary' : 'button-secondary'} button--small"
						>
							Draft
						</button>
					</div>
				</div>

				<div>
					<label for="category-select" class="block text-sm font-medium text-gray-700 mb-2">Category</label>
					<select
						id="category-select"
						bind:value={selectedCategory}
						class="form-select form-select--small"
					>
						<option value="all">All Categories</option>
						{#each tourCategories as category}
							<option value={category}>{category}</option>
						{/each}
					</select>
				</div>
			</div>
		{/if}
	</div>

	<!-- Tour Cards Grid -->
	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<LoadingSpinner size="medium" text="Loading tours..." />
		</div>
	{:else if filteredTours.length === 0}
		<div class="bg-white rounded-xl border border-gray-200 p-8 sm:p-12">
			<EmptyState
				icon={searchQuery ? Search : MapPin}
				title={searchQuery ? 'No tours found' : 'No tours yet'}
				description={searchQuery 
					? 'Try adjusting your search or filters to find tours'
					: 'Create your first tour to start receiving bookings'}
				actionText={searchQuery ? 'Clear Filters' : 'Create Your First Tour'}
				onAction={searchQuery 
					? () => { searchQuery = ''; selectedStatus = 'all'; selectedCategory = 'all'; }
					: () => goto('/tours/new')}
			/>
		</div>
	{:else}
		<!-- Results Counter -->
		<div class="mb-4 sm:mb-6 flex items-center justify-between">
			<p class="text-sm text-gray-600">
				Showing {filteredTours.length} of {tours.length} tours
				{#if searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'}
					<span class="text-gray-500">• Filters applied</span>
				{/if}
			</p>
			{#if filteredTours.length !== tours.length}
				<button
					onclick={() => { searchQuery = ''; selectedStatus = 'all'; selectedCategory = 'all'; }}
					class="text-sm text-blue-600 hover:text-blue-700 font-medium"
				>
					Show all tours
				</button>
			{/if}
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
			{#each filteredTours as tour (tour.id)}
				<div class="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 group relative flex flex-col h-full">
					<!-- Tour Image -->
					<div class="relative h-40 sm:h-48 bg-gray-100 overflow-hidden rounded-t-xl flex-shrink-0">
						{#if tour?.images?.[0]}
							{@const imageUrl = getImageUrl(tour, tour.images[0])}
							{#if imageUrl}
								<img 
									src={imageUrl} 
									alt={tour.name || 'Tour'}
									class="w-full h-full object-cover"
									loading="lazy"
								/>
							{:else}
								<div class="w-full h-full flex items-center justify-center">
									<MapPin class="h-8 w-8 sm:h-12 sm:w-12 text-gray-300" />
								</div>
							{/if}
						{:else}
							<div class="w-full h-full flex items-center justify-center">
								<MapPin class="h-8 w-8 sm:h-12 sm:w-12 text-gray-300" />
							</div>
						{/if}
						
						<!-- Status Badge -->
						<div class="absolute top-2 sm:top-3 right-2 sm:right-3">
							<span class="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium {getStatusColor(tour.status)} backdrop-blur-sm">
								<span class="w-1.5 h-1.5 rounded-full {getStatusDot(tour.status)}"></span>
								{tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
							</span>
						</div>

						<!-- Quick Actions on Hover -->
						<div class="absolute inset-0 bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
							<button
								onclick={() => goto(`/tours/${tour.id}`)}
								class="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
								title="View details"
							>
								<Eye class="h-4 w-4 sm:h-5 sm:w-5" />
							</button>
							<button
								onclick={() => goto(`/tours/${tour.id}/edit`)}
								class="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
								title="Edit tour"
							>
								<Edit class="h-4 w-4 sm:h-5 sm:w-5" />
							</button>
							<button
								onclick={() => goto(`/tours/${tour.id}/qr`)}
								class="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
								title="QR codes"
							>
								<QrCode class="h-4 w-4 sm:h-5 sm:w-5" />
							</button>
						</div>
					</div>

					<!-- Tour Content -->
					<div class="p-4 sm:p-5 flex flex-col flex-grow">
						<!-- Title and Category -->
						<div class="mb-3">
							<h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{tour.name}</h3>
							{#if tour.category}
								<span class="text-sm text-gray-500">{tour.category}</span>
							{/if}
						</div>

						<!-- Description -->
						{#if tour.description}
							<p class="text-sm text-gray-600 mb-4 line-clamp-2">{tour.description}</p>
						{/if}

						<!-- Tour Details Grid -->
						<div class="grid grid-cols-2 gap-3 mb-4 flex-grow">
							<div class="flex items-center gap-2 text-sm text-gray-600">
								<DollarSign class="h-4 w-4 text-gray-400 flex-shrink-0" />
								<span class="font-medium">€{tour.price}</span>
							</div>
							<div class="flex items-center gap-2 text-sm text-gray-600">
								<Clock class="h-4 w-4 text-gray-400 flex-shrink-0" />
								<span>{Math.floor(tour.duration / 60)}h {tour.duration % 60}m</span>
							</div>
							<div class="flex items-center gap-2 text-sm text-gray-600">
								<Users class="h-4 w-4 text-gray-400 flex-shrink-0" />
								<span>Max {tour.capacity}</span>
							</div>
							{#if tour.location}
								<div class="flex items-center gap-2 text-sm text-gray-600">
									<MapPin class="h-4 w-4 text-gray-400 flex-shrink-0" />
									<span class="truncate">{tour.location}</span>
								</div>
							{/if}
						</div>

						<!-- Action Buttons -->
						<div class="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
							<div class="flex gap-2">
								<button
									onclick={() => goto(`/tours/${tour.id}`)}
									class="button-primary button--small text-xs sm:text-sm"
								>
									<span class="hidden sm:inline">View Details</span>
									<span class="sm:hidden">Details</span>
								</button>
								<button
									onclick={() => goto(`/tours/${tour.id}/bookings`)}
									class="button-secondary button--small text-xs sm:text-sm"
								>
									Bookings
								</button>
							</div>
							
							<!-- More Options Dropdown -->
							<div class="relative dropdown-container">
								<button
									onclick={() => toggleDropdown(tour.id)}
									class="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
								>
									<MoreVertical class="h-4 w-4 sm:h-5 sm:w-5" />
								</button>
								
								{#if openDropdownId === tour.id}
									<div class="absolute right-0 top-full mt-1 w-44 sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
										<button
											onclick={() => { goto(`/tours/${tour.id}/edit`); openDropdownId = null; }}
											class="w-full flex items-center gap-2 px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
										>
											<Edit class="h-4 w-4" />
											Edit Tour
										</button>
										<button
											onclick={() => { goto(`/tours/${tour.id}/qr`); openDropdownId = null; }}
											class="w-full flex items-center gap-2 px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
										>
											<QrCode class="h-4 w-4" />
											QR Codes
										</button>
										<button
											onclick={() => { goto(`/tours/${tour.id}/schedule`); openDropdownId = null; }}
											class="w-full flex items-center gap-2 px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
										>
											<Calendar class="h-4 w-4" />
											Schedule
										</button>
										<div class="border-t border-gray-100 my-1"></div>
										<form method="POST" action="?/duplicate" use:enhance={() => {
											isDuplicatingId = tour.id;
											return async ({ result }) => {
												isDuplicatingId = null;
												if (result.type === 'success') {
													await invalidateAll();
												}
											};
										}}>
											<input type="hidden" name="tourId" value={tour.id} />
											<button
												type="submit"
												disabled={isDuplicatingId === tour.id}
												class="w-full flex items-center gap-2 px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
											>
												{#if isDuplicatingId === tour.id}
													<LoadingSpinner size="small" />
												{:else}
													<Copy class="h-4 w-4" />
												{/if}
												Duplicate
											</button>
										</form>
										<form method="POST" action="?/delete" use:enhance={() => {
											if (!confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
												return;
											}
											isDeletingId = tour.id;
											return async ({ result }) => {
												isDeletingId = null;
												if (result.type === 'success') {
													await invalidateAll();
												}
											};
										}}>
											<input type="hidden" name="tourId" value={tour.id} />
											<button
												type="submit"
												disabled={isDeletingId === tour.id}
												class="w-full flex items-center gap-2 px-3 sm:px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
											>
												{#if isDeletingId === tour.id}
													<LoadingSpinner size="small" />
												{:else}
													<Trash2 class="h-4 w-4" />
												{/if}
												Delete
											</button>
										</form>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.line-clamp-1 {
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 1;
		line-clamp: 1;
		-webkit-box-orient: vertical;
	}
	
	.line-clamp-2 {
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
</style>
