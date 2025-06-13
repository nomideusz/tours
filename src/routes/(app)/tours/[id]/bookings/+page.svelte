<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import BookingsList from '$lib/components/BookingsList.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import { formatEuro } from '$lib/utils/currency.js';
	
	// Icons
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Euro from 'lucide-svelte/icons/euro';
	import Users from 'lucide-svelte/icons/users';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import Plus from 'lucide-svelte/icons/plus';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import QrCode from 'lucide-svelte/icons/qr-code';
	
	let { data }: { data: PageData } = $props();
	
	const tour = data.tour;
	const bookings = data.bookings;
	const stats = data.stats;
</script>

<svelte:head>
	<title>{tour.name} - Bookings - Zaur</title>
	<meta name="description" content="Manage bookings for {tour.name}" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Navigation & Header -->
	<div class="mb-6 sm:mb-8">
		<!-- Back Button & Breadcrumb -->
		<div class="flex items-center gap-4 mb-4">
			<button 
				onclick={() => goto(`/tours/${tour.id}`)}
				class="p-2 rounded-lg transition-colors"
				style="hover:background: var(--bg-secondary);"
				aria-label="Back to tour details"
			>
				<ArrowLeft class="h-5 w-5" style="color: var(--text-secondary);" />
			</button>
			<nav class="flex items-center gap-2 text-sm" style="color: var(--text-secondary);">
				<a href="/dashboard" class="hover:text-blue-600">Dashboard</a>
				<ChevronRight class="h-3 w-3" />
				<a href="/tours" class="hover:text-blue-600">Tours</a>
				<ChevronRight class="h-3 w-3" />
				<a href="/tours/{tour.id}" class="hover:text-blue-600 truncate max-w-32">{tour.name}</a>
				<ChevronRight class="h-3 w-3" />
				<span>Bookings</span>
			</nav>
		</div>

		<!-- Mobile-First Header -->
		<MobilePageHeader
			title={tour.name}
			secondaryInfo="Bookings ({stats.totalBookings} total)"
			statusButton={{
				label: `${stats.confirmedBookings} confirmed`,
				color: 'var(--color-success)',
				dotColor: 'var(--color-success)',
				onclick: () => {}
			}}
			quickActions={[
				{
					label: 'QR Scanner',
					icon: UserCheck,
					onclick: () => goto('/checkin-scanner'),
					variant: 'primary'
				},
				{
					label: 'Tour Details',
					icon: MapPin,
					onclick: () => goto(`/tours/${tour.id}`),
					variant: 'secondary'
				}
			]}
			infoItems={[
				{
					icon: Calendar,
					label: 'Total',
					value: `${stats.totalBookings} bookings`
				},
				{
					icon: Euro,
					label: 'Revenue',
					value: formatEuro(stats.totalRevenue)
				},
				{
					icon: Users,
					label: 'Participants',
					value: `${stats.totalParticipants} people`
				},
				{
					icon: TrendingUp,
					label: 'Upcoming',
					value: `${stats.upcomingCount} tours`
				}
			]}
		/>

		<!-- Desktop Header -->
		<div class="hidden sm:block">
			<PageHeader 
				title="{tour.name} - Bookings"
				subtitle="Manage bookings for this tour • {tour.location}"
			/>
		</div>
	</div>
	
	<!-- Statistics - Desktop Only (Mobile shows in header) -->
	<div class="hidden sm:grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
		<StatsCard
			title="Total Bookings"
			value={stats.totalBookings}
			subtitle="{stats.confirmedBookings} confirmed"
			icon={Calendar}
			variant="small"
		/>

		<StatsCard
			title="Total Revenue"
			value={formatEuro(stats.totalRevenue)}
			subtitle="from confirmed bookings"
			icon={Euro}
			variant="small"
		/>

		<StatsCard
			title="Total Participants"
			value={stats.totalParticipants}
			subtitle="confirmed guests"
			icon={Users}
			variant="small"
		/>

		<StatsCard
			title="Upcoming Tours"
			value={stats.upcomingCount}
			subtitle="future bookings"
			icon={TrendingUp}
			variant="small"
		/>

		<StatsCard
			title="Checked In"
			value={stats.checkedInCount}
			subtitle="participants"
			icon={UserCheck}
			variant="small"
		/>
	</div>

	<!-- Tour Info Banner - Mobile Only -->
	<div class="sm:hidden mb-6 rounded-xl p-4" style="background: var(--bg-tertiary); border: 1px solid var(--border-secondary);">
		<div class="flex items-center gap-3">
			<MapPin class="h-5 w-5 flex-shrink-0" style="color: var(--color-primary-600);" />
			<div class="min-w-0 flex-1">
				<h3 class="font-medium truncate" style="color: var(--text-primary);">{tour.name}</h3>
				<p class="text-sm truncate" style="color: var(--text-secondary);">{tour.location}</p>
			</div>
			<div class="flex items-center gap-2">
				<button
					onclick={() => goto(`/tours/${tour.id}`)}
					class="button-secondary button--small button--icon"
					title="View tour details"
				>
					<MapPin class="h-3 w-3" />
				</button>
			</div>
		</div>
	</div>
		
	<!-- Bookings Table -->
	<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="px-4 sm:px-6 py-4" style="border-bottom: 1px solid var(--border-primary);">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-medium" style="color: var(--text-primary);">Tour Bookings</h2>
				{#if bookings.length > 0}
					<span class="text-sm" style="color: var(--text-secondary);">
						{bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
					</span>
				{/if}
			</div>
		</div>
		
		{#if bookings.length > 0}
			<BookingsList bookings={bookings as any} />
		{:else}
			<div class="p-8 text-center">
				<Calendar class="w-12 h-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">No bookings yet</h3>
				<p class="text-sm mb-6" style="color: var(--text-secondary);">
					This tour hasn't received any bookings yet. Share your QR code or booking link to start getting customers!
				</p>
				<div class="flex flex-col sm:flex-row gap-3 justify-center">
					<button
						onclick={() => goto(`/tours/${tour.id}/qr`)}
						class="button-primary button--gap"
					>
						<QrCode class="h-4 w-4" />
						View QR Code
					</button>
					<button
						onclick={() => goto(`/tours/${tour.id}`)}
						class="button-secondary button--gap"
					>
						<MapPin class="h-4 w-4" />
						Tour Settings
					</button>
				</div>
			</div>
		{/if}
	</div>
</div> 