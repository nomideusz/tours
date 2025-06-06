<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';
	import { getDisplayReference } from '$lib/ticket-qr.js';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Users from 'lucide-svelte/icons/users';
	import Euro from 'lucide-svelte/icons/euro';
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

<div class="min-h-screen bg-gray-50">
	<div class="max-w-2xl mx-auto px-4 py-6">
		<!-- Header -->
		<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
			<div class="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-6 text-white">
				<div class="flex items-center gap-3 mb-3">
					<div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
						<UserCheck class="w-6 h-6" />
					</div>
					<div>
						<h1 class="text-xl font-bold">Customer Check-in</h1>
						<p class="text-indigo-100 text-sm">{data.booking.expand?.tour?.name}</p>
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
				<div class="px-6 py-4 bg-green-50 border-b border-green-200">
					<div class="flex items-center gap-2 text-green-800">
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
						<p class="text-sm text-green-600 mt-1">
							Checked in at {formatDateTime(form.checkedInAt)}
						</p>
					{/if}
				</div>
			{/if}
			
			{#if form?.error}
				<div class="px-6 py-4 bg-red-50 border-b border-red-200">
					<div class="flex items-center gap-2 text-red-800">
						<AlertCircle class="w-5 h-5" />
						<span class="font-medium">{form.error}</span>
					</div>
				</div>
			{/if}
		</div>
		
		<!-- Customer Information -->
		<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-lg font-semibold text-gray-900">Customer Information</h2>
			</div>
			
			<div class="px-6 py-6">
				<div class="grid gap-4">
					<div class="flex items-center gap-3">
						<User class="w-5 h-5 text-gray-400" />
						<div>
							<p class="font-semibold text-gray-900 text-lg">{data.booking.customerName}</p>
							<p class="text-sm text-gray-600">Primary contact</p>
						</div>
					</div>
					
					<div class="flex items-center gap-3">
						<Mail class="w-5 h-5 text-gray-400" />
						<div>
							<p class="font-medium text-gray-900">{data.booking.customerEmail}</p>
							<p class="text-sm text-gray-600">Email address</p>
						</div>
					</div>
					
					{#if data.booking.customerPhone}
						<div class="flex items-center gap-3">
							<Phone class="w-5 h-5 text-gray-400" />
							<div>
								<p class="font-medium text-gray-900">{data.booking.customerPhone}</p>
								<p class="text-sm text-gray-600">Phone number</p>
							</div>
						</div>
					{/if}
					
					<div class="flex items-center gap-3">
						<Users class="w-5 h-5 text-gray-400" />
						<div>
							<p class="font-medium text-gray-900">
								{data.booking.participants} {data.booking.participants === 1 ? 'participant' : 'participants'}
							</p>
							<p class="text-sm text-gray-600">Group size</p>
						</div>
					</div>
					
					<div class="flex items-center gap-3">
						<Ticket class="w-5 h-5 text-gray-400" />
						<div>
							<p class="font-medium text-gray-900">{data.booking.bookingReference}</p>
							<p class="text-sm text-gray-600">Booking reference</p>
						</div>
					</div>
				</div>
				
				{#if data.booking.specialRequests}
					<div class="mt-6 p-4 bg-blue-50 rounded-lg">
						<h3 class="font-medium text-blue-900 mb-2">Special Requests</h3>
						<p class="text-sm text-blue-800">{data.booking.specialRequests}</p>
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Tour Details -->
		<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-lg font-semibold text-gray-900">Tour Details</h2>
			</div>
			
			<div class="px-6 py-6">
				<div class="grid gap-4">
					<div class="flex items-center gap-3">
						<Calendar class="w-5 h-5 text-gray-400" />
						<div>
							<p class="font-medium text-gray-900">
								{data.booking.expand?.timeSlot?.startTime ? formatDate(data.booking.expand.timeSlot.startTime) : 'Date TBD'}
							</p>
							<p class="text-sm text-gray-600">
								{data.booking.expand?.timeSlot?.startTime && data.booking.expand?.timeSlot?.endTime 
									? `${formatTime(data.booking.expand.timeSlot.startTime)} - ${formatTime(data.booking.expand.timeSlot.endTime)}`
									: 'Time TBD'
								}
							</p>
						</div>
					</div>
					
					{#if data.booking.expand?.tour?.location}
						<div class="flex items-start gap-3">
							<MapPin class="w-5 h-5 text-gray-400 mt-1" />
							<div>
								<p class="font-medium text-gray-900">Meeting Point</p>
								<p class="text-sm text-gray-600">{data.booking.expand?.tour?.location}</p>
							</div>
						</div>
					{/if}
					
					<div class="flex items-center gap-3">
						<Euro class="w-5 h-5 text-gray-400" />
						<div>
							<p class="font-medium text-gray-900">€{data.booking.totalAmount}</p>
							<p class="text-sm text-gray-600">Total amount paid</p>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Check-in Actions -->
		{#if canTakeAction}
			<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
				<div class="px-6 py-4 border-b border-gray-200">
					<h2 class="text-lg font-semibold text-gray-900">Check-in Actions</h2>
					<p class="text-sm text-gray-600 mt-1">Mark the customer's attendance status</p>
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
								class="w-full button-secondary text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300 button--gap justify-center py-3"
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
			<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
				<div class="px-6 py-6 text-center">
					<div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center {statusInfo.class}">
						<statusInfo.icon class="w-8 h-8 {statusInfo.iconClass}" />
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-2">
						{#if isCheckedIn}
							Customer Checked In
						{:else}
							Customer Marked as No Show
						{/if}
					</h3>
					<p class="text-gray-600">
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