<script lang="ts">
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let {
		paymentStatus,
		onSetupPayments
	}: {
		paymentStatus: {
			isSetup: boolean;
			loading: boolean;
		};
		onSetupPayments: () => void;
	} = $props();
</script>

<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
	<div class="p-4 border-b" style="border-color: var(--border-primary);">
		<div class="flex items-center gap-3">
			<div class="p-2 rounded-lg" style="background: var(--color-success-light);">
				<DollarSign class="h-4 w-4" style="color: var(--color-success);" />
			</div>
			<div>
				<h3 class="font-semibold" style="color: var(--text-primary);">Payment Setup</h3>
				<p class="text-xs" style="color: var(--text-secondary);">Accept customer payments</p>
			</div>
		</div>
	</div>
	<div class="p-4">
		{#if paymentStatus.loading}
			<div class="flex justify-center py-4">
				<LoadingSpinner size="small" />
			</div>
		{:else}
			<div class="space-y-4">
				<!-- Account Status -->
				<div class="flex items-start gap-3 p-3 rounded-lg" style="background: var(--bg-secondary);">
					{#if paymentStatus.isSetup}
						<CheckCircle class="h-4 w-4 mt-0.5" style="color: var(--color-success);" />
						<div>
							<p class="text-sm font-medium" style="color: var(--text-primary);">Active</p>
							<p class="text-xs" style="color: var(--text-secondary);">Ready to accept payments</p>
						</div>
					{:else}
						<CreditCard class="h-4 w-4 mt-0.5" style="color: var(--text-tertiary);" />
						<div>
							<p class="text-sm font-medium" style="color: var(--text-primary);">Not set up</p>
							<p class="text-xs" style="color: var(--text-secondary);">Set up payment account</p>
						</div>
					{/if}
				</div>

				<!-- Setup Button -->
				<div class="flex justify-center">
					{#if !paymentStatus.isSetup}
						<button
							onclick={onSetupPayments}
							class="button-primary button--gap button--small"
						>
							<CreditCard class="h-3 w-3" />
							Setup Payments
						</button>
					{:else}
						<button
							onclick={onSetupPayments}
							class="button-secondary button--gap button--small"
						>
							<CreditCard class="h-3 w-3" />
							Manage Account
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div> 