<script lang="ts">
	import { browser } from '$app/environment';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatDate } from '$lib/utils/date-helpers.js';
	import type { PageData } from './$types.js';
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	
	// Icons
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Users from 'lucide-svelte/icons/users';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Calendar from 'lucide-svelte/icons/calendar';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Clock from 'lucide-svelte/icons/clock';
	import Activity from 'lucide-svelte/icons/activity';
	import ArrowUp from 'lucide-svelte/icons/arrow-up';
	import ArrowDown from 'lucide-svelte/icons/arrow-down';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import Target from 'lucide-svelte/icons/target';
	import Percent from 'lucide-svelte/icons/percent';

	let { data }: { data: PageData } = $props();
	
	// Analytics time range state
	let timeRange = $state<'week' | 'month' | 'quarter' | 'year'>('month');
	let activeTab = $state<'overview' | 'revenue' | 'bookings' | 'tours' | 'conversions'>('overview');
	
	// Fetch analytics data
	const analyticsQuery = createQuery({
		queryKey: ['analytics', timeRange],
		queryFn: async () => {
			const response = await fetch(`/api/analytics?range=${timeRange}`);
			if (!response.ok) throw new Error('Failed to fetch analytics');
			return response.json();
		},
		staleTime: 30 * 1000, // 30 seconds
		gcTime: 5 * 60 * 1000,
		refetchOnWindowFocus: true,
	});
	
	// Dashboard stats for comparison
	const dashboardStatsQuery = createQuery({
		queryKey: queryKeys.dashboardStats,
		queryFn: queryFunctions.fetchDashboardStats,
		staleTime: 30 * 1000,
		gcTime: 5 * 60 * 1000,
	});
	
	// Tours stats
	const toursStatsQuery = createQuery({
		queryKey: queryKeys.toursStats,
		queryFn: queryFunctions.fetchToursStats,
		staleTime: 30 * 1000,
		gcTime: 5 * 60 * 1000,
	});
	
	// Loading and error states
	let isLoading = $derived($analyticsQuery.isLoading || $dashboardStatsQuery.isLoading || $toursStatsQuery.isLoading);
	let hasError = $derived($analyticsQuery.isError || $dashboardStatsQuery.isError || $toursStatsQuery.isError);
	
	// Data
	let analytics = $derived($analyticsQuery.data || {
		revenue: { total: 0, trend: 0, chartData: [] },
		bookings: { total: 0, trend: 0, chartData: [] },
		customers: { total: 0, new: 0, returning: 0 },
		tours: { views: 0, bookings: 0, conversionRate: 0 },
		qrCodes: { scans: 0, conversions: 0, conversionRate: 0 },
		popularTours: [],
		peakTimes: [],
	});
	
	let dashboardStats = $derived($dashboardStatsQuery.data || {});
	let toursStats = $derived($toursStatsQuery.data || { stats: {} });
	
	// Calculate additional metrics
	let avgBookingValue = $derived(
		analytics.revenue.total && analytics.bookings.total
			? analytics.revenue.total / analytics.bookings.total
			: 0
	);
	
	// Tab navigation for mobile
	const tabs = [
		{ id: 'overview' as const, label: 'Overview', icon: BarChart3 },
		{ id: 'revenue' as const, label: 'Revenue', icon: DollarSign },
		{ id: 'bookings' as const, label: 'Bookings', icon: Calendar },
		{ id: 'tours' as const, label: 'Tours', icon: MapPin },
		{ id: 'conversions' as const, label: 'Conversions', icon: Target },
	];
</script>

<svelte:head>
	<title>Analytics - Zaur</title>
	<meta name="description" content="Tour business analytics and insights" />
</svelte:head>

<style>
	.tab-button {
		position: relative;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}
	
	.tab-button:hover {
		color: var(--text-primary);
	}
	
	.tab-button.active {
		color: var(--text-primary);
	}
	
	.tab-button.active::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 0;
		right: 0;
		height: 2px;
		background-color: var(--color-primary-500);
	}
	
	.time-range-button {
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.time-range-button:hover {
		color: var(--text-primary);
		border-color: var(--border-primary);
	}
	
	.time-range-button.active {
		color: var(--color-primary-700);
		background: var(--color-primary-50);
		border-color: var(--color-primary-200);
	}
	
	.stat-card {
		position: relative;
		overflow: hidden;
	}
	
	.stat-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, 
			var(--color-primary-400) 0%, 
			var(--color-primary-500) 50%, 
			var(--color-primary-400) 100%);
		transform: translateX(-100%);
		animation: shimmer 2s infinite;
	}
	
	@keyframes shimmer {
		to {
			transform: translateX(100%);
		}
	}
	
	.chart-container {
		position: relative;
		height: 200px;
		width: 100%;
	}
	
	@media (min-width: 640px) {
		.chart-container {
			height: 300px;
		}
	}
	
	.mobile-scroll {
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}
	
	.mobile-scroll::-webkit-scrollbar {
		display: none;
	}
	
	.desktop-tab-active {
		background: var(--bg-primary);
		color: var(--text-primary);
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
	}
	
	.desktop-tab-inactive {
		color: var(--text-secondary);
	}
	
	.desktop-tab-inactive:hover {
		color: var(--text-primary);
	}
</style>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Header -->
	<div class="mb-6 sm:mb-8">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<h1 class="text-2xl sm:text-3xl font-bold" style="color: var(--text-primary);">
					Analytics
				</h1>
				<p class="text-sm mt-1" style="color: var(--text-secondary);">
					Track your tour business performance
				</p>
			</div>
			
			<!-- Time Range Selector -->
			<div class="flex items-center gap-2">
				<button
					onclick={() => timeRange = 'week'}
					class="time-range-button {timeRange === 'week' ? 'active' : ''}"
				>
					Week
				</button>
				<button
					onclick={() => timeRange = 'month'}
					class="time-range-button {timeRange === 'month' ? 'active' : ''}"
				>
					Month
				</button>
				<button
					onclick={() => timeRange = 'quarter'}
					class="time-range-button {timeRange === 'quarter' ? 'active' : ''}"
				>
					Quarter
				</button>
				<button
					onclick={() => timeRange = 'year'}
					class="time-range-button {timeRange === 'year' ? 'active' : ''}"
				>
					Year
				</button>
			</div>
		</div>
	</div>
	
	{#if isLoading}
		<!-- Loading State -->
		<div class="flex items-center justify-center min-h-[60vh]">
			<div class="text-center">
				<Loader2 class="h-8 w-8 animate-spin mx-auto mb-4" style="color: var(--text-tertiary);" />
				<p class="text-sm" style="color: var(--text-secondary);">Loading analytics...</p>
			</div>
		</div>
	{:else if hasError}
		<!-- Error State -->
		<div class="rounded-lg p-8 text-center" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<Activity class="w-12 h-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
			<h2 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Unable to load analytics</h2>
			<p class="text-sm mb-4" style="color: var(--text-secondary);">Please try again later.</p>
			<button
				onclick={() => {
					$analyticsQuery.refetch();
					$dashboardStatsQuery.refetch();
					$toursStatsQuery.refetch();
				}}
				class="button-secondary"
			>
				Retry
			</button>
		</div>
	{:else}
		<!-- Mobile Tab Navigation -->
		<div class="sm:hidden mb-6 -mx-4">
			<div class="flex overflow-x-auto mobile-scroll px-4 border-b" style="border-color: var(--border-primary);">
				{#each tabs as tab}
					<button
						onclick={() => activeTab = tab.id}
						class="tab-button {activeTab === tab.id ? 'active' : ''}"
					>
						<div class="flex items-center gap-2">
							<tab.icon class="h-4 w-4" />
							<span>{tab.label}</span>
						</div>
					</button>
				{/each}
			</div>
		</div>
		
		<!-- Desktop Tab Navigation -->
		<div class="hidden sm:block mb-6">
			<div class="flex items-center gap-1 p-1 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
				{#each tabs as tab}
					<button
						onclick={() => activeTab = tab.id}
						class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
							{activeTab === tab.id ? 'desktop-tab-active' : 'desktop-tab-inactive'}"
					>
						<tab.icon class="h-4 w-4" />
						{tab.label}
					</button>
				{/each}
			</div>
		</div>
		
		<!-- Content based on active tab -->
		{#if activeTab === 'overview'}
			<!-- Overview Tab -->
			<div class="space-y-6">
				<!-- Key Metrics -->
				<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
					<!-- Total Revenue -->
					<div class="stat-card rounded-lg p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="flex items-start justify-between mb-3">
							<div class="p-2 rounded-lg" style="background: var(--bg-secondary);">
								<DollarSign class="h-4 w-4" style="color: var(--color-primary-600);" />
							</div>
							{#if analytics.revenue.trend !== 0}
								<div class="flex items-center gap-1 text-xs {analytics.revenue.trend > 0 ? 'text-green-600' : 'text-red-600'}">
									{#if analytics.revenue.trend > 0}
										<ArrowUp class="h-3 w-3" />
									{:else}
										<ArrowDown class="h-3 w-3" />
									{/if}
									{Math.abs(analytics.revenue.trend)}%
								</div>
							{/if}
						</div>
						<p class="text-2xl font-bold mb-1" style="color: var(--text-primary);">
							{$globalCurrencyFormatter(analytics.revenue.total)}
						</p>
						<p class="text-xs" style="color: var(--text-secondary);">Total Revenue</p>
					</div>
					
					<!-- Total Bookings -->
					<div class="stat-card rounded-lg p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="flex items-start justify-between mb-3">
							<div class="p-2 rounded-lg" style="background: var(--bg-secondary);">
								<Calendar class="h-4 w-4" style="color: var(--color-primary-600);" />
							</div>
							{#if analytics.bookings.trend !== 0}
								<div class="flex items-center gap-1 text-xs {analytics.bookings.trend > 0 ? 'text-green-600' : 'text-red-600'}">
									{#if analytics.bookings.trend > 0}
										<ArrowUp class="h-3 w-3" />
									{:else}
										<ArrowDown class="h-3 w-3" />
									{/if}
									{Math.abs(analytics.bookings.trend)}%
								</div>
							{/if}
						</div>
						<p class="text-2xl font-bold mb-1" style="color: var(--text-primary);">
							{analytics.bookings.total}
						</p>
						<p class="text-xs" style="color: var(--text-secondary);">Total Bookings</p>
					</div>
					
					<!-- Avg Booking Value -->
					<div class="stat-card rounded-lg p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="flex items-start justify-between mb-3">
							<div class="p-2 rounded-lg" style="background: var(--bg-secondary);">
								<Target class="h-4 w-4" style="color: var(--color-primary-600);" />
							</div>
						</div>
						<p class="text-2xl font-bold mb-1" style="color: var(--text-primary);">
							{$globalCurrencyFormatter(avgBookingValue)}
						</p>
						<p class="text-xs" style="color: var(--text-secondary);">Avg Booking Value</p>
					</div>
					
					<!-- Conversion Rate -->
					<div class="stat-card rounded-lg p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="flex items-start justify-between mb-3">
							<div class="p-2 rounded-lg" style="background: var(--bg-secondary);">
								<Percent class="h-4 w-4" style="color: var(--color-primary-600);" />
							</div>
						</div>
						<p class="text-2xl font-bold mb-1" style="color: var(--text-primary);">
							{analytics.qrCodes.conversionRate || 0}%
						</p>
						<p class="text-xs" style="color: var(--text-secondary);">QR Conversion Rate</p>
					</div>
				</div>
				
				<!-- Charts Section -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<!-- Revenue Chart Placeholder -->
					<div class="rounded-lg p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<h3 class="text-sm font-semibold mb-4" style="color: var(--text-primary);">Revenue Trend</h3>
						<div class="chart-container flex items-center justify-center" style="background: var(--bg-secondary); border-radius: 0.5rem;">
							<div class="text-center">
								<BarChart3 class="h-8 w-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
								<p class="text-sm" style="color: var(--text-secondary);">Chart coming soon</p>
							</div>
						</div>
					</div>
					
					<!-- Bookings Chart Placeholder -->
					<div class="rounded-lg p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<h3 class="text-sm font-semibold mb-4" style="color: var(--text-primary);">Bookings Trend</h3>
						<div class="chart-container flex items-center justify-center" style="background: var(--bg-secondary); border-radius: 0.5rem;">
							<div class="text-center">
								<Activity class="h-8 w-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
								<p class="text-sm" style="color: var(--text-secondary);">Chart coming soon</p>
							</div>
						</div>
					</div>
				</div>
				
				<!-- Popular Tours -->
				<div class="rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b" style="border-color: var(--border-primary);">
						<h3 class="text-sm font-semibold" style="color: var(--text-primary);">Top Performing Tours</h3>
					</div>
					<div class="p-4">
						{#if analytics.popularTours && analytics.popularTours.length > 0}
							<div class="space-y-3">
								{#each analytics.popularTours.slice(0, 5) as tour, index}
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-3">
											<span class="text-xs font-medium w-6" style="color: var(--text-tertiary);">#{index + 1}</span>
											<div>
												<p class="text-sm font-medium" style="color: var(--text-primary);">{tour.name}</p>
												<p class="text-xs" style="color: var(--text-secondary);">
													{tour.bookings} bookings • {$globalCurrencyFormatter(tour.revenue)}
												</p>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-center py-4" style="color: var(--text-secondary);">
								No tour data available for this period
							</p>
						{/if}
					</div>
				</div>
			</div>
		{:else if activeTab === 'revenue'}
			<!-- Revenue Tab -->
			<div class="space-y-6">
				<div class="rounded-lg p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Revenue Analytics</h3>
					<div class="text-center py-12">
						<DollarSign class="h-12 w-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
						<p class="text-sm" style="color: var(--text-secondary);">Revenue analytics coming soon</p>
					</div>
				</div>
			</div>
		{:else if activeTab === 'bookings'}
			<!-- Bookings Tab -->
			<div class="space-y-6">
				<div class="rounded-lg p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Booking Analytics</h3>
					<div class="text-center py-12">
						<Calendar class="h-12 w-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
						<p class="text-sm" style="color: var(--text-secondary);">Booking analytics coming soon</p>
					</div>
				</div>
			</div>
		{:else if activeTab === 'tours'}
			<!-- Tours Tab -->
			<div class="space-y-6">
				<div class="rounded-lg p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Tour Performance</h3>
					<div class="text-center py-12">
						<MapPin class="h-12 w-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
						<p class="text-sm" style="color: var(--text-secondary);">Tour analytics coming soon</p>
					</div>
				</div>
			</div>
		{:else if activeTab === 'conversions'}
			<!-- Conversions Tab -->
			<div class="space-y-6">
				<div class="rounded-lg p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Conversion Analytics</h3>
					<div class="text-center py-12">
						<Target class="h-12 w-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
						<p class="text-sm" style="color: var(--text-secondary);">Conversion analytics coming soon</p>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div> 