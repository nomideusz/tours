<script lang="ts">
	import { browser } from '$app/environment';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatDate } from '$lib/utils/date-helpers.js';
	import type { PageData } from './$types.js';
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import AnalyticsChart from '$lib/components/AnalyticsChart.svelte';
	
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
	import UserCheck from 'lucide-svelte/icons/user-check';
	import Share2 from 'lucide-svelte/icons/share-2';

	let { data }: { data: PageData } = $props();
	
	// Analytics time range state
	let timeRange = $state<'week' | 'month' | 'quarter' | 'year'>('month');
	
	let activeTab = $state<'overview' | 'revenue' | 'bookings' | 'tours' | 'conversions'>('overview');
	
	// Click handler for time range changes
	function handleTimeRangeChange(range: typeof timeRange) {
		timeRange = range;
	}

	// Fetch analytics data
	const analyticsQuery = createQuery({
		queryKey: ['analytics', 'month'] as const,
		queryFn: async () => {
			const response = await fetch(`/api/analytics?range=${timeRange}`);
			if (!response.ok) throw new Error('Failed to fetch analytics');
			return response.json();
		},
		staleTime: 5 * 60 * 1000, // 5 minutes - reduce excessive refetching
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false, // Disable window focus refetching
	});
	
	// Refetch when timeRange changes
	$effect(() => {
		if (timeRange) {
			$analyticsQuery.refetch();
		}
	});
	
	// Dashboard stats for comparison
	const dashboardStatsQuery = createQuery({
		queryKey: queryKeys.dashboardStats,
		queryFn: ({ signal }) => queryFunctions.fetchDashboardStats(signal),
		staleTime: 5 * 60 * 1000, // 5 minutes - reduce excessive refetching
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false, // Disable window focus refetching
	});
	
	// Tours stats
	const toursStatsQuery = createQuery({
		queryKey: queryKeys.toursStats,
		queryFn: ({ signal }) => queryFunctions.fetchToursStats(signal),
		staleTime: 5 * 60 * 1000, // 5 minutes - reduce excessive refetching
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false, // Disable window focus refetching
	});
	
	// Loading and error states
	let isLoading = $derived($analyticsQuery.isLoading || $dashboardStatsQuery.isLoading || $toursStatsQuery.isLoading);
	let hasError = $derived($analyticsQuery.isError || $dashboardStatsQuery.isError || $toursStatsQuery.isError);
	
	// Data
	let analytics = $derived($analyticsQuery.data || null);
	
	let dashboardStats = $derived($dashboardStatsQuery.data || {});
	let toursStats = $derived($toursStatsQuery.data || { stats: {} });
	
	// Calculate additional metrics
	let avgBookingValue = $derived(
		analytics?.revenue.total && analytics?.bookings.total
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
	
	// Source icons mapping
	const sourceIcons: Record<string, any> = {
		main_qr: QrCode,
		tour_qr: QrCode,
		direct: Activity,
		referral: Share2,
		social: Share2,
		other: Activity,
	};
	
	// Format source name
	function formatSourceName(source: string): string {
		const names: Record<string, string> = {
			main_qr: 'Main QR Code',
			tour_qr: 'Tour QR Code',
			direct: 'Direct Visit',
			referral: 'Referral Link',
			social: 'Social Media',
			other: 'Other',
		};
		return names[source] || source;
	}
</script>

<svelte:head>
	<title>Analytics - Zaur</title>
	<meta name="description" content="Tour business analytics and insights" />
</svelte:head>

<style>
	.tab-button {
		position: relative;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
		min-height: 44px; /* Better touch targets */
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}
	
	@media (min-width: 640px) {
		.tab-button {
			padding: 0.5rem 1rem;
			min-height: auto;
		}
	}
	
	.tab-button:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
	}
	
	.tab-button.active {
		color: var(--color-primary-700);
		font-weight: 600;
	}
	
	.tab-button.active::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 0;
		right: 0;
		height: 3px;
		background-color: var(--color-primary-600);
		border-radius: 2px 2px 0 0;
	}
	
	.time-range-button {
		padding: 0.5rem 0.875rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		position: relative;
		min-height: 44px; /* Better touch targets on mobile */
		display: flex;
		align-items: center;
		justify-content: center;
		white-space: nowrap;
	}
	
	@media (min-width: 640px) {
		.time-range-button {
			padding: 0.375rem 0.75rem;
			min-height: auto;
		}
	}
	
	.time-range-button:hover {
		color: var(--text-primary);
		border-color: var(--border-primary);
		background: var(--bg-secondary);
	}
	
	.time-range-button.active {
		color: #FFFFFF;
		background: var(--color-primary-600);
		border-color: var(--color-primary-600);
		font-weight: 600;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
	}
	
	.time-range-button.active:hover {
		background: var(--color-primary-700);
		border-color: var(--color-primary-700);
		color: #FFFFFF;
	}
	
	.stat-card {
		position: relative;
		overflow: hidden;
	}
	

	
	.chart-container {
		position: relative;
		height: 250px;
		width: 100%;
		margin: 0 -0.5rem; /* Better mobile margins */
	}
	
	@media (min-width: 640px) {
		.chart-container {
			height: 300px;
			margin: 0;
		}
	}
	
	@media (min-width: 1024px) {
		.chart-container {
			height: 350px;
		}
	}
	
	.mobile-scroll {
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		-ms-overflow-style: none;
		padding-bottom: 2px; /* Prevent content clipping */
	}
	
	.mobile-scroll::-webkit-scrollbar {
		display: none;
	}
	
	/* Extra small mobile devices */
	@media (max-width: 375px) {
		.time-range-button {
			padding: 0.5rem 0.625rem;
			font-size: 0.6875rem;
		}
		
		.tab-button {
			padding: 0.625rem 0.75rem;
			font-size: 0.8125rem;
		}
		
		.chart-container {
			height: 220px;
			margin: 0 -0.75rem;
		}
	}
	
	/* Custom breakpoint for xs */
	@media (min-width: 420px) {
		.xs\:grid-cols-2 {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
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
	
	.peak-time-bar {
		position: relative;
		height: 100px;
		background: var(--bg-secondary);
		border-radius: 0.25rem;
		overflow: hidden;
	}
	
	.peak-time-fill {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--color-primary-500);
		transition: height 0.3s ease;
	}
	
	.source-bar {
		position: relative;
		height: 8px;
		background: var(--bg-secondary);
		border-radius: 9999px;
		overflow: hidden;
	}
	
	.source-fill {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		background: var(--color-primary-500);
		transition: width 0.3s ease;
	}
</style>

<div class="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 lg:py-8">
	<!-- Header -->
	<div class="mb-4 sm:mb-8">
		<!-- Mobile Header -->
		<MobilePageHeader
			title="Analytics"
			secondaryInfo={`${timeRange} view`}
			quickActions={[]}
			infoItems={[
				{
					icon: DollarSign,
					label: 'Revenue',
					value: isLoading ? '...' : $globalCurrencyFormatter(analytics?.revenue.total)
				},
				{
					icon: Calendar,
					label: 'Bookings',
					value: isLoading ? '...' : `${analytics?.bookings.total}`
				},
				{
					icon: Percent,
					label: 'QR Rate',
					value: isLoading ? '...' : `${analytics?.qrCodes.conversionRate || 0}%`
				},
				{
					icon: TrendingUp,
					label: 'Trend',
					value: isLoading ? '...' : analytics?.revenue.trend > 0 ? `+${analytics.revenue.trend}%` : `${analytics.revenue.trend}%`
				}
			]}
		/>
		
		<!-- Mobile Time Range Selector -->
		<div class="sm:hidden mb-4 px-1">
			<div class="flex items-center gap-2 overflow-x-auto mobile-scroll pb-2">
				<button
					onclick={() => handleTimeRangeChange('week')}
					class="time-range-button {timeRange === 'week' ? 'active' : ''}"
				>
					Week
				</button>
				<button
					onclick={() => handleTimeRangeChange('month')}
					class="time-range-button {timeRange === 'month' ? 'active' : ''}"
				>
					Month
				</button>
				<button
					onclick={() => handleTimeRangeChange('quarter')}
					class="time-range-button {timeRange === 'quarter' ? 'active' : ''}"
				>
					Quarter
				</button>
				<button
					onclick={() => handleTimeRangeChange('year')}
					class="time-range-button {timeRange === 'year' ? 'active' : ''}"
				>
					Year
				</button>
			</div>
		</div>
		
		<!-- Desktop Header -->
		<div class="hidden sm:block">
			<PageHeader 
				title="Analytics"
				subtitle="Track your tour business performance"
			>
				<!-- Time Range Selector -->
				<div class="flex items-center gap-2">
					<button
						onclick={() => handleTimeRangeChange('week')}
						class="time-range-button {timeRange === 'week' ? 'active' : ''}"
					>
						Week
					</button>
					<button
						onclick={() => handleTimeRangeChange('month')}
						class="time-range-button {timeRange === 'month' ? 'active' : ''}"
					>
						Month
					</button>
					<button
						onclick={() => handleTimeRangeChange('quarter')}
						class="time-range-button {timeRange === 'quarter' ? 'active' : ''}"
					>
						Quarter
					</button>
					<button
						onclick={() => handleTimeRangeChange('year')}
						class="time-range-button {timeRange === 'year' ? 'active' : ''}"
					>
						Year
					</button>
				</div>
			</PageHeader>
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
			<div class="space-y-4 sm:space-y-6">
				<!-- Key Metrics -->
				<div class="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
					<!-- Total Revenue -->
					<div class="stat-card rounded-lg p-3 sm:p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="flex items-start justify-between mb-2 sm:mb-3">
							<div class="p-2 rounded-lg" style="background: var(--bg-secondary);">
								<DollarSign class="h-4 w-4" style="color: var(--color-primary-600);" />
							</div>
							{#if analytics?.revenue.trend !== 0}
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
						<p class="text-xl sm:text-2xl font-bold mb-1" style="color: var(--text-primary);">
							{$globalCurrencyFormatter(analytics?.revenue.total)}
						</p>
						<p class="text-xs" style="color: var(--text-secondary);">Total Revenue</p>
					</div>
					
					<!-- Total Bookings -->
					<div class="stat-card rounded-lg p-3 sm:p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="flex items-start justify-between mb-2 sm:mb-3">
							<div class="p-2 rounded-lg" style="background: var(--bg-secondary);">
								<Calendar class="h-4 w-4" style="color: var(--color-primary-600);" />
							</div>
							{#if analytics?.bookings.trend !== 0}
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
						<p class="text-xl sm:text-2xl font-bold mb-1" style="color: var(--text-primary);">
							{analytics?.bookings.total}
						</p>
						<p class="text-xs" style="color: var(--text-secondary);">Total Bookings</p>
					</div>
					
					<!-- Avg Booking Value -->
					<div class="stat-card rounded-lg p-3 sm:p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="flex items-start justify-between mb-2 sm:mb-3">
							<div class="p-2 rounded-lg" style="background: var(--bg-secondary);">
								<Target class="h-4 w-4" style="color: var(--color-primary-600);" />
							</div>
						</div>
						<p class="text-xl sm:text-2xl font-bold mb-1" style="color: var(--text-primary);">
							{$globalCurrencyFormatter(avgBookingValue)}
						</p>
						<p class="text-xs" style="color: var(--text-secondary);">Avg Booking Value</p>
					</div>
					
					<!-- Conversion Rate -->
					<div class="stat-card rounded-lg p-3 sm:p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="flex items-start justify-between mb-2 sm:mb-3">
							<div class="p-2 rounded-lg" style="background: var(--bg-secondary);">
								<Percent class="h-4 w-4" style="color: var(--color-primary-600);" />
							</div>
						</div>
						<p class="text-xl sm:text-2xl font-bold mb-1" style="color: var(--text-primary);">
							{analytics?.qrCodes.conversionRate || 0}%
						</p>
						<p class="text-xs" style="color: var(--text-secondary);">QR Conversion Rate</p>
					</div>
				</div>
				
				<!-- Charts Section -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
					<!-- Revenue Chart -->
					<div class="rounded-lg p-3 sm:p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<h3 class="text-sm font-semibold mb-3 sm:mb-4" style="color: var(--text-primary);">Revenue Trend</h3>
						<div class="chart-container">
							<AnalyticsChart 
								data={analytics?.revenue.chartData || []} 
								type="line"
								showCurrency={true}
								color="var(--color-primary-500)"
								label="Revenue"
								key={`revenue-${activeTab}-${timeRange}`}
							/>
						</div>
					</div>
					
					<!-- Bookings Chart -->
					<div class="rounded-lg p-3 sm:p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<h3 class="text-sm font-semibold mb-3 sm:mb-4" style="color: var(--text-primary);">Bookings Trend</h3>
						<div class="chart-container">
							<AnalyticsChart 
								data={analytics?.bookings.chartData || []} 
								type="bar"
								color="var(--color-primary-500)"
								label="Bookings"
								key={`bookings-${activeTab}-${timeRange}`}
							/>
						</div>
					</div>
				</div>
				
				<!-- Additional Insights Grid -->
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
					<!-- Popular Tours -->
					<div class="rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 border-b" style="border-color: var(--border-primary);">
							<h3 class="text-sm font-semibold" style="color: var(--text-primary);">Top Performing Tours</h3>
						</div>
						<div class="p-4">
							{#if analytics?.popularTours && analytics.popularTours.length > 0}
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
					
					<!-- Customer Insights -->
					<div class="rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 border-b" style="border-color: var(--border-primary);">
							<h3 class="text-sm font-semibold" style="color: var(--text-primary);">Customer Insights</h3>
						</div>
						<div class="p-4 space-y-4">
							<div>
								<div class="flex items-center justify-between mb-2">
									<span class="text-xs" style="color: var(--text-secondary);">Total Customers</span>
									<span class="text-sm font-semibold" style="color: var(--text-primary);">{analytics?.customers.total}</span>
								</div>
								<div class="flex items-center justify-between mb-2">
									<span class="text-xs" style="color: var(--text-secondary);">New Customers</span>
									<span class="text-sm font-semibold text-green-600">{analytics?.customers.new}</span>
								</div>
								<div class="flex items-center justify-between mb-2">
									<span class="text-xs" style="color: var(--text-secondary);">Returning Customers</span>
									<span class="text-sm font-semibold text-blue-600">{analytics?.customers.returning}</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-xs" style="color: var(--text-secondary);">Retention Rate</span>
									<span class="text-sm font-semibold" style="color: var(--text-primary);">{analytics?.customerRetention.rate}%</span>
								</div>
							</div>
						</div>
					</div>
					
					<!-- Source Analytics -->
					<div class="rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 border-b" style="border-color: var(--border-primary);">
							<h3 class="text-sm font-semibold" style="color: var(--text-primary);">Booking Sources</h3>
						</div>
						<div class="p-4">
							{#if analytics?.sourceAnalytics && analytics.sourceAnalytics.length > 0}
								<div class="space-y-3">
									{#each analytics.sourceAnalytics as source}
										{@const Icon = sourceIcons[source.source] || Activity}
										<div>
											<div class="flex items-center justify-between mb-1">
												<div class="flex items-center gap-2">
													<Icon class="h-3 w-3" style="color: var(--text-tertiary);" />
													<span class="text-xs font-medium" style="color: var(--text-primary);">
														{formatSourceName(source.source)}
													</span>
												</div>
												<span class="text-xs" style="color: var(--text-secondary);">
													{source.percentage}%
												</span>
											</div>
											<div class="source-bar">
												<div class="source-fill" style="width: {source.percentage}%"></div>
											</div>
											<p class="text-xs mt-1" style="color: var(--text-tertiary);">
												{source.bookings} bookings • {$globalCurrencyFormatter(source.revenue)}
											</p>
										</div>
									{/each}
								</div>
							{:else}
								<p class="text-sm text-center py-4" style="color: var(--text-secondary);">
									No source data available
								</p>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{:else if activeTab === 'revenue'}
			<!-- Revenue Tab -->
			<div class="space-y-6">
				<div class="rounded-lg p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<h3 class="text-lg font-semibold mb-6" style="color: var(--text-primary);">Revenue Analytics</h3>
					
					<!-- Revenue Chart -->
					<div class="mb-6">
						<AnalyticsChart 
							data={analytics?.revenue.chartData || []} 
							type="line"
							showCurrency={true}
							color="var(--color-primary-500)"
							label="Revenue"
							key={`revenue-${activeTab}-${timeRange}`}
						/>
					</div>
					
					<!-- Revenue Breakdown -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
						<div>
							<h4 class="text-sm font-semibold mb-4" style="color: var(--text-primary);">Revenue by Tour</h4>
							{#if analytics?.popularTours && analytics.popularTours.length > 0}
								<div class="space-y-2">
									{#each analytics.popularTours as tour}
										<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-secondary);">
											<div>
												<p class="text-sm font-medium" style="color: var(--text-primary);">{tour.name}</p>
												<p class="text-xs" style="color: var(--text-secondary);">
													{tour.participants} participants
												</p>
											</div>
											<p class="text-sm font-semibold" style="color: var(--text-primary);">
												{$globalCurrencyFormatter(tour.revenue)}
											</p>
										</div>
									{/each}
								</div>
							{:else}
								<p class="text-sm text-center py-4" style="color: var(--text-secondary);">
									No revenue data available
								</p>
							{/if}
						</div>
						
						<div>
							<h4 class="text-sm font-semibold mb-4" style="color: var(--text-primary);">Key Metrics</h4>
							<div class="space-y-3">
								<div class="p-3 rounded-lg" style="background: var(--bg-secondary);">
									<p class="text-xs mb-1" style="color: var(--text-secondary);">Average Tour Value</p>
									<p class="text-lg font-semibold" style="color: var(--text-primary);">
										{$globalCurrencyFormatter(avgBookingValue)}
									</p>
								</div>
								<div class="p-3 rounded-lg" style="background: var(--bg-secondary);">
									<p class="text-xs mb-1" style="color: var(--text-secondary);">Revenue Growth</p>
									<p class="text-lg font-semibold {analytics.revenue.trend > 0 ? 'text-green-600' : 'text-red-600'}">
										{analytics.revenue.trend > 0 ? '+' : ''}{analytics.revenue.trend}%
									</p>
								</div>
								<div class="p-3 rounded-lg" style="background: var(--bg-secondary);">
									<p class="text-xs mb-1" style="color: var(--text-secondary);">Total Participants</p>
									<p class="text-lg font-semibold" style="color: var(--text-primary);">
										{analytics.popularTours.reduce((sum: number, tour: any) => sum + tour.participants, 0)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else if activeTab === 'bookings'}
			<!-- Bookings Tab -->
			<div class="space-y-6">
				<div class="rounded-lg p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<h3 class="text-lg font-semibold mb-6" style="color: var(--text-primary);">Booking Analytics</h3>
					
					<!-- Bookings Chart -->
					<div class="mb-6">
						<AnalyticsChart 
							data={analytics?.bookings.chartData || []} 
							type="bar"
							color="var(--color-primary-500)"
							label="Bookings"
							key={`bookings-${activeTab}-${timeRange}`}
						/>
					</div>
					
					<!-- Peak Times -->
					<div class="mt-6">
						<h4 class="text-sm font-semibold mb-4" style="color: var(--text-primary);">Peak Booking Times</h4>
						{#if analytics?.peakTimes && analytics.peakTimes.length > 0}
							<div class="grid grid-cols-12 gap-2">
								{#each analytics.peakTimes as time}
									{@const maxBookings = Math.max(...analytics.peakTimes.map((t: any) => t.bookings))}
									{@const percentage = (time.bookings / maxBookings) * 100}
									<div class="text-center">
										<div class="peak-time-bar relative mb-2">
											<div 
												class="peak-time-fill" 
												style="height: {percentage}%; opacity: {0.3 + (percentage / 100) * 0.7}"
											></div>
										</div>
										<p class="text-xs" style="color: var(--text-tertiary);">{time.label}</p>
										<p class="text-xs font-medium" style="color: var(--text-secondary);">{time.bookings}</p>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-center py-4" style="color: var(--text-secondary);">
								No booking time data available
							</p>
						{/if}
					</div>
				</div>
			</div>
		{:else if activeTab === 'tours'}
			<!-- Tours Tab -->
			<div class="space-y-6">
				<div class="rounded-lg p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<h3 class="text-lg font-semibold mb-6" style="color: var(--text-primary);">Tour Performance</h3>
					
					{#if analytics?.popularTours && analytics.popularTours.length > 0}
						<div class="space-y-4">
							{#each analytics.popularTours as tour, index}
								<div class="p-4 rounded-lg" style="background: var(--bg-secondary);">
									<div class="flex items-start justify-between mb-3">
										<div>
											<div class="flex items-center gap-2 mb-1">
												<span class="text-sm font-medium px-2 py-0.5 rounded" 
													style="background: var(--color-primary-100); color: var(--color-primary-700);">
													#{index + 1}
												</span>
												<h4 class="text-base font-semibold" style="color: var(--text-primary);">
													{tour.name}
												</h4>
											</div>
											<p class="text-sm" style="color: var(--text-secondary);">
												{tour.bookings} bookings • {tour.participants} participants
											</p>
										</div>
										<div class="text-right">
											<p class="text-lg font-bold" style="color: var(--text-primary);">
												{$globalCurrencyFormatter(tour.revenue)}
											</p>
											<p class="text-xs" style="color: var(--text-secondary);">
												Avg: {$globalCurrencyFormatter(tour.avgValue)}
											</p>
										</div>
									</div>
									
									<!-- Tour metrics bar -->
									<div class="grid grid-cols-3 gap-2 text-center">
										<div class="p-2 rounded" style="background: var(--bg-primary);">
											<p class="text-xs" style="color: var(--text-tertiary);">Bookings</p>
											<p class="text-sm font-semibold" style="color: var(--text-primary);">{tour.bookings}</p>
										</div>
										<div class="p-2 rounded" style="background: var(--bg-primary);">
											<p class="text-xs" style="color: var(--text-tertiary);">Participants</p>
											<p class="text-sm font-semibold" style="color: var(--text-primary);">{tour.participants}</p>
										</div>
										<div class="p-2 rounded" style="background: var(--bg-primary);">
											<p class="text-xs" style="color: var(--text-tertiary);">Avg Value</p>
											<p class="text-sm font-semibold" style="color: var(--text-primary);">
												{$globalCurrencyFormatter(tour.avgValue)}
											</p>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-center py-8" style="color: var(--text-secondary);">
							No tour performance data available for this period
						</p>
					{/if}
				</div>
			</div>
		{:else if activeTab === 'conversions'}
			<!-- Conversions Tab -->
			<div class="space-y-6">
				<div class="rounded-lg p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<h3 class="text-lg font-semibold mb-6" style="color: var(--text-primary);">Conversion Analytics</h3>
					
					<!-- Conversion Funnel -->
					<div class="mb-8">
						<h4 class="text-sm font-semibold mb-4" style="color: var(--text-primary);">QR Code Conversion Funnel</h4>
						<div class="space-y-3">
							<div>
								<div class="flex items-center justify-between mb-1">
									<span class="text-sm" style="color: var(--text-primary);">QR Scans</span>
									<span class="text-sm font-semibold" style="color: var(--text-primary);">{analytics?.qrCodes.scans}</span>
								</div>
								<div class="h-8 rounded-lg overflow-hidden" style="background: var(--color-primary-500);">
									<div class="h-full flex items-center justify-center text-xs font-medium text-white">
										100%
									</div>
								</div>
							</div>
							
							<div>
								<div class="flex items-center justify-between mb-1">
									<span class="text-sm" style="color: var(--text-primary);">Conversions</span>
									<span class="text-sm font-semibold" style="color: var(--text-primary);">{analytics?.qrCodes.conversions}</span>
								</div>
								<div class="h-8 rounded-lg overflow-hidden" style="background: var(--bg-secondary);">
									<div 
										class="h-full flex items-center justify-center text-xs font-medium text-white rounded-lg"
										style="width: {analytics?.qrCodes.conversionRate}%; background: var(--color-primary-500);"
									>
										{analytics?.qrCodes.conversionRate}%
									</div>
								</div>
							</div>
						</div>
					</div>
					
					<!-- Source Conversions -->
					<div>
						<h4 class="text-sm font-semibold mb-4" style="color: var(--text-primary);">Conversion by Source</h4>
						{#if analytics?.sourceAnalytics && analytics.sourceAnalytics.length > 0}
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								{#each analytics.sourceAnalytics as source}
									{@const Icon = sourceIcons[source.source] || Activity}
									<div class="p-4 rounded-lg" style="background: var(--bg-secondary);">
										<div class="flex items-center gap-3 mb-3">
											<div class="p-2 rounded-lg" style="background: var(--bg-primary);">
												<Icon class="h-4 w-4" style="color: var(--color-primary-600);" />
											</div>
											<div class="flex-1">
												<p class="text-sm font-medium" style="color: var(--text-primary);">
													{formatSourceName(source.source)}
												</p>
												<p class="text-xs" style="color: var(--text-secondary);">
													{source.bookings} bookings
												</p>
											</div>
											<p class="text-lg font-bold" style="color: var(--text-primary);">
												{source.percentage}%
											</p>
										</div>
										<div class="text-xs" style="color: var(--text-tertiary);">
											Revenue: {$globalCurrencyFormatter(source.revenue)}
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-center py-4" style="color: var(--text-secondary);">
								No conversion data available
							</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div> 