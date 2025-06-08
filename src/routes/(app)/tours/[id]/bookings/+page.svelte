<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';
	import type { Booking } from '$lib/types.js';
	import BookingsList from '$lib/components/BookingsList.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import { formatEuro } from '$lib/utils/currency.js';
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Euro from 'lucide-svelte/icons/euro';
	import Users from 'lucide-svelte/icons/users';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import Clock from 'lucide-svelte/icons/clock';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Download from 'lucide-svelte/icons/download';
	import Filter from 'lucide-svelte/icons/filter';
	import Search from 'lucide-svelte/icons/search';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import Ticket from 'lucide-svelte/icons/ticket';
	import Plus from 'lucide-svelte/icons/plus';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';

	// Extended booking type with expand data
	interface ExpandedBooking extends Booking {
		expand?: {
			tour?: {
				id: string;
				name: string;
				[key: string]: any;
			};
			timeSlot?: {
				id: string;
				startTime: string;
				endTime: string;
				[key: string]: any;
			};
		};
	}

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	let bookings = $state<ExpandedBooking[]>(data.bookings as unknown as ExpandedBooking[] || []);
	let isLoading = $state(false);
	let error = $state<string | null>(form?.error || null);
	let selectedStatus = $state('all');
	let searchQuery = $state('');
	let dateFilter = $state('all');
	let isUpdatingStatus = $state<string | null>(null);

	// Update bookings when data changes
	$effect(() => {
		bookings = (data.bookings as unknown as ExpandedBooking[]) || [];
		error = form?.error || null;
	});

	// Use server-calculated stats (safe access)
	let stats = $derived(() => {
		if (!data.stats) {
			return {
				total: 0,
				confirmed: 0,
				pending: 0,
				cancelled: 0,
				completed: 0,
				revenue: 0,
				participants: 0,
				upcoming: 0
			};
		}
		return data.stats;
	});

	// Filtered bookings (only frontend filtering, no calculations)
	let filteredBookings = $state<ExpandedBooking[]>([]);

	// Check URL params for initial filters
	$effect(() => {
		if (typeof window !== 'undefined') {
			const urlParams = new URLSearchParams(window.location.search);
			const dateParam = urlParams.get('date');
			if (dateParam === 'today') {
				dateFilter = 'today';
			}
		}
	});

	// Update filtered bookings when filters change
	$effect(() => {
		let filtered = bookings;

		// Status filter
		if (selectedStatus !== 'all') {
			filtered = filtered.filter(b => b.status === selectedStatus);
		}

		// Search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(b => 
				b.customerName.toLowerCase().includes(query) ||
				b.customerEmail.toLowerCase().includes(query) ||
				b.bookingReference.toLowerCase().includes(query) ||
				b.customerPhone?.toLowerCase().includes(query)
			);
		}

		// Date filter
		if (dateFilter !== 'all') {
			const now = new Date();
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

			filtered = filtered.filter(b => {
				const tourDate = new Date(b.expand?.timeSlot?.startTime || b.created);
				
				switch (dateFilter) {
					case 'upcoming':
						return tourDate > now;
					case 'past':
						return tourDate < now;
					case 'today':
						return tourDate >= today && tourDate < tomorrow;
					default:
						return true;
				}
			});
		}

		filteredBookings = filtered;
	});

	async function refreshBookings() {
		isLoading = true;
		await invalidateAll();
		isLoading = false;
	}

	// Helper function to validate status transitions
	function getStatusValidationError(booking: ExpandedBooking, newStatus: Booking['status']): string | null {
		if (newStatus === 'confirmed' && booking.paymentStatus !== 'paid') {
			return 'Cannot confirm booking: Payment not completed. Customer must complete payment first.';
		}
		
		if (newStatus === 'completed' && booking.status !== 'confirmed') {
			return 'Cannot complete booking: Only confirmed bookings can be completed.';
		}
		
		return null;
	}

	// Helper function to check if a status action is disabled
	function isStatusActionDisabled(booking: ExpandedBooking, newStatus: Booking['status']): boolean {
		return getStatusValidationError(booking, newStatus) !== null;
	}

	function exportBookings() {
		// Simple CSV export
		const headers = ['Booking Reference', 'Customer Name', 'Email', 'Phone', 'Participants', 'Amount', 'Status', 'Date', 'Time'];
		const csvData = filteredBookings.map(booking => [
			booking.bookingReference,
			booking.customerName,
			booking.customerEmail,
			booking.customerPhone || '',
			booking.participants,
			`€${booking.totalAmount}`,
			booking.status,
			booking.expand?.timeSlot?.startTime ? 
				new Date(booking.expand.timeSlot.startTime).toLocaleDateString() : 
				new Date(booking.created).toLocaleDateString(),
			booking.expand?.timeSlot?.startTime ? 
				new Date(booking.expand.timeSlot.startTime).toLocaleTimeString() : 
				''
		]);

		const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `bookings-${data.tour?.name || 'tour'}-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function formatDate(dateString: string) {
		try {
			if (!dateString) return 'Date not available';
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return 'Invalid date';
			
			return date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			});
		} catch (error) {
			console.warn('Error formatting date:', dateString, error);
			return 'Date not available';
		}
	}

	function formatTime(dateString: string) {
		try {
			if (!dateString) return 'Time not available';
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return 'Invalid time';
			
			return date.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			});
		} catch (error) {
			console.warn('Error formatting time:', dateString, error);
			return 'Time not available';
		}
	}
</script>

<svelte:head>
	<title>{data.tour?.name} Bookings - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<div class="mb-6 sm:mb-8">
		<PageHeader 
			title="{data.tour?.name} Bookings"
			subtitle="View and manage all bookings for this tour"
			breadcrumbs={[
				{ label: 'Tours', href: '/tours' },
				{ label: data.tour?.name || 'Tour', href: `/tours/${data.tour?.id || ''}` },
				{ label: 'Bookings' }
			]}
			backUrl={`/tours/${data.tour?.id || ''}`}
		>
			<div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
				<button 
					onclick={() => goto('/bookings')}
					class="button-secondary button--gap button--small"
				>
					<ArrowLeft class="h-4 w-4" />
					All Bookings
				</button>
				<button 
					onclick={refreshBookings}
					disabled={isLoading}
					class="button-secondary button--gap button--small"
				>
					{#if isLoading}
						<div class="form-spinner"></div>
					{:else}
						<RefreshCw class="h-4 w-4" />
					{/if}
					Refresh
				</button>
				<button 
					onclick={exportBookings}
					class="hidden sm:flex button-primary button--gap button--small"
				>
					<Download class="h-4 w-4" />
					Export CSV
				</button>
			</div>
		</PageHeader>
	</div>

	{#if error}
		<div class="mb-6 rounded-xl p-4" style="background: var(--color-error-light); border: 1px solid var(--border-danger);">
			<div class="flex gap-3">
				<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-error);" />
				<div>
					<p class="font-medium" style="color: var(--text-danger);">Error</p>
					<p class="text-sm mt-1" style="color: var(--text-danger);">{error}</p>
				</div>
			</div>
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
					onclick={exportBookings}
					class="button-primary button--gap button--small justify-center py-3"
				>
					<Download class="h-4 w-4" />
					Export
				</button>
			</div>
			<div class="grid grid-cols-2 gap-3 mt-3">
				<button
					onclick={() => goto(`/tours/${data.tour?.id || ''}/qr`)}
					class="button-secondary button--gap button--small justify-center py-3"
				>
					<QrCode class="h-4 w-4" />
					QR Codes
				</button>
				<button
					onclick={() => goto('/bookings')}
					class="button-secondary button--gap button--small justify-center py-3"
				>
					<Calendar class="h-4 w-4" />
					All Bookings
				</button>
			</div>
		</div>
	</div>

	<!-- Statistics Cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
		<StatsCard
			title="Total Bookings"
			value={stats().total}
			subtitle="all bookings"
			icon={Calendar}
			variant="small"
		/>

		<StatsCard
			title="Confirmed"
			value={stats().confirmed}
			subtitle="paid & ready"
			icon={CheckCircle}
			variant="small"
		/>

		<StatsCard
			title="Pending"
			value={stats().pending}
			subtitle="awaiting payment"
			icon={Clock}
			variant="small"
		/>

		<StatsCard
			title="Upcoming"
			value={stats().upcoming}
			subtitle="future tours"
			icon={TrendingUp}
			variant="small"
		/>

		<StatsCard
			title="Revenue"
			value={formatEuro(stats().revenue)}
			subtitle="total earned"
			icon={Euro}
			variant="small"
		/>

		<StatsCard
			title="Participants"
			value={stats().participants}
			subtitle="confirmed guests"
			icon={Users}
			variant="small"
		/>

		<StatsCard
			title="Cancelled"
			value={stats().cancelled}
			subtitle="cancelled bookings"
			icon={XCircle}
			variant="small"
		/>

		<StatsCard
			title="Completed"
			value={stats().completed}
			subtitle="finished tours"
			icon={UserCheck}
			variant="small"
		/>
	</div>

	<!-- Filters -->
	<div class="rounded-xl p-6 mb-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="flex flex-col lg:flex-row lg:items-center gap-4">
			<div class="flex items-center gap-2">
				<Filter class="h-5 w-5" style="color: var(--text-tertiary);" />
				<span class="text-sm font-medium" style="color: var(--text-secondary);">Filters:</span>
			</div>
			
			<div class="flex flex-wrap gap-4 flex-1">
				<!-- Status Filter -->
				<div class="flex flex-col">
					<label for="status-filter" class="text-xs mb-1" style="color: var(--text-tertiary);">Status</label>
					<select id="status-filter" bind:value={selectedStatus} class="form-select form-select--small">
						<option value="all">All Statuses</option>
						<option value="pending">Pending</option>
						<option value="confirmed">Confirmed</option>
						<option value="cancelled">Cancelled</option>
						<option value="completed">Completed</option>
						<option value="no_show">No Show</option>
					</select>
				</div>

				<!-- Date Filter -->
				<div class="flex flex-col">
					<label for="date-filter" class="text-xs mb-1" style="color: var(--text-tertiary);">Date</label>
					<select id="date-filter" bind:value={dateFilter} class="form-select form-select--small">
						<option value="all">All Dates</option>
						<option value="upcoming">Upcoming</option>
						<option value="today">Today</option>
						<option value="past">Past</option>
					</select>
				</div>

				<!-- Search -->
				<div class="flex flex-col flex-1 min-w-64">
					<label for="search-input" class="text-xs mb-1" style="color: var(--text-tertiary);">Search</label>
					<div class="relative">
						<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-placeholder);" />
						<input 
							id="search-input"
							type="text" 
							bind:value={searchQuery}
							placeholder="Search by name, email, reference..."
							class="form-input form-input--small pl-10"
						/>
					</div>
				</div>
			</div>

			<div class="text-sm" style="color: var(--text-tertiary);">
				Showing {filteredBookings.length} of {stats().total} bookings
			</div>
		</div>
	</div>

	<!-- Bookings List -->
	{#if filteredBookings.length === 0}
		<div class="rounded-xl p-12 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="max-w-md mx-auto">
				<div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style="background: var(--bg-secondary);">
					<Calendar class="h-8 w-8" style="color: var(--text-tertiary);" />
				</div>
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">
					{selectedStatus === 'all' && searchQuery === '' && dateFilter === 'all' 
						? 'No bookings yet' 
						: 'No bookings match your filters'}
				</h3>
				<p class="mb-6" style="color: var(--text-secondary);">
					{selectedStatus === 'all' && searchQuery === '' && dateFilter === 'all'
						? 'Bookings will appear here when customers start booking your tour'
						: 'Try adjusting your filters to see more results'}
				</p>
				{#if selectedStatus !== 'all' || searchQuery !== '' || dateFilter !== 'all'}
					<button 
						onclick={() => { selectedStatus = 'all'; searchQuery = ''; dateFilter = 'all'; }}
						class="button-secondary button--gap button--small"
					>
						Clear Filters
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<div class="space-y-4">
			{#each filteredBookings as booking (booking.id)}
				<div class="rounded-xl p-4 sm:p-6 hover:shadow-lg transition-shadow" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="flex flex-col gap-4">
						<!-- Header Section -->
						<div class="flex flex-col gap-3">
							<div class="flex items-start justify-between">
								<div class="min-w-0 flex-1">
									<h3 class="text-lg font-semibold truncate" style="color: var(--text-primary);">{booking.customerName}</h3>
									<div class="mt-1 space-y-1">
										<div class="text-sm" style="color: var(--text-secondary);">
											<span>Ref: <code class="px-1.5 py-0.5 rounded font-mono text-xs" style="background: var(--bg-secondary);">{booking.bookingReference}</code></span>
										</div>
										<div class="text-sm truncate" style="color: var(--text-secondary);">{booking.customerEmail}</div>
										{#if booking.customerPhone}
											<div class="text-sm" style="color: var(--text-secondary);">{booking.customerPhone}</div>
										{/if}
									</div>
								</div>
							</div>
							
							<!-- Status Badges - Mobile Optimized -->
							<div class="flex flex-wrap gap-2">
								<!-- Booking Status Badge -->
								<span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border {
									booking.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
									booking.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
									booking.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
									booking.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
									'bg-gray-50 text-gray-700 border-gray-200'
								}">
									<span class="w-1.5 h-1.5 rounded-full {
										booking.status === 'confirmed' ? 'bg-green-500' :
										booking.status === 'pending' ? 'bg-yellow-500' :
										booking.status === 'cancelled' ? 'bg-red-500' :
										booking.status === 'completed' ? 'bg-blue-500' :
										'bg-gray-500'
									}"></span>
									{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
								</span>
								
								<!-- Payment Status Badge -->
								<span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border {
									booking.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
									booking.paymentStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
									booking.paymentStatus === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
									booking.paymentStatus === 'refunded' ? 'bg-gray-50 text-gray-700 border-gray-200' :
									'bg-gray-50 text-gray-700 border-gray-200'
								}">
									<span class="mr-0.5">💳</span>
									{booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
								</span>

								<!-- Attendance Status Badge (for confirmed bookings) -->
								{#if booking.status === 'confirmed' && booking.paymentStatus === 'paid'}
									<span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border {
										booking.attendanceStatus === 'checked_in' ? 'bg-blue-50 text-blue-700 border-blue-200' :
										booking.attendanceStatus === 'no_show' ? 'bg-gray-50 text-gray-700 border-gray-200' :
										'bg-purple-50 text-purple-700 border-purple-200'
									}">
										<span class="mr-0.5">
											{#if booking.attendanceStatus === 'checked_in'}
												✅
											{:else if booking.attendanceStatus === 'no_show'}
												❌
											{:else}
												⏳
											{/if}
										</span>
										{#if booking.attendanceStatus === 'checked_in'}
											Checked In
										{:else if booking.attendanceStatus === 'no_show'}
											No Show
										{:else}
											Not Arrived
										{/if}
									</span>
								{/if}
							</div>
						</div>

						{#if booking.checkedInAt}
							<p class="text-xs" style="color: var(--text-tertiary);">
								Checked in: {new Date(booking.checkedInAt).toLocaleString('en-US', {
									month: 'short',
									day: 'numeric',
									hour: 'numeric',
									minute: '2-digit',
									hour12: true
								})}
							</p>
						{/if}

						<!-- Details Grid - Mobile Optimized -->
						<div class="grid grid-cols-2 gap-3">
							<div class="p-3 rounded-lg" style="background: var(--bg-secondary);">
								<Calendar class="h-4 w-4 mx-auto mb-1" style="color: var(--text-tertiary);" />
								<p class="text-sm font-semibold" style="color: var(--text-primary);">
									{booking.expand?.timeSlot?.startTime ? 
										formatDate(booking.expand.timeSlot.startTime) : 
										formatDate(booking.created)}
								</p>
								<p class="text-xs" style="color: var(--text-tertiary);">Date</p>
							</div>
							<div class="p-3 rounded-lg" style="background: var(--bg-secondary);">
								<Clock class="h-4 w-4 mx-auto mb-1" style="color: var(--text-tertiary);" />
								<p class="text-sm font-semibold" style="color: var(--text-primary);">
									{booking.expand?.timeSlot?.startTime ? 
										formatTime(booking.expand.timeSlot.startTime) : 
										'Not scheduled'}
								</p>
								<p class="text-xs" style="color: var(--text-tertiary);">Time</p>
							</div>
							<div class="p-3 rounded-lg" style="background: var(--bg-secondary);">
								<Users class="h-4 w-4 mx-auto mb-1" style="color: var(--text-tertiary);" />
								<p class="text-sm font-semibold" style="color: var(--text-primary);">{booking.participants}</p>
								<p class="text-xs" style="color: var(--text-tertiary);">Participants</p>
							</div>
							<div class="p-3 rounded-lg" style="background: var(--bg-secondary);">
								<Euro class="h-4 w-4 mx-auto mb-1" style="color: var(--text-tertiary);" />
								<p class="text-sm font-semibold" style="color: var(--text-primary);">{formatEuro(booking.totalAmount)}</p>
								<p class="text-xs" style="color: var(--text-tertiary);">Amount</p>
							</div>
						</div>

						{#if booking.specialRequests}
							<div class="p-3 rounded-lg" style="background: var(--color-primary-50);">
								<p class="text-xs font-medium mb-1" style="color: var(--color-primary-700);">Special Requests:</p>
								<p class="text-sm" style="color: var(--color-primary-900);">{booking.specialRequests}</p>
							</div>
						{/if}

						<!-- Actions -->
						{#if booking.status === 'pending'}
							{@const confirmDisabled = isStatusActionDisabled(booking, 'confirmed') || isUpdatingStatus === booking.id}
							{@const confirmError = getStatusValidationError(booking, 'confirmed')}
							<div class="flex flex-col gap-2">
								<div class="relative">
									<form method="POST" action="?/updateStatus" use:enhance={() => {
										isUpdatingStatus = booking.id;
										return async ({ result }) => {
											isUpdatingStatus = null;
											if (result.type === 'success') {
												await invalidateAll();
											}
										};
									}}>
										<input type="hidden" name="bookingId" value={booking.id} />
										<input type="hidden" name="status" value="confirmed" />
										<button
											type="submit"
											disabled={confirmDisabled}
											class="button-primary button--gap button--small w-full {confirmDisabled && !isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}"
											title={confirmError || ''}
										>
											{#if isUpdatingStatus === booking.id}
												<div class="form-spinner"></div>
											{:else}
												<CheckCircle class="h-4 w-4" />
											{/if}
											Confirm
										</button>
									</form>
								</div>
								
								<form method="POST" action="?/updateStatus" use:enhance={() => {
									isUpdatingStatus = booking.id;
									return async ({ result }) => {
										isUpdatingStatus = null;
										if (result.type === 'success') {
											await invalidateAll();
										}
									};
								}}>
									<input type="hidden" name="bookingId" value={booking.id} />
									<input type="hidden" name="status" value="cancelled" />
									<button
										type="submit"
										disabled={isUpdatingStatus === booking.id}
										class="button-secondary button--gap button--small text-red-600 hover:bg-red-50 w-full"
									>
										{#if isUpdatingStatus === booking.id}
											<div class="form-spinner"></div>
										{:else}
											<XCircle class="h-4 w-4" />
										{/if}
										Cancel
									</button>
								</form>
							</div>
						{:else if booking.status === 'confirmed'}
							{@const completeDisabled = isStatusActionDisabled(booking, 'completed') || isUpdatingStatus === booking.id}
							{@const completeError = getStatusValidationError(booking, 'completed')}
							<div class="flex flex-col gap-2">
								<!-- Ticket Check-in Button (if has ticket QR code) -->
								{#if booking.ticketQRCode}
									<a
										href="/checkin/{booking.ticketQRCode}"
										target="_blank"
										class="button-primary button--gap button--small text-center"
									>
										<UserCheck class="h-4 w-4" />
										Check In Customer
									</a>
								{/if}
								
								<div class="relative">
									<form method="POST" action="?/updateStatus" use:enhance={() => {
										isUpdatingStatus = booking.id;
										return async ({ result }) => {
											isUpdatingStatus = null;
											if (result.type === 'success') {
												await invalidateAll();
											}
										};
									}}>
										<input type="hidden" name="bookingId" value={booking.id} />
										<input type="hidden" name="status" value="completed" />
										<button
											type="submit"
											disabled={completeDisabled}
											class="button-primary button--gap button--small w-full {completeDisabled && !isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}"
											title={completeError || ''}
										>
											{#if isUpdatingStatus === booking.id}
												<div class="form-spinner"></div>
											{:else}
												<UserCheck class="h-4 w-4" />
											{/if}
											Mark Complete
										</button>
									</form>
								</div>
								
								<form method="POST" action="?/updateStatus" use:enhance={() => {
									isUpdatingStatus = booking.id;
									return async ({ result }) => {
										isUpdatingStatus = null;
										if (result.type === 'success') {
											await invalidateAll();
										}
									};
								}}>
									<input type="hidden" name="bookingId" value={booking.id} />
									<input type="hidden" name="status" value="no_show" />
									<button
										type="submit"
										disabled={isUpdatingStatus === booking.id}
										class="button-secondary button--gap button--small text-orange-600 hover:bg-orange-50 w-full"
									>
										{#if isUpdatingStatus === booking.id}
											<div class="form-spinner"></div>
										{:else}
											<AlertCircle class="h-4 w-4" />
										{/if}
										No Show
									</button>
								</form>
							</div>
						{:else if booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'no_show'}
							<div class="flex flex-col gap-2">
								<div class="text-center text-sm py-2" style="color: var(--text-tertiary);">
									{#if booking.status === 'completed'}
										✅ Tour completed
									{:else if booking.status === 'cancelled'}
										❌ Booking cancelled
									{:else if booking.status === 'no_show'}
										👻 Customer no-show
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div> 