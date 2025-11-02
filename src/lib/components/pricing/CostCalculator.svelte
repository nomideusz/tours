<!--
Cost Calculator Component
Helps tour guides understand true costs and suggests fair pricing
Educational tool to prevent underpricing
-->

<script lang="ts">
	import { calculateSuggestedPrice, formatPrice, type CostFactors } from '$lib/utils/pricing-calculations.js';
	
	interface Props {
		duration: number;        // Tour duration in minutes
		capacity: number;        // Max participants
		currency?: string;
		currencySymbol?: string;
		onSuggestedPrice?: (price: number) => void;
	}
	
	let { 
		duration, 
		capacity,
		currency = 'EUR',
		currencySymbol = '€',
		onSuggestedPrice
	}: Props = $props();
	
	let showCalculator = $state(false);
	
	// Cost factors with sensible defaults
	let hourlyRate = $state(25);          // Tour guide hourly rate
	let prepTime = $state(60);            // Prep time in minutes
	let equipmentCost = $state(5);        // Per tour equipment cost
	let otherCosts = $state(10);          // Insurance, licenses per tour
	let targetOccupancy = $state(60);     // Expected occupancy %
	let profitMargin = $state(30);        // Desired profit margin %
	
	// Calculations
	let totalHours = $derived((duration + prepTime) / 60);
	let laborCost = $derived(totalHours * hourlyRate);
	let totalCosts = $derived(laborCost + equipmentCost + otherCosts);
	let expectedParticipants = $derived(capacity * (targetOccupancy / 100));
	let costPerPerson = $derived(totalCosts / Math.max(expectedParticipants, 1));
	
	// Get suggested price
	let suggestedPrice = $derived(() => {
		const factors: CostFactors = {
			hourlyRate,
			duration,
			prepTime,
			equipmentCost,
			otherCosts,
			targetOccupancy: targetOccupancy / 100,
			profitMargin: profitMargin / 100
		};
		return calculateSuggestedPrice(factors, capacity);
	});
	
	// Net income after Stripe fees (since Zaur takes no commission)
	let netIncome = $derived(() => {
		const price = suggestedPrice();
		const stripeFeeRate = currency === 'EUR' ? 0.015 : 0.029;
		const stripeFeeFixed = currency === 'EUR' ? 0.25 : 0.30;
		const stripeFee = price * stripeFeeRate + stripeFeeFixed;
		return price - stripeFee;
	});
	
	function useSuggestedPrice() {
		if (onSuggestedPrice) {
			onSuggestedPrice(suggestedPrice());
		}
		showCalculator = false;
	}
</script>

<div class="cost-calculator">
	<button 
		type="button"
		onclick={() => showCalculator = !showCalculator}
		class="calculator-toggle"
	>
		<span>{showCalculator ? '−' : '+'} Calculate Fair Price</span>
	</button>
	
	{#if showCalculator}
		<div class="calculator-panel">
			<div class="panel-header">
				<h4>Fair Pricing Calculator</h4>
				<p>Don't undersell yourself! Calculate pricing based on your true costs.</p>
			</div>
			
			<div class="calculator-sections">
				<!-- Labor Costs -->
				<div class="section">
					<h5>Time Investment</h5>
					<div class="inputs-grid">
						<label>
							<span>Your hourly rate</span>
							<div class="input-group">
								<span class="prefix">{currencySymbol}</span>
								<input 
									type="number" 
									bind:value={hourlyRate} 
									min="10" 
									max="200"
									step="5"
								/>
								<span class="suffix">/hour</span>
							</div>
						</label>
						
						<label>
							<span>Preparation time</span>
							<div class="input-group">
								<input 
									type="number" 
									bind:value={prepTime} 
									min="15" 
									max="240"
									step="15"
								/>
								<span class="suffix">minutes</span>
							</div>
						</label>
					</div>
					
					<div class="calculation-row">
						<span>Tour duration: {duration} min</span>
						<span>Total time: <strong>{totalHours.toFixed(1)} hours</strong></span>
					</div>
					<div class="calculation-row highlight">
						<span>Labor cost:</span>
						<span class="amount">{formatPrice(laborCost, currency)}</span>
					</div>
				</div>
				
				<!-- Fixed Costs -->
				<div class="section">
					<h5>Fixed Costs (per tour)</h5>
					<div class="inputs-grid">
						<label>
							<span>Equipment & supplies</span>
							<div class="input-group">
								<span class="prefix">{currencySymbol}</span>
								<input 
									type="number" 
									bind:value={equipmentCost} 
									min="0" 
									max="100"
									step="5"
								/>
							</div>
						</label>
						
						<label>
							<span>Insurance & licenses</span>
							<div class="input-group">
								<span class="prefix">{currencySymbol}</span>
								<input 
									type="number" 
									bind:value={otherCosts} 
									min="0" 
									max="100"
									step="5"
								/>
							</div>
						</label>
					</div>
					
					<div class="calculation-row highlight">
						<span>Total fixed costs:</span>
						<span class="amount">{formatPrice(equipmentCost + otherCosts, currency)}</span>
					</div>
				</div>
				
				<!-- Capacity Planning -->
				<div class="section">
					<h5>Capacity Planning</h5>
					<div class="inputs-grid">
						<label>
							<span>Expected occupancy</span>
							<div class="input-group">
								<input 
									type="number" 
									bind:value={targetOccupancy} 
									min="30" 
									max="100"
									step="10"
								/>
								<span class="suffix">%</span>
							</div>
							<span class="help-text">Industry average: 60-70%</span>
						</label>
						
						<label>
							<span>Profit margin</span>
							<div class="input-group">
								<input 
									type="number" 
									bind:value={profitMargin} 
									min="10" 
									max="100"
									step="10"
								/>
								<span class="suffix">%</span>
							</div>
							<span class="help-text">Recommended: 30-40%</span>
						</label>
					</div>
					
					<div class="calculation-row">
						<span>Max capacity: {capacity} people</span>
						<span>Expected: <strong>{expectedParticipants.toFixed(1)} people</strong></span>
					</div>
				</div>
				
				<!-- Results -->
				<div class="section results">
					<h5>Pricing Breakdown</h5>
					<div class="breakdown">
						<div class="breakdown-row">
							<span>Total costs</span>
							<span>{formatPrice(totalCosts, currency)}</span>
						</div>
						<div class="breakdown-row">
							<span>Cost per person</span>
							<span>{formatPrice(costPerPerson, currency)}</span>
						</div>
						<div class="breakdown-row">
							<span>+ Profit margin ({profitMargin}%)</span>
							<span>{formatPrice(costPerPerson * (profitMargin / 100), currency)}</span>
						</div>
						<div class="divider"></div>
						<div class="breakdown-row suggested">
							<span>Suggested price</span>
							<span class="price-large">{formatPrice(suggestedPrice(), currency)}</span>
						</div>
						<div class="breakdown-row net">
							<span>You receive (after Stripe)</span>
							<span class="net-amount">{formatPrice(netIncome(), currency)}</span>
						</div>
					</div>
					
					<div class="action-buttons">
						<button 
							type="button"
							onclick={useSuggestedPrice}
							class="use-price-btn"
						>
							Use {formatPrice(suggestedPrice(), currency)}
						</button>
					</div>
				</div>
				
				<!-- Important reminders -->
				<div class="reminders">
					<div class="reminder-text">
						<strong>Don't forget:</strong> Marketing costs, equipment maintenance, seasonal variations, and taxes.
						<br>
						<strong>Remember:</strong> Higher prices = perceived quality. Don't undervalue yourself!
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.cost-calculator {
		margin: 1rem 0;
	}
	
	.calculator-toggle {
		display: block;
		width: 100%;
		padding: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: color 0.15s ease;
	}
	
	.calculator-toggle:hover {
		color: var(--text-primary);
	}
	
	.calculator-panel {
		margin-top: 1rem;
		padding: 1.5rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
	}
	
	.panel-header {
		margin-bottom: 1.5rem;
	}
	
	.panel-header h4 {
		margin: 0 0 0.25rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.panel-header p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.calculator-sections {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.section {
		padding: 1rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.5rem;
	}
	
	.section h5 {
		margin: 0 0 1rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.inputs-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	
	label {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	
	label span {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
	}
	
	.help-text {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
		margin-top: -0.25rem;
	}
	
	.input-group {
		display: flex;
		align-items: center;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.375rem;
		overflow: hidden;
	}
	
	.input-group:focus-within {
		border-color: var(--color-accent-500);
		box-shadow: 0 0 0 3px var(--color-accent-100);
	}
	
	.prefix, .suffix {
		padding: 0 0.5rem;
		font-size: 0.8125rem;
		color: var(--text-tertiary);
		background: var(--bg-tertiary);
	}
	
	input {
		flex: 1;
		padding: 0.5rem;
		font-size: 0.875rem;
		border: none;
		background: transparent;
		text-align: center;
		appearance: textfield;
		-moz-appearance: textfield;
	}
	
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	
	.calculation-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		font-size: 0.8125rem;
		color: var(--text-secondary);
	}
	
	.calculation-row.highlight {
		padding-top: 0.75rem;
		border-top: 1px solid var(--border-secondary);
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.amount {
		font-weight: 600;
		color: var(--color-primary-700);
	}
	
	.results {
		background: var(--color-primary-50);
		border-color: var(--color-primary-200);
	}
	
	.breakdown {
		margin-bottom: 1rem;
	}
	
	.breakdown-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		font-size: 0.875rem;
	}
	
	.breakdown-row.suggested {
		padding-top: 0.75rem;
		font-weight: 600;
		color: var(--color-primary-800);
	}
	
	.breakdown-row.net {
		font-size: 0.8125rem;
		color: var(--color-success-700);
	}
	
	.price-large {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-primary-900);
	}
	
	.net-amount {
		font-weight: 600;
		color: var(--color-success-800);
	}
	
	.divider {
		height: 1px;
		background: var(--color-primary-200);
		margin: 0.5rem 0;
	}
	
	.action-buttons {
		display: flex;
		gap: 0.75rem;
	}
	
	.use-price-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: white;
		background: var(--color-primary-600);
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}
	
	.use-price-btn:hover {
		background: var(--color-primary-700);
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	
	.reminders {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 1rem;
	}
	
	.reminder-text {
		padding: 0.75rem;
		background: var(--bg-tertiary);
		border-radius: 0.375rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.inputs-grid {
			grid-template-columns: 1fr;
		}
		
		.calculator-panel {
			padding: 1rem;
		}
	}
</style>
