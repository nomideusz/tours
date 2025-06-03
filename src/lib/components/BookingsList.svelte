<script lang="ts">
	import type { Booking } from '$lib/types.js';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Euro from 'lucide-svelte/icons/euro';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	
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
	
	interface Props {
		bookings: ExpandedBooking[];
		showTourName?: boolean;
	}
	
	let { bookings, showTourName = true }: Props = $props();
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
		});
	}
	
	function formatTime(dateString: string) {
		return new Date(dateString).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		});
	}
	
	function getStatusIcon(status: string) {
		switch (status) {
			case 'confirmed':
				return CheckCircle;
			case 'cancelled':
				return XCircle;
			case 'pending':
				return AlertCircle;
			default:
				return HelpCircle;
		}
	}
	
	function getStatusColor(status: string) {
		switch (status) {
			case 'confirmed':
				return 'text-green-600';
			case 'cancelled':
				return 'text-red-600';
			case 'pending':
				return 'text-amber-600';
			default:
				return 'text-gray-600';
		}
	}
	
	function getPaymentBadge(paymentStatus: string) {
		switch (paymentStatus) {
			case 'paid':
				return { text: 'Paid', class: 'bg-green-100 text-green-800' };
			case 'pending':
				return { text: 'Pending', class: 'bg-amber-100 text-amber-800' };
			case 'failed':
				return { text: 'Failed', class: 'bg-red-100 text-red-800' };
			case 'refunded':
				return { text: 'Refunded', class: 'bg-gray-100 text-gray-800' };
			default:
				return { text: paymentStatus, class: 'bg-gray-100 text-gray-800' };
		}
	}
</script>

{#if bookings.length === 0}
	<div class="text-center py-12">
		<Calendar class="mx-auto h-12 w-12 text-gray-400" />
		<h3 class="mt-2 text-sm font-semibold text-gray-900">No bookings</h3>
		<p class="mt-1 text-sm text-gray-500">No bookings have been made yet.</p>
	</div>
{:else}
	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Booking
					</th>
					{#if showTourName}
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Tour
						</th>
					{/if}
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Date & Time
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Customer
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Amount
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Status
					</th>
					<th class="relative px-6 py-3">
						<span class="sr-only">Actions</span>
					</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#each bookings as booking}
					{@const StatusIcon = getStatusIcon(booking.status)}
					{@const statusColor = getStatusColor(booking.status)}
					{@const paymentBadge = getPaymentBadge(booking.paymentStatus)}
					
					<tr class="hover:bg-gray-50 cursor-pointer" onclick={() => window.location.href = `/bookings/${booking.id}`}>
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="text-sm font-medium text-gray-900">
								{booking.bookingReference}
							</div>
							<div class="text-xs text-gray-500">
								{new Date(booking.created).toLocaleDateString()}
							</div>
						</td>
						
						{#if showTourName}
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900">
									{booking.expand?.tour?.name || 'Unknown Tour'}
								</div>
							</td>
						{/if}
						
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="text-sm text-gray-900 flex items-center gap-1">
								<Calendar class="w-4 h-4 text-gray-400" />
								{formatDate(booking.expand?.timeSlot?.startTime || booking.created)}
							</div>
							<div class="text-xs text-gray-500 flex items-center gap-1 mt-1">
								<Clock class="w-3 h-3 text-gray-400" />
								{formatTime(booking.expand?.timeSlot?.startTime || booking.created)} - 
								{formatTime(booking.expand?.timeSlot?.endTime || booking.created)}
							</div>
						</td>
						
						<td class="px-6 py-4">
							<div class="text-sm text-gray-900">{booking.customerName}</div>
							<div class="text-xs text-gray-500">{booking.customerEmail}</div>
							{#if booking.customerPhone}
								<div class="text-xs text-gray-500">{booking.customerPhone}</div>
							{/if}
						</td>
						
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="text-sm font-medium text-gray-900 flex items-center gap-1">
								<Euro class="w-4 h-4 text-gray-400" />
								{booking.totalAmount}
							</div>
							<div class="text-xs text-gray-500 flex items-center gap-1">
								<Users class="w-3 h-3 text-gray-400" />
								{booking.participants} {booking.participants === 1 ? 'person' : 'people'}
							</div>
						</td>
						
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="flex items-center gap-2 mb-1">
								<StatusIcon class="w-4 h-4 {statusColor}" />
								<span class="text-sm font-medium {statusColor} capitalize">
									{booking.status}
								</span>
							</div>
							<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {paymentBadge.class}">
								{paymentBadge.text}
							</span>
						</td>
						
						<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
							<a 
								href="/bookings/{booking.id}" 
								class="text-blue-600 hover:text-blue-900 underline" 
								onclick={(e) => e.stopPropagation()}
							>
								View Details
							</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if} 