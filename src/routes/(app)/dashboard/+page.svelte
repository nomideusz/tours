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
	
	// Filter today's schedule on the client side to handle timezone properly
	let todaysSchedule = $derived(
		(() => {
			const allSchedule = data.todaysSchedule || [];
			const now = new Date();
			const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
			
			return allSchedule.filter(schedule => {
				if (!schedule.time) return false;
				
				const scheduleDate = new Date(schedule.time);
				const scheduleLocalDate = new Date(scheduleDate.getTime());
				return scheduleLocalDate >= todayStart && scheduleLocalDate < todayEnd;
			});
		})()
	);
</script>

<svelte:head>
	<title>Dashboard - Zaur</title>
	<meta name="description" content="Your daily operations center - today's schedule, bookings, and quick actions" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Operations Header -->
	<div class="mb-6 sm:mb-8">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<h1 class="text-2xl sm:text-3xl font-bold" style="color: var(--text-primary);">
					Dashboard
				</h1>
				<p class="text-sm font-medium mt-1" style="color: var(--text-secondary);">
					{new Date().toLocaleDateString('en-US', { 
						weekday: 'long', 
						month: 'long', 
						day: 'numeric',
						year: 'numeric'
					})}
				</p>
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

	<!-- TODAY'S OPERATIONS - MOST IMPORTANT -->
	<div class="mb-6 lg:mb-8">
		<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="px-4 sm:px-6 py-4" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
							<Calendar class="w-5 h-5 text-white" />
						</div>
						<div>
							<h2 class="text-xl font-bold" style="color: var(--text-primary);">Today's Tours</h2>
							<p class="text-sm" style="color: var(--text-secondary);">
								{todaysSchedule.length} {todaysSchedule.length === 1 ? 'tour' : 'tours'} with confirmed bookings
								{#if todaysSchedule.length > 0}
									• {todaysSchedule.reduce((sum: number, s: any) => sum + (s.participants || 0), 0)} total guests
								{/if}
							</p>
						</div>
					</div>
					<div class="flex items-center gap-2">
						{#if todaysSchedule.length > 0}
							<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
								<Clock class="w-3 h-3 mr-1" />
								Active Day
							</span>
						{/if}
						<button
							onclick={() => goto('/bookings')}
							class="button-secondary button--small"
						>
							View All
						</button>
					</div>
				</div>
			</div>
			
			<div class="p-4 sm:p-6">
				{#if todaysSchedule.length > 0}
					<div class="space-y-4">
						{#each todaysSchedule as schedule}
							<div class="flex items-center gap-4 p-4 rounded-lg transition-all hover:shadow-md" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
								<div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
									<Clock class="w-5 h-5 text-white" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-3 mb-1">
										<p class="text-lg font-bold" style="color: var(--text-primary);">
											{new Date(schedule.time).toLocaleTimeString('en-US', { 
												hour: '2-digit', 
												minute: '2-digit', 
												hour12: false 
											})}
										</p>
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" 
											class:bg-green-100={schedule.status === 'confirmed'}
											class:text-green-700={schedule.status === 'confirmed'}
											class:bg-yellow-100={schedule.status === 'pending'}
											class:text-yellow-700={schedule.status === 'pending'}>
											{schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
										</span>
									</div>
									<p class="text-base font-medium mb-1" style="color: var(--text-primary);">
										{schedule.tourName}
									</p>
									<div class="flex items-center gap-4 text-sm" style="color: var(--text-secondary);">
										<span class="flex items-center gap-1">
											<Users class="w-3 h-3" />
											{schedule.participants} {schedule.participants === 1 ? 'guest' : 'guests'}
										</span>
										<span class="flex items-center gap-1">
											<User class="w-3 h-3" />
											{schedule.customerName}
										</span>
									</div>
								</div>
								<div class="flex items-center gap-2">
									<button
										onclick={() => goto('/checkin-scanner')}
										class="button-primary button--small px-4 py-2"
									>
										<UserCheck class="w-4 h-4" />
										<span class="hidden sm:inline ml-2">Check In</span>
									</button>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-12">
						<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<Calendar class="w-8 h-8 text-gray-400" />
						</div>
						<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">No tours today</h3>
						<p class="text-sm mb-6" style="color: var(--text-secondary);">
							You don't have any confirmed bookings for today. Perfect time to plan your upcoming tours or focus on marketing!
						</p>
						<div class="flex flex-col sm:flex-row gap-3 justify-center">
							<button
								onclick={() => goto('/tours')}
								class="button-primary button--gap"
							>
								<MapPin class="h-4 w-4" />
								Manage Tours
							</button>
							<button
								onclick={() => goto('/tours/new')}
								class="button-secondary button--gap"
							>
								<Plus class="h-4 w-4" />
								Create New Tour
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Quick Stats - Focus on Today & This Week -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
		<StatsCard
			title="Today's Bookings" 
			value={stats.todayBookings}
			subtitle="new today"
			icon={Calendar}
			variant="small"
		/>

		<StatsCard
			title="Week Revenue"
			value={formatEuro(stats.weeklyRevenue)}
			subtitle="last 7 days"
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

	<!-- Mobile Quick Actions -->
	<div class="lg:hidden mb-6">
		<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<h3 class="text-base font-semibold mb-3" style="color: var(--text-primary);">Quick Actions</h3>
			<div class="grid grid-cols-2 gap-3 mb-3">
				<button
					onclick={() => goto('/tours')}
					class="button-primary button--gap button--small justify-center py-3"
				>
					<MapPin class="h-4 w-4" />
					Business Management
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

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
		<!-- Recent Activity -->
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
								description="Your recent bookings will appear here as customers book your tours"
								actionText="Share Your Tours"
								onAction={() => goto('/tours')}
							/>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Desktop Sidebar -->
		<div class="hidden lg:block space-y-6">
			<!-- Today's Performance -->
			<div class="rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Today's Performance</h3>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-sm" style="color: var(--text-secondary);">Tours Today</span>
						<span class="font-semibold" style="color: var(--text-primary);">{todaysSchedule.length}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm" style="color: var(--text-secondary);">Total Guests</span>
						<span class="font-semibold" style="color: var(--text-primary);">
							{todaysSchedule.reduce((sum: number, s: any) => sum + (s.participants || 0), 0)}
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm" style="color: var(--text-secondary);">New Bookings</span>
						<span class="font-semibold" style="color: var(--text-primary);">{stats.todayBookings}</span>
					</div>
				</div>
			</div>

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