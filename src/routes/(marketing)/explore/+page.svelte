<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { createPublicToursQuery } from '$lib/queries/public-queries.js';

	import { formatCategoryName } from '$lib/utils/tour-helpers-client.js';
	import CustomSelect from '$lib/components/ui/CustomSelect.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import TourCard from '$lib/components/tour/TourCard.svelte';
	
	// Icons
	import Search from 'lucide-svelte/icons/search';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Filter from 'lucide-svelte/icons/filter';
	import X from 'lucide-svelte/icons/x';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ArrowUpDown from 'lucide-svelte/icons/arrow-up-down';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	
	// State from URL params
	let searchQuery = $state($page.url.searchParams.get('search') || '');
	let selectedLocation = $state($page.url.searchParams.get('location') || '');
	let selectedCategory = $state($page.url.searchParams.get('category') || '');
	let sortBy = $state($page.url.searchParams.get('sortBy') || 'popular');
	let currentPage = $state(parseInt($page.url.searchParams.get('page') || '1'));
	
	// Local state
	let showFilters = $state(false);
	let searchInput = $state('');
	let searchTimeout: NodeJS.Timeout | null = null;
	
	// Sync searchInput with searchQuery from URL
	$effect(() => {
		searchInput = searchQuery;
	});
	
	// Build query params
	let queryParams = $derived({
		search: searchQuery,
		location: selectedLocation,
		category: selectedCategory,
		sortBy,
		page: currentPage,
		limit: 12 // Auto-fill grid, 3-4 per row on wide screens
	});
	
	// TanStack Query
	let toursQuery = $derived(createPublicToursQuery(queryParams));
	
	// Derived data
	let tours = $derived($toursQuery.data?.tours || []);
	let pagination = $derived($toursQuery.data?.pagination || { total: 0, totalPages: 0 });
	let filters = $derived($toursQuery.data?.filters || { categories: [], locations: [] });
	let isLoading = $derived($toursQuery.isLoading);
	let isError = $derived($toursQuery.isError);
	
	// Handle search input changes (real-time with debounce)
	function handleSearchInput(value: string) {
		searchInput = value;
		// Clear previous timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		
		// Trigger search based on input length
		if (value.length === 0) {
			// Immediately clear search when input is empty
			searchQuery = '';
			currentPage = 1;
			updateUrl();
		} else if (value.length >= 3) {
			// Search when user has typed at least 3 characters
			searchTimeout = setTimeout(() => {
				searchQuery = value;
				currentPage = 1;
				updateUrl();
			}, 500);
		}
		// Don't search for 1-2 characters to avoid too many requests
	}
	
	// Update URL when filters change
	function updateUrl() {
		const params = new URLSearchParams();
		if (searchQuery) params.set('search', searchQuery);
		if (selectedLocation) params.set('location', selectedLocation);
		if (selectedCategory) params.set('category', selectedCategory);
		if (sortBy !== 'popular') params.set('sortBy', sortBy);
		if (currentPage > 1) params.set('page', currentPage.toString());
		
		// Use history API directly to avoid interrupting user input
		const newUrl = `/explore?${params.toString()}`;
		if (typeof window !== 'undefined' && window.location.pathname + window.location.search !== newUrl) {
			window.history.replaceState({}, '', newUrl);
		}
	}
	
	// Handle search form submission (for when user presses Enter)
	function handleSearch() {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		// Allow search even with less than 3 characters when explicitly submitted
		searchQuery = searchInput.trim();
		currentPage = 1;
		updateUrl();
	}
	
	// Clear search
	function clearSearch() {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		searchInput = '';
		searchQuery = '';
		currentPage = 1;
		updateUrl();
	}
	
	// Handle filter changes
	function handleLocationChange(location: string) {
		selectedLocation = location;
		currentPage = 1;
		updateUrl();
	}
	
	function handleCategoryChange(category: string) {
		selectedCategory = category;
		currentPage = 1;
		updateUrl();
	}
	
	function handleSortChange(sort: string) {
		sortBy = sort;
		currentPage = 1;
		updateUrl();
	}
	
	// Clear individual filters
	function clearLocation() {
		selectedLocation = '';
		currentPage = 1;
		updateUrl();
	}
	
	function clearCategory() {
		selectedCategory = '';
		currentPage = 1;
		updateUrl();
	}
	
	function clearSort() {
		sortBy = 'popular';
		currentPage = 1;
		updateUrl();
	}
	
	// Clear filters
	function clearFilters() {
		searchQuery = '';
		searchInput = '';
		selectedLocation = '';
		selectedCategory = '';
		sortBy = 'popular';
		currentPage = 1;
		updateUrl();
	}
	
	// Pagination
	function goToPage(page: number) {
		currentPage = page;
		updateUrl();
		// Scroll to top
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
	
	// Active filters count
	let activeFiltersCount = $derived.by(() => {
		let count = 0;
		if (searchQuery) count++;
		if (selectedLocation) count++;
		if (selectedCategory) count++;
		if (sortBy !== 'popular') count++;
		return count;
	});
	
	// Watch for filter changes and update URL
	$effect(() => {
		// Use sortBy, selectedLocation, selectedCategory in this effect
		// so it runs when they change
		if (sortBy || selectedLocation || selectedCategory) {
			updateUrl();
		}
	});
</script>


<svelte:head>
	<title>Explore Tours - Zaur</title>
	<meta name="description" content="Discover amazing tours and experiences. Browse and book directly with local tour operators." />
</svelte:head>

<div class="subtle-retro-section min-h-screen">
	<!-- Hero Section -->
	<div class="explore-hero">
		<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
			<div class="text-center">
				<h1 class="explore-title">
					Discover Amazing Tours
				</h1>
				<p class="explore-subtitle">
					Book directly with local tour operators. Zero commission, ever.
				</p>
			</div>
		</div>
	</div>
	
	<!-- Main Content -->
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
		<!-- Filters Bar -->
		<div class="filters-bar">
			<!-- Filter Chips -->
			<div class="filters-container">
				<!-- Search -->
				<div class="search-filter">
					<Search class="w-4 h-4 filter-icon" />
					<input
						type="search"
						value={searchInput}
						oninput={(e) => handleSearchInput(e.currentTarget.value)}
						onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
						placeholder="Search tours..."
						class="search-input search-no-cancel"
					/>
					{#if searchInput}
						<button
							type="button"
							onclick={clearSearch}
							class="clear-search-btn"
							aria-label="Clear search"
						>
							<X class="h-3.5 w-3.5" />
						</button>
					{/if}
				</div>
				
			<!-- Sort By -->
			<CustomSelect
				bind:value={sortBy}
				options={[
					{ value: 'popular', label: 'Most Popular' },
					{ value: 'newest', label: 'Newest First' },
					{ value: 'oldest', label: 'Oldest First' },
					{ value: 'priceAsc', label: 'Price: Low to High' },
					{ value: 'priceDesc', label: 'Price: High to Low' }
				]}
				icon={ArrowUpDown}
				onchange={handleSortChange}
			/>
			
			<!-- Location Filter -->
			{#if filters.locations.length > 0}
				<CustomSelect
					bind:value={selectedLocation}
					options={[
						{ value: '', label: 'All Locations' },
						...filters.locations.map((loc: string) => ({ value: loc, label: loc }))
					]}
					icon={MapPin}
					placeholder="All Locations"
					onchange={handleLocationChange}
				/>
			{/if}
			
			<!-- Category Filter -->
			{#if filters.categories.length > 0}
				<CustomSelect
					bind:value={selectedCategory}
					options={[
						{ value: '', label: 'All Categories' },
						...filters.categories.map((cat: string) => ({ 
							value: cat.toLowerCase(), // Store lowercase for API
							label: formatCategoryName(cat) // Display capitalized
						}))
					]}
					icon={Filter}
					placeholder="All Categories"
					onchange={handleCategoryChange}
				/>
			{/if}
			</div>
			
			<!-- Active Filters & Clear -->
			{#if activeFiltersCount > 0}
				<button
					onclick={clearFilters}
					class="clear-filters-btn"
				>
					<X class="w-4 h-4" />
					Clear filters ({activeFiltersCount})
				</button>
			{/if}
		</div>
		
		<!-- Tours Grid -->
		<div class="tours-section">
			<!-- Results Count -->
			<div class="results-count">
				{#if isLoading}
					<Loader2 class="w-4 h-4 animate-spin" />
					<span>Loading tours...</span>
				{:else}
					<span>{pagination.total} tour{pagination.total === 1 ? '' : 's'} found</span>
				{/if}
			</div>
			
			<!-- Loading State -->
			{#if isLoading}
					<div class="tours-grid">
						{#each Array(6) as _}
							<div class="tour-card-modern animate-pulse">
								<div class="tour-card-image-wrapper">
									<div class="tour-card-placeholder" style="background: var(--bg-secondary);"></div>
								</div>
								<div class="tour-card-content">
									<div class="h-8 rounded w-2/3" style="background: var(--bg-secondary);"></div>
									<div class="h-5 rounded w-full" style="background: var(--bg-secondary);"></div>
									<div class="h-5 rounded w-3/4" style="background: var(--bg-secondary);"></div>
									<div class="flex gap-2 mt-2">
										<div class="h-6 rounded-full w-20" style="background: var(--bg-secondary);"></div>
										<div class="h-6 rounded-full w-20" style="background: var(--bg-secondary);"></div>
									</div>
								</div>
							</div>
						{/each}
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
						<MapPin class="h-12 w-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
						<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">No tours found</h3>
						<p class="mb-4" style="color: var(--text-secondary);">
							Try adjusting your search or filters
						</p>
						{#if activeFiltersCount > 0}
							<button onclick={clearFilters} class="button-secondary cursor-pointer">
								Clear filters
							</button>
						{/if}
					</div>
				
			<!-- Tours Grid -->
			{:else}
				<div class="tours-grid">
					{#each tours as tour}
						<TourCard {tour} />
					{/each}
				</div>
				
				<!-- Pagination -->
				<Pagination
					currentPage={currentPage}
					totalPages={pagination.totalPages}
					onPageChange={goToPage}
				/>
			{/if}
		</div>
	</div>
</div> 


<style>
	/* Subtle Retro Section */
	.subtle-retro-section {
		background: linear-gradient(
			180deg,
			var(--bg-primary) 0%,
			var(--bg-secondary) 100%
		);
		position: relative;
		overflow: hidden;
	}
	
	.subtle-retro-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 40px,
			rgba(0, 0, 0, 0.02) 40px,
			rgba(0, 0, 0, 0.02) 41px
		);
		pointer-events: none;
		z-index: 0;
	}
	
	/* Filters Bar */
	.filters-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}
	
	.filters-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		flex: 1;
	}
	
	/* Search Filter */
	.search-filter {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		transition: all 0.2s ease;
		flex: 1;
		min-width: 200px;
		max-width: 400px;
		min-height: 2.5rem;
	}
	
	.search-filter:focus-within {
		border-color: var(--color-primary-400);
		box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
	}
	
	.search-input {
		flex: 1;
		background: transparent;
		border: none;
		color: var(--text-primary);
		font-size: 0.875rem;
		outline: none;
		min-width: 0;
	}
	
	.search-input::placeholder {
		color: var(--text-tertiary);
	}
	
	.clear-search-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		padding: 0;
		background: transparent;
		border: none;
		color: var(--text-tertiary);
		cursor: pointer;
		border-radius: 0.25rem;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}
	
	.clear-search-btn:hover {
		background: var(--bg-secondary);
		color: var(--text-secondary);
	}
	
	.clear-filters-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}
	
	.clear-filters-btn:hover {
		background: var(--bg-tertiary);
		border-color: var(--color-primary-300);
		color: var(--text-primary);
	}
	
	/* Tours Section */
	.tours-section {
		position: relative;
		z-index: 1;
	}
	
	.results-count {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
	}
	
	/* Tours Grid - Fixed 3 columns */
	.tours-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
		position: relative;
		z-index: 1;
	}
	
	@media (max-width: 1200px) {
		.tours-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	
	@media (max-width: 768px) {
		.tours-grid {
			grid-template-columns: 1fr;
		}
		
		.filters-bar {
			flex-direction: column;
			align-items: stretch;
		}
		
		.filters-container {
			width: 100%;
			flex-direction: column;
		}
		
		.search-filter {
			width: 100%;
			max-width: none;
		}
		
		.filters-container :global(.custom-select) {
			width: 100%;
		}
		
		.clear-filters-btn {
			width: 100%;
			justify-content: center;
		}
	}
	
	/* Search input styling */
	.search-no-cancel::-webkit-search-cancel-button {
		-webkit-appearance: none;
		appearance: none;
	}
	
	.search-no-cancel::-webkit-search-decoration {
		-webkit-appearance: none;
		appearance: none;
	}
	
	.search-no-cancel::-ms-clear {
		display: none;
	}
	
	/* Hero Section */
	.explore-hero {
		position: relative;
		padding: 4rem 0 3rem;
		z-index: 1;
	}
	
	.explore-title {
		font-size: 3.5rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 1rem;
		letter-spacing: -0.02em;
		line-height: 1.1;
	}
	
	.explore-subtitle {
		font-size: 1.375rem;
		color: var(--text-secondary);
		max-width: 48rem;
		margin: 0 auto;
		line-height: 1.5;
	}
	
	/* Mobile Responsive */
	@media (max-width: 768px) {
		.explore-hero {
			padding: 3rem 0 2.5rem;
		}
		
		.explore-title {
			font-size: 2.25rem;
		}
		
		.explore-subtitle {
			font-size: 1.125rem;
		}
	}
	
</style>