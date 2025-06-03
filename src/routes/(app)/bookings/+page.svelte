<script lang="ts">
	import type { PageData } from './$types.js';
	import BookingsList from '$lib/components/BookingsList.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatEuro } from '$lib/utils/currency.js';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Euro from 'lucide-svelte/icons/euro';
	import Users from 'lucide-svelte/icons/users';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	
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

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<PageHeader 
		title="All Bookings"
		subtitle="Manage your tour bookings and view payment status"
	/>
	
	<!-- Statistics -->
	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
		<StatsCard
			title="Total Bookings"
			value={stats().totalBookings}
			subtitle="{stats().confirmedBookings} confirmed"
			icon={Calendar}
		/>

		<StatsCard
			title="Total Revenue"
			value={formatEuro(stats().totalRevenue)}
			subtitle="from confirmed bookings"
			icon={Euro}
		/>

		<StatsCard
			title="Total Participants"
			value={stats().totalParticipants}
			subtitle="confirmed guests"
			icon={Users}
		/>

		<StatsCard
			title="Upcoming Tours"
			value={stats().upcomingCount}
			subtitle="future bookings"
			icon={TrendingUp}
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