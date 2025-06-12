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
	import Copy from 'lucide-svelte/icons/copy';
	import Link from 'lucide-svelte/icons/link';

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
	
	// Profile link state
	let profileLinkCopied = $state(false);
	
	// Get the full profile URL
	const profileUrl = $derived(`${$page.url.origin}/${profile.username}`);
	
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
	
	// Copy profile link function
	async function copyProfileLink() {
		try {
			await navigator.clipboard.writeText(profileUrl);
			profileLinkCopied = true;
			setTimeout(() => {
				profileLinkCopied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy link:', err);
		}
	}
</script>

<svelte:head>
	<title>Dashboard - Zaur</title>
	<meta name="description" content="Your daily operations center - today's schedule, bookings, and quick actions" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Operations Header -->
	<div class="mb-6 sm:mb-8">
		<div class="flex flex-col gap-4">
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
				
				<!-- Quick Scanner Access - Single Button -->
				{#if todaysSchedule.length > 0}
					<button
						onclick={() => goto('/checkin-scanner')}
						class="button-primary button--gap"
					>
						<QrCode class="h-4 w-4" />
						<span class="hidden sm:inline">Check-in Scanner</span>
						<span class="sm:hidden">Scanner</span>
					</button>
				{/if}
			</div>
			
			<!-- Profile Link Section -->
			<div class="rounded-lg p-3" style="background: var(--bg-tertiary); border: 1px solid var(--border-secondary);">
				<div class="flex flex-col sm:flex-row sm:items-center gap-3">
					<div class="flex items-center gap-2 min-w-0 flex-1">
						<Link class="h-4 w-4 flex-shrink-0" style="color: var(--color-primary-600);" />
						<span class="text-sm font-medium" style="color: var(--text-secondary);">
							Your public profile:
						</span>
					</div>
					
					<div class="flex items-center gap-2 flex-1 min-w-0">
						<div class="flex-1 overflow-hidden">
							<a 
								href="/{profile.username}" 
								target="_blank" 
								rel="noopener noreferrer"
								class="text-sm font-mono truncate block"
								style="color: var(--color-primary-600); text-overflow: ellipsis;"
							>
								{profileUrl}
							</a>
						</div>
						
						<div class="flex items-center gap-2 flex-shrink-0">
							<a
								href="/{profile.username}"
								target="_blank"
								rel="noopener noreferrer"
								class="button-secondary button--small button--icon"
								title="View your profile"
							>
								<ExternalLink class="h-3 w-3" />
							</a>
							<button
								onclick={copyProfileLink}
								class="button-primary button--small button--icon {profileLinkCopied ? 'button-success' : ''}"
								title={profileLinkCopied ? "Copied!" : "Copy URL"}
							>
								{#if profileLinkCopied}
									<CheckCircle class="h-3 w-3" />
								{:else}
									<Copy class="h-3 w-3" />
								{/if}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Today's Schedule - Operations Priority -->
	{#if todaysSchedule.length > 0}
		<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold" style="color: var(--text-primary);">Today's Schedule</h3>
					<span class="text-sm" style="color: var(--text-secondary);">
						{todaysSchedule.length} {todaysSchedule.length === 1 ? 'tour' : 'tours'} today
					</span>
				</div>
			</div>
			<div class="p-4">
				<div class="space-y-3">
					{#each todaysSchedule.slice(0, 4) as schedule}
						<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-secondary);">
							<div class="flex-1 min-w-0">
								<h4 class="text-sm font-medium truncate" style="color: var(--text-primary);">
									{schedule.tourName}
								</h4>
								<div class="flex items-center gap-2 mt-1">
									<span class="text-xs font-medium" style="color: var(--text-secondary);">
										{formatDate(schedule.time)}
									</span>
									<span class="text-xs" style="color: var(--text-tertiary);">•</span>
									<span class="text-xs" style="color: var(--text-secondary);">
										{schedule.participants || 0} guests
									</span>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<span class="px-2 py-1 text-xs rounded-full {getStatusColor(schedule.status)}">
									{schedule.status}
								</span>
							</div>
						</div>
					{/each}
					{#if todaysSchedule.length > 4}
						<div class="text-center pt-2">
							<span class="text-xs" style="color: var(--text-tertiary);">
								+ {todaysSchedule.length - 4} more tours today
							</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold" style="color: var(--text-primary);">Today's Schedule</h3>
					<button onclick={() => goto('/tours')} class="button-secondary button--small">
						<MapPin class="h-3 w-3 mr-1" />
						Tours
					</button>
				</div>
			</div>
			<div class="p-8">
				<div class="text-center">
					<Calendar class="w-8 h-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
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
			</div>
		</div>
	{/if}

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
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<h3 class="font-semibold" style="color: var(--text-primary);">Quick Actions</h3>
			</div>
			<div class="p-4">
				<div class="grid grid-cols-2 gap-3">
					<button
						onclick={() => goto('/tours')}
						class="button-primary button--gap button--small justify-center py-3"
					>
						<MapPin class="h-4 w-4" />
						Tours
					</button>
					<button
						onclick={() => goto('/bookings')}
						class="button-secondary button--gap button--small justify-center py-3"
					>
						<Calendar class="h-4 w-4" />
						Bookings
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
		<!-- Recent Activity -->
		<div class="lg:col-span-2">
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold" style="color: var(--text-primary);">Recent Bookings</h3>
						<button onclick={() => goto('/bookings')} class="button-secondary button--small">
							View All
						</button>
					</div>
				</div>
				
				<div class="divide-y" style="border-color: var(--border-primary);">
					{#if recentBookings.length > 0}
						{#each recentBookings.slice(0, 5) as booking}
							<div class="p-4 hover:bg-gray-50 transition-colors">
								<div class="flex items-center justify-between">
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2 mb-1">
											<p class="text-sm font-medium truncate" style="color: var(--text-primary);">
												{booking.customerName}
											</p>
											<span class="px-2 py-1 text-xs rounded-full {getStatusColor(booking.status)}">
												{booking.status}
											</span>
										</div>
										<p class="text-xs mb-1" style="color: var(--text-secondary);">
											{booking.tourName}
										</p>
										<div class="flex items-center gap-2 text-xs" style="color: var(--text-tertiary);">
											<span>{formatDate(booking.date)}</span>
											<span>•</span>
											<span>{booking.participants} guests</span>
											<span>•</span>
											<span>{formatEuro(booking.amount)}</span>
										</div>
									</div>
									<div class="flex items-center gap-2 ml-3">
										{#if booking.status === 'pending'}
											<button
												onclick={() => goto(`/bookings/${booking.id}`)}
												class="button-primary button--small"
											>
												Review
											</button>
										{:else}
											<button
												onclick={() => goto(`/bookings/${booking.id}`)}
												class="button-secondary button--small"
											>
												View
											</button>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					{:else}
						<div class="p-8">
							<div class="text-center">
								<Calendar class="w-8 h-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
								<p class="text-sm" style="color: var(--text-secondary);">No bookings yet</p>
								<button onclick={() => goto('/tours')} class="text-xs mt-2" style="color: var(--color-primary-600);">
									View Tours
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Desktop Sidebar -->
		<div class="hidden lg:block space-y-6">
			<!-- Today's Performance -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h3 class="font-semibold" style="color: var(--text-primary);">Today's Performance</h3>
				</div>
				<div class="p-4">
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
			</div>

			<!-- Quick Actions -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h3 class="font-semibold" style="color: var(--text-primary);">Quick Actions</h3>
				</div>
				<div class="p-4">
					<div class="space-y-3">
						<button
							onclick={() => goto('/tours/new')}
							class="w-full button-primary button--gap button--small justify-center"
						>
							<Plus class="h-4 w-4" />
							Create New Tour
						</button>
						<button
							onclick={() => goto('/tours')}
							class="w-full button-secondary button--gap button--small justify-center"
						>
							<MapPin class="h-4 w-4" />
							Manage Tours
						</button>
					</div>
				</div>
			</div>

			<!-- This Week Summary -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h3 class="font-semibold" style="color: var(--text-primary);">This Week</h3>
				</div>
				<div class="p-4">
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

</div>