<script lang="ts">
	import { formatDateTime } from '$lib/utils/date-helpers.js';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import Clock from 'lucide-svelte/icons/clock';
	import User from 'lucide-svelte/icons/user';
	import ReceiptText from 'lucide-svelte/icons/receipt-text';
	
	interface Props {
		booking: any;
		currency: string;
	}
	
	let { booking, currency }: Props = $props();
	
	let RefundIcon = $derived(
		booking.refundStatus === 'succeeded' ? CheckCircle :
		booking.refundStatus === 'failed' ? XCircle :
		Clock
	);
	
	let refundStatusColor = $derived(
		booking.refundStatus === 'succeeded' ? 'success' :
		booking.refundStatus === 'failed' ? 'error' :
		'warning'
	);
</script>

{#if booking.status === 'cancelled'}
	<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="px-4 py-3 sm:px-6 sm:py-4" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
			<h3 class="font-semibold text-sm sm:text-base flex items-center gap-2" style="color: var(--text-primary);">
				<XCircle class="h-5 w-5" style="color: var(--color-error-600);" />
				Cancellation Details
			</h3>
		</div>
		
		<div class="p-4 sm:p-6 space-y-4">
			<!-- Cancelled By -->
			{#if booking.cancelledBy}
				<div class="flex items-center gap-3">
					<div class="rounded-lg p-2 flex-shrink-0" style="background: var(--bg-secondary);">
						<User class="h-4 w-4" style="color: var(--text-secondary);" />
					</div>
					<div>
						<p class="text-xs font-medium" style="color: var(--text-secondary);">Cancelled By</p>
						<p class="text-sm font-semibold capitalize" style="color: var(--text-primary);">
							{booking.cancelledBy === 'guide' ? 'Tour Guide' : 'Customer'}
						</p>
					</div>
				</div>
			{/if}
			
			<!-- Cancellation Reason -->
			{#if booking.cancellationReason}
				<div class="flex items-center gap-3">
					<div class="rounded-lg p-2 flex-shrink-0" style="background: var(--bg-secondary);">
						<ReceiptText class="h-4 w-4" style="color: var(--text-secondary);" />
					</div>
					<div>
						<p class="text-xs font-medium" style="color: var(--text-secondary);">Reason</p>
						<p class="text-sm font-semibold capitalize" style="color: var(--text-primary);">
							{booking.cancellationReason.replace('_', ' ')}
						</p>
					</div>
				</div>
			{/if}
			
			<!-- Refund Information -->
			{#if booking.refundAmount || booking.refundPercentage !== undefined}
				<div class="p-4 rounded-lg" style="background: var(--color-{refundStatusColor}-50); border: 1px solid var(--color-{refundStatusColor}-200);">
					<div class="flex items-start justify-between gap-4 mb-2">
						<div class="flex items-center gap-2">
							<RefundIcon class="h-5 w-5" style="color: var(--color-{refundStatusColor}-600);" />
							<p class="font-semibold text-sm" style="color: var(--color-{refundStatusColor}-900);">
								{booking.refundStatus === 'succeeded' ? 'Refund Processed' : 
								 booking.refundStatus === 'failed' ? 'Refund Failed' :
								 'Refund Pending'}
							</p>
						</div>
						{#if booking.refundAmount && parseFloat(booking.refundAmount) > 0}
							<div class="text-right">
								<p class="text-lg font-bold" style="color: var(--color-{refundStatusColor}-700);">
									{currency}{parseFloat(booking.refundAmount).toFixed(2)}
								</p>
								{#if booking.refundPercentage !== undefined}
									<p class="text-xs" style="color: var(--color-{refundStatusColor}-600);">
										{booking.refundPercentage}% refund
									</p>
								{/if}
							</div>
						{/if}
					</div>
					
					{#if booking.refundId}
						<p class="text-xs font-mono mt-2" style="color: var(--color-{refundStatusColor}-700);">
							Refund ID: {booking.refundId}
						</p>
					{/if}
					
					{#if booking.refundProcessedAt}
						<p class="text-xs mt-1" style="color: var(--color-{refundStatusColor}-700);">
							Processed: {formatDateTime(booking.refundProcessedAt)}
						</p>
					{/if}
					
					{#if booking.refundStatus === 'succeeded'}
						<p class="text-xs mt-3" style="color: var(--color-success-700);">
							✅ Refund typically appears in customer's account within 5-10 business days
						</p>
					{:else if booking.refundStatus === 'failed'}
						<p class="text-xs mt-3" style="color: var(--color-error-700);">
							{booking.refundNotes || 'Automatic refund failed. Please process manually.'}
						</p>
					{:else if booking.refundAmount && parseFloat(booking.refundAmount) === 0}
						<p class="text-xs mt-3" style="color: var(--text-secondary);">
							No refund due per cancellation policy
						</p>
					{/if}
				</div>
			{:else}
				<!-- No refund info yet -->
				<div class="p-3 rounded-lg" style="background: var(--color-info-50); border: 1px solid var(--color-info-200);">
					<p class="text-xs" style="color: var(--color-info-800);">
						Booking was cancelled but refund information is not available.
					</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

