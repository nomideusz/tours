<script lang="ts">
	import { getTransferStatusMessage } from '$lib/payment-transfers-client.js';
	import { formatDateTime } from '$lib/utils/date-helpers.js';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Clock from 'lucide-svelte/icons/clock';
	import XCircle from 'lucide-svelte/icons/x-circle';
	
	interface Props {
		booking: any;
		currency: string;
	}
	
	let { booking, currency }: Props = $props();
	
	let transferInfo = $derived(getTransferStatusMessage(booking));
	
	let StatusIcon = $derived(
		booking.transferId && booking.transferStatus === 'completed' ? CheckCircle :
		booking.transferStatus === 'failed' ? XCircle :
		Clock
	);
</script>

{#if booking.paymentStatus === 'paid' && (booking.transferStatus || booking.transferScheduledFor)}
	<div class="rounded-xl p-4" style="background: var(--color-{booking.transferId ? 'success' : 'info'}-50); border: 1px solid var(--color-{booking.transferId ? 'success' : 'info'}-200);">
		<div class="flex items-start gap-3">
			{#if booking.transferId && booking.transferProcessedAt}
				<!-- Transferred -->
				<CheckCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-success-600);" />
				<div class="flex-1">
					<p class="font-semibold text-sm" style="color: var(--color-success-900);">
						{currency}{parseFloat(booking.totalAmount).toFixed(2)} transferred to your account
					</p>
					<p class="text-xs mt-1" style="color: var(--color-success-700);">
						{formatDateTime(booking.transferProcessedAt)} • Available for withdrawal
					</p>
				</div>
			{:else if booking.transferScheduledFor}
				<!-- Pending -->
				<Clock class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-info-600);" />
				<div class="flex-1">
					<p class="font-semibold text-sm" style="color: var(--color-info-900);">
						{currency}{parseFloat(booking.totalAmount).toFixed(2)} will transfer {transferInfo.text.toLowerCase()}
					</p>
					<p class="text-xs mt-1" style="color: var(--color-info-700);">
						Held on platform until cancellation window closes on {formatDateTime(booking.transferScheduledFor)}
					</p>
				</div>
			{:else if booking.transferStatus === 'failed'}
				<!-- Failed -->
				<XCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-error-600);" />
				<div class="flex-1">
					<p class="font-semibold text-sm" style="color: var(--color-error-900);">
						Transfer failed - contact support
					</p>
					<p class="text-xs mt-1" style="color: var(--color-error-700);">
						{booking.transferNotes || 'Please contact support to resolve this issue'}
					</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

