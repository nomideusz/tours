<script lang="ts">
	// EMERGENCY FIX: Dashboard shows ESTIMATED statistics for performance.
	// Real data was causing 502 errors for users with many tours (26+).
	// To fetch real statistics, use the /api/dashboard-stats endpoint:
	// const response = await fetch('/api/dashboard-stats');
	// const realStats = await response.json();
	
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import { formatEuro } from '$lib/utils/currency.js';
	import { formatDate, formatDateMobile, getStatusColor } from '$lib/utils/date-helpers.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	
	// Icons
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import Plus from 'lucide-svelte/icons/plus';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Clock from 'lucide-svelte/icons/clock';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';

	let { data }: { data: PageData } = $props();

	// Use real data from server (with fallbacks for type safety)
	let stats = $state(data.stats || {
		totalTours: 0,
		activeTours: 0,
		todayBookings: 0,
		weeklyRevenue: 0,
		upcomingTours: 0,
		totalCustomers: 0,
		monthlyTours: 0
	});
	let recentBookings = $state(data.recentBookings || []);
	let todaysSchedule = $state(data.todaysSchedule || []);



	// Data is now loaded server-side
</script>

<svelte:head>
	<title>Dashboard - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<div class="mb-6 sm:mb-8">
		<PageHeader 
			title="Dashboard"
			subtitle="Welcome back! Here's what's happening with your tours."
		/>
	</div>

	<!-- Quick Actions - Prominent on mobile -->
	<div class="lg:hidden mb-6">
		<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<h3 class="text-base font-semibold mb-3" style="color: var(--text-primary);">Quick Actions</h3>
			<div class="grid grid-cols-2 gap-3">
				<button
					onclick={() => goto('/checkin-scanner')}
					class="button-primary button--gap button--small justify-center py-3"
				>
					<UserCheck class="h-4 w-4" />
					QR Scanner
				</button>
				<button
					onclick={() => goto('/tours/new')}
					class="button-primary button--gap button--small justify-center py-3"
				>
					<Plus class="h-4 w-4" />
					New Tour
				</button>
			</div>
		</div>
	</div>

	<!-- Today's Schedule - Prominent on mobile, above stats -->
	<div class="lg:hidden mb-6">
		<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="flex items-center justify-between mb-3">
				<h3 class="text-base font-semibold" style="color: var(--text-primary);">Today's Schedule</h3>
				<button
					onclick={() => goto('/bookings')}
					class="button-secondary button--small text-xs px-2 py-1"
				>
					View All
				</button>
			</div>
			<div class="space-y-2">
				{#if todaysSchedule.length > 0}
					{#each todaysSchedule.slice(0, 3) as schedule}
						<div class="flex items-center gap-3 p-2 rounded-lg" style="background: var(--bg-secondary);">
							<div class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
								<Clock class="w-3 h-3 text-white" />
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium" style="color: var(--text-primary);">
									{new Date('2024-01-01T' + schedule.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
								</p>
								<p class="text-xs truncate" style="color: var(--text-secondary);">
									{schedule.tourName} • {schedule.participants} {schedule.participants === 1 ? 'guest' : 'guests'}
								</p>
							</div>
						</div>
					{/each}
					{#if todaysSchedule.length > 3}
						<div class="text-center pt-1">
							<button
								onclick={() => goto('/bookings')}
								class="text-xs text-blue-600 hover:text-blue-700 font-medium"
							>
								View {todaysSchedule.length - 3} more
							</button>
						</div>
					{/if}
				{:else}
					<div class="text-center py-4">
						<div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
							<Calendar class="w-4 h-4 text-gray-400" />
						</div>
						<p class="text-sm" style="color: var(--text-secondary);">No bookings today</p>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Compact Stats Grid -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
		<div class="lg:hidden col-span-2">
			<!-- Mobile: Today's focus -->
			<StatsCard
				title="Today's Bookings" 
				value={stats.todayBookings}
				subtitle="bookings for today"
				icon={Calendar}
				variant="small"
			/>
		</div>
		
		<StatsCard
			title="Total Tours"
			value={stats.totalTours}
			subtitle="{stats.activeTours} active"
			icon={MapPin}
			trend={stats.monthlyTours > 0 ? { value: `+${stats.monthlyTours} this month`, positive: true } : undefined}
			href="/tours"
			variant="small"
		/>

		<!-- Hidden on mobile, shown on larger screens -->
		<div class="hidden lg:block">
			<StatsCard
				title="Today's Bookings" 
				value={stats.todayBookings}
				subtitle="bookings for today"
				icon={Calendar}
				variant="small"
			/>
		</div>

		<StatsCard
			title="Weekly Revenue"
			value={formatEuro(stats.weeklyRevenue)}
			subtitle="{stats.totalCustomers} total guests"
			icon={DollarSign}
			trend={stats.weeklyRevenue > 0 ? { value: "This week", positive: true } : undefined}
			variant="small"
		/>

		<StatsCard
			title="Active Bookings"
			value={stats.upcomingTours || 0}
			subtitle="tours scheduled"
			icon={TrendingUp}
			variant="small"
		/>
	</div>

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
		<!-- Recent Bookings -->
		<div class="lg:col-span-2">
			<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="px-4 sm:px-6 py-4" style="border-bottom: 1px solid var(--border-primary);">
					<div class="flex items-center justify-between">
						<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Recent Bookings</h2>
						<button
							onclick={() => goto('/bookings')}
							class="button-secondary button--small"
						>
							View All
						</button>
					</div>
				</div>
				
				<div style="border-color: var(--border-primary);" class="divide-y">
					{#if recentBookings.length > 0}
						{#each recentBookings.slice(0, 5) as booking}
							<button class="w-full px-4 sm:px-6 py-4 transition-colors text-left" style="hover:background: var(--bg-secondary);" onclick={() => goto(`/bookings/${booking.id}`)}>
								<div class="flex items-center justify-between">
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-3 mb-2">
											<div class="flex-shrink-0">
												<div class="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
													<Users class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
												</div>
											</div>
											<div class="flex-1 min-w-0">
												<p class="text-sm font-medium truncate" style="color: var(--text-primary);">
													{booking.customerName}
												</p>
												<p class="text-sm truncate" style="color: var(--text-secondary);">
													{booking.tourName}
												</p>
											</div>
										</div>
										<div class="flex items-center gap-3 sm:gap-4 text-xs overflow-x-auto" style="color: var(--text-tertiary);">
											<span class="flex items-center gap-1 flex-shrink-0">
												<Clock class="w-3 h-3" />
																							<span class="hidden sm:inline">{formatDate(booking.date)}</span>
											<span class="sm:hidden">{formatDateMobile(booking.date)}</span>
											</span>
											<span class="flex items-center gap-1 flex-shrink-0">
												<Users class="w-3 h-3" />
												{booking.participants} {booking.participants === 1 ? 'person' : 'people'}
											</span>
											<span class="flex items-center gap-1 flex-shrink-0">
												<DollarSign class="w-3 h-3" />
												{formatEuro(booking.amount || 0)}
											</span>
										</div>
									</div>
									<div class="flex items-center gap-3 ml-3">
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getStatusColor(booking.status)}">
											<span class="hidden sm:inline">{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
											<span class="sm:hidden">{booking.status.charAt(0).toUpperCase()}</span>
										</span>
									</div>
								</div>
							</button>
						{/each}
						{#if recentBookings.length > 5}
							<div class="px-4 sm:px-6 py-3 bg-gray-50 text-center border-t border-gray-200">
								<button
									onclick={() => goto('/bookings')}
									class="text-sm text-blue-600 hover:text-blue-700 font-medium"
								>
									View {recentBookings.length - 5} more bookings
								</button>
							</div>
						{/if}
					{:else}
						<div class="px-4 sm:px-6 py-8">
							<EmptyState
								icon={Calendar}
								title="No recent bookings"
								description="Bookings will appear here once customers start booking your tours"
								actionText="View All Bookings"
								onAction={() => goto('/bookings')}
							/>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Desktop Sidebar -->
		<div class="hidden lg:block space-y-6">
			<!-- Today's Schedule -->
			<div class="rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Today's Schedule</h3>
					<button
						onclick={() => goto('/bookings')}
						class="button-secondary button--small"
					>
						View All
					</button>
				</div>
				<div class="space-y-3">
					{#if todaysSchedule.length > 0}
						{#each todaysSchedule.slice(0, 4) as schedule}
							<div class="flex items-center gap-3 p-3 rounded-lg transition-colors hover:opacity-90" style="background: var(--bg-secondary);">
								<div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
									<Clock class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium" style="color: var(--text-primary);">
										{new Date('2024-01-01T' + schedule.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
									</p>
									<p class="text-xs truncate" style="color: var(--text-secondary);">
										{schedule.tourName} • {schedule.participants} {schedule.participants === 1 ? 'guest' : 'guests'}
									</p>
								</div>
							</div>
						{/each}
						{#if todaysSchedule.length > 4}
							<div class="text-center pt-2">
								<button
									onclick={() => goto('/bookings')}
									class="text-sm text-blue-600 hover:text-blue-700 font-medium"
								>
									View {todaysSchedule.length - 4} more bookings
								</button>
							</div>
						{/if}
					{:else}
						<EmptyState
							icon={Calendar}
							title="No bookings today"
							description="Your schedule is clear for today"
						/>
					{/if}
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Quick Actions</h3>
				<div class="grid grid-cols-2 gap-3 mb-4">
					<button
						onclick={() => goto('/checkin-scanner')}
						class="button-primary button--gap button--small justify-center"
					>
						<UserCheck class="h-4 w-4" />
						QR Scanner
					</button>
					<button
						onclick={() => goto('/tours/new')}
						class="button-primary button--gap button--small justify-center"
					>
						<Plus class="h-4 w-4" />
						New Tour
					</button>
				</div>
				<div class="space-y-2">
					<button
						onclick={() => goto('/tours')}
						class="w-full button-secondary button--gap button--small justify-center"
					>
						<MapPin class="h-4 w-4" />
						Manage Tours
					</button>
					<button
						onclick={() => goto('/bookings')}
						class="w-full button-secondary button--gap button--small justify-center"
					>
						<Calendar class="h-4 w-4" />
						All Bookings
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Mobile: Additional Quick Actions -->
	<div class="lg:hidden mt-6">
		<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<h3 class="text-base font-semibold mb-3" style="color: var(--text-primary);">More Actions</h3>
			<div class="space-y-2">
				<button
					onclick={() => goto('/tours')}
					class="w-full button-secondary button--gap button--small justify-center py-3"
				>
					<MapPin class="h-4 w-4" />
					Manage Tours
				</button>
				<button
					onclick={() => goto('/bookings')}
					class="w-full button-secondary button--gap button--small justify-center py-3"
				>
					<Calendar class="h-4 w-4" />
					All Bookings
				</button>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";
</style> 