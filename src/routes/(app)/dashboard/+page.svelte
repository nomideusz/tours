<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types.js';
	import { formatEuro } from '$lib/utils/currency.js';
	import { formatDate, formatDateMobile, getStatusColor } from '$lib/utils/date-helpers.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	
	// Icons
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Globe from 'lucide-svelte/icons/globe';
	import User from 'lucide-svelte/icons/user';
	import Mail from 'lucide-svelte/icons/mail';
	import Phone from 'lucide-svelte/icons/phone';
	import Settings from 'lucide-svelte/icons/settings';
	import Calendar from 'lucide-svelte/icons/calendar';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import Plus from 'lucide-svelte/icons/plus';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Clock from 'lucide-svelte/icons/clock';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';

	let { data }: { data: PageData } = $props();

	const { profile } = data;
	
	// Focus on today/this week stats only
	let stats = $derived(data.stats || {
		todayBookings: 0,
		weeklyRevenue: 0,
		upcomingTours: 0,
		totalCustomers: 0,
	});
	let recentBookings = $state(data.recentBookings || []);
	let todaysSchedule = $state(data.todaysSchedule || []);

	// Helper functions
	function getTimeOfDay() {
		const hour = new Date().getHours();
		if (hour < 12) return 'morning';
		if (hour < 17) return 'afternoon';
		return 'evening';
	}

	function getGreeting() {
		const timeOfDay = getTimeOfDay();
		const firstName = profile.name.split(' ')[0];
		return `Good ${timeOfDay}, ${firstName}!`;
	}
</script>

<svelte:head>
	<title>Dashboard - Operations Center - Zaur</title>
	<meta name="description" content="Your daily operations center - today's schedule, bookings, and quick actions" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Operations Header -->
	<div class="mb-6 sm:mb-8">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div class="flex items-center gap-4">
				<!-- Status Indicator -->
				<div class="flex-shrink-0">
					<div class="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-200">
						<Clock class="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
					</div>
				</div>
				
				<!-- Greeting and Date -->
				<div>
					<h1 class="text-2xl sm:text-3xl font-bold" style="color: var(--text-primary);">
						{getGreeting()}
					</h1>
					<p class="text-lg font-medium mt-1" style="color: var(--text-secondary);">
						{new Date().toLocaleDateString('en-US', { 
							weekday: 'long', 
							month: 'long', 
							day: 'numeric' 
						})}
					</p>
					<div class="flex items-center gap-2 mt-2">
						<span class="text-sm" style="color: var(--text-tertiary);">Operations Center</span>
						<span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Live</span>
					</div>
				</div>
			</div>
			
			<!-- Emergency Actions -->
			<div class="flex gap-2">
				<button
					onclick={() => goto('/checkin-scanner')}
					class="button-primary button--gap"
				>
					<UserCheck class="h-4 w-4" />
					<span class="hidden sm:inline">QR Scanner</span>
					<span class="sm:hidden">Scanner</span>
				</button>
			</div>
		</div>
	</div>

	<!-- Quick Actions - Today's Operations -->
	<div class="lg:hidden mb-6">
		<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<h3 class="text-base font-semibold mb-3" style="color: var(--text-primary);">Quick Actions</h3>
			<div class="grid grid-cols-2 gap-3 mb-3">
				<button
					onclick={() => goto('/tours')}
					class="button-primary button--gap button--small justify-center py-3"
				>
					<MapPin class="h-4 w-4" />
					Tours Management
				</button>
				<button
					onclick={() => goto('/bookings')}
					class="button-secondary button--gap button--small justify-center py-3"
				>
					<Calendar class="h-4 w-4" />
					All Bookings
				</button>
			</div>
			<a
				href="/{profile.username}"
				target="_blank"
				rel="noopener noreferrer"
				class="w-full button-secondary button--gap button--small justify-center py-2"
			>
				<ExternalLink class="h-4 w-4" />
				View Public Profile
			</a>
		</div>
	</div>

	<!-- Today's Schedule - MOST IMPORTANT on mobile -->
	<div class="mb-6">
		<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="px-4 py-3" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
							<Calendar class="w-4 h-4 text-white" />
						</div>
						<div>
							<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Today's Tours</h2>
							<p class="text-sm" style="color: var(--text-secondary);">
								{todaysSchedule.length} {todaysSchedule.length === 1 ? 'tour' : 'tours'} with guests
							</p>
						</div>
					</div>
					<button
						onclick={() => goto('/bookings')}
						class="button-secondary button--small"
					>
						View All
					</button>
				</div>
			</div>
			
			<div class="p-4">
				{#if todaysSchedule.length > 0}
					<div class="space-y-3">
						{#each todaysSchedule as schedule}
							<div class="flex items-center gap-3 p-3 rounded-lg transition-colors hover:opacity-90" style="background: var(--bg-secondary);">
								<div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
									<Clock class="w-4 h-4 text-white" />
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-base font-semibold" style="color: var(--text-primary);">
										{new Date('2024-01-01T' + schedule.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
									</p>
									<p class="text-sm" style="color: var(--text-secondary);">
										{schedule.tourName}
									</p>
									<p class="text-xs" style="color: var(--text-tertiary);">
										{schedule.participants} {schedule.participants === 1 ? 'guest' : 'guests'}
									</p>
								</div>
								<div class="flex items-center gap-2">
									<button
										onclick={() => goto('/checkin-scanner')}
										class="button-primary button--small px-3 py-2"
									>
										<UserCheck class="w-3 h-3" />
										<span class="hidden sm:inline ml-1">Scan</span>
									</button>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<EmptyState
						icon={Calendar}
						title="No tours today"
						description="You don't have any guests booked for today. Great time to plan or market your tours!"
						actionText="Manage Tours"
						onAction={() => goto('/tours')}
					/>
				{/if}
			</div>
		</div>
	</div>

	<!-- This Week's Performance - Focus on time-sensitive metrics -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
		<StatsCard
			title="Today's Bookings" 
			value={stats.todayBookings}
			subtitle="scheduled today"
			icon={Calendar}
			variant="small"
		/>

		<StatsCard
			title="This Week's Revenue"
			value={formatEuro(stats.weeklyRevenue)}
			subtitle="from bookings"
			icon={DollarSign}
			trend={stats.weeklyRevenue > 0 ? { value: "This week", positive: true } : undefined}
			variant="small"
		/>

		<StatsCard
			title="Upcoming Tours"
			value={stats.upcomingTours || 0}
			subtitle="next 7 days"
			icon={TrendingUp}
			variant="small"
		/>

		<StatsCard
			title="Total Guests"
			value={stats.totalCustomers}
			subtitle="this week"
			icon={Users}
			variant="small"
		/>
	</div>

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
		<!-- Recent Activity -->
		<div class="lg:col-span-2">
			<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="px-4 sm:px-6 py-4" style="border-bottom: 1px solid var(--border-primary);">
					<div class="flex items-center justify-between">
						<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Recent Activity</h2>
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
								title="No recent activity"
								description="Your recent bookings and activity will appear here"
								actionText="Create Your First Tour"
								onAction={() => goto('/tours/new')}
							/>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Desktop Sidebar -->
		<div class="hidden lg:block space-y-6">
			<!-- Quick Links -->
			<div class="rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Quick Links</h3>
				<div class="space-y-3">
					<a
						href="/{profile.username}"
						target="_blank"
						rel="noopener noreferrer"
						class="w-full button-primary button--gap button--small justify-center"
					>
						<ExternalLink class="h-4 w-4" />
						View Public Profile
					</a>
					<button
						onclick={() => goto('/tours/new')}
						class="w-full button-secondary button--gap button--small justify-center"
					>
						<Plus class="h-4 w-4" />
						Create New Tour
					</button>
				</div>
			</div>

			<!-- This Week Summary -->
			<div class="rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">This Week</h3>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-sm" style="color: var(--text-secondary);">Revenue</span>
						<span class="font-semibold" style="color: var(--text-primary);">{formatEuro(stats.weeklyRevenue)}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm" style="color: var(--text-secondary);">Guests</span>
						<span class="font-semibold" style="color: var(--text-primary);">{stats.totalCustomers}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm" style="color: var(--text-secondary);">Upcoming</span>
						<span class="font-semibold" style="color: var(--text-primary);">{stats.upcomingTours} tours</span>
					</div>
				</div>
			</div>
		</div>
	</div>


</div>

<style lang="postcss">
	@reference "tailwindcss";
</style> 