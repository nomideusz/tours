<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toursApi } from '$lib/pocketbase.js';
	import type { Tour } from '$lib/types.js';
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
	import AlertCircle from 'lucide-svelte/icons/alert-circle';

	let tours = $state<Tour[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let selectedStatus = $state('all');
	let searchQuery = $state('');
	let showFilters = $state(false);
	let selectedCategory = $state('all');
	let sortBy = $state('recent');
	let openDropdownId = $state<string | null>(null);

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

	onMount(() => {
		loadTours();
		// Close dropdown when clicking outside
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	function handleClickOutside(event: MouseEvent) {
		if (!event.target || !(event.target as Element).closest('.dropdown-container')) {
			openDropdownId = null;
		}
	}

	async function loadTours() {
		try {
			isLoading = true;
			error = null;
			tours = await toursApi.getAll();
		} catch (err) {
			error = 'Failed to load tours. Please try again.';
			console.error('Error loading tours:', err);
		} finally {
			isLoading = false;
		}
	}

	async function deleteTour(tourId: string) {
		if (!confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
			return;
		}

		try {
			await toursApi.delete(tourId);
			tours = tours.filter((tour) => tour.id !== tourId);
			openDropdownId = null;
		} catch (err) {
			error = 'Failed to delete tour. Please try again.';
			console.error('Error deleting tour:', err);
		}
	}

	async function duplicateTour(tour: Tour) {
		try {
			const duplicatedData = {
				name: `${tour.name} (Copy)`,
				description: tour.description,
				price: tour.price,
				duration: tour.duration,
				capacity: tour.capacity,
				status: 'draft' as Tour['status'],
				category: tour.category,
				location: tour.location,
				includedItems: tour.includedItems || [],
				requirements: tour.requirements || [],
				cancellationPolicy: tour.cancellationPolicy
			};

			const newTour = await toursApi.create(duplicatedData);
			tours = [newTour, ...tours];
			openDropdownId = null;
		} catch (err) {
			error = 'Failed to duplicate tour. Please try again.';
			console.error('Error duplicating tour:', err);
		}
	}

	function getStatusColor(status: Tour['status']) {
		switch (status) {
			case 'active':
				return 'bg-green-50 text-green-700 border-green-200';
			case 'inactive':
				return 'bg-yellow-50 text-yellow-700 border-yellow-200';
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
			case 'inactive':
				return 'bg-yellow-500';
			case 'draft':
				return 'bg-gray-500';
			default:
				return 'bg-gray-500';
		}
	}

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

		// Search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
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

	// Calculate statistics
	let stats = $derived({
		total: tours.length,
		active: tours.filter((t) => t.status === 'active').length,
		draft: tours.filter((t) => t.status === 'draft').length,
		inactive: tours.filter((t) => t.status === 'inactive').length,
		totalRevenue: tours.reduce((sum, tour) => sum + (tour.price || 0), 0)
	});

	// Mock data for quick stats (in a real app, this would come from the backend)
	let quickStats = $derived({
		todayBookings: 12,
		weekBookings: 78,
		monthRevenue: 4250,
		avgRating: 4.8
	});

	function toggleDropdown(tourId: string) {
		openDropdownId = openDropdownId === tourId ? null : tourId;
	}
</script>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<!-- Page Header -->
	<div class="mb-8">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Tours</h1>
				<p class="mt-1 text-gray-600">Manage and track your tour offerings</p>
			</div>
			<button onclick={() => goto('/tours/new')} class="button-primary button--gap">
				<Plus class="h-5 w-5" />
				Create Tour
			</button>
		</div>
	</div>

	{#if error}
		<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
			<div class="flex gap-3">
				<AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
				<div>
					<p class="font-medium text-red-800">Error</p>
					<p class="text-sm text-red-700 mt-1">{error}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Quick Stats Dashboard -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
		<!-- Today's Bookings -->
		<div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
			<div class="flex items-center justify-between mb-2">
				<div class="p-2 bg-blue-50 rounded-lg">
					<Calendar class="h-5 w-5 text-blue-600" />
				</div>
				<span class="text-xs text-green-600 font-medium flex items-center gap-1">
					<TrendingUp class="h-3 w-3" />
					+12%
				</span>
			</div>
			<p class="text-2xl font-bold text-gray-900">{quickStats.todayBookings}</p>
			<p class="text-sm text-gray-600 mt-1">Today's bookings</p>
		</div>

		<!-- This Week -->
		<div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
			<div class="flex items-center justify-between mb-2">
				<div class="p-2 bg-purple-50 rounded-lg">
					<BarChart3 class="h-5 w-5 text-purple-600" />
				</div>
				<span class="text-xs text-green-600 font-medium flex items-center gap-1">
					<TrendingUp class="h-3 w-3" />
					+8%
				</span>
			</div>
			<p class="text-2xl font-bold text-gray-900">{quickStats.weekBookings}</p>
			<p class="text-sm text-gray-600 mt-1">This week</p>
		</div>

		<!-- Monthly Revenue -->
		<div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
			<div class="flex items-center justify-between mb-2">
				<div class="p-2 bg-green-50 rounded-lg">
					<DollarSign class="h-5 w-5 text-green-600" />
				</div>
				<span class="text-xs text-green-600 font-medium flex items-center gap-1">
					<TrendingUp class="h-3 w-3" />
					+15%
				</span>
			</div>
			<p class="text-2xl font-bold text-gray-900">€{quickStats.monthRevenue}</p>
			<p class="text-sm text-gray-600 mt-1">This month</p>
		</div>

		<!-- Active Tours -->
		<div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
			<div class="flex items-center justify-between mb-2">
				<div class="p-2 bg-emerald-50 rounded-lg">
					<Eye class="h-5 w-5 text-emerald-600" />
				</div>
			</div>
			<p class="text-2xl font-bold text-gray-900">{stats.active}/{stats.total}</p>
			<p class="text-sm text-gray-600 mt-1">Active tours</p>
		</div>
	</div>

	<!-- Search and Filters -->
	<div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
		<div class="flex flex-col lg:flex-row gap-4">
			<!-- Search -->
			<div class="flex-1">
				<div class="relative">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search tours by name, location, or description..."
						class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
					/>
				</div>
			</div>

			<!-- Filter Buttons -->
			<div class="flex items-center gap-2">
				<button
					onclick={() => showFilters = !showFilters}
					class="button-secondary button--gap button--small"
				>
					<Filter class="h-4 w-4" />
					Filters
					{#if selectedCategory !== 'all' || selectedStatus !== 'all'}
						<span class="ml-1 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">
							{(selectedCategory !== 'all' ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0)}
						</span>
					{/if}
				</button>

				<select
					bind:value={sortBy}
					class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
				>
					<option value="recent">Most Recent</option>
					<option value="name">Name (A-Z)</option>
					<option value="price-low">Price (Low to High)</option>
					<option value="price-high">Price (High to Low)</option>
				</select>
			</div>
		</div>

		<!-- Expanded Filters -->
		{#if showFilters}
			<div class="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
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
						<button
							onclick={() => selectedStatus = 'inactive'}
							class="{selectedStatus === 'inactive' ? 'button-primary' : 'button-secondary'} button--small"
						>
							Inactive
						</button>
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
					<select
						bind:value={selectedCategory}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
			<div class="flex items-center gap-2 text-gray-600">
				<div class="form-spinner"></div>
				Loading tours...
			</div>
		</div>
	{:else if filteredTours.length === 0}
		<div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
			<div class="max-w-md mx-auto">
				<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<Search class="h-8 w-8 text-gray-400" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">
					{searchQuery ? 'No tours found' : 'No tours yet'}
				</h3>
				<p class="text-gray-600 mb-6">
					{searchQuery 
						? 'Try adjusting your search or filters'
						: 'Create your first tour to start receiving bookings'}
				</p>
				{#if !searchQuery}
					<button onclick={() => goto('/tours/new')} class="button-primary button--gap">
						<Plus class="h-4 w-4" />
						Create Your First Tour
					</button>
				{:else}
					<button onclick={() => { searchQuery = ''; selectedStatus = 'all'; selectedCategory = 'all'; }} class="button-secondary">
						Clear Filters
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
			{#each filteredTours as tour (tour.id)}
				<div class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group">
					<!-- Tour Image -->
					<div class="relative h-48 bg-gray-100">
						{#if tour.images && tour.images[0]}
							<img 
								src={`https://z.xeon.pl/api/files/tours/${tour.id}/${tour.images[0]}?thumb=400x300`} 
								alt={tour.name}
								class="w-full h-full object-cover"
							/>
						{:else}
							<div class="w-full h-full flex items-center justify-center">
								<MapPin class="h-12 w-12 text-gray-300" />
							</div>
						{/if}
						
						<!-- Status Badge -->
						<div class="absolute top-3 right-3">
							<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium {getStatusColor(tour.status)} backdrop-blur-sm">
								<span class="w-1.5 h-1.5 rounded-full {getStatusDot(tour.status)}"></span>
								{tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
							</span>
						</div>

						<!-- Quick Actions on Hover -->
						<div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
							<button
								onclick={() => goto(`/tours/${tour.id}`)}
								class="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
								title="View details"
							>
								<Eye class="h-5 w-5" />
							</button>
							<button
								onclick={() => goto(`/tours/${tour.id}/edit`)}
								class="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
								title="Edit tour"
							>
								<Edit class="h-5 w-5" />
							</button>
							<button
								onclick={() => goto(`/tours/${tour.id}/qr`)}
								class="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
								title="QR codes"
							>
								<QrCode class="h-5 w-5" />
							</button>
						</div>
					</div>

					<!-- Tour Content -->
					<div class="p-5">
						<!-- Title and Category -->
						<div class="mb-3">
							<h3 class="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{tour.name}</h3>
							{#if tour.category}
								<span class="text-sm text-gray-500">{tour.category}</span>
							{/if}
						</div>

						<!-- Description -->
						{#if tour.description}
							<p class="text-sm text-gray-600 mb-4 line-clamp-2">{tour.description}</p>
						{/if}

						<!-- Tour Details Grid -->
						<div class="grid grid-cols-2 gap-3 mb-4">
							<div class="flex items-center gap-2 text-sm text-gray-600">
								<DollarSign class="h-4 w-4 text-gray-400" />
								<span class="font-medium">€{tour.price}</span>
							</div>
							<div class="flex items-center gap-2 text-sm text-gray-600">
								<Clock class="h-4 w-4 text-gray-400" />
								<span>{Math.floor(tour.duration / 60)}h {tour.duration % 60}m</span>
							</div>
							<div class="flex items-center gap-2 text-sm text-gray-600">
								<Users class="h-4 w-4 text-gray-400" />
								<span>Max {tour.capacity}</span>
							</div>
							{#if tour.location}
								<div class="flex items-center gap-2 text-sm text-gray-600">
									<MapPin class="h-4 w-4 text-gray-400" />
									<span class="truncate">{tour.location}</span>
								</div>
							{/if}
						</div>

						<!-- Action Buttons -->
						<div class="flex items-center justify-between pt-4 border-t border-gray-100">
							<div class="flex gap-2">
								<button
									onclick={() => goto(`/tours/${tour.id}/schedule`)}
									class="button-secondary button--small"
								>
									Schedule
								</button>
								<button
									onclick={() => goto(`/tours/${tour.id}/bookings`)}
									class="button-secondary button--small"
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
									<MoreVertical class="h-5 w-5" />
								</button>
								
								{#if openDropdownId === tour.id}
									<div class="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
										<button
											onclick={() => duplicateTour(tour)}
											class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
										>
											<Copy class="h-4 w-4" />
											Duplicate
										</button>
										<button
											onclick={() => deleteTour(tour.id)}
											class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
</div>

<style>
	.line-clamp-1 {
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
	}
	
	.line-clamp-2 {
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
</style>
