<!--
Stripe Fee Selector Component
Lets tour guide decide who pays the Stripe processing fee
-->

<script lang="ts">
	import { calculateAllInPricing, STRIPE_FEES } from '$lib/utils/pricing-calculations.js';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	
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
	
	let isExpanded = $state(false);
	
	// Calculate what guide receives in each scenario
	let pricing = $derived(calculateAllInPricing(basePrice, currency));
	let fees = $derived(STRIPE_FEES[currency as keyof typeof STRIPE_FEES] || STRIPE_FEES.DEFAULT);
	
	// If guide pays, they receive less. If customer pays, guide gets full amount
	let guideReceivesIfGuidePays = $derived(basePrice - pricing.stripeFee);
	let guideReceivesIfCustomerPays = $derived(basePrice);
	let customerPaysIfGuidePays = $derived(basePrice);
	let customerPaysIfCustomerPays = $derived(pricing.totalPrice);
	
	// Summary text based on selection
	let summaryText = $derived(
		guidePaysStripeFee 
			? `You absorb ${currencySymbol}${pricing.stripeFee.toFixed(2)} fee • Receive ${currencySymbol}${guideReceivesIfGuidePays.toFixed(2)}`
			: `Customer pays ${currencySymbol}${pricing.stripeFee.toFixed(2)} fee • You receive ${currencySymbol}${guideReceivesIfCustomerPays.toFixed(2)}`
	);
</script>

<div class="stripe-fee-selector">
	<!-- Compact Header (Always Visible) -->
	<button
		type="button"
		class="selector-toggle"
		onclick={() => isExpanded = !isExpanded}
		aria-expanded={isExpanded}
	>
		<div class="toggle-left">
			<CreditCard class="toggle-icon" />
			<div class="toggle-content">
				<h4>Payment Processing Fee</h4>
				<p class="summary-text">{summaryText}</p>
			</div>
		</div>
		<ChevronDown class="chevron {isExpanded ? 'expanded' : ''}" />
	</button>
	
	<!-- Expandable Content -->
	{#if isExpanded}
		<div class="selector-content">
			<p class="help-text">Stripe charges {fees.percentage}% + {currencySymbol}{fees.fixed.toFixed(2)} per transaction</p>
			
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
		</div>
	{/if}
</div>

<style>
	.stripe-fee-selector {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		transition: all 0.2s ease;
	}
	
	.stripe-fee-selector:hover {
		border-color: var(--border-secondary);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	
	.selector-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
	}
	
	.toggle-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}
	
	:global(.toggle-icon) {
		width: 1rem;
		height: 1rem;
		color: var(--text-secondary);
		flex-shrink: 0;
	}
	
	.toggle-content {
		flex: 1;
		min-width: 0;
	}
	
	.selector-toggle h4 {
		margin: 0 0 0.125rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.summary-text {
		margin: 0;
		font-size: 0.75rem;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	:global(.chevron) {
		width: 1rem;
		height: 1rem;
		color: var(--text-tertiary);
		flex-shrink: 0;
		transition: transform 0.2s ease;
	}
	
	:global(.chevron.expanded) {
		transform: rotate(180deg);
	}
	
	.selector-content {
		padding: 1rem 0 0 0;
	}
	
	.help-text {
		margin: 0 0 1rem 0;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
	
	.options {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin: 0;
	}
	
	/* Stack on mobile */
	@media (max-width: 768px) {
		.options {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
	}
	
	.option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s ease;
		min-height: 100%;
	}
	
	.option:hover {
		border-color: var(--text-primary);
	}
	
	.option.selected {
		border-color: var(--color-accent-500);
		background: var(--bg-primary);
	}
	
	.option input[type="radio"] {
		margin-top: 0;
		vertical-align: middle;
		flex-shrink: 0;
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
	
	/* Mobile */
	@media (max-width: 640px) {
		.stripe-fee-selector {
			padding: 0.75rem;
		}
		
		.selector-toggle h4 {
			font-size: 0.8125rem;
		}
		
		.summary-text {
			font-size: 0.6875rem;
		}
		
		.selector-content {
			padding: 0.75rem 0 0 0;
		}
		
		.option {
			padding: 0.625rem;
		}
		
		.option-details {
			font-size: 0.6875rem;
		}
	}
</style>
