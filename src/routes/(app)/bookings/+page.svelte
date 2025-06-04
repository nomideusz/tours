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
	
	// Calculate statistics
	let stats = $derived(() => {
		const confirmed = data.bookings.filter(b => b.status === 'confirmed');
		const totalRevenue = confirmed.reduce((sum, b) => sum + b.totalAmount, 0);
		const totalParticipants = confirmed.reduce((sum, b) => sum + b.participants, 0);
		const upcomingCount = confirmed.filter(b => {
			const tourDate = new Date(b.expand?.timeSlot?.startTime || b.created);
			return tourDate > new Date();
		}).length;
		
		return {
			totalBookings: data.bookings.length,
			confirmedBookings: confirmed.length,
			totalRevenue,
			totalParticipants,
			upcomingCount
		};
	});
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
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<h3 class="text-base font-semibold text-gray-900 mb-3">Quick Actions</h3>
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
	
	<!-- Statistics -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
		<StatsCard
			title="Total Bookings"
			value={stats().totalBookings}
			subtitle="{stats().confirmedBookings} confirmed"
			icon={Calendar}
			variant="small"
		/>

		<StatsCard
			title="Total Revenue"
			value={formatEuro(stats().totalRevenue)}
			subtitle="from confirmed bookings"
			icon={Euro}
			variant="small"
		/>

		<StatsCard
			title="Total Participants"
			value={stats().totalParticipants}
			subtitle="confirmed guests"
			icon={Users}
			variant="small"
		/>

		<StatsCard
			title="Upcoming Tours"
			value={stats().upcomingCount}
			subtitle="future bookings"
			icon={TrendingUp}
			variant="small"
		/>
	</div>
		
	<!-- Bookings Table -->
	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		<div class="px-6 py-4 border-b border-gray-200">
			<h2 class="text-lg font-medium text-gray-900">All Bookings</h2>
		</div>
		<BookingsList bookings={data.bookings} />
	</div>
</div> 