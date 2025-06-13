<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { formatEuro } from '$lib/utils/currency.js';
	
	// Icons
	import MapPin from 'lucide-svelte/icons/map-pin';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import Loader2 from 'lucide-svelte/icons/loader-2';

	// TanStack Query for shared stats
	const sharedStatsQuery = createQuery({
		queryKey: queryKeys.dashboardStats,
		queryFn: queryFunctions.fetchDashboardStats,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000,   // 10 minutes
	});

	// Reactive data
	let stats = $derived($sharedStatsQuery.data || {
		totalTours: 0,
		activeTours: 0,
		monthlyTours: 0
	});

	function handleRefresh() {
		$sharedStatsQuery.refetch();
	}
</script>

<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-lg font-semibold" style="color: var(--text-primary);">
			TanStack Query Demo
		</h3>
		<button
			onclick={handleRefresh}
			disabled={$sharedStatsQuery.isLoading}
			class="button-secondary button--small"
		>
			{#if $sharedStatsQuery.isLoading}
				<Loader2 class="h-4 w-4 animate-spin" />
			{:else}
				<RefreshCw class="h-4 w-4" />
			{/if}
			Refresh
		</button>
	</div>

	{#if $sharedStatsQuery.isError}
		<div class="p-3 rounded-lg mb-4" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
			<p class="text-sm font-medium" style="color: var(--color-danger-900);">
				Error loading stats
			</p>
			<p class="text-xs mt-1" style="color: var(--color-danger-700);">
				{$sharedStatsQuery.error?.message || 'Unknown error'}
			</p>
		</div>
	{/if}

	<div class="grid grid-cols-3 gap-4">
		<div class="text-center">
			<div class="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center" style="background: var(--color-primary-100);">
				<MapPin class="h-5 w-5" style="color: var(--color-primary-600);" />
			</div>
			<div class="text-2xl font-bold" style="color: var(--text-primary);">
				{stats.totalTours}
			</div>
			<div class="text-xs" style="color: var(--text-secondary);">
				Total Tours
			</div>
		</div>

		<div class="text-center">
			<div class="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center" style="background: var(--color-success-100);">
				<BarChart3 class="h-5 w-5" style="color: var(--color-success-600);" />
			</div>
			<div class="text-2xl font-bold" style="color: var(--text-primary);">
				{stats.activeTours}
			</div>
			<div class="text-xs" style="color: var(--text-secondary);">
				Active Tours
			</div>
		</div>

		<div class="text-center">
			<div class="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center" style="background: var(--color-warning-100);">
				<DollarSign class="h-5 w-5" style="color: var(--color-warning-600);" />
			</div>
			<div class="text-2xl font-bold" style="color: var(--text-primary);">
				{stats.monthlyTours}
			</div>
			<div class="text-xs" style="color: var(--text-secondary);">
				This Month
			</div>
		</div>
	</div>

	<div class="mt-4 pt-3 border-t" style="border-color: var(--border-primary);">
		<div class="flex items-center justify-between text-xs" style="color: var(--text-tertiary);">
			<span>
				{#if $sharedStatsQuery.isFetching}
					<Loader2 class="h-3 w-3 animate-spin inline mr-1" />
					Updating...
				{:else if $sharedStatsQuery.dataUpdatedAt}
					Last updated: {new Date($sharedStatsQuery.dataUpdatedAt).toLocaleTimeString()}
				{:else}
					Ready
				{/if}
			</span>
			<span class="text-xs px-2 py-1 rounded" style="background: var(--color-primary-100); color: var(--color-primary-700);">
				Cached for 5min
			</span>
		</div>
	</div>
</div> 