<script lang="ts">
	import type { PageData } from './$types.js';
	import BookingsList from '$lib/components/BookingsList.svelte';
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

<div class="min-h-screen bg-gray-50">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900">Bookings</h1>
			<p class="mt-2 text-gray-600">Manage your tour bookings and view payment status</p>
		</div>
		
		<!-- Statistics -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
			<div class="bg-white rounded-lg shadow-sm p-6">
				<div class="flex items-center">
					<div class="flex-1">
						<p class="text-sm font-medium text-gray-500">Total Bookings</p>
						<p class="mt-1 text-2xl font-semibold text-gray-900">{stats().totalBookings}</p>
					</div>
					<Calendar class="h-8 w-8 text-gray-400" />
				</div>
			</div>
			
			<div class="bg-white rounded-lg shadow-sm p-6">
				<div class="flex items-center">
					<div class="flex-1">
						<p class="text-sm font-medium text-gray-500">Total Revenue</p>
						<p class="mt-1 text-2xl font-semibold text-gray-900">€{stats().totalRevenue}</p>
					</div>
					<Euro class="h-8 w-8 text-gray-400" />
				</div>
			</div>
			
			<div class="bg-white rounded-lg shadow-sm p-6">
				<div class="flex items-center">
					<div class="flex-1">
						<p class="text-sm font-medium text-gray-500">Total Participants</p>
						<p class="mt-1 text-2xl font-semibold text-gray-900">{stats().totalParticipants}</p>
					</div>
					<Users class="h-8 w-8 text-gray-400" />
				</div>
			</div>
			
			<div class="bg-white rounded-lg shadow-sm p-6">
				<div class="flex items-center">
					<div class="flex-1">
						<p class="text-sm font-medium text-gray-500">Upcoming Tours</p>
						<p class="mt-1 text-2xl font-semibold text-gray-900">{stats().upcomingCount}</p>
					</div>
					<TrendingUp class="h-8 w-8 text-gray-400" />
				</div>
			</div>
		</div>
		
		<!-- Bookings Table -->
		<div class="bg-white rounded-lg shadow-sm">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-lg font-medium text-gray-900">All Bookings</h2>
			</div>
			<BookingsList bookings={data.bookings} />
		</div>
	</div>
</div> 