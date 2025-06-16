<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';
	import { getDisplayReference } from '$lib/ticket-qr.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import { formatTourOwnerCurrency } from '$lib/utils/currency.js';
	import { formatParticipantDisplay } from '$lib/utils/participant-display.js';
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
	
	let { data, form }: { data: PageData; form: ActionData | null } = $props();
	
	let isSubmitting = $state(false);
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
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
					class: 'bg-green-50 text-green-700 border-green-200',
					iconClass: 'text-green-600'
				};
			case 'no_show':
				return {
					icon: XCircle,
					text: 'No Show',
					class: 'bg-red-50 text-red-700 border-red-200',
					iconClass: 'text-red-600'
				};
			default:
				return {
					icon: AlertCircle,
					text: 'Awaiting Check-in',
					class: 'bg-amber-50 text-amber-700 border-amber-200',
					iconClass: 'text-amber-600'
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

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<div class="max-w-2xl mx-auto">
		<!-- Header -->
		<div class="rounded-xl overflow-hidden mb-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="px-6 py-6 text-white" style="background: var(--color-primary-600);">
				<div class="flex items-center gap-3 mb-3">
					<div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
						<UserCheck class="w-6 h-6" />
					</div>
					<div>
						<h1 class="text-xl font-bold">Customer Check-in</h1>
						<p class="text-white/80 text-sm">{data.booking.expand?.tour?.name}</p>
					</div>
				</div>
				
				<!-- Status Badge -->
				<div class="flex items-center gap-2">
					<span class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full bg-white/20 text-white">
						<statusInfo.icon class="w-4 h-4" />
						{statusInfo.text}
					</span>
				</div>
			</div>
			
			{#if form?.success}
				<div class="px-6 py-4 border-b" style="background: var(--color-success-50); border-color: var(--color-success-200);">
					<div class="flex items-center gap-2" style="color: var(--color-success-800);">
						<CheckCircle class="w-5 h-5" />
						<span class="font-medium">
							{#if form.noShow}
								Customer marked as no-show
							{:else}
								Customer checked in successfully!
							{/if}
						</span>
					</div>
					{#if form.checkedInAt}
						<p class="text-sm mt-1" style="color: var(--color-success-600);">
							Checked in at {formatDateTime(form.checkedInAt)}
						</p>
					{/if}
				</div>
			{/if}
			
			{#if form?.error}
				<div class="px-6 py-4 border-b" style="background: var(--color-danger-50); border-color: var(--color-danger-200);">
					<div class="flex items-center gap-2" style="color: var(--color-danger-800);">
						<AlertCircle class="w-5 h-5" />
						<span class="font-medium">{form.error}</span>
					</div>
				</div>
			{/if}
		</div>
		
		<!-- Customer Information -->
		<div class="rounded-xl overflow-hidden mb-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="px-6 py-4 border-b" style="border-color: var(--border-primary);">
				<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Customer Information</h2>
			</div>
			
			<div class="px-6 py-6">
				<div class="grid gap-4">
					<div class="flex items-center gap-3">
						<User class="w-5 h-5" style="color: var(--text-tertiary);" />
						<div>
							<p class="font-semibold text-lg" style="color: var(--text-primary);">{data.booking.customerName}</p>
							<p class="text-sm" style="color: var(--text-secondary);">Primary contact</p>
						</div>
					</div>
					
					<div class="flex items-center gap-3">
						<Mail class="w-5 h-5" style="color: var(--text-tertiary);" />
						<div>
							<p class="font-medium" style="color: var(--text-primary);">{data.booking.customerEmail}</p>
							<p class="text-sm" style="color: var(--text-secondary);">Email address</p>
						</div>
					</div>
					
					{#if data.booking.customerPhone}
						<div class="flex items-center gap-3">
							<Phone class="w-5 h-5" style="color: var(--text-tertiary);" />
							<div>
								<p class="font-medium" style="color: var(--text-primary);">{data.booking.customerPhone}</p>
								<p class="text-sm" style="color: var(--text-secondary);">Phone number</p>
							</div>
						</div>
					{/if}
					
					<div class="flex items-center gap-3">
						<Users class="w-5 h-5" style="color: var(--text-tertiary);" />
						<div>
							<p class="font-medium" style="color: var(--text-primary);">
								{formatParticipantDisplay(data.booking)}
							</p>
							<p class="text-sm" style="color: var(--text-secondary);">Group size</p>
						</div>
					</div>
					
					<div class="flex items-center gap-3">
						<Ticket class="w-5 h-5" style="color: var(--text-tertiary);" />
						<div>
							<p class="font-medium" style="color: var(--text-primary);">{data.booking.bookingReference}</p>
							<p class="text-sm" style="color: var(--text-secondary);">Booking reference</p>
						</div>
					</div>
				</div>
				
				{#if data.booking.specialRequests}
					<div class="mt-6 p-4 rounded-lg" style="background: var(--color-primary-50);">
						<h3 class="font-medium mb-2" style="color: var(--color-primary-900);">Special Requests</h3>
						<p class="text-sm" style="color: var(--color-primary-800);">{data.booking.specialRequests}</p>
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Tour Details -->
		<div class="rounded-xl overflow-hidden mb-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="px-6 py-4 border-b" style="border-color: var(--border-primary);">
				<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Tour Details</h2>
			</div>
			
			<div class="px-6 py-6">
				<div class="grid gap-4">
					<div class="flex items-center gap-3">
						<Calendar class="w-5 h-5" style="color: var(--text-tertiary);" />
						<div>
							<p class="font-medium" style="color: var(--text-primary);">
								{data.booking.expand?.timeSlot?.startTime ? formatDate(data.booking.expand.timeSlot.startTime) : 'Date TBD'}
							</p>
							<p class="text-sm" style="color: var(--text-secondary);">
								{data.booking.expand?.timeSlot?.startTime && data.booking.expand?.timeSlot?.endTime 
									? formatSlotTimeRange(data.booking.expand.timeSlot.startTime, data.booking.expand.timeSlot.endTime)
									: 'Time TBD'
								}
							</p>
						</div>
					</div>
					
					{#if data.booking.expand?.tour?.location}
						<div class="flex items-start gap-3">
							<MapPin class="w-5 h-5 mt-1" style="color: var(--text-tertiary);" />
							<div>
								<p class="font-medium" style="color: var(--text-primary);">Meeting Point</p>
								<p class="text-sm" style="color: var(--text-secondary);">{data.booking.expand?.tour?.location}</p>
							</div>
						</div>
					{/if}
					
					<div class="flex items-center gap-3">
						<DollarSign class="w-5 h-5" style="color: var(--text-tertiary);" />
						<div>
							<p class="font-medium" style="color: var(--text-primary);">{formatTourOwnerCurrency(data.booking.totalAmount)}</p>
							<p class="text-sm" style="color: var(--text-secondary);">Total amount paid</p>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Check-in Actions -->
		{#if canTakeAction}
			<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="px-6 py-4 border-b" style="border-color: var(--border-primary);">
					<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Check-in Actions</h2>
					<p class="text-sm mt-1" style="color: var(--text-secondary);">Mark the customer's attendance status</p>
				</div>
				
				<div class="px-6 py-6">
					<div class="grid gap-4">
						<!-- Check In Button -->
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
								class="w-full button-primary button--gap justify-center py-4 text-base"
							>
								{#if isSubmitting}
									<div class="form-spinner"></div>
									Processing...
								{:else}
									<CheckCircle class="w-5 h-5" />
									Check In Customer
								{/if}
							</button>
						</form>
						
						<!-- No Show Button -->
						<form method="POST" action="?/noshow" use:enhance={() => {
							isSubmitting = true;
							return async ({ update }) => {
								isSubmitting = false;
								await update();
							};
						}}>
							<button
								type="submit"
								disabled={isSubmitting}
								class="w-full button-secondary button--gap justify-center py-3"
								style="color: var(--color-danger-600); border-color: var(--color-danger-200);"
							>
								{#if isSubmitting}
									<div class="form-spinner"></div>
									Processing...
								{:else}
									<UserX class="w-5 h-5" />
									Mark as No Show
								{/if}
							</button>
						</form>
					</div>
				</div>
			</div>
		{:else}
			<!-- Already Processed -->
			<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="px-6 py-6 text-center">
					<div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center {statusInfo.class}">
						<statusInfo.icon class="w-8 h-8 {statusInfo.iconClass}" />
					</div>
					<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">
						{#if isCheckedIn}
							Customer Checked In
						{:else}
							Customer Marked as No Show
						{/if}
					</h3>
					<p style="color: var(--text-secondary);">
						{#if isCheckedIn && data.booking.checkedInAt}
							Checked in at {formatDateTime(data.booking.checkedInAt)}
						{:else}
							This booking has been processed
						{/if}
					</p>
				</div>
			</div>
		{/if}
	</div>
</div> 