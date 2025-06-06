<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { formatEuro } from '$lib/utils/currency.js';
	import type { PageData, ActionData } from './$types.js';
	import type { Tour } from '$lib/types.js';
	import Edit from 'lucide-svelte/icons/edit';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Euro from 'lucide-svelte/icons/euro';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Check from 'lucide-svelte/icons/check';
	import Info from 'lucide-svelte/icons/info';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import CalendarDays from 'lucide-svelte/icons/calendar-days';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import ToggleLeft from 'lucide-svelte/icons/toggle-left';
	import ToggleRight from 'lucide-svelte/icons/toggle-right';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Image from 'lucide-svelte/icons/image';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import User from 'lucide-svelte/icons/user';
	import Ticket from 'lucide-svelte/icons/ticket';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let tour = $state(data.tour);
	let error = $state<string | null>((form as any)?.error || null);
	let isDeleting = $state(false);
	let isUpdatingStatus = $state(false);
	
	// Update tour when data changes
	$effect(() => {
		tour = data.tour;
		error = (form as any)?.error || null;
	});

	function deleteTour() {
		if (!tour || !confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
			return;
		}
		
		isDeleting = true;
		const form = document.getElementById('delete-tour-form') as HTMLFormElement;
		form?.requestSubmit();
	}

	function getStatusColor(status: Tour['status']) {
		switch (status) {
			case 'active':
				return 'bg-green-50 text-green-700 border-green-200';
			case 'draft':
				return 'bg-gray-50 text-gray-700 border-gray-200';
			default:
				return 'bg-gray-50 text-gray-700 border-gray-200';
		}
	}

	function getStatusDot(status: Tour['status']) {
		switch (status) {
			case 'active':
				return 'bg-green-500';
			case 'draft':
				return 'bg-gray-500';
			default:
				return 'bg-gray-500';
		}
	}

	function formatDuration(minutes: number) {
		const totalMinutes = Math.round(minutes);
		const hours = Math.floor(totalMinutes / 60);
		const mins = totalMinutes % 60;
		
		if (hours === 0) {
			return `${mins} minutes`;
		} else if (mins === 0) {
			return `${hours} hour${hours > 1 ? 's' : ''}`;
		} else {
			return `${hours}h ${mins}m`;
		}
	}

	// Statistics from server
	let stats = $derived(data.stats || {
		qrCodes: 0,
		totalBookings: 0,
		revenue: 0,
		thisWeekBookings: 0,
		conversionRate: 0
	});

	// Upcoming bookings from server
	let upcomingBookings = $derived(data.bookings || []);
</script>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	{#if error}
		<div class="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
			<div class="flex gap-3">
				<AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
				<div>
					<p class="font-medium text-red-800">Error</p>
					<p class="text-sm text-red-700 mt-1">{error}</p>
				</div>
			</div>
		</div>
	{/if}

	{#if !tour}
		<div class="bg-white rounded-xl border border-gray-200 p-12">
			<EmptyState
				icon={MapPin}
				title="Tour Not Found"
				description="The tour you're looking for doesn't exist or has been deleted."
				actionText="Back to Tours"
				onAction={() => goto('/tours')}
			/>
		</div>
	{:else}
		<div class="mb-6 sm:mb-8">
			<PageHeader 
				title={tour.name}
				subtitle={`${tour.category ? `${tour.category} • ` : ''}${tour.location ? `${tour.location} • ` : ''}Created ${new Date(tour.createdAt).toLocaleDateString()}`}
				backUrl="/tours"
			>
				<div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
					<span class="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium {getStatusColor(tour.status)}">
						<span class="w-1.5 h-1.5 rounded-full {getStatusDot(tour.status)}"></span>
						{tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
					</span>
					<div class="flex items-center gap-2 sm:gap-3">
						<form method="POST" action="?/toggleStatus" use:enhance={() => {
							isUpdatingStatus = true;
							return async ({ result }) => {
								isUpdatingStatus = false;
								if (result.type === 'success') {
									await invalidateAll();
								}
							};
						}}>
							<button
								type="submit"
								disabled={isUpdatingStatus}
								class="button-secondary button--gap button--small"
							>
								{#if isUpdatingStatus}
									<div class="form-spinner"></div>
								{:else if tour.status === 'active'}
									<ToggleRight class="h-4 w-4" />
								{:else}
									<ToggleLeft class="h-4 w-4" />
								{/if}
								<span class="hidden sm:inline">{tour.status === 'active' ? 'Save as Draft' : 'Publish Tour'}</span>
								<span class="sm:hidden">{tour.status === 'active' ? 'Draft' : 'Publish'}</span>
							</button>
						</form>
						<button
							onclick={() => goto(`/tours/${tour?.id}/edit`)}
							class="hidden sm:flex button-primary button--gap button--small"
						>
							<Edit class="h-4 w-4" />
							Edit Tour
						</button>
					</div>
				</div>
			</PageHeader>
		</div>

		<!-- Today's Check-ins Section -->
		{#if upcomingBookings.length > 0}
			<div class="rounded-xl overflow-hidden mb-8" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="px-6 py-4 bg-gradient-to-r from-indigo-50 to-indigo-100" style="border-bottom: 1px solid var(--border-primary);">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
								<UserCheck class="w-5 h-5 text-white" />
							</div>
							<div>
								<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Today's Check-ins</h3>
								<p class="text-sm" style="color: var(--text-secondary);">Upcoming tours requiring check-in</p>
							</div>
						</div>
						<button
							onclick={() => goto(`/tours/${tour?.id}/bookings?date=today`)}
							class="button-secondary button--gap button--small"
						>
							View All
							<ChevronRight class="w-4 h-4" />
						</button>
					</div>
				</div>
				
				<div style="border-color: var(--border-primary);" class="divide-y">
					{#each upcomingBookings.slice(0, 3) as booking}
						{@const b = booking as any}
						<div class="px-6 py-4 transition-colors" style="hover:background: var(--bg-secondary);">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-4">
									<div class="flex-shrink-0">
										<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background: var(--bg-tertiary);">
											<User class="w-6 h-6" style="color: var(--text-secondary);" />
										</div>
									</div>
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2 mb-1">
											<p class="text-sm font-semibold truncate" style="color: var(--text-primary);">
												{b.customerName}
											</p>
											<span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full {
												b.attendanceStatus === 'checked_in' ? 'bg-green-50 text-green-700' :
												b.attendanceStatus === 'no_show' ? '' :
												'bg-amber-50 text-amber-700'
											}" style="{
												b.attendanceStatus === 'checked_in' ? '' :
												b.attendanceStatus === 'no_show' ? 'background: var(--bg-tertiary); color: var(--text-secondary);' :
												''
											}">
												{b.attendanceStatus === 'checked_in' ? '✅ Checked In' :
												 b.attendanceStatus === 'no_show' ? '❌ No Show' : 
												 '⏳ Awaiting'}
											</span>
										</div>
										<div class="flex items-center gap-4 text-xs" style="color: var(--text-tertiary);">
											<span class="flex items-center gap-1">
												<Clock class="w-3 h-3" />
												{booking.expand?.timeSlot?.startTime ? 
													new Date(booking.expand.timeSlot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 
													'Time TBD'}
											</span>
											<span class="flex items-center gap-1">
												<Users class="w-3 h-3" />
												{booking.participants} {booking.participants === 1 ? 'person' : 'people'}
											</span>
											<span class="flex items-center gap-1">
												<Ticket class="w-3 h-3" />
												{b.bookingReference}
											</span>
										</div>
									</div>
								</div>
								
								<div class="flex items-center gap-2">
									{#if b.ticketQRCode && b.attendanceStatus !== 'checked_in'}
										<a
											href="/checkin/{b.ticketQRCode}"
											target="_blank"
											class="button-primary button--gap button--small"
										>
											<UserCheck class="w-4 h-4" />
											Check In
										</a>
									{:else if b.attendanceStatus === 'checked_in'}
										<span class="text-sm font-medium text-green-600">
											Completed
										</span>
									{:else}
										<span class="text-sm" style="color: var(--text-tertiary);">
											No ticket
										</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
				
				{#if upcomingBookings.length > 3}
					<div class="px-6 py-3 text-center" style="background: var(--bg-secondary);">
						<button
							onclick={() => goto(`/tours/${tour?.id}/bookings?date=today`)}
							style="color: var(--color-primary-600);"
							class="text-sm font-medium hover:opacity-80 transition-opacity"
						>
							View {upcomingBookings.length - 3} more upcoming check-ins
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<div class="rounded-xl p-8 mb-8" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<EmptyState
					icon={UserCheck}
					title="No Check-ins Today"
					description="No upcoming tours require check-in today. Check-ins will appear here when guests have confirmed bookings."
					actionText="View All Bookings"
					onAction={() => goto(`/tours/${tour?.id}/bookings`)}
				/>
			</div>
		{/if}

		<!-- Mobile Quick Actions -->
		<div class="lg:hidden mb-6">
			<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<h3 class="text-base font-semibold mb-3" style="color: var(--text-primary);">Quick Actions</h3>
				<div class="grid grid-cols-2 gap-3">
					<button
						onclick={() => goto('/checkin-scanner')}
						class="button-primary button--gap button--small justify-center py-3"
					>
						<UserCheck class="h-4 w-4" />
						Check-in
					</button>
					<button
						onclick={() => goto(`/tours/${tour?.id}/bookings`)}
						class="button-primary button--gap button--small justify-center py-3"
					>
						<Calendar class="h-4 w-4" />
						Bookings
					</button>
				</div>
				<div class="grid grid-cols-3 gap-3 mt-3">
					<button
						onclick={() => goto(`/tours/${tour?.id}/qr`)}
						class="button-secondary button--gap button--small justify-center py-3"
					>
						<QrCode class="h-4 w-4" />
						QR Codes
					</button>
					<button
						onclick={() => goto(`/tours/${tour?.id}/schedule`)}
						class="button-secondary button--gap button--small justify-center py-3"
					>
						<CalendarDays class="h-4 w-4" />
						Schedule
					</button>
					<button
						onclick={() => goto(`/tours/${tour?.id}/edit`)}
						class="button-secondary button--gap button--small justify-center py-3"
					>
						<Edit class="h-4 w-4" />
						Edit
					</button>
				</div>
			</div>
		</div>

		<!-- Quick Stats Cards -->
		<div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8 items-stretch">
			<StatsCard
				title="QR Codes"
				value={stats.qrCodes || 0}
				subtitle="{stats.activeQRCodes || 0} active"
				icon={QrCode}
				variant="small"
			/>

			<StatsCard
				title="Total Bookings"
				value={stats.totalBookings || 0}
				subtitle="{stats.confirmedBookings || 0} confirmed"
				icon={UserCheck}
				variant="small"
			/>

			<StatsCard
				title="Revenue"
				value={formatEuro(stats.revenue || 0)}
				subtitle="{stats.averageBookingValue && stats.averageBookingValue > 0 ? formatEuro(stats.averageBookingValue) : formatEuro(0)} avg"
				icon={Euro}
				variant="small"
			/>

			<StatsCard
				title="This Week"
				value={stats.thisWeekBookings || 0}
				subtitle="new bookings"
				icon={TrendingUp}
				variant="small"
				trend={stats.thisWeekBookings > 0 ? { value: "This week", positive: true } : undefined}
			/>

			<StatsCard
				title="Participants"
				value={stats.totalParticipants || 0}
				subtitle="total guests"
				icon={Users}
				variant="small"
			/>

			<StatsCard
				title="QR Conversion"
				value="{(stats.conversionRate || 0).toFixed(1)}%"
				subtitle="{stats.totalQRScans || 0} scans"
				icon={TrendingUp}
				variant="small"
			/>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
			<!-- Main Content -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Tour Images -->
				{#if tour.images && tour.images.length > 0}
					<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-6" style="border-bottom: 1px solid var(--border-primary);">
							<h2 class="text-xl font-semibold" style="color: var(--text-primary);">Tour Images</h2>
						</div>
						<div class="p-6">
							<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{#each tour.images as image, index}
									<div class="relative group rounded-lg overflow-hidden" style="background: var(--bg-secondary);">
										<img 
											src="/uploads/tours/{tour.id}/{image}" 
											alt="Tour image {index + 1}"
											class="w-full h-48 object-cover"
											loading="lazy"
										/>
										<div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
											<button 
												onclick={() => window.open(`/uploads/tours/${tour.id}/${image}`, '_blank')}
												class="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
											>
												View Full Size
											</button>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{:else}
					<div class="rounded-xl p-8" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<EmptyState
							icon={Image}
							title="No Images"
							description="Add images to make your tour more appealing to customers"
							actionText="Edit Tour"
							onAction={() => goto(`/tours/${tour?.id}/edit`)}
						/>
					</div>
				{/if}

				<!-- Tour Details -->
				<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-6" style="border-bottom: 1px solid var(--border-primary);">
						<h2 class="text-xl font-semibold" style="color: var(--text-primary);">Tour Details</h2>
					</div>
					<div class="p-6 space-y-6">
						{#if tour.description}
							<div>
								<h3 class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Description</h3>
								<p class="leading-relaxed" style="color: var(--text-primary);">{tour.description}</p>
							</div>
						{/if}

						<div class="grid grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-6">
							<div class="text-center p-3 sm:p-4 rounded-lg" style="background: var(--bg-secondary);">
								<Euro class="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
								<p class="text-lg sm:text-2xl font-bold" style="color: var(--text-primary);">€{tour.price}</p>
								<p class="text-xs sm:text-sm" style="color: var(--text-tertiary);">per person</p>
							</div>
							<div class="text-center p-3 sm:p-4 rounded-lg" style="background: var(--bg-secondary);">
								<Clock class="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
								<p class="text-sm sm:text-lg font-semibold" style="color: var(--text-primary);">{formatDuration(tour.duration)}</p>
								<p class="text-xs sm:text-sm" style="color: var(--text-tertiary);">duration</p>
							</div>
							<div class="text-center p-3 sm:p-4 rounded-lg" style="background: var(--bg-secondary);">
								<Users class="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
								<p class="text-sm sm:text-lg font-semibold" style="color: var(--text-primary);">{tour.capacity}</p>
								<p class="text-xs sm:text-sm" style="color: var(--text-tertiary);">max capacity</p>
							</div>
						</div>
					</div>
				</div>

				<!-- What's Included -->
				{#if tour.includedItems && tour.includedItems.length > 0}
					<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-6" style="border-bottom: 1px solid var(--border-primary);">
							<h2 class="text-xl font-semibold" style="color: var(--text-primary);">What's Included</h2>
						</div>
						<div class="p-6">
							<ul class="space-y-3">
								{#each tour.includedItems as item}
									<li class="flex items-start gap-3">
										<Check class="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
										<span style="color: var(--text-secondary);">{item}</span>
									</li>
								{/each}
							</ul>
						</div>
					</div>
				{/if}

				<!-- Requirements -->
				{#if tour.requirements && tour.requirements.length > 0}
					<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-6" style="border-bottom: 1px solid var(--border-primary);">
							<h2 class="text-xl font-semibold" style="color: var(--text-primary);">Requirements</h2>
						</div>
						<div class="p-6">
							<ul class="space-y-3">
								{#each tour.requirements as requirement}
									<li class="flex items-start gap-3">
										<Info class="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
										<span style="color: var(--text-secondary);">{requirement}</span>
									</li>
								{/each}
							</ul>
						</div>
					</div>
				{/if}

				<!-- Cancellation Policy -->
				{#if tour.cancellationPolicy}
					<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-6" style="border-bottom: 1px solid var(--border-primary);">
							<h2 class="text-xl font-semibold" style="color: var(--text-primary);">Cancellation Policy</h2>
						</div>
						<div class="p-6">
							<p class="leading-relaxed" style="color: var(--text-secondary);">{tour.cancellationPolicy}</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Sidebar -->
			<div class="hidden lg:block space-y-6">
				<!-- Quick Actions -->
				<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-6" style="border-bottom: 1px solid var(--border-primary);">
						<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Quick Actions</h3>
						<p class="text-sm mt-1" style="color: var(--text-secondary);">Manage your tour efficiently</p>
					</div>
					
					<div class="p-6 space-y-4">
						<!-- Primary Action -->
						<div class="rounded-lg p-4" style="background: var(--bg-secondary); border: 1px solid var(--color-primary-200);">
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center gap-2">
									<div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
										<UserCheck class="h-4 w-4 text-white" />
									</div>
									<div>
										<h4 class="font-medium" style="color: var(--text-primary);">Guest Check-in</h4>
										<p class="text-xs" style="color: var(--text-secondary);">Scan QR codes to check in guests</p>
									</div>
								</div>
								{#if upcomingBookings.length > 0}
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
										{upcomingBookings.length} pending
									</span>
								{/if}
							</div>
							<button
								onclick={() => goto('/checkin-scanner')}
								class="button-primary button--full-width button--gap button--small justify-center"
							>
								<UserCheck class="h-4 w-4" />
								Open QR Scanner
							</button>
						</div>

						<!-- Secondary Actions Grid -->
						<div class="grid grid-cols-1 gap-3">
							<button
								onclick={() => goto(`/tours/${tour?.id}/bookings`)}
								class="group flex items-center justify-between p-4 rounded-lg transition-all"
								style="border: 1px solid var(--border-primary);"
								onmouseenter={(e) => {
									e.currentTarget.style.borderColor = '#3b82f6';
									e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
								}}
								onmouseleave={(e) => {
									e.currentTarget.style.borderColor = 'var(--border-primary)';
									e.currentTarget.style.background = 'transparent';
								}}
							>
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors" style="background: var(--bg-tertiary);">
										<Calendar class="h-5 w-5" style="color: var(--text-secondary);" />
									</div>
									<div class="text-left">
										<h4 class="font-medium" style="color: var(--text-primary);">All Bookings</h4>
										<p class="text-sm" style="color: var(--text-secondary);">{stats.totalBookings || 0} total bookings</p>
									</div>
								</div>
								<ChevronRight class="h-4 w-4" style="color: var(--text-tertiary);" />
							</button>

							<button
								onclick={() => goto(`/tours/${tour?.id}/qr`)}
								class="group flex items-center justify-between p-4 rounded-lg transition-all {stats.qrCodes > 0 ? 'ring-2 ring-purple-200' : ''}"
								style="border: 1px solid var(--border-primary);"
								onmouseenter={(e) => {
									e.currentTarget.style.borderColor = '#a855f7';
									e.currentTarget.style.background = 'rgba(168, 85, 247, 0.05)';
								}}
								onmouseleave={(e) => {
									e.currentTarget.style.borderColor = 'var(--border-primary)';
									e.currentTarget.style.background = 'transparent';
								}}
							>
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors {stats.qrCodes > 0 ? 'bg-purple-100' : ''}" style={stats.qrCodes > 0 ? '' : 'background: var(--bg-tertiary);'}>
										<QrCode class="h-5 w-5 {stats.qrCodes > 0 ? 'text-purple-600' : ''}" style={stats.qrCodes > 0 ? '' : 'color: var(--text-secondary);'} />
									</div>
									<div class="text-left">
										<h4 class="font-medium" style="color: var(--text-primary);">QR Codes</h4>
										<p class="text-sm" style="color: var(--text-secondary);">
											{#if stats.qrCodes > 0}
												{stats.qrCodes} code{stats.qrCodes !== 1 ? 's' : ''} ready to share
											{:else}
												Create marketing QR codes
											{/if}
										</p>
									</div>
								</div>
								<div class="flex items-center gap-2">
									{#if stats.qrCodes > 0}
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
											{stats.activeQRCodes} active
										</span>
									{/if}
									<ChevronRight class="h-4 w-4" style="color: var(--text-tertiary);" />
								</div>
							</button>

							<button
								onclick={() => goto(`/tours/${tour?.id}/schedule`)}
								class="group flex items-center justify-between p-4 rounded-lg transition-all"
								style="border: 1px solid var(--border-primary);"
								onmouseenter={(e) => {
									e.currentTarget.style.borderColor = '#10b981';
									e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)';
								}}
								onmouseleave={(e) => {
									e.currentTarget.style.borderColor = 'var(--border-primary)';
									e.currentTarget.style.background = 'transparent';
								}}
							>
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors" style="background: var(--bg-tertiary);">
										<CalendarDays class="h-5 w-5" style="color: var(--text-secondary);" />
									</div>
									<div class="text-left">
										<h4 class="font-medium" style="color: var(--text-primary);">Schedule</h4>
										<p class="text-sm" style="color: var(--text-secondary);">Manage time slots</p>
									</div>
								</div>
								<ChevronRight class="h-4 w-4" style="color: var(--text-tertiary);" />
							</button>
						</div>
					</div>
				</div>

				<!-- Danger Zone -->
				<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid #fca5a5;">
					<div class="p-6" style="background: var(--bg-secondary); border-bottom: 1px solid #fca5a5;">
						<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Danger Zone</h3>
						<p class="text-sm" style="color: var(--text-secondary);">
							Deleting a tour is permanent and cannot be undone.
						</p>
					</div>
					<div class="p-6">
						<form id="delete-tour-form" method="POST" action="?/delete" use:enhance={() => {
							isDeleting = true;
							return async ({ result }) => {
								isDeleting = false;
								if (result.type === 'redirect') {
									goto(result.location);
								}
							};
						}}>
							<button
								type="button"
								onclick={deleteTour}
								disabled={isDeleting}
								class="button--danger button--full-width button--gap button--small justify-center rounded-lg flex items-center"
							>
								{#if isDeleting}
									<LoadingSpinner size="small" />
									Deleting...
								{:else}
									<Trash2 class="h-4 w-4 flex-shrink-0" />
									Delete Tour
								{/if}
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

 