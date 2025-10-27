<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	
	// Calculator state
	let monthlyRevenue = $state(3000);
	let platformCommission = $state(20); // Default to 20%
	let isCalculating = $state(false);
	
	// Computed values
	let platformTakes = $derived(monthlyRevenue * (platformCommission / 100));
	let platformYearly = $derived(platformTakes * 12);
	let zaurMonthly = $derived(20); // Beta 2 pricing
	let zaurYearly = $derived(zaurMonthly * 12);
	let savingsMonthly = $derived(platformTakes - zaurMonthly);
	let savingsYearly = $derived(savingsMonthly * 12);
	
	// Format currency
	function formatEuro(amount: number): string {
		return new Intl.NumberFormat('en-EU', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
	
	// Handle input with animation
	function handleRevenueInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const value = parseInt(input.value) || 0;
		
		isCalculating = true;
		setTimeout(() => {
			monthlyRevenue = Math.max(0, Math.min(50000, value));
			isCalculating = false;
		}, 150);
	}
	
	// Handle slider with animation
	function handleCommissionSlider(e: Event) {
		const input = e.target as HTMLInputElement;
		platformCommission = parseInt(input.value);
	}
</script>

<section class="calculator-section subtle-retro-section">
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12">
		<div class="max-w-6xl mx-auto py-12 sm:py-20">
			
			<!-- Section Header -->
			<div class="text-center mb-8 sm:mb-12">
				<h2 class="calculator-title">
					See What You're Losing to Commissions
				</h2>
				<p class="calculator-subtitle">
					Booking platforms take 20-25% of every tour you sell. Calculate your actual losses:
				</p>
			</div>
			
			<!-- Calculator Card -->
			<div class="calculator-card">
				
				<!-- Input Grid -->
				<div class="calculator-inputs-grid">
				
				<!-- Revenue Input -->
				<div class="calculator-input-group">
					<label for="revenue-input" class="input-label">
						Your Monthly Tour Revenue
					</label>
					<div class="input-wrapper">
						<span class="input-prefix">€</span>
						<input
							id="revenue-input"
							type="number"
							value={monthlyRevenue}
							oninput={handleRevenueInput}
							min="0"
							max="50000"
							step="100"
							class="revenue-input"
							placeholder="3000"
						/>
						<span class="input-suffix">/month</span>
					</div>
					<div class="input-slider-wrapper">
						<input
							type="range"
							min="0"
							max="10000"
							step="100"
							value={monthlyRevenue}
							oninput={handleRevenueInput}
							class="revenue-slider"
						/>
						<div class="slider-labels">
							<span>€0</span>
							<span>€5k</span>
							<span>€10k</span>
						</div>
					</div>
				</div>
				
				<!-- Commission Selector -->
				<div class="calculator-input-group">
					<label for="commission-slider" class="input-label">
						Platform Commission Rate
					</label>
					<div class="commission-options">
						<button
							onclick={() => platformCommission = 20}
							class="commission-btn"
							class:active={platformCommission === 20}
						>
							20%
							<span class="commission-hint">Common</span>
						</button>
						<button
							onclick={() => platformCommission = 25}
							class="commission-btn"
							class:active={platformCommission === 25}
						>
							25%
							<span class="commission-hint">Premium</span>
						</button>
						<button
							onclick={() => platformCommission = 30}
							class="commission-btn"
							class:active={platformCommission === 30}
						>
							30%
							<span class="commission-hint">High</span>
						</button>
					</div>
					<div class="custom-commission">
						<input
							id="commission-slider"
							type="range"
							min="15"
							max="35"
							step="1"
							value={platformCommission}
							oninput={handleCommissionSlider}
							class="commission-slider"
						/>
						<span class="commission-value">{platformCommission}%</span>
					</div>
				</div>
				
				</div><!-- End input grid -->
				
				<!-- Results -->
				<div class="calculator-results" class:calculating={isCalculating}>
					
					<!-- Platform Cost -->
					<div class="result-row result-row--bad">
						<div class="result-header">
							<span class="result-label">You're Losing Each Year:</span>
						</div>
						<div class="result-values">
							<div class="result-amount result-amount--bad">
								{formatEuro(platformTakes)}/month
							</div>
							<div class="result-amount-yearly">
								= {formatEuro(platformYearly)}/year
							</div>
						</div>
					</div>
					
					<!-- Zaur Cost -->
					<div class="result-row result-row--good">
						<div class="result-header">
							<span class="result-label">zaur.app Beta 2 Costs:</span>
						</div>
						<div class="result-values">
							<div class="result-amount result-amount--good">
								€{zaurMonthly}/month
							</div>
							<div class="result-amount-yearly">
								= €{zaurYearly}/year
							</div>
						</div>
					</div>
					
					<!-- Savings (Big reveal) -->
					{#if savingsYearly > 0}
						<div class="result-row result-row--savings" in:fly={{ y: 20, duration: 400, easing: quintOut }}>
							<div class="savings-content">
								<div class="savings-label">You Save With Beta 2:</div>
								<div class="savings-amount">
									{formatEuro(savingsYearly)}
									<span class="savings-period">/year</span>
								</div>
								<div class="savings-note">
									That's {formatEuro(savingsMonthly)} extra every month
								</div>
							</div>
						</div>
					{/if}
					
				</div>
				
				<!-- CTA -->
				<div class="calculator-cta">
			<button onclick={() => window.location.href = '/beta-2/apply'} class="button-primary button--large button--full">
				Lock In €20/Month Forever →
			</button>
					<p class="cta-note">
						Beta 2 discount ends March 2026 – Then it's €25/month
					</p>
				</div>
				
			</div>
			
		</div>
	</div>
</section>

<style>
	/* Subtle retro section with minimal color */
	.calculator-section {
		background: linear-gradient(
			180deg,
			var(--bg-primary) 0%,
			var(--bg-secondary) 100%
		);
		position: relative;
		overflow: hidden;
		min-height: 70vh;
		display: flex;
		align-items: center;
	}
	
	/* Very subtle texture overlay */
	.calculator-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 40px,
			rgba(0, 0, 0, 0.02) 40px,
			rgba(0, 0, 0, 0.02) 41px
		);
		pointer-events: none;
	}
	
	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.calculator-section::before {
			background-image: repeating-linear-gradient(
				0deg,
				transparent,
				transparent 40px,
				rgba(255, 255, 255, 0.02) 40px,
				rgba(255, 255, 255, 0.02) 41px
			);
		}
	}
	
	/* Section Header */
	.calculator-title {
		font-size: 2.5rem;
		font-weight: 800;
		color: var(--text-primary);
		line-height: 1.2;
		margin-bottom: 1rem;
		position: relative;
		z-index: 1;
	}
	
	.calculator-subtitle {
		font-size: 1.125rem;
		color: var(--text-secondary);
		line-height: 1.6;
		max-width: 600px;
		margin: 0 auto;
		position: relative;
		z-index: 1;
	}
	
	/* Calculator Card */
	.calculator-card {
		background: var(--bg-secondary);
		border: 2px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 2.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
		position: relative;
		z-index: 1;
	}
	
	/* Input Grid - side by side on desktop */
	.calculator-inputs-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}
	
	/* Input Groups */
	.calculator-input-group {
		margin-bottom: 0;
	}
	
	.input-label {
		display: block;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
	}
	
	/* Revenue Input */
	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		margin-bottom: 1rem;
	}
	
	.input-prefix {
		position: absolute;
		left: 1rem;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-secondary);
		pointer-events: none;
	}
	
	.revenue-input {
		width: 100%;
		padding: 1rem 1rem 1rem 2.5rem;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
		border-radius: var(--radius-md);
		transition: border-color 0.2s, box-shadow 0.2s;
	}
	
	.revenue-input:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
	}
	
	.input-suffix {
		position: absolute;
		right: 1rem;
		font-size: 0.875rem;
		color: var(--text-tertiary);
		pointer-events: none;
	}
	
	/* Slider */
	.input-slider-wrapper {
		margin-top: 0.75rem;
	}
	
	.revenue-slider {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		background: var(--border-primary);
		outline: none;
		-webkit-appearance: none;
		appearance: none;
	}
	
	.revenue-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--primary);
		cursor: pointer;
		transition: transform 0.15s;
	}
	
	.revenue-slider::-webkit-slider-thumb:hover {
		transform: scale(1.2);
	}
	
	.revenue-slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--primary);
		cursor: pointer;
		border: none;
		transition: transform 0.15s;
	}
	
	.revenue-slider::-moz-range-thumb:hover {
		transform: scale(1.2);
	}
	
	.slider-labels {
		display: flex;
		justify-content: space-between;
		margin-top: 0.5rem;
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}
	
	/* Commission Options */
	.commission-options {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	
	.commission-btn {
		padding: 0.875rem;
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
		border-radius: var(--radius-md);
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}
	
	.commission-btn:hover {
		border-color: var(--primary);
		transform: translateY(-2px);
	}
	
	.commission-btn.active {
		background: var(--primary);
		color: white;
		border-color: var(--primary);
	}
	
	.commission-hint {
		font-size: 0.6875rem;
		font-weight: 500;
		opacity: 0.8;
	}
	
	.custom-commission {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.commission-slider {
		flex: 1;
		height: 6px;
		border-radius: 3px;
		background: var(--border-primary);
		outline: none;
		-webkit-appearance: none;
		appearance: none;
	}
	
	.commission-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--primary);
		cursor: pointer;
	}
	
	.commission-slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--primary);
		cursor: pointer;
		border: none;
	}
	
	.commission-value {
		min-width: 45px;
		font-weight: 700;
		color: var(--text-primary);
		text-align: right;
	}
	
	/* Results */
	.calculator-results {
		padding-top: 2rem;
		border-top: 2px solid var(--border-primary);
		transition: opacity 0.2s;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	
	.calculator-results.calculating {
		opacity: 0.5;
	}
	
	.result-row {
		padding: 1.25rem;
		border-radius: var(--radius-md);
		margin-bottom: 0;
	}
	
	.result-row--bad {
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.2);
	}
	
	.result-row--good {
		background: rgba(34, 197, 94, 0.08);
		border: 1px solid rgba(34, 197, 94, 0.2);
	}
	
	.result-row--savings {
		background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.15), rgba(var(--primary-rgb), 0.05));
		border: 2px solid var(--primary);
		padding: 1.5rem;
		margin-top: 0.5rem;
		grid-column: 1 / -1;
	}
	
	.result-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}
	
	.result-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary);
	}
	
	.result-values {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	
	.result-amount {
		font-size: 1.75rem;
		font-weight: 800;
		line-height: 1;
	}
	
	.result-amount--bad {
		color: rgb(239, 68, 68);
	}
	
	.result-amount--good {
		color: rgb(34, 197, 94);
	}
	
	.result-amount-yearly {
		font-size: 0.9375rem;
		color: var(--text-tertiary);
		font-weight: 500;
	}
	
	/* Savings Highlight */
	.savings-content {
		text-align: center;
	}
	
	.savings-label {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
	}
	
	.savings-amount {
		font-size: 3rem;
		font-weight: 900;
		color: var(--primary);
		line-height: 1;
		margin-bottom: 0.5rem;
	}
	
	.savings-period {
		font-size: 1.25rem;
		font-weight: 600;
	}
	
	.savings-note {
		font-size: 0.9375rem;
		color: var(--text-secondary);
		margin-top: 0.75rem;
	}
	
	/* CTA */
	.calculator-cta {
		margin-top: 2rem;
		text-align: center;
	}
	
	.button--full {
		width: 100%;
		justify-content: center;
	}
	
	.cta-note {
		margin-top: 0.75rem;
		font-size: 0.8125rem;
		color: var(--text-tertiary);
	}
	
	/* Mobile Responsive */
	@media (max-width: 768px) {
		/* Stack inputs on mobile */
		.calculator-inputs-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		
		.calculator-input-group {
			margin-bottom: 0;
		}
		
		/* Stack results on mobile */
		.calculator-results {
			grid-template-columns: 1fr;
		}
		
		.calculator-title {
			font-size: 1.75rem;
		}
		
		.calculator-subtitle {
			font-size: 1rem;
		}
		
		.calculator-card {
			padding: 1.5rem;
		}
		
		.revenue-input {
			font-size: 1.25rem;
			padding: 0.875rem 0.875rem 0.875rem 2.25rem;
		}
		
		.input-prefix {
			font-size: 1.25rem;
			left: 0.875rem;
		}
		
		.commission-options {
			grid-template-columns: repeat(3, 1fr);
			gap: 0.5rem;
		}
		
		.commission-btn {
			padding: 0.75rem 0.5rem;
			font-size: 1rem;
		}
		
		.commission-hint {
			font-size: 0.625rem;
		}
		
		.result-amount {
			font-size: 1.5rem;
		}
		
		.savings-amount {
			font-size: 2.25rem;
		}
	}
	
	@media (max-width: 400px) {
		.calculator-card {
			padding: 1.25rem;
		}
		
		.revenue-input {
			font-size: 1.125rem;
		}
		
		.commission-options {
			gap: 0.375rem;
		}
		
		.commission-btn {
			padding: 0.625rem 0.375rem;
			font-size: 0.9375rem;
		}
		
		.savings-amount {
			font-size: 2rem;
		}
	}
</style>