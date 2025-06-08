<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import BookingsList from '$lib/components/BookingsList.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatEuro } from '$lib/utils/currency.js';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Euro from 'lucide-svelte/icons/euro';
	import Users from 'lucide-svelte/icons/users';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import Plus from 'lucide-svelte/icons/plus';
	import QrCode from 'lucide-svelte/icons/qr-code';
	
	let { data }: { data: PageData } = $props();
</script>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<div class="mb-6 sm:mb-8">
		<PageHeader 
			title="All Bookings"
			subtitle="Manage your tour bookings and view payment status"
		/>
	</div>
	
	<!-- Mobile Quick Actions - Prominent on mobile -->
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
	
	<!-- Statistics - Now using server-calculated stats -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
		<StatsCard
			title="Total Bookings"
			value={data.stats.totalBookings}
			subtitle="{data.stats.confirmedBookings} confirmed"
			icon={Calendar}
			variant="small"
		/>

		<StatsCard
			title="Total Revenue"
			value={formatEuro(data.stats.totalRevenue)}
			subtitle="from confirmed bookings"
			icon={Euro}
			variant="small"
		/>

		<StatsCard
			title="Total Participants"
			value={data.stats.totalParticipants}
			subtitle="confirmed guests"
			icon={Users}
			variant="small"
		/>

		<StatsCard
			title="Upcoming Tours"
			value={data.stats.upcomingCount}
			subtitle="future bookings"
			icon={TrendingUp}
			variant="small"
		/>
	</div>
		
	<!-- Bookings Table -->
	<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="px-6 py-4" style="border-bottom: 1px solid var(--border-primary);">
			<h2 class="text-lg font-medium" style="color: var(--text-primary);">All Bookings</h2>
		</div>
		<BookingsList bookings={data.bookings as any} />
	</div>
</div> 