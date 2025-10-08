<!--
All-In Pricing Display Component
Shows transparent pricing with Stripe Express fees
Compliant with FTC, California SB 478, UK, and EU regulations
-->

<script lang="ts">
	interface Props {
		basePrice: number;
		currencySymbol?: string;
		currency?: string;
		showBreakdown?: boolean;
		compact?: boolean;
	}
	
	let { 
		basePrice, 
		currencySymbol = '€',
		currency = 'EUR',
		showBreakdown = true,
		compact = false
	}: Props = $props();
	
	// Stripe Express fees by currency
	// https://stripe.com/pricing
	const stripeFees = {
		EUR: { percentage: 1.5, fixed: 0.25 }, // EU: 1.5% + €0.25
		USD: { percentage: 2.9, fixed: 0.30 }, // US: 2.9% + $0.30
		GBP: { percentage: 1.5, fixed: 0.25 }, // UK: 1.5% + £0.25
		AUD: { percentage: 1.75, fixed: 0.30 }, // AU: 1.75% + A$0.30
		CAD: { percentage: 2.9, fixed: 0.30 }, // CA: 2.9% + C$0.30
		CHF: { percentage: 2.9, fixed: 0.30 }, // CH: 2.9% + CHF 0.30
		DKK: { percentage: 1.5, fixed: 1.80 }, // DK: 1.5% + kr1.80
		NOK: { percentage: 1.5, fixed: 1.80 }, // NO: 1.5% + kr1.80
		SEK: { percentage: 1.5, fixed: 1.80 }, // SE: 1.5% + kr1.80
		PLN: { percentage: 1.5, fixed: 1.00 }, // PL: 1.5% + zł1.00
		CZK: { percentage: 1.5, fixed: 6.00 }, // CZ: 1.5% + Kč6.00
		// Default for other currencies
		DEFAULT: { percentage: 2.9, fixed: 0.30 }
	};
	
	// Get fees for current currency
	let fees = $derived(stripeFees[currency as keyof typeof stripeFees] || stripeFees.DEFAULT);
	
	// Calculate Stripe processing fee
	let stripeFee = $derived(
		basePrice * (fees.percentage / 100) + fees.fixed
	);
	
	// Total price customer pays
	let totalPrice = $derived(basePrice + stripeFee);
	
	// What guide receives after Stripe fees
	let guideReceives = $derived(basePrice);
	
	// Format currency
	function formatPrice(amount: number): string {
		return `${currencySymbol}${amount.toFixed(2)}`;
	}
</script>

<div class="all-in-pricing {compact ? 'compact' : ''}">
	
	{#if showBreakdown && !compact}
		<div class="price-breakdown">
			<div class="line-item">
				<span>Tour Price</span>
				<span class="amount">{formatPrice(basePrice)}</span>
			</div>
			<div class="line-item fee">
				<span class="fee-label" title="Stripe Express: {fees.percentage}% + {currencySymbol}{fees.fixed}">
					Payment Processing
				</span>
				<span class="amount">{formatPrice(stripeFee)}</span>
			</div>
			<div class="divider"></div>
		</div>
	{/if}
	
	<div class="total-section">
		<div class="total-line">
			<span class="total-label">Total Price</span>
			<span class="total-amount">{formatPrice(totalPrice)}</span>
		</div>
		<p class="compliance-text">
			Final price · No hidden fees · No booking fees
		</p>
	</div>
	
	{#if !compact}
		<div class="guide-info">
			<div class="info-box">
				<p>
					Guide receives: <strong>{formatPrice(guideReceives)}</strong>
					<span class="no-commission">(Zaur: 0% commission)</span>
				</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.all-in-pricing {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.25rem;
		margin: 1rem 0;
	}
	
	.all-in-pricing.compact {
		padding: 0.75rem;
		margin: 0.5rem 0;
	}
	
	.price-breakdown {
		margin-bottom: 1rem;
	}
	
	.line-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		font-size: 0.875rem;
	}
	
	.line-item.fee {
		color: var(--text-secondary);
	}
	
	.fee-label {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	
	.info-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: help;
		color: var(--text-tertiary);
		display: inline-flex;
		align-items: center;
		transition: color 0.15s ease;
	}
	
	.info-btn:hover {
		color: var(--text-secondary);
	}
	
	.amount {
		font-weight: 500;
	}
	
	.divider {
		height: 1px;
		background: var(--border-primary);
		margin: 0.5rem 0;
	}
	
	.total-section {
		margin-bottom: 0.75rem;
	}
	
	.total-line {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}
	
	.total-label {
		font-weight: 600;
		font-size: 1rem;
		color: var(--text-primary);
	}
	
	.total-amount {
		font-weight: 700;
		font-size: 1.25rem;
		color: var(--color-primary-700);
	}
	
	.compliance-text {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin: 0;
		text-align: center;
	}
	
	.guide-info {
		margin-top: 0.75rem;
	}
	
	.info-box {
		padding: 0.5rem;
		background: var(--bg-tertiary);
		border-radius: 0.25rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
	
	.info-box p {
		margin: 0;
		flex: 1;
	}
	
	.no-commission {
		display: block;
		font-size: 0.75rem;
		color: var(--color-success-600);
		margin-top: 0.125rem;
	}
	
	/* Mobile responsive */
	@media (max-width: 640px) {
		.all-in-pricing {
			padding: 1rem;
		}
		
		.total-amount {
			font-size: 1.125rem;
		}
	}
</style>
