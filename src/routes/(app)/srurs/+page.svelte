<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import { formatEuro } from '$lib/utils/currency.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	
	// Icons
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import Eye from 'lucide-svelte/icons/eye';
	import Plus from 'lucide-svelte/icons/plus';
	import TrendingUp from 'lucide-svelte/icons/trending-up';

	let { data }: { data: PageData } = $props();

	// Use stats from server (with fallbacks for type safety)
	let stats = $derived(data.stats || {
		totalTours: 0,
		activeTours: 0,
		draftTours: 0,
		monthlyTours: 0,
		totalRevenue: 0,
		todayBookings: 0,
		weekBookings: 0,
		monthRevenue: 0,
		totalBookings: 0,
		confirmedBookings: 0,
		totalParticipants: 0
	});
</script>

<svelte:head>
	<title>Tours - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<div class="mb-6 sm:mb-8">
		<PageHeader 
			title="Tours (New Version)"
			subtitle="Manage and track your tour offerings with improved performance"
		>
			<button onclick={() => goto('/tours/new')} class="hidden sm:flex button-primary button--gap">
				<Plus class="h-4 w-4 sm:h-5 sm:w-5" />
				Create Tour
			</button>
		</PageHeader>
	</div>

	<!-- Quick Actions - Mobile -->
	<div class="lg:hidden mb-6">
		<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<h3 class="text-base font-semibold mb-3" style="color: var(--text-primary);">Quick Actions</h3>
			<div class="grid grid-cols-2 gap-3">
				<button
					onclick={() => goto('/tours/new')}
					class="button-primary button--gap button--small justify-center py-3"
				>
					<Plus class="h-4 w-4" />
					New Tour
				</button>
				<button
					onclick={() => goto('/checkin-scanner')}
					class="button-primary button--gap button--small justify-center py-3"
				>
					<Eye class="h-4 w-4" />
					QR Scanner
				</button>
			</div>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
		<StatsCard
			title="Total Tours"
			value={stats.totalTours}
			subtitle="{stats.activeTours} active"
			icon={MapPin}
			trend={stats.monthlyTours > 0 ? { value: `+${stats.monthlyTours} this month`, positive: true } : undefined}
			href="/tours"
			variant="small"
		/>

		<StatsCard
			title="Today's Bookings" 
			value={stats.todayBookings}
			subtitle="bookings for today"
			icon={Calendar}
			variant="small"
		/>

		<StatsCard
			title="Weekly Bookings"
			value={stats.weekBookings}
			subtitle="{stats.totalBookings} total bookings"
			icon={BarChart3}
			trend={stats.weekBookings > 0 ? { value: "This week", positive: true } : undefined}
			variant="small"
		/>

		<StatsCard
			title="Monthly Revenue"
			value={formatEuro(stats.monthRevenue)}
			subtitle="{stats.totalParticipants} total guests"
			icon={DollarSign}
			trend={stats.monthRevenue > 0 ? { value: "This month", positive: true } : undefined}
			variant="small"
		/>
	</div>

	<!-- Additional Stats Row -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
		<StatsCard
			title="Draft Tours"
			value={stats.draftTours}
			subtitle="not published"
			icon={Eye}
			variant="small"
		/>

		<StatsCard
			title="Total Revenue"
			value={formatEuro(stats.totalRevenue)}
			subtitle="all time"
			icon={TrendingUp}
			variant="small"
		/>

		<StatsCard
			title="Confirmed Bookings"
			value={stats.confirmedBookings}
			subtitle="paid bookings"
			icon={Users}
			variant="small"
		/>

		<StatsCard
			title="Total Participants"
			value={stats.totalParticipants}
			subtitle="all guests"
			icon={Users}
			variant="small"
		/>
	</div>

	<!-- Placeholder for future content -->
	<div class="rounded-xl p-8 sm:p-12 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="max-w-md mx-auto">
			<MapPin class="h-12 w-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
			<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Tours List Coming Soon</h3>
			<p class="text-sm mb-4" style="color: var(--text-secondary);">
				This is a skeleton for the improved tours page. The tours list, search, and filters will be added next.
			</p>
			<button
				onclick={() => goto('/tours')}
				class="button-secondary button--gap"
			>
				<MapPin class="h-4 w-4" />
				Back to Current Tours
			</button>
		</div>
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";
</style>
