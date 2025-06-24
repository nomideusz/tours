<script lang="ts">
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let {
		paymentStatus,
		onSetupPayments,
		isSettingUpPayment = false,
		error = null
	}: {
		paymentStatus: {
			isSetup: boolean;
			loading: boolean;
		};
		onSetupPayments: () => void;
		isSettingUpPayment?: boolean;
		error?: string | null;
	} = $props();
</script>

<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);" data-payment-setup-section>
	<div class="p-4 border-b" style="border-color: var(--border-primary);">
		<div class="flex items-center gap-3">
			<div class="p-2 rounded-lg" style="background: var(--color-success-100);">
				<DollarSign class="h-4 w-4" style="color: var(--color-success-600);" />
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
						<CheckCircle class="h-4 w-4 mt-0.5" style="color: var(--color-success-600);" />
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

				<!-- Error Message -->
				{#if error && !paymentStatus.isSetup}
					<div class="rounded-lg p-3 text-sm" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
						<div class="flex items-start gap-2">
							<AlertCircle class="h-4 w-4 mt-0.5 flex-shrink-0" style="color: var(--color-error-600);" />
							<p style="color: var(--color-error-700);">{error}</p>
						</div>
					</div>
				{/if}

				<!-- Setup Button -->
				<div class="flex justify-center">
					{#if !paymentStatus.isSetup}
						<button
							onclick={onSetupPayments}
							disabled={isSettingUpPayment}
							class="button-primary button--gap button--small"
						>
							{#if isSettingUpPayment}
								<span class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
								Setting up...
							{:else}
								<CreditCard class="h-3 w-3" />
								Setup Payments
							{/if}
						</button>
					{:else}
						<button
							onclick={onSetupPayments}
							disabled={isSettingUpPayment}
							class="button-secondary button--gap button--small"
						>
							{#if isSettingUpPayment}
								<span class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
								Loading...
							{:else}
								<CreditCard class="h-3 w-3" />
								Manage Account
							{/if}
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div> 