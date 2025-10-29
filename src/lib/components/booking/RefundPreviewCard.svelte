<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { cancelBookingMutation } from '$lib/queries/mutations.js';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Clock from 'lucide-svelte/icons/clock';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	
	interface Props {
		bookingId: string;
		onSuccess?: () => void;
	}
	
	let { bookingId, onSuccess }: Props = $props();
	
	// Fetch refund preview
	let refundQuery = $derived(createQuery({
		queryKey: ['refund-preview', bookingId],
		queryFn: async () => {
			const response = await fetch(`/api/bookings/${bookingId}/refund-preview`);
			if (!response.ok) throw new Error('Failed to fetch refund preview');
			return response.json();
		},
		refetchInterval: 60 * 1000, // Refresh every minute as time changes
		staleTime: 30 * 1000
	}));
	
	let refundData = $derived($refundQuery.data);
	let canCancel = $derived(refundData?.canCancel ?? true);
	
	// Cancel mutation
	const cancelMutation = cancelBookingMutation();
	
	let showCancelModal = $state(false);
	let cancelReason = $state<'weather' | 'illness' | 'emergency' | 'low_enrollment' | 'other'>('other');
	let customMessage = $state('');
	let error = $state<string | null>(null);
	
	async function handleCancel() {
		error = null;
		
		try {
			const result = await $cancelMutation.mutateAsync({
				bookingId,
				reason: cancelReason,
				customMessage: customMessage.trim() || undefined
			});
			
			if (result.success) {
				showCancelModal = false;
				onSuccess?.();
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to cancel booking';
		}
	}
</script>

{#if $refundQuery.isLoading}
	<div class="rounded-xl p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
		<div class="flex items-center gap-3">
			<Loader2 class="h-4 w-4 animate-spin" style="color: var(--text-tertiary);" />
			<span class="text-sm" style="color: var(--text-secondary);">Loading cancellation options...</span>
		</div>
	</div>
{:else if refundData && canCancel}
	<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="px-4 py-3 sm:px-6 sm:py-4" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
			<h3 class="font-semibold text-sm sm:text-base" style="color: var(--text-primary);">Cancellation & Refund</h3>
		</div>
		
		<div class="p-4 sm:p-6 space-y-4">
			<!-- Refund Preview -->
			{#if refundData.refund}
				<div class="p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
					<div class="flex items-start justify-between gap-4 mb-3">
						<div>
							<p class="text-sm font-semibold" style="color: var(--text-primary);">
								{refundData.refund.isRefundable ? 'Refund Available' : 'No Refund Available'}
							</p>
							<p class="text-xs mt-1" style="color: var(--text-secondary);">
								{refundData.refund.rule}
							</p>
						</div>
						{#if refundData.refund.isRefundable}
							<div class="text-right">
								<p class="text-lg font-bold" style="color: var(--color-success-600);">
									{refundData.refund.formattedAmount}
								</p>
								<p class="text-xs" style="color: var(--text-secondary);">
									{refundData.refund.percentage}% refund
								</p>
							</div>
						{/if}
					</div>
					
					<!-- Time until tour -->
					<div class="flex items-center gap-2 p-2 rounded" style="background: var(--bg-tertiary);">
						<Clock class="h-4 w-4" style="color: var(--text-secondary);" />
						<span class="text-xs" style="color: var(--text-secondary);">
							Tour starts in: <strong>{refundData.refund.timeUntilTour.formatted}</strong>
						</span>
					</div>
				</div>
			{/if}
			
			<!-- Cancel Button -->
			<button
				onclick={() => showCancelModal = true}
				class="button-danger w-full button-gap"
				disabled={$cancelMutation.isPending}
			>
				{#if $cancelMutation.isPending}
					<Loader2 class="h-4 w-4 animate-spin" />
					Cancelling...
				{:else}
					<XCircle class="h-4 w-4" />
					Cancel Booking
				{/if}
			</button>
		</div>
	</div>
{:else if refundData && !canCancel}
	<div class="rounded-xl p-4" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
		<div class="flex items-start gap-3">
			<AlertTriangle class="h-5 w-5 flex-shrink-0" style="color: var(--color-warning-600);" />
			<div>
				<p class="text-sm font-medium" style="color: var(--color-warning-900);">Cancellation Not Available</p>
				<p class="text-xs mt-1" style="color: var(--color-warning-700);">
					{refundData.reason || 'This booking cannot be cancelled at this time.'}
				</p>
			</div>
		</div>
	</div>
{/if}

<!-- Cancel Confirmation Modal -->
{#if showCancelModal}
	<div class="fixed inset-0 flex items-center justify-center p-4" style="z-index: 1000; background: rgba(0, 0, 0, 0.5);">
		<div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6" style="background: var(--bg-primary);">
			<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">
				Confirm Cancellation
			</h3>
			
			{#if error}
				<div class="mb-4 p-3 rounded-lg" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
					<p class="text-sm" style="color: var(--color-error-700);">{error}</p>
				</div>
			{/if}
			
			{#if refundData?.refund}
				<div class="mb-4 p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
					<p class="text-sm font-medium mb-2" style="color: var(--text-primary);">
						{refundData.refund.isRefundable ? 'Refund Details' : 'No Refund'}
					</p>
					{#if refundData.refund.isRefundable}
						<p class="text-2xl font-bold" style="color: var(--color-success-600);">
							{refundData.refund.formattedAmount}
						</p>
						<p class="text-xs mt-1" style="color: var(--text-secondary);">
							{refundData.refund.percentage}% refund • {refundData.refund.rule}
						</p>
					{:else}
						<p class="text-sm" style="color: var(--text-secondary);">
							{refundData.refund.rule}
						</p>
					{/if}
				</div>
			{/if}
			
			<!-- Reason -->
			<div class="mb-4">
				<label for="cancelReason" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
					Reason for Cancellation
				</label>
				<select id="cancelReason" bind:value={cancelReason} class="form-select w-full">
					<option value="weather">Weather</option>
					<option value="illness">Illness</option>
					<option value="emergency">Emergency</option>
					<option value="low_enrollment">Low Enrollment</option>
					<option value="other">Other</option>
				</select>
			</div>
			
			<!-- Optional Message -->
			<div class="mb-4">
				<label for="cancelMessage" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
					Message (Optional)
				</label>
				<textarea
					id="cancelMessage"
					bind:value={customMessage}
					rows="3"
					class="form-textarea w-full text-sm"
					placeholder="Add a note for the customer..."
				></textarea>
			</div>
			
			<!-- Actions -->
			<div class="flex gap-3">
				<button
					onclick={() => { showCancelModal = false; error = null; }}
					class="button-secondary flex-1"
					disabled={$cancelMutation.isPending}
				>
					Keep Booking
				</button>
				<button
					onclick={handleCancel}
					class="button-danger flex-1 button-gap"
					disabled={$cancelMutation.isPending}
				>
					{#if $cancelMutation.isPending}
						<Loader2 class="h-4 w-4 animate-spin" />
						Cancelling...
					{:else}
						<CheckCircle class="h-4 w-4" />
						Confirm Cancel
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

