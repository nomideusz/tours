<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';
	import { getDisplayReference } from '$lib/ticket-qr.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import { formatTourOwnerCurrency } from '$lib/utils/currency.js';
	import { formatParticipantDisplay } from '$lib/utils/participant-display.js';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Phone from 'lucide-svelte/icons/phone';
	import Mail from 'lucide-svelte/icons/mail';
	import User from 'lucide-svelte/icons/user';
	import Ticket from 'lucide-svelte/icons/ticket';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import UserX from 'lucide-svelte/icons/user-x';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	
	let { data, form }: { data: PageData; form: ActionData | null } = $props();
	
	let isSubmitting = $state(false);
	let showNoShowModal = $state(false);
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}
	
	function formatTime(dateString: string) {
		return new Date(dateString).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}
	
	function formatDateTime(dateString: string) {
		return new Date(dateString).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}
	
	function getStatusInfo(attendanceStatus: string) {
		switch (attendanceStatus) {
			case 'checked_in':
				return {
					icon: CheckCircle,
					text: 'Checked In',
					class: 'status-confirmed',
					iconClass: ''
				};
			case 'no_show':
				return {
					icon: XCircle,
					text: 'No Show',
					class: 'status-cancelled',
					iconClass: ''
				};
			default:
				return {
					icon: AlertCircle,
					text: 'Ready for Check-in',
					class: 'status-pending',
					iconClass: ''
				};
		}
	}
	
	let statusInfo = $derived(getStatusInfo(data.booking.attendanceStatus || 'not_arrived'));
	let isCheckedIn = $derived(data.booking.attendanceStatus === 'checked_in');
	let isNoShow = $derived(data.booking.attendanceStatus === 'no_show');
	let canTakeAction = $derived(!isCheckedIn && !isNoShow);
</script>

<svelte:head>
	<title>Check-in: {data.booking.customerName} - {data.booking.expand?.tour?.name}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
</svelte:head>

<div class="checkin-container">
	<!-- Mobile-optimized Header -->
	<div class="sticky top-0 z-10 mobile-header">
		<div class="px-4 py-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<a href="/checkin-scanner" class="mobile-header-link">
						<ArrowLeft class="w-5 h-5" />
					</a>
					<div>
						<h1 class="text-lg font-semibold mobile-header-title">Check-in</h1>
						<p class="text-xs mobile-header-subtitle">{data.booking.expand?.tour?.name}</p>
					</div>
				</div>
				<a href="/checkin-scanner" class="mobile-header-link">
					<QrCode class="w-5 h-5" />
				</a>
			</div>
		</div>
	</div>

	<div class="checkin-content">
		<!-- Status Card -->
		<div class="mb-4 rounded-xl overflow-hidden shadow-sm" style="background: var(--bg-primary);">
			<div class="p-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="status-icon-wrapper {statusInfo.class}">
							<statusInfo.icon class="w-6 h-6" />
						</div>
						<div>
							<p class="font-medium text-lg" style="color: var(--text-primary);">{statusInfo.text}</p>
							{#if isCheckedIn && data.booking.checkedInAt}
								<p class="text-xs" style="color: var(--text-secondary);">
									{formatDateTime(data.booking.checkedInAt)}
								</p>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>

		{#if form?.success}
			<div class="mb-4 rounded-xl px-4 py-3 shadow-sm alert-success">
				<div class="flex items-center gap-2">
					<CheckCircle class="w-5 h-5 flex-shrink-0" />
					<span class="font-medium">
						{#if form.noShow}
							Customer marked as no-show
						{:else}
							Customer checked in successfully!
						{/if}
					</span>
				</div>
			</div>
		{/if}

		{#if form?.error}
			<div class="mb-4 rounded-xl px-4 py-3 shadow-sm alert-error">
				<div class="flex items-center gap-2">
					<AlertCircle class="w-5 h-5 flex-shrink-0" />
					<span class="font-medium">{form.error}</span>
				</div>
			</div>
		{/if}

		<!-- Customer Card -->
		<div class="mb-4 rounded-xl overflow-hidden shadow-sm" style="background: var(--bg-primary);">
			<div class="p-4">
				<h2 class="text-base font-semibold mb-4 flex items-center gap-2" style="color: var(--text-primary);">
					<User class="w-4 h-4" style="color: var(--color-primary-600);" />
					Customer Details
				</h2>
				
				<!-- Customer Name - Most Prominent -->
				<div class="mb-4 p-3 rounded-lg info-box">
					<p class="text-xl font-bold" style="color: var(--text-primary);">{data.booking.customerName}</p>
					<p class="text-sm mt-1" style="color: var(--text-secondary);">
						{formatParticipantDisplay(data.booking)}
					</p>
				</div>

				<div class="space-y-3">
					<div class="flex items-center gap-3">
						<Mail class="w-4 h-4" style="color: var(--text-tertiary);" />
						<p class="text-sm" style="color: var(--text-primary);">{data.booking.customerEmail}</p>
					</div>
					
					{#if data.booking.customerPhone}
						<div class="flex items-center gap-3">
							<Phone class="w-4 h-4" style="color: var(--text-tertiary);" />
							<p class="text-sm" style="color: var(--text-primary);">{data.booking.customerPhone}</p>
						</div>
					{/if}
					
					<div class="flex items-center gap-3">
						<Ticket class="w-4 h-4" style="color: var(--text-tertiary);" />
						<p class="text-sm" style="color: var(--text-primary);">{data.booking.bookingReference}</p>
					</div>
				</div>
				
				{#if data.booking.specialRequests}
					<div class="mt-4 p-3 rounded-lg alert-warning">
						<h3 class="font-medium text-sm mb-1">Special Requests</h3>
						<p class="text-sm">{data.booking.specialRequests}</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Tour Details Card -->
		<div class="mb-4 rounded-xl overflow-hidden shadow-sm" style="background: var(--bg-primary);">
			<div class="p-4">
				<h2 class="text-base font-semibold mb-4 flex items-center gap-2" style="color: var(--text-primary);">
					<Calendar class="w-4 h-4" style="color: var(--color-primary-600);" />
					Tour Information
				</h2>
				
				<div class="space-y-3">
					{#if data.booking.expand?.timeSlot?.startTime}
						<div class="p-3 rounded-lg info-box">
							<p class="text-sm font-medium mb-1" style="color: var(--text-primary);">
								{formatDate(data.booking.expand.timeSlot.startTime)}
							</p>
							<p class="text-lg font-bold time-display">
								{formatSlotTimeRange(data.booking.expand.timeSlot.startTime, data.booking.expand.timeSlot.endTime)}
							</p>
						</div>
					{/if}
					
					{#if data.booking.expand?.tour?.location}
						<div class="flex items-start gap-3">
							<MapPin class="w-4 h-4 mt-0.5" style="color: var(--text-tertiary);" />
							<div class="flex-1">
								<p class="text-xs font-medium mb-0.5" style="color: var(--text-secondary);">Meeting Point</p>
								<p class="text-sm" style="color: var(--text-primary);">{data.booking.expand?.tour?.location}</p>
							</div>
						</div>
					{/if}
					
					<div class="flex items-center gap-3">
						<DollarSign class="w-4 h-4" style="color: var(--text-tertiary);" />
						<div class="flex-1">
							<p class="text-xs font-medium mb-0.5" style="color: var(--text-secondary);">Total Amount</p>
							<p class="text-sm font-semibold" style="color: var(--text-primary);">
								{formatTourOwnerCurrency(data.booking.totalAmount, data.tourOwnerCurrency)}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Fixed Bottom Action Area -->
	{#if canTakeAction}
		<div class="checkin-actions checkin-actions--active">
			<div class="max-w-2xl mx-auto">
				<!-- Check In Button - Primary Action -->
				<form method="POST" action="?/checkin" use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						isSubmitting = false;
						await update();
					};
				}}>
					<button
						type="submit"
						disabled={isSubmitting}
						class="w-full button-success button-gap button-large justify-center font-semibold shadow-lg"
					>
						{#if isSubmitting}
							<div class="form-spinner"></div>
							Processing...
						{:else}
							<CheckCircle class="w-6 h-6" />
							Check In Customer
						{/if}
					</button>
				</form>
				
				<!-- Secondary Actions -->
				<div class="mt-2 flex gap-2">
					<button
						onclick={() => showNoShowModal = true}
						disabled={isSubmitting}
						class="flex-1 button-danger button-small"
					>
						<UserX class="w-4 h-4 mr-1" />
						No Show
					</button>
					<a href="/checkin-scanner" class="flex-1 button-secondary button-small text-center">
						<QrCode class="w-4 h-4 mr-1 inline" />
						Scan Next
					</a>
				</div>
			</div>
		</div>
	{:else}
		<!-- Already Processed State -->
		<div class="checkin-actions checkin-actions--completed">
			<div class="max-w-2xl mx-auto">
				<div class="p-4 rounded-xl text-center badge badge-lg {statusInfo.class}">
					<statusInfo.icon class="w-12 h-12 mx-auto mb-2" />
					<h3 class="text-lg font-semibold mb-1">
						{#if isCheckedIn}
							Already Checked In
						{:else}
							Marked as No Show
						{/if}
					</h3>
					{#if isCheckedIn && data.booking.checkedInAt}
						<p class="text-sm opacity-75">
							{formatDateTime(data.booking.checkedInAt)}
						</p>
					{/if}
				</div>
				<a href="/checkin-scanner" class="w-full button-primary button-gap mt-3 text-center">
					<QrCode class="w-5 h-5 inline" />
					Scan Next Ticket
				</a>
			</div>
		</div>
	{/if}
</div>

<!-- No Show Confirmation Modal -->
<ConfirmationModal
	isOpen={showNoShowModal}
	title="Mark as No Show?"
	message="Are you sure you want to mark {data.booking.customerName} as a no-show? This action cannot be undone."
	confirmText="Yes, Mark as No Show"
	cancelText="Cancel"
	variant="danger"
	icon={UserX}
	onConfirm={() => {
		showNoShowModal = false;
		const form = document.getElementById('noshow-form') as HTMLFormElement;
		form?.requestSubmit();
	}}
	onCancel={() => showNoShowModal = false}
	onClose={() => showNoShowModal = false}
/>

<!-- Hidden No Show Form -->
<form id="noshow-form" method="POST" action="?/noshow" class="hidden" use:enhance={() => {
	isSubmitting = true;
	return async ({ update }) => {
		isSubmitting = false;
		await update();
	};
}}></form>

<style>
	/* Container setup for proper scrolling */
	.checkin-container {
		min-height: 100vh;
		background: var(--bg-secondary);
		display: flex;
		flex-direction: column;
	}
	
	/* Scrollable content area */
	.checkin-content {
		flex: 1;
		max-width: 42rem;
		margin: 0 auto;
		width: 100%;
		padding: 1rem 1rem 0;
		overflow-y: auto;
		/* Add padding bottom to account for fixed action area height */
		padding-bottom: 200px; /* Adjust based on actual action area height */
	}
	
	/* Mobile header styling */
	.mobile-header {
		background: linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-700) 100%);
		color: white;
	}
	
	.mobile-header-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		transition: all 0.2s;
	}
	
	.mobile-header-link:hover {
		background: rgba(255, 255, 255, 0.2);
	}
	
	.mobile-header-title {
		color: white;
	}
	
	.mobile-header-subtitle {
		color: rgba(255, 255, 255, 0.7);
	}
	
	/* Info box styling */
	.info-box {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
	}
	
	/* Time display using primary color */
	.time-display {
		color: var(--color-primary-600);
	}
	
	/* Custom status icon wrapper sizing for this page */
	.status-icon-wrapper {
		width: 2.5rem;
		height: 2.5rem;
	}
	
	/* Fixed bottom action area */
	.checkin-actions {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--bg-primary);
		border-top: 1px solid var(--border-primary);
		box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
		padding: 0.5rem 1rem 1rem;
		z-index: 10;
		/* Add backdrop blur for better visibility on scroll */
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}
	
	/* Different padding for active vs completed states */
	.checkin-actions--active {
		/* Approximate height: button + secondary actions + padding */
		min-height: 140px;
	}
	
	.checkin-actions--completed {
		/* Approximate height: status badge + scan next button + padding */
		min-height: 180px;
	}
	
	/* Page-specific badge overrides for large status display */
	.badge.badge-lg {
		padding: 1rem;
		font-size: 1rem;
		width: 100%;
		display: block;
		border-radius: 0.75rem;
	}
	
	/* Responsive adjustments for very small screens */
	@media (max-height: 600px) {
		.checkin-content {
			padding-bottom: 160px;
		}
		
		.checkin-actions--active {
			min-height: 120px;
		}
		
		.checkin-actions--completed {
			min-height: 160px;
		}
	}
</style> 