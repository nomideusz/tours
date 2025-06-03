<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import type { Booking } from '$lib/types.js';
	import { bookingsApi } from '$lib/pocketbase.js';
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
			qrCode?: {
				id: string;
				code: string;
				[key: string]: any;
			};
		};
	}

	let { data }: { data: PageData } = $props();
	
	let bookings = $state<ExpandedBooking[]>(data.bookings || []);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let selectedStatus = $state('all');
	let searchQuery = $state('');
	let dateFilter = $state('all'); // 'all', 'upcoming', 'past', 'today'
	let isUpdatingStatus = $state<string | null>(null);

	// Calculate statistics reactively
	let stats = $state({
		total: 0,
		confirmed: 0,
		pending: 0,
		cancelled: 0,
		completed: 0,
		revenue: 0,
		participants: 0,
		upcoming: 0
	});

	// Filtered bookings
	let filteredBookings = $state<ExpandedBooking[]>([]);

	// Update stats and filtered bookings when bookings change
	$effect(() => {
		const confirmed = bookings.filter(b => b.status === 'confirmed');
		const pending = bookings.filter(b => b.status === 'pending');
		const cancelled = bookings.filter(b => b.status === 'cancelled');
		const completed = bookings.filter(b => b.status === 'completed');
		
		const totalRevenue = confirmed.reduce((sum, b) => sum + b.totalAmount, 0);
		const totalParticipants = confirmed.reduce((sum, b) => sum + b.participants, 0);
		
		const upcoming = bookings.filter(b => {
			const tourDate = new Date(b.expand?.timeSlot?.startTime || b.created);
			return tourDate > new Date() && (b.status === 'confirmed' || b.status === 'pending');
		});

		stats = {
			total: bookings.length,
			confirmed: confirmed.length,
			pending: pending.length,
			cancelled: cancelled.length,
			completed: completed.length,
			revenue: totalRevenue,
			participants: totalParticipants,
			upcoming: upcoming.length
		};
	});

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
		try {
			isLoading = true;
			error = null;
			// Reload the page to get fresh data from the server
			location.reload();
		} catch (err) {
			error = 'Failed to refresh bookings';
			console.error('Error refreshing bookings:', err);
		} finally {
			isLoading = false;
		}
	}

	async function updateBookingStatus(bookingId: string, newStatus: Booking['status']) {
		const booking = bookings.find(b => b.id === bookingId);
		if (!booking) return;

		// Check if the action is valid before showing confirmation
		const validationError = getStatusValidationError(booking, newStatus);
		if (validationError) {
			error = validationError;
			return;
		}

		if (!confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) {
			return;
		}

		try {
			isUpdatingStatus = bookingId;
			error = null; // Clear any previous errors
			await bookingsApi.updateStatus(bookingId, newStatus);
			
			// Update local state
			bookings = bookings.map(b => 
				b.id === bookingId ? { ...b, status: newStatus } : b
			);
		} catch (err) {
			// Handle specific validation errors from the API
			if (err instanceof Error) {
				if (err.message.includes('payment')) {
					error = `Cannot ${newStatus} booking: Payment not completed. Customer must complete payment first.`;
				} else if (err.message.includes('confirmed')) {
					error = `Cannot ${newStatus} booking: Only confirmed bookings can be marked as completed.`;
				} else {
					error = `Failed to update booking status: ${err.message}`;
				}
			} else {
				error = `Failed to update booking status to ${newStatus}`;
			}
			console.error('Error updating booking status:', err);
		} finally {
			isUpdatingStatus = null;
		}
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
		a.download = `bookings-${data.tour.name}-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatTime(dateString: string) {
		return new Date(dateString).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}
</script>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<PageHeader 
		title="Bookings Management"
		subtitle="View and manage all bookings for this tour"
		breadcrumbs={[
			{ label: 'Tours', href: '/tours' },
			{ label: data.tour.name, href: `/tours/${data.tour.id}` },
			{ label: 'Bookings' }
		]}
		backUrl={`/tours/${data.tour.id}`}
	>
		<div class="flex items-center gap-2">
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
				class="button-primary button--gap button--small"
			>
				<Download class="h-4 w-4" />
				Export CSV
			</button>
		</div>
	</PageHeader>

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

	<!-- Payment Validation Info -->
	<div class="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
		<div class="flex gap-3">
			<div class="p-1 bg-blue-100 rounded-lg">
				<AlertCircle class="h-4 w-4 text-blue-600" />
			</div>
			<div>
				<div class="flex items-center gap-2">
					<p class="font-medium text-blue-800 text-sm">Payment Validation Active</p>
					<Tooltip content="This feature prevents confirming bookings until payment is completed, ensuring you only provide services to paying customers. The 💳 badge shows payment status for each booking.">
						<HelpCircle class="h-3 w-3 text-blue-600" />
					</Tooltip>
				</div>
				<p class="text-xs text-blue-700 mt-1">
					Booking status changes are validated against payment status. You can only confirm bookings with completed payments. 
					Payment status is shown with a 💳 badge next to each booking.
				</p>
			</div>
		</div>
	</div>

	<!-- Statistics Cards -->
	<div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
		<StatsCard
			title="Total Bookings"
			value={stats.total}
			subtitle="all bookings"
			icon={Calendar}
			variant="small"
		/>

		<StatsCard
			title="Confirmed"
			value={stats.confirmed}
			subtitle="paid & ready"
			icon={CheckCircle}
			variant="small"
		/>

		<StatsCard
			title="Pending"
			value={stats.pending}
			subtitle="awaiting payment"
			icon={Clock}
			variant="small"
		/>

		<StatsCard
			title="Upcoming"
			value={stats.upcoming}
			subtitle="future tours"
			icon={TrendingUp}
			variant="small"
		/>

		<StatsCard
			title="Revenue"
			value={formatEuro(stats.revenue)}
			subtitle="total earned"
			icon={Euro}
			variant="small"
		/>

		<StatsCard
			title="Participants"
			value={stats.participants}
			subtitle="confirmed guests"
			icon={Users}
			variant="small"
		/>

		<StatsCard
			title="Cancelled"
			value={stats.cancelled}
			subtitle="cancelled bookings"
			icon={XCircle}
			variant="small"
		/>

		<StatsCard
			title="Completed"
			value={stats.completed}
			subtitle="finished tours"
			icon={UserCheck}
			variant="small"
		/>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
		<div class="flex flex-col lg:flex-row lg:items-center gap-4">
			<div class="flex items-center gap-2">
				<Filter class="h-5 w-5 text-gray-500" />
				<span class="text-sm font-medium text-gray-700">Filters:</span>
			</div>
			
			<div class="flex flex-wrap gap-4 flex-1">
				<!-- Status Filter -->
				<div class="flex flex-col">
					<label class="text-xs text-gray-600 mb-1">Status</label>
					<select bind:value={selectedStatus} class="form-select form-select--small">
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
					<label class="text-xs text-gray-600 mb-1">Date</label>
					<select bind:value={dateFilter} class="form-select form-select--small">
						<option value="all">All Dates</option>
						<option value="upcoming">Upcoming</option>
						<option value="today">Today</option>
						<option value="past">Past</option>
					</select>
				</div>

				<!-- Search -->
				<div class="flex flex-col flex-1 min-w-64">
					<label class="text-xs text-gray-600 mb-1">Search</label>
					<div class="relative">
						<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
						<input 
							type="text" 
							bind:value={searchQuery}
							placeholder="Search by name, email, reference..."
							class="form-input form-input--small pl-10"
						/>
					</div>
				</div>
			</div>

			<div class="text-sm text-gray-600">
				Showing {filteredBookings.length} of {stats.total} bookings
			</div>
		</div>
	</div>

	<!-- Bookings List -->
	{#if filteredBookings.length === 0}
		<div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
			<div class="max-w-md mx-auto">
				<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<Calendar class="h-8 w-8 text-gray-400" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">
					{selectedStatus === 'all' && searchQuery === '' && dateFilter === 'all' 
						? 'No bookings yet' 
						: 'No bookings match your filters'}
				</h3>
				<p class="text-gray-600 mb-6">
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
				<div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
					<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
						<div class="flex-1">
							<div class="flex items-start justify-between mb-3">
								<div>
									<h3 class="text-lg font-semibold text-gray-900">{booking.customerName}</h3>
									<div class="flex items-center gap-2 mt-1 text-sm text-gray-600">
										<span>Ref: <code class="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">{booking.bookingReference}</code></span>
										<span>•</span>
										<span>{booking.customerEmail}</span>
										{#if booking.customerPhone}
											<span>•</span>
											<span>{booking.customerPhone}</span>
										{/if}
									</div>
								</div>
								<div class="flex items-center gap-2 flex-wrap">
									<!-- Booking Status Badge -->
									<span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full {
										booking.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
										booking.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
										booking.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
										booking.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
										'bg-gray-50 text-gray-700 border-gray-200'
									} border">
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
									<span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full {
										booking.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
										booking.paymentStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
										booking.paymentStatus === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
										booking.paymentStatus === 'refunded' ? 'bg-gray-50 text-gray-700 border-gray-200' :
										'bg-gray-50 text-gray-700 border-gray-200'
									} border">
										<span class="mr-0.5">💳</span>
										{booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
									</span>

									<!-- Attendance Status Badge (for confirmed bookings) -->
									{#if booking.status === 'confirmed' && booking.paymentStatus === 'paid'}
										<span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full {
											booking.attendanceStatus === 'checked_in' ? 'bg-blue-50 text-blue-700 border-blue-200' :
											booking.attendanceStatus === 'no_show' ? 'bg-gray-50 text-gray-700 border-gray-200' :
											'bg-purple-50 text-purple-700 border-purple-200'
										} border">
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
								<p class="text-xs text-gray-500 mt-2">
									Checked in: {new Date(booking.checkedInAt).toLocaleString('en-US', {
										month: 'short',
										day: 'numeric',
										hour: 'numeric',
										minute: '2-digit',
										hour12: true
									})}
								</p>
							{/if}

							<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
								<div class="p-3 bg-gray-50 rounded-lg">
									<Calendar class="h-4 w-4 text-gray-400 mx-auto mb-1" />
									<p class="text-sm font-semibold text-gray-900">
										{booking.expand?.timeSlot?.startTime ? 
											formatDate(booking.expand.timeSlot.startTime) : 
											formatDate(booking.created)}
									</p>
									<p class="text-xs text-gray-500">Date</p>
								</div>
								<div class="p-3 bg-gray-50 rounded-lg">
									<Clock class="h-4 w-4 text-gray-400 mx-auto mb-1" />
									<p class="text-sm font-semibold text-gray-900">
										{booking.expand?.timeSlot?.startTime ? 
											formatTime(booking.expand.timeSlot.startTime) : 
											'Not scheduled'}
									</p>
									<p class="text-xs text-gray-500">Time</p>
								</div>
								<div class="p-3 bg-gray-50 rounded-lg">
									<Users class="h-4 w-4 text-gray-400 mx-auto mb-1" />
									<p class="text-sm font-semibold text-gray-900">{booking.participants}</p>
									<p class="text-xs text-gray-500">Participants</p>
								</div>
								<div class="p-3 bg-gray-50 rounded-lg">
									<Euro class="h-4 w-4 text-gray-400 mx-auto mb-1" />
									<p class="text-sm font-semibold text-gray-900">{formatEuro(booking.totalAmount)}</p>
									<p class="text-xs text-gray-500">Amount</p>
								</div>
							</div>

							{#if booking.specialRequests}
								<div class="mt-3 p-3 bg-blue-50 rounded-lg">
									<p class="text-xs text-blue-700 font-medium mb-1">Special Requests:</p>
									<p class="text-sm text-blue-900">{booking.specialRequests}</p>
								</div>
							{/if}
						</div>

						<!-- Actions -->
						{#if booking.status === 'pending'}
							{@const confirmDisabled = isStatusActionDisabled(booking, 'confirmed') || isUpdatingStatus === booking.id}
							{@const confirmError = getStatusValidationError(booking, 'confirmed')}
							<div class="flex flex-col gap-2">
								<div class="relative">
									<button
										onclick={() => updateBookingStatus(booking.id, 'confirmed')}
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
									{#if confirmError && !isUpdatingStatus}
										<div class="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-3 py-1 text-xs text-white bg-gray-800 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
											{confirmError}
											<div class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
										</div>
									{/if}
								</div>
								
								<button
									onclick={() => updateBookingStatus(booking.id, 'cancelled')}
									disabled={isUpdatingStatus === booking.id}
									class="button-secondary button--gap button--small text-red-600 hover:bg-red-50"
								>
									{#if isUpdatingStatus === booking.id}
										<div class="form-spinner"></div>
									{:else}
										<XCircle class="h-4 w-4" />
									{/if}
									Cancel
								</button>
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
									<button
										onclick={() => updateBookingStatus(booking.id, 'completed')}
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
									{#if completeError && !isUpdatingStatus}
										<div class="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-3 py-1 text-xs text-white bg-gray-800 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
											{completeError}
											<div class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
										</div>
									{/if}
								</div>
								
								<button
									onclick={() => updateBookingStatus(booking.id, 'no_show')}
									disabled={isUpdatingStatus === booking.id}
									class="button-secondary button--gap button--small text-orange-600 hover:bg-orange-50"
								>
									{#if isUpdatingStatus === booking.id}
										<div class="form-spinner"></div>
									{:else}
										<AlertCircle class="h-4 w-4" />
									{/if}
									No Show
								</button>
							</div>
						{:else if booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'no_show'}
							<div class="flex flex-col gap-2">
								<div class="text-center text-sm text-gray-500 py-2">
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