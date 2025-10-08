<!--
Stripe Fee Selector Component
Lets tour guide decide who pays the Stripe processing fee
-->

<script lang="ts">
	import { calculateAllInPricing, STRIPE_FEES } from '$lib/utils/pricing-calculations.js';
	
	interface Props {
		guidePaysStripeFee?: boolean;
		basePrice: number;
		currency?: string;
		currencySymbol?: string;
		onUpdate: (guidePaysStripeFee: boolean) => void;
	}
	
	let { 
		guidePaysStripeFee = $bindable(false),
		basePrice,
		currency = 'EUR',
		currencySymbol = '€',
		onUpdate
	}: Props = $props();
	
	// Calculate what guide receives in each scenario
	let pricing = $derived(calculateAllInPricing(basePrice, currency));
	let fees = $derived(STRIPE_FEES[currency as keyof typeof STRIPE_FEES] || STRIPE_FEES.DEFAULT);
	
	// If guide pays, they receive less. If customer pays, guide gets full amount
	let guideReceivesIfGuidePays = $derived(basePrice - pricing.stripeFee);
	let guideReceivesIfCustomerPays = $derived(basePrice);
	let customerPaysIfGuidePays = $derived(basePrice);
	let customerPaysIfCustomerPays = $derived(pricing.totalPrice);
</script>

<div class="stripe-fee-selector">
	<div class="selector-header">
		<h4>Payment Processing Fee</h4>
		<p class="help-text">Stripe charges {fees.percentage}% + {currencySymbol}{fees.fixed.toFixed(2)} per transaction</p>
	</div>
	
	<div class="options">
		<label class="option {!guidePaysStripeFee ? 'selected' : ''}">
			<input 
				type="radio" 
				name="stripeFee"
				checked={!guidePaysStripeFee}
				onchange={() => {
					guidePaysStripeFee = false;
					onUpdate(false);
				}}
			/>
			<div class="option-content">
				<div class="option-title">Customer pays fee (recommended)</div>
				<div class="option-details">
					<span class="detail">Customer pays: <strong>{currencySymbol}{customerPaysIfCustomerPays.toFixed(2)}</strong></span>
					<span class="detail success">You receive: <strong>{currencySymbol}{guideReceivesIfCustomerPays.toFixed(2)}</strong></span>
				</div>
			</div>
		</label>
		
		<label class="option {guidePaysStripeFee ? 'selected' : ''}">
			<input 
				type="radio" 
				name="stripeFee"
				checked={guidePaysStripeFee}
				onchange={() => {
					guidePaysStripeFee = true;
					onUpdate(true);
				}}
			/>
			<div class="option-content">
				<div class="option-title">I pay the fee</div>
				<div class="option-details">
					<span class="detail">Customer pays: <strong>{currencySymbol}{customerPaysIfGuidePays.toFixed(2)}</strong></span>
					<span class="detail">You receive: <strong>{currencySymbol}{guideReceivesIfGuidePays.toFixed(2)}</strong></span>
				</div>
			</div>
		</label>
	</div>
	
	<div class="note">
		Most platforms (Airbnb, GetYourGuide) pass fees to customers. This is transparent and standard practice.
	</div>
</div>

<style>
	.stripe-fee-selector {
		padding: 0.75rem 0;
	}
	
	.selector-header h4 {
		margin: 0 0 0.25rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.help-text {
		margin: 0;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
	
	.options {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0.75rem 0;
	}
	
	.option {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}
	
	.option:hover {
		border-color: var(--text-primary);
	}
	
	.option.selected {
		border-color: var(--color-primary-500);
		background: var(--bg-primary);
	}
	
	.option input[type="radio"] {
		margin-top: 0.125rem;
	}
	
	.option-content {
		flex: 1;
	}
	
	.option-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.375rem;
	}
	
	.option-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.detail {
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-family: monospace;
	}
	
	.detail.success {
		color: var(--color-success-700);
	}
	
	.note {
		padding: 0.5rem;
		background: var(--bg-tertiary);
		border-radius: 0.25rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	/* Mobile */
	@media (max-width: 640px) {
		.option {
			padding: 0.625rem;
		}
		
		.option-details {
			font-size: 0.6875rem;
		}
	}
</style>
