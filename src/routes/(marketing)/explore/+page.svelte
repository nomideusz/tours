<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { createPublicToursQuery } from '$lib/queries/public-queries.js';

	import { getTourDisplayPriceFormattedWithCurrency, formatCategoryName } from '$lib/utils/tour-helpers-client.js';
	import { generateBookingURL } from '$lib/utils/qr-generation.js';
	
	// Icons
	import Search from 'lucide-svelte/icons/search';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Filter from 'lucide-svelte/icons/filter';
	import X from 'lucide-svelte/icons/x';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
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
	let searchInput = $state(searchQuery);
	let searchTimeout: NodeJS.Timeout | null = null;
	
	// Build query params
	let queryParams = $derived({
		search: searchQuery,
		location: selectedLocation,
		category: selectedCategory,
		sortBy,
		page: currentPage,
		limit: 12
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
	
	// Format duration
	function formatDuration(minutes: number) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return hours > 0 ? `${hours}h ${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;
	}
	
	// Format next slot date
	function formatNextSlot(dateString: string | null) {
		if (!dateString) return null;
		
		const date = new Date(dateString);
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		
		if (date.toDateString() === today.toDateString()) return 'Today';
		if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
		
		return date.toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric' 
		});
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
	
	// Track avatar load errors
	let avatarErrors = $state(new Set());
</script>


<svelte:head>
	<title>Explore Tours - Zaur</title>
	<meta name="description" content="Discover amazing tours and experiences. Browse and book directly with local tour operators." />
</svelte:head>

<div class="min-h-screen" style="background: var(--bg-secondary);">
	<!-- Hero Section -->
	<div class="relative py-12 sm:py-16" style="background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);">
		<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
			<div class="text-center mb-8">
				<h1 class="text-3xl sm:text-4xl font-bold mb-4" style="color: var(--text-primary);">
					Discover Amazing Tours
				</h1>
				<p class="text-lg" style="color: var(--text-secondary);">
					Book directly with local tour operators. No booking fees, ever.
				</p>
			</div>
			
			<!-- Search Bar -->
			<div class="max-w-2xl mx-auto">
				<div class="flex items-center gap-3 rounded-xl px-4 py-3 shadow-sm search-container">
					<Search class="h-5 w-5 flex-shrink-0 search-icon" />
					<input
						type="search"
						value={searchInput}
						oninput={(e) => handleSearchInput(e.currentTarget.value)}
						onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
						placeholder="Search tours, destinations, or activities..."
						class="flex-1 bg-transparent border-0 outline-0 search-no-cancel text-base"
					/>
					{#if searchInput}
						<button
							type="button"
							onclick={clearSearch}
							class="p-1.5 rounded-md transition-colors flex-shrink-0 clear-button"
							aria-label="Clear search"
						>
							<X class="h-4 w-4" />
						</button>
					{/if}
					<button
						type="button"
						onclick={handleSearch}
						class="button-primary button--small"
					>
						Search
					</button>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Main Content -->
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
		<div class="flex flex-col lg:flex-row gap-8">
			<!-- Filters Sidebar -->
			<aside class="lg:w-64 flex-shrink-0">
				<!-- Mobile Filter Toggle -->
				<button
					onclick={() => showFilters = !showFilters}
					class="lg:hidden button-secondary button--gap w-full mb-4"
				>
					<Filter class="h-4 w-4" />
					Filters
					{#if activeFiltersCount > 0}
						<span class="ml-auto px-2 py-0.5 text-xs rounded-full" style="background: var(--bg-accent); color: var(--text-on-accent);">
							{activeFiltersCount}
						</span>
					{/if}
				</button>
				
				<!-- Filters Container -->
				<div class="space-y-6 {showFilters ? 'block' : 'hidden'} lg:block">
					<!-- Active Filters -->
					{#if activeFiltersCount > 0}
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium" style="color: var(--text-primary);">Active Filters</span>
							<button
								onclick={clearFilters}
								class="text-sm cursor-pointer hover:underline transition-all" style="color: var(--text-accent);"
							>
								Clear all
							</button>
						</div>
						
						<!-- Active Filter Tags -->
						<div class="flex flex-wrap gap-2">
							{#if selectedLocation}
								<div class="flex items-center gap-1 px-3 py-1 rounded-full text-sm" style="background: var(--bg-secondary); color: var(--text-primary);">
									<span>Location: {selectedLocation}</span>
									<button onclick={clearLocation} class="cursor-pointer p-0.5 hover:bg-opacity-50 rounded-sm transition-colors" aria-label="Clear location filter">
										<X class="h-3 w-3" style="color: var(--text-secondary);" />
									</button>
								</div>
							{/if}
							{#if selectedCategory}
								<div class="flex items-center gap-1 px-3 py-1 rounded-full text-sm" style="background: var(--bg-secondary); color: var(--text-primary);">
									<span>Category: {selectedCategory}</span>
									<button onclick={clearCategory} class="cursor-pointer p-0.5 hover:bg-opacity-50 rounded-sm transition-colors" aria-label="Clear category filter">
										<X class="h-3 w-3" style="color: var(--text-secondary);" />
									</button>
								</div>
							{/if}
							{#if sortBy !== 'popular'}
								<div class="flex items-center gap-1 px-3 py-1 rounded-full text-sm" style="background: var(--bg-secondary); color: var(--text-primary);">
									<span>Sort: {sortBy === 'newest' ? 'Newest First' : sortBy === 'oldest' ? 'Oldest First' : sortBy === 'priceAsc' ? 'Price: Low to High' : 'Price: High to Low'}</span>
									<button onclick={clearSort} class="cursor-pointer p-0.5 hover:bg-opacity-50 rounded-sm transition-colors" aria-label="Clear sort filter">
										<X class="h-3 w-3" style="color: var(--text-secondary);" />
									</button>
								</div>
							{/if}
						</div>
					{/if}
					
					<!-- Sort By -->
					<div>
						<label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
							Sort By
						</label>
						<select
							value={sortBy}
							onchange={(e) => handleSortChange(e.currentTarget.value)}
							class="form-select w-full cursor-pointer"
						>
							<option value="popular">Most Popular</option>
							<option value="newest">Newest First</option>
							<option value="oldest">Oldest First</option>
							<option value="priceAsc">Price: Low to High</option>
							<option value="priceDesc">Price: High to Low</option>
						</select>
					</div>
					
					<!-- Location Filter -->
					{#if filters.locations.length > 0}
						<div>
							<label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
								Location
							</label>
							<select
								value={selectedLocation}
								onchange={(e) => handleLocationChange(e.currentTarget.value)}
								class="form-select w-full cursor-pointer"
							>
								<option value="">All Locations</option>
								{#each filters.locations as location}
									<option value={location}>{location}</option>
								{/each}
							</select>
							<p class="text-xs mt-1" style="color: var(--text-tertiary);">
								Locations are grouped by city/region for easier browsing
							</p>
						</div>
					{/if}
					
					<!-- Category Filter -->
					{#if filters.categories.length > 0}
						<div>
							<label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
								Category
							</label>
							<select
								value={selectedCategory}
								onchange={(e) => handleCategoryChange(e.currentTarget.value)}
								class="form-select w-full cursor-pointer"
							>
								<option value="">All Categories</option>
								{#each filters.categories as category}
									<option value={category}>{formatCategoryName(category)}</option>
								{/each}
							</select>
						</div>
					{/if}
				</div>
			</aside>
			
			<!-- Tours Grid -->
			<div class="flex-1">
				<!-- Results Header -->
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-lg font-semibold" style="color: var(--text-primary);">
						{#if isLoading}
							Loading tours...
						{:else}
							{pagination.total} tour{pagination.total === 1 ? '' : 's'} found
						{/if}
					</h2>
				</div>
				
				<!-- Loading State -->
				{#if isLoading}
					<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{#each Array(6) as _}
							<div class="rounded-xl animate-pulse" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
								<div class="aspect-[16/10]" style="background: var(--bg-secondary);"></div>
								<div class="p-4 space-y-3">
									<div class="h-5 rounded" style="background: var(--bg-secondary);"></div>
									<div class="h-4 rounded w-3/4" style="background: var(--bg-secondary);"></div>
									<div class="h-4 rounded w-1/2" style="background: var(--bg-secondary);"></div>
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
					<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{#each tours as tour}
							<div 
								class="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full"
								style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
								onclick={() => {
									console.log('Tour clicked:', tour.name, 'QR Code:', tour.qrCode);
									if (tour.qrCode) {
										goto(`/book/${tour.qrCode}`);
									} else {
										console.error('No QR code for tour:', tour.name);
									}
								}}
								onkeydown={(e) => {
									if (e.key === 'Enter' && tour.qrCode) {
										goto(`/book/${tour.qrCode}`);
									}
								}}
								role="button"
								tabindex="0"
								aria-label="View tour: {tour.name}"
							>
								<!-- Tour Image -->
								{#if tour.images && tour.images.length > 0}
									<div class="aspect-[16/10] overflow-hidden" style="background: var(--bg-secondary);">
										<img 
											src="/api/images/{tour.id}/{tour.images[0]}?size=medium"
											alt={tour.name}
											class="w-full h-full object-cover transition-transform group-hover:scale-105"
											loading="lazy"
										/>
									</div>
								{:else}
									<div class="aspect-[16/10] flex items-center justify-center" style="background: var(--bg-tertiary);">
										<MapPin class="w-12 h-12" style="color: var(--text-tertiary);" />
									</div>
								{/if}
								
								<!-- Main Content -->
								<div class="p-4 flex-grow flex flex-col">
									<!-- Tour Name -->
									<h3 class="font-semibold text-lg mb-2 line-clamp-1" style="color: var(--text-primary);">
										{tour.name}
									</h3>
									
									<!-- Location -->
									{#if tour.location}
										<div class="flex items-center gap-1.5 mb-3 text-sm" style="color: var(--text-secondary);">
											<MapPin class="w-4 h-4 flex-shrink-0" />
											<span class="line-clamp-1">{tour.location}</span>
										</div>
									{/if}

									<!-- Categories -->
									{#if tour.categories && tour.categories.length > 0}
										<div class="flex flex-wrap gap-1 mb-3">
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
									
									<!-- Tour Info -->
									<div class="mb-4">
										<!-- Duration -->
										<div class="flex items-center gap-1.5 text-sm" style="color: var(--text-secondary);">
											<Clock class="w-4 h-4" />
											<span>{formatDuration(tour.duration)}</span>
										</div>
									</div>
									
									<!-- Price and Availability -->
									<div class="flex items-end justify-between flex-grow">
										<div>
											{#if tour.pricingModel === 'private_tour'}
												<!-- Private Tour Pricing -->
												<p class="text-2xl font-bold" style="color: var(--text-primary);">
													{getTourDisplayPriceFormattedWithCurrency(tour, tour.operator.currency)}
												</p>
												<p class="text-sm" style="color: var(--text-secondary);">
													flat rate
												</p>
											{:else if tour.pricingModel === 'participant_categories'}
												<!-- Participant Categories Pricing -->
												<p class="text-2xl font-bold" style="color: var(--text-primary);">
													{getTourDisplayPriceFormattedWithCurrency(tour, tour.operator.currency)}
												</p>
												<p class="text-sm" style="color: var(--text-secondary);">
													per person
												</p>
											{:else if tour.pricingModel === 'group_tiers'}
												<!-- Group Tiers Pricing -->
												<p class="text-2xl font-bold" style="color: var(--text-primary);">
													{getTourDisplayPriceFormattedWithCurrency(tour, tour.operator.currency)}
												</p>
												<p class="text-sm" style="color: var(--text-secondary);">
													group pricing
												</p>
											{:else if tour.pricingModel === 'adult_child' && tour.pricingTiers?.adult}
												<!-- Adult/Child Pricing -->
												<div class="flex items-baseline gap-2">
													<div>
														<p class="text-2xl font-bold" style="color: var(--text-primary);">
															{getTourDisplayPriceFormattedWithCurrency(tour, tour.operator.currency)}
														</p>
														<p class="text-xs" style="color: var(--text-secondary);">Adult</p>
													</div>
													{#if tour.pricingTiers.child !== undefined && tour.pricingTiers.child !== null}
														<div class="ml-2">
															<p class="text-lg font-semibold" style="color: var(--text-primary);">
																{tour.pricingTiers.child === 0 ? 'Free' : new Intl.NumberFormat('en-US', { 
																	style: 'currency', 
																	currency: tour.operator.currency || 'EUR',
																	minimumFractionDigits: 0,
																	maximumFractionDigits: 2
																}).format(Number(tour.pricingTiers.child))}
															</p>
															<p class="text-xs" style="color: var(--text-secondary);">Child (3-12)</p>
														</div>
													{/if}
												</div>
											{:else}
												<!-- Standard Pricing (Per Person) -->
												<p class="text-2xl font-bold" style="color: var(--text-primary);">
													{getTourDisplayPriceFormattedWithCurrency(tour, tour.operator.currency)}
												</p>
												<p class="text-sm" style="color: var(--text-secondary);">
													per person
												</p>
											{/if}
										</div>
										
										{#if tour.availability.nextSlot}
											<div class="text-right">
												<p class="text-sm font-medium" style="color: var(--text-success);">
													Next: {formatNextSlot(tour.availability.nextSlot)}
												</p>
												<p class="text-xs" style="color: var(--text-secondary);">
													{tour.availability.availableSlots} time slot{tour.availability.availableSlots === 1 ? '' : 's'}
												</p>
											</div>
										{:else}
											<div class="text-right">
												<div class="px-3 py-2 rounded-lg text-center" style="background: var(--bg-tertiary); border: 1px solid var(--border-secondary);">
													<p class="text-sm font-medium" style="color: var(--text-tertiary);">
														No time slots available
													</p>
													<p class="text-xs mt-1" style="color: var(--text-tertiary);">
														Check back later
													</p>
												</div>
											</div>
										{/if}
									</div>
								</div>
								
								<!-- Operator Info - Always at bottom -->
								<div class="px-4 pb-4">
									<div class="pt-4 flex items-center gap-2" style="border-top: 1px solid var(--border-primary);">
										{#if tour.operator.avatar && tour.operator.avatar.trim()}
											<img 
												src={tour.operator.avatar.startsWith('/api/') ? tour.operator.avatar : `/api/avatars/${tour.operator.id}/${tour.operator.avatar}`}
												alt={tour.operator.name || tour.operator.username || 'Tour operator'}
												class="w-6 h-6 rounded-full"
												onerror={(e) => {
													console.log('Avatar failed to load:', tour.operator.avatar, 'for', tour.operator.name);
													(e.currentTarget as HTMLImageElement).style.display = 'none';
													const fallback = e.currentTarget.nextElementSibling as HTMLElement;
													if (fallback) fallback.style.display = 'flex';
												}}
											/>
											<div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium" 
												style="background: var(--bg-secondary); color: var(--text-secondary); display: none;">
												{(tour.operator.name || tour.operator.username || 'Tour Operator').charAt(0).toUpperCase()}
											</div>
										{:else}
											<div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium" 
												style="background: var(--bg-secondary); color: var(--text-secondary);">
												{(tour.operator.name || tour.operator.username || 'Tour Operator').charAt(0).toUpperCase()}
											</div>
										{/if}
										{#if tour.operator.name && tour.operator.name.trim()}
											<span class="text-sm line-clamp-1" style="color: var(--text-secondary);">
												by {tour.operator.name}
											</span>
										{:else if tour.operator.username && tour.operator.username.trim()}
											<span class="text-sm line-clamp-1" style="color: var(--text-secondary);">
												by @{tour.operator.username}
											</span>
										{:else}
											<span class="text-sm line-clamp-1" style="color: var(--text-secondary);">
												Tour Operator
											</span>
										{/if}
									</div>
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
	</div>
</div> 


<style>
	/* Hide browser's default search input clear button */
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

	/* Search container styling */
	.search-container {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		transition: all var(--transition-base) ease;
	}

	.search-container:focus-within {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent);
	}

	/* Search button now uses standard button-primary class from buttons.css */

	/* Clear button styling */
	.clear-button {
		color: var(--text-tertiary);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all var(--transition-base) ease;
	}

	.clear-button:hover {
		background: var(--bg-tertiary);
		color: var(--text-secondary);
	}

	/* Input styling */
	.search-container input {
		background: transparent;
		color: var(--text-primary);
	}

	.search-container input::placeholder {
		color: var(--text-tertiary);
		opacity: 0.8;
	}

	.search-container input:focus {
		outline: none;
	}

	/* Icon styling */
	.search-container .search-icon {
		color: var(--text-secondary);
		transition: color var(--transition-base) ease;
	}

	.search-container:focus-within .search-icon {
		color: var(--primary);
	}

	/* Dark Mode Specific Overrides */
	[data-theme="dark"] .search-container {
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 
		           inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	[data-theme="dark"] .search-container:focus-within {
		border-color: var(--primary);
		background: var(--bg-primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 25%, transparent), 
		           0 2px 8px rgba(0, 0, 0, 0.4),
		           inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	[data-theme="dark"] .search-container input {
		color: var(--text-primary);
	}

	[data-theme="dark"] .search-container input::placeholder {
		color: var(--text-tertiary);
		opacity: 0.9;
	}

	/* Search button dark mode handled automatically by button-primary class */

	[data-theme="dark"] .clear-button {
		color: var(--text-tertiary);
	}

	[data-theme="dark"] .clear-button:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--text-primary);
	}

	[data-theme="dark"] .search-container .search-icon {
		color: var(--text-secondary);
	}

	[data-theme="dark"] .search-container:focus-within .search-icon {
		color: var(--primary);
	}
</style>