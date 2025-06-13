<script lang="ts">
	// Simple API-Only Example (No +page.server.ts needed)
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { formatEuro } from '$lib/utils/currency.js';
	import type { Tour } from '$lib/types.js';
	
	// Icons  
	import MapPin from 'lucide-svelte/icons/map-pin';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Users from 'lucide-svelte/icons/users';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import Loader2 from 'lucide-svelte/icons/loader-2';

	// Pure API queries (no initialData)
	const statsQuery = createQuery({
		queryKey: queryKeys.toursStats,
		queryFn: queryFunctions.fetchToursStats,
		staleTime: 2 * 60 * 1000
	});

	const toursQuery = createQuery({
		queryKey: queryKeys.userTours,
		queryFn: queryFunctions.fetchUserTours,
		staleTime: 1 * 60 * 1000
	});

	// Reactive data
	let stats = $derived($statsQuery.data || {});
	let tours = $derived(($toursQuery.data as Tour[]) || []);
	let isLoading = $derived($statsQuery.isLoading || $toursQuery.isLoading);
	let isError = $derived($statsQuery.isError || $toursQuery.isError);

	function refresh() {
		$statsQuery.refetch();
		$toursQuery.refetch();
	}
</script>

<div class="max-w-4xl mx-auto p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold">Tours (API-Only)</h1>
		<button onclick={refresh} class="button-secondary button--small" disabled={isLoading}>
			{#if isLoading}
				<Loader2 class="h-4 w-4 animate-spin" />
			{:else}
				<RefreshCw class="h-4 w-4" />
			{/if}
			Refresh
		</button>
	</div>

	{#if isLoading}
		<!-- Loading state users will see initially -->
		<div class="animate-pulse space-y-4">
			<div class="grid grid-cols-4 gap-4">
				{#each Array(4) as _}
					<div class="bg-gray-200 h-20 rounded"></div>
				{/each}
			</div>
			<div class="bg-gray-200 h-32 rounded"></div>
		</div>
	{:else if isError}
		<!-- Error state -->
		<div class="bg-red-50 border border-red-200 rounded p-4">
			<p class="text-red-800">Failed to load data</p>
			<button onclick={refresh} class="button-secondary button--small mt-2">
				Try Again
			</button>
		</div>
	{:else}
		<!-- Success state -->
		<div class="space-y-6">
			<!-- Stats Grid -->
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
				<div class="bg-white p-4 rounded-lg border text-center">
					<MapPin class="h-6 w-6 mx-auto mb-2 text-blue-600" />
					<div class="text-2xl font-bold">{stats.totalTours || 0}</div>
					<div class="text-sm text-gray-600">Total Tours</div>
				</div>
				<div class="bg-white p-4 rounded-lg border text-center">
					<BarChart3 class="h-6 w-6 mx-auto mb-2 text-green-600" />
					<div class="text-2xl font-bold">{stats.activeTours || 0}</div>
					<div class="text-sm text-gray-600">Active</div>
				</div>
				<div class="bg-white p-4 rounded-lg border text-center">
					<DollarSign class="h-6 w-6 mx-auto mb-2 text-yellow-600" />
					<div class="text-2xl font-bold">{formatEuro(stats.monthRevenue || 0)}</div>
					<div class="text-sm text-gray-600">Revenue</div>
				</div>
				<div class="bg-white p-4 rounded-lg border text-center">
					<Users class="h-6 w-6 mx-auto mb-2 text-purple-600" />
					<div class="text-2xl font-bold">{stats.totalBookings || 0}</div>
					<div class="text-sm text-gray-600">Bookings</div>
				</div>
			</div>

			<!-- Tours List -->
			<div class="bg-white rounded-lg border">
				<div class="p-4 border-b">
					<h2 class="text-lg font-semibold">Your Tours ({tours.length})</h2>
				</div>
				<div class="p-4">
					{#if tours.length === 0}
						<p class="text-gray-500 text-center py-8">No tours found</p>
					{:else}
						<div class="space-y-3">
							{#each tours as tour}
								<div class="flex items-center justify-between p-3 bg-gray-50 rounded">
									<div>
										<h3 class="font-medium">{tour.name}</h3>
										<p class="text-sm text-gray-600">{formatEuro(parseFloat(tour.price))}</p>
									</div>
									<span class="px-2 py-1 text-xs rounded {tour.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
										{tour.status}
									</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Debug Info -->
			<div class="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
				<h3 class="font-semibold text-blue-900 mb-2">TanStack Query Debug</h3>
				<div class="text-blue-800 space-y-1">
					<div>Stats last updated: {$statsQuery.dataUpdatedAt ? new Date($statsQuery.dataUpdatedAt).toLocaleTimeString() : 'Never'}</div>
					<div>Tours last updated: {$toursQuery.dataUpdatedAt ? new Date($toursQuery.dataUpdatedAt).toLocaleTimeString() : 'Never'}</div>
					<div>Is fetching: {$statsQuery.isFetching || $toursQuery.isFetching ? 'Yes' : 'No'}</div>
				</div>
			</div>
		</div>
	{/if}
</div> 