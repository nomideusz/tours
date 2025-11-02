<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	
	// Icons
	import Euro from 'lucide-svelte/icons/euro';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	
	// Umami tracking
	import { trackCTAClick } from '$lib/utils/umami-tracking.js';
	
	// Beta 2 spot counter
	let beta2Data = $state({ total: 100, remaining: 100, accepted: 0, percentFilled: 0 });
	let loading = $state(true);
	let daysUntilMarch2026 = $state(0);
	
	// Calculator state
	let monthlyRevenue = $state(3000);
	let platformCommission = $state(20);
	let isCalculating = $state(false);
	
	// Computed values
	let platformTakes = $derived(monthlyRevenue * (platformCommission / 100));
	let platformYearly = $derived(platformTakes * 12);
	let zaurMonthly = $derived(20);
	let zaurYearly = $derived(zaurMonthly * 12);
	let savingsMonthly = $derived(platformTakes - zaurMonthly);
	let savingsYearly = $derived(savingsMonthly * 12);
	
	onMount(async () => {
		// Fetch beta 2 count
		try {
			const response = await fetch('/api/beta-2-count');
			if (response.ok) {
				beta2Data = await response.json();
			}
		} catch (error) {
			console.error('Failed to fetch Beta 2 count:', error);
		} finally {
			loading = false;
		}
		
		// Calculate days until March 2026
		const marchDate = new Date('2026-03-01');
		const today = new Date();
		const diffTime = marchDate.getTime() - today.getTime();
		daysUntilMarch2026 = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	});
	
	function formatEuro(amount: number): string {
		return new Intl.NumberFormat('en-EU', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
	
	function handleRevenueInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const value = parseInt(input.value) || 0;
		
		isCalculating = true;
		setTimeout(() => {
			monthlyRevenue = Math.max(0, Math.min(50000, value));
			isCalculating = false;
		}, 150);
	}
	
	function handleCommissionSlider(e: Event) {
		const input = e.target as HTMLInputElement;
		platformCommission = parseInt(input.value);
	}
	
	function handleJoinBeta2() {
		trackCTAClick('hero', 'Lock In Your Beta 2 Discount', '/beta-2/apply');
		goto('/beta-2/apply');
	}
</script>

<div class="hero-calculator-section">
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-16 py-8 sm:py-20">
			
			<!-- Beta 2 Badge with Countdown -->
			<div class="text-center mb-6" in:fade={{ delay: 200 }}>
				<div class="beta-badge-container">
					<div class="beta-badge">
						<span>BETA 2 CLOSES IN {daysUntilMarch2026} DAYS</span>
					</div>
				</div>
			</div>
			
			<!-- Main Value Prop -->
			<div class="hero-content">
				<div class="hero-eyebrow">
					For Independent Tour Guides & Operators
				</div>
				<h1 class="hero-title">
					<span class="title-line">The Simplest</span>
					<span class="title-line">Booking System</span>
					<span class="title-accent">with QR Codes</span>
				</h1>
				<p class="hero-subtitle">
					Stop losing <span class="highlight-bad">20-25%</span> to platforms.<br />
					Keep <span class="highlight-good">100%</span> of your revenue.
				</p>
			</div>
			
			<!-- Section Divider -->
			<hr class="section-divider" aria-hidden="true" />
			
			<!-- How It Works - 3 Simple Steps -->
			<div id="how-it-works" class="how-it-works-container">
				<div class="steps-grid">
					<!-- Step 1 -->
					<div class="step-card">
						<div class="step-number">1</div>
						<h3 class="step-title">Create QR Code</h3>
						<p class="step-description">
							Add tour details and schedule in&nbsp;2&nbsp;minutes
						</p>
						<div class="step-visual">
							<div class="qr-code-mini">
								<img 
									src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=https://zaur.app/?demo=true"
									alt="QR Code"
									class="w-15 h-15"
								/>
							</div>
						</div>
					</div>

					<!-- Step 2 -->
					<div class="step-card">
						<div class="step-number">2</div>
						<h3 class="step-title">Share Anywhere</h3>
						<p class="step-description">
							Print or display digitally. Customers&nbsp;scan&nbsp;to&nbsp;book
						</p>
						<div class="step-visual">
							<div class="time-slots">
								<span class="time-slot">10:00</span>
								<span class="time-slot">14:00</span>
								<span class="time-slot">17:00</span>
							</div>
						</div>
					</div>

					<!-- Step 3 -->
					<div class="step-card">
						<div class="step-number">3</div>
						<h3 class="step-title">Get Paid 100%</h3>
						<p class="step-description">
							Instant bookings, direct payments to&nbsp;your&nbsp;account
						</p>
						<div class="step-visual">
							<div class="booking-notification">
								<div class="notification-icon">
									<Euro class="w-3 h-3" />
								</div>
								<span class="notification-text">+€25</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Section Divider -->
			<hr class="section-divider" aria-hidden="true" />
			
			<!-- Calculator: Show What You're Losing -->
			<div id="calculator" class="calculator-container" role="region" aria-labelledby="calculator-title">
				<div class="calculator-header">
					<h2 id="calculator-title" class="calculator-title">
						Calculate Your Savings
					</h2>
					<p class="calculator-subtitle">
						See the real numbers for your business
					</p>
				</div>
				
				<div class="calculator-card">
					
					<!-- Inputs -->
					<div class="calculator-inputs">
						<!-- Revenue Input -->
						<div class="input-group">
							<label for="revenue-input" class="input-label">
								Your Monthly Tour Revenue
							</label>
							<div class="input-content">
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
									aria-label="Your monthly tour revenue in euros"
								/>
									<span class="input-suffix">/month</span>
								</div>
							</div>
						</div>
						
						<!-- Commission Input -->
						<div class="input-group">
							<label for="commission-slider" class="input-label">
								Current Platform Commission
							</label>
							<div class="input-content">
								<div class="option-buttons" role="group" aria-label="Commission rate options">
									<button
										type="button"
										onclick={() => platformCommission = 20}
										class="option-button"
										class:active={platformCommission === 20}
										aria-label="Set commission to 20%"
										aria-pressed={platformCommission === 20}
									>
										20%
									</button>
									<button
										type="button"
										onclick={() => platformCommission = 25}
										class="option-button"
										class:active={platformCommission === 25}
										aria-label="Set commission to 25%"
										aria-pressed={platformCommission === 25}
									>
										25%
									</button>
									<button
										type="button"
										onclick={() => platformCommission = 30}
										class="option-button"
										class:active={platformCommission === 30}
										aria-label="Set commission to 30%"
										aria-pressed={platformCommission === 30}
									>
										30%
									</button>
								</div>
							</div>
						</div>
					</div>
					
					<!-- Sliders Row - Aligned -->
					<div class="sliders-row">
						<div class="slider-group">
							<input
								type="range"
								min="0"
								max="10000"
								step="100"
								value={monthlyRevenue}
								oninput={handleRevenueInput}
								class="revenue-slider"
								aria-label="Adjust monthly revenue slider"
								aria-valuemin="0"
								aria-valuemax="10000"
								aria-valuenow={monthlyRevenue}
							/>
							<div class="slider-labels">
								<span>€0</span>
								<span>€5k</span>
								<span>€10k</span>
							</div>
						</div>
						
					<div class="slider-group">
						<input
							id="commission-slider"
							type="range"
							min="15"
							max="35"
							step="1"
							value={platformCommission}
							oninput={handleCommissionSlider}
							class="commission-slider"
							aria-label="Adjust platform commission percentage"
							aria-valuemin="15"
							aria-valuemax="35"
							aria-valuenow={platformCommission}
							aria-valuetext="{platformCommission}%"
						/>
						<div class="slider-labels">
							<span>15%</span>
							<span>25%</span>
							<span>35%</span>
						</div>
					</div>
					</div>
					
					<!-- Results -->
					<div class="calculator-results" class:calculating={isCalculating} aria-live="polite" aria-atomic="true">
						<div class="results-grid">
							<!-- Current Loss -->
							<div class="result-card result-card--bad">
								<div class="result-label">Current Platform Fees</div>
								<div class="result-amount result-amount--bad">
									{formatEuro(platformTakes)}<span class="period">/mo</span>
								</div>
								<div class="result-yearly">
									{formatEuro(platformYearly)}/year
								</div>
							</div>
							
							<!-- Zaur Cost -->
							<div class="result-card result-card--good">
								<div class="result-label">Zaur Flat Fee</div>
								<div class="result-amount result-amount--good">
									€{zaurMonthly}<span class="period">/mo</span>
								</div>
								<div class="result-yearly">
									€{zaurYearly}/year
								</div>
							</div>
						</div>
						
						<!-- Big Savings -->
						{#if savingsYearly > 0}
							<div class="savings-highlight" in:fly={{ y: 20, duration: 400, easing: quintOut }}>
								<div class="savings-label">You Save</div>
								<div class="savings-amount">
									{formatEuro(savingsYearly)}<span class="savings-period">/year</span>
								</div>
							</div>
						{/if}
					</div>
					
					<!-- Integrated CTA -->
					<div class="calculator-cta">
						<hr class="cta-divider" aria-hidden="true" />
						<div class="cta-content">
							<div class="cta-badge">BETA 2 • CLOSES MARCH 2026</div>
							<h3 class="cta-title">Lock In €20/Month Forever</h3>
							<div class="cta-benefits">
								<span class="benefit">✓ 4 months free</span>
								<span class="benefit">✓ Price locked forever</span>
								<span class="benefit">✓ Early access</span>
							</div>
							<button 
								type="button"
								onclick={handleJoinBeta2} 
								class="button-primary button-large button-gap"
								aria-label="Apply for Beta 2 program"
							>
								Apply for Beta 2
								<ArrowRight class="w-4 h-4" aria-hidden="true" />
							</button>
							<p class="cta-note">
								Public launch: €25/month
							</p>
						</div>
					</div>
					
				</div>
			</div>
			
	</div>
</div>

<style>
	/* Section Background - Clean & Professional */
	.hero-calculator-section {
		background: linear-gradient(
			180deg,
			var(--bg-primary) 0%,
			var(--bg-secondary) 100%
		);
		position: relative;
		overflow: hidden;
	}
	
	/* Beta Badge */
	.beta-badge {
		display: inline-block;
		padding: 0.5rem 1.25rem;
		background: var(--color-accent-100);
		color: var(--color-accent-700);
		border: 1px solid var(--color-accent-300);
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		transition: all var(--transition-base);
		box-shadow: 0 2px 8px rgba(var(--color-accent-600-rgb), 0.2);
	}
	
	.beta-badge:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(var(--color-accent-600-rgb), 0.3);
		border-color: var(--color-accent-600);
		background: var(--color-accent-200);
	}
	
	/* Hero Content Container */
	.hero-content {
		text-align: center;
		margin-bottom: 4rem;
		max-width: 56rem;
		margin-left: auto;
		margin-right: auto;
	}
	
	/* Hero Eyebrow - Small descriptive text above title */
	.hero-eyebrow {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.12em;
		margin-bottom: 1.5rem;
		opacity: 0.9;
	}
	
	/* Hero Title - Main headline */
	.hero-title {
		font-size: 3.75rem;
		font-weight: 900;
		line-height: 1.15;
		letter-spacing: -0.025em;
		color: var(--text-primary);
		margin-bottom: 1.75rem;
		display: flex;
		flex-direction: column;
		gap: 0;
	}
	
	.title-line {
		display: block;
	}
	
	/* Title accent - Secondary part of headline */
	.title-accent {
		color: var(--primary);
		font-weight: 700;
		font-size: 2.25rem;
		display: block;
		margin-top: 0.5rem;
	}
	
	/* Highlighted numbers in title and subtitle */
	.highlight-bad {
		color: var(--color-error-500);
		font-weight: 700;
		white-space: nowrap;
		position: relative;
		display: inline-block;
	}
	
	.highlight-good {
		color: var(--color-success-500);
		font-weight: 700;
		white-space: nowrap;
		position: relative;
		display: inline-block;
	}
	
	/* Hero Subtitle */
	.hero-subtitle {
		font-size: 1.375rem;
		color: var(--text-secondary);
		line-height: 1.7;
		max-width: 42rem;
		margin: 2rem auto 0;
		font-weight: 400;
		letter-spacing: -0.01em;
	}
	
	/* Section Divider */
	.section-divider {
		border: none;
		max-width: 14rem;
		height: 8px;
		background: transparent;
		margin: 5rem auto;
		position: relative;
		display: flex;
		align-items: center;
		overflow: visible;
	}
	
	.section-divider::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			var(--border-secondary) 50%,
			transparent 100%
		);
	}
	
	.section-divider::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 8px;
		height: 8px;
		background: var(--primary);
		border-radius: 50%;
		opacity: 0.6;
		z-index: 1;
		box-shadow: 0 0 0 2px var(--bg-primary);
	}
	
	/* How It Works - Compact 3-Step */
	.how-it-works-container {
		position: relative;
		z-index: 1;
		margin-bottom: 5rem;
	}
	
	/* Scroll offset for anchor links to account for fixed header */
	#how-it-works {
		scroll-margin-top: 8rem;
	}
	
	@media (min-width: 640px) {
		#how-it-works {
			scroll-margin-top: 10rem;
		}
	}
	
	@media (min-width: 1024px) {
		#how-it-works {
			scroll-margin-top: 12rem;
		}
	}
	
	.steps-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
	}
	
	.step-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 2rem 1.5rem;
		text-align: center;
		transition: all var(--transition-slow);
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100%;
		box-shadow: var(--shadow-xs);
	}
	
	.step-card::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.04), transparent);
		border-radius: var(--radius-lg);
		opacity: 0;
		transition: opacity var(--transition-slow);
	}
	
	.step-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
		border-color: var(--primary);
	}
	
	.step-card:hover::before {
		opacity: 1;
	}
	
	.step-number {
		width: 2.5rem;
		height: 2.5rem;
		background: var(--primary);
		color: white;
		border-radius: 50%;
		font-size: 1.125rem;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.25rem;
		position: relative;
		z-index: 1;
		transition: transform var(--transition-slow);
		box-shadow: var(--shadow-primary);
	}
	
	.step-card:hover .step-number {
		transform: scale(1.1) translateY(-2px);
		box-shadow: 0 8px 16px rgba(var(--primary-rgb), 0.3);
	}
	
	.step-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
		letter-spacing: -0.01em;
		position: relative;
		z-index: 1;
	}
	
	.step-description {
		font-size: 0.9375rem;
		color: var(--text-secondary);
		line-height: 1.65;
		margin-bottom: 1.5rem;
		flex-grow: 1;
		max-width: 20rem;
		margin-left: auto;
		margin-right: auto;
		letter-spacing: -0.01em;
		position: relative;
		z-index: 1;
	}
	
	.step-visual {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 4.5rem;
		margin-top: auto;
	}
	
	.qr-code-mini {
		background: white;
		padding: 0.5rem;
		border-radius: var(--radius-md);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.qr-code-mini img {
		display: block;
		width: 60px;
		height: 60px;
	}
	
	.time-slots {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
		min-height: 2.5rem;
		align-items: center;
	}
	
	.time-slot {
		padding: 0.375rem 0.625rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.booking-notification {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.25rem;
		background: var(--bg-primary);
		border: 2px solid var(--primary);
		border-radius: var(--radius-md);
	}
	
	.notification-icon {
		width: 2rem;
		height: 2rem;
		background: var(--primary);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	
	.notification-text {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--primary);
	}
	
	/* Calculator */
	.calculator-container {
		position: relative;
		z-index: 1;
		margin-bottom: 4rem;
	}
	
	.calculator-header {
		text-align: center;
		margin-bottom: 2.5rem;
	}
	
	.calculator-title {
		font-size: 2.25rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 1rem;
		letter-spacing: -0.025em;
		line-height: 1.2;
	}
	
	.calculator-subtitle {
		font-size: 1.0625rem;
		color: var(--text-secondary);
		line-height: 1.6;
		max-width: 36rem;
		margin: 0 auto;
		letter-spacing: -0.01em;
	}
	
	.calculator-card {
		background: var(--bg-secondary);
		border: 2px solid var(--border-primary);
		border-radius: var(--radius-xl);
		padding: 2.5rem 2rem;
		box-shadow: var(--shadow-md);
		transition: box-shadow var(--transition-slow);
	}
	
	.calculator-card:hover {
		box-shadow: var(--shadow-lg);
	}
	
	.calculator-inputs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 1.5rem;
	}
	
	.input-group {
		display: flex;
		flex-direction: column;
	}
	
	.input-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
		letter-spacing: -0.01em;
	}
	
	.input-content {
		flex: 1;
	}
	
	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}
	
	/* Sliders Row - Both sliders aligned */
	.sliders-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
		padding: 1.5rem 0 2rem 0;
		border-top: 1px solid var(--border-secondary);
		border-bottom: 2px solid var(--border-primary);
	}
	
	.slider-group {
		display: flex;
		flex-direction: column;
	}
	
	.input-prefix {
		position: absolute;
		left: 1rem;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-secondary);
		pointer-events: none;
	}
	
	.revenue-input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 2.5rem;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
		border-radius: var(--radius-md);
		transition: all var(--transition-base);
		letter-spacing: -0.01em;
		height: 3.25rem;
	}
	
	.revenue-input:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
	}
	
	.revenue-input:hover:not(:focus) {
		border-color: var(--border-secondary);
	}
	
	.input-suffix {
		position: absolute;
		right: 1rem;
		font-size: 0.75rem;
		color: var(--text-tertiary);
		pointer-events: none;
	}
	
	.revenue-slider,
	.commission-slider {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		background: var(--border-primary);
		outline: none;
		-webkit-appearance: none;
		appearance: none;
	}
	
	.revenue-slider::-webkit-slider-thumb,
	.commission-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--primary);
		cursor: pointer;
	}
	
	.revenue-slider::-moz-range-thumb,
	.commission-slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--primary);
		cursor: pointer;
		border: none;
	}
	
	.slider-labels {
		display: flex;
		justify-content: space-between;
		margin-top: 0.5rem;
		font-size: 0.6875rem;
		color: var(--text-tertiary);
	}
	
	/* Option Buttons - Reusable button group for selecting options */
	.option-buttons {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}
	
	.option-button {
		padding: 0.75rem;
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
		border-radius: var(--radius-md);
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
		cursor: pointer;
		transition: all var(--transition-slow);
		letter-spacing: -0.01em;
		box-shadow: var(--shadow-xs);
		height: 3.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.option-button:hover:not(.active) {
		border-color: var(--primary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}
	
	.option-button.active {
		background: var(--primary);
		color: white;
		border-color: var(--primary);
		box-shadow: var(--shadow-primary);
	}
	
	/* Results */
	.calculator-results {
		transition: opacity 0.2s;
	}
	
	.calculator-results.calculating {
		opacity: 0.5;
	}
	
	.results-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	
	.result-card {
		padding: 1.5rem 1.25rem;
		border-radius: var(--radius-lg);
		text-align: center;
		transition: all var(--transition-base);
	}
	
	.result-card--bad {
		background: color-mix(in srgb, var(--color-error-500) 6%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-error-500) 15%, transparent);
		box-shadow: var(--shadow-xs);
	}
	
	.result-card--good {
		background: color-mix(in srgb, var(--color-success-500) 6%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-success-500) 15%, transparent);
		box-shadow: var(--shadow-xs);
	}
	
	.result-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
	}
	
	.result-amount {
		font-size: 2rem;
		font-weight: 800;
		line-height: 1;
	}
	
	.result-amount--bad {
		color: var(--color-error-500);
	}
	
	.result-amount--good {
		color: var(--color-success-500);
	}
	
	.period {
		font-size: 1rem;
		font-weight: 600;
	}
	
	.result-yearly {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		margin-top: 0.5rem;
	}
	
	.savings-highlight {
		background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.12), rgba(var(--primary-rgb), 0.04));
		border: 2px solid var(--primary);
		border-radius: var(--radius-lg);
		padding: 2rem 1.5rem;
		text-align: center;
		box-shadow: var(--shadow-primary);
		position: relative;
		overflow: hidden;
	}
	
	.savings-highlight::before {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 50% 0%, rgba(var(--primary-rgb), 0.1), transparent 70%);
		pointer-events: none;
	}
	
	.savings-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 0.75rem;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		position: relative;
		z-index: 1;
	}
	
	.savings-amount {
		font-size: 3rem;
		font-weight: 900;
		color: var(--primary);
		line-height: 1;
		letter-spacing: -0.02em;
		position: relative;
		z-index: 1;
	}
	
	.savings-period {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--primary);
		opacity: 0.8;
	}
	
	/* Integrated CTA inside Calculator */
	.calculator-cta {
		margin-top: 2rem;
	}
	
	.cta-divider {
		border: none;
		height: 8px;
		background: transparent;
		margin-bottom: 2rem;
		position: relative;
		display: flex;
		align-items: center;
		overflow: visible;
	}
	
	.cta-divider::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			var(--border-primary) 20%,
			var(--border-primary) 80%,
			transparent 100%
		);
	}
	
	.cta-content {
		text-align: center;
		padding: 0 1rem;
	}
	
	.cta-badge {
		display: inline-block;
		padding: 0.5rem 1rem;
		background: var(--color-accent-600);
		color: white;
		border-radius: 9999px;
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		margin-bottom: 1.25rem;
		box-shadow: 0 2px 8px rgba(var(--color-accent-600-rgb), 0.3);
		transition: all var(--transition-base);
	}
	
	.cta-badge:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(var(--color-accent-600-rgb), 0.4);
	}
	
	.cta-title {
		font-size: 1.875rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
		letter-spacing: -0.025em;
		line-height: 1.2;
	}
	
	.cta-benefits {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}
	
	.benefit {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-weight: 500;
		white-space: nowrap;
		letter-spacing: -0.01em;
		transition: color var(--transition-base);
	}
	
	.benefit:hover {
		color: var(--text-primary);
	}
	
	.calculator-cta button {
		margin: 0 auto 1rem;
		transition: all var(--transition-base);
	}
	
	.calculator-cta button:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}
	
	.cta-note {
		font-size: 0.8125rem;
		color: var(--text-tertiary);
		font-style: italic;
		letter-spacing: -0.01em;
		line-height: 1.5;
	}
	
	/* Mobile Responsive */
	@media (max-width: 768px) {
		.hero-content {
			margin-bottom: 3rem;
		}
		
		.section-divider {
			margin: 3.5rem auto;
			max-width: 10rem;
		}
		
		.hero-eyebrow {
			font-size: 0.75rem;
			margin-bottom: 1rem;
		}
		
		.hero-title {
			font-size: 2rem;
			margin-bottom: 1.25rem;
			line-height: 1.2;
		}
		
		.title-line {
			font-size: 2rem;
		}
		
		.title-accent {
			font-size: 1.5rem;
			margin-top: 0.375rem;
		}
		
		.hero-subtitle {
			font-size: 1.0625rem;
			line-height: 1.6;
		}
		
		.how-it-works-container {
			margin-bottom: 3.5rem;
		}
		
		.steps-grid {
			grid-template-columns: 1fr;
			gap: 1.25rem;
		}
		
		.step-card {
			padding: 1.75rem 1.25rem;
		}
		
		.step-number {
			width: 2.25rem;
			height: 2.25rem;
			font-size: 1rem;
			margin-bottom: 1rem;
		}
		
		.step-description {
			font-size: 0.875rem;
			margin-bottom: 1.25rem;
			line-height: 1.6;
			max-width: 100%;
		}
		
		.step-visual {
			min-height: 4rem;
		}
		
		.qr-code-mini img {
			width: 55px;
			height: 55px;
		}
		
		.time-slots {
			min-height: 2.25rem;
		}
		
		.booking-notification {
			padding: 0.625rem 1rem;
			min-height: 2.75rem;
		}
		
		.notification-icon {
			width: 1.75rem;
			height: 1.75rem;
		}
		
		.notification-text {
			font-size: 1rem;
		}
		
		.calculator-container {
			margin-bottom: 3rem;
		}
		
		.calculator-header {
			margin-bottom: 2rem;
		}
		
		.calculator-title {
			font-size: 1.625rem;
		}
		
		.calculator-subtitle {
			font-size: 0.9375rem;
		}
		
		.calculator-card {
			padding: 2rem 1.5rem;
			border-radius: var(--radius-lg);
		}
		
		.cta-title {
			font-size: 1.5rem;
			margin-bottom: 1rem;
		}
		
		.cta-benefits {
			flex-direction: column;
			gap: 0.875rem;
			align-items: center;
			margin-bottom: 1.75rem;
		}
		
		.benefit {
			font-size: 0.9375rem;
		}
		
		.calculator-cta button {
			width: 100%;
			padding: 1rem 1.5rem;
			font-size: 1rem;
		}
		
		.calculator-inputs {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		
		.sliders-row {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		
		.results-grid {
			grid-template-columns: 1fr;
			gap: 1.25rem;
		}
		
		.result-card {
			padding: 1.5rem 1.25rem;
		}
		
		.result-amount {
			font-size: 1.875rem;
		}
		
		.savings-highlight {
			padding: 1.75rem 1.5rem;
		}
		
		.savings-amount {
			font-size: 2.5rem;
		}
		
		.savings-period {
			font-size: 1.25rem;
		}
	}
	
	@media (max-width: 480px) {
		.beta-badge {
			font-size: 0.6875rem;
			padding: 0.375rem 0.875rem;
		}
		
		.hero-content {
			margin-bottom: 2.5rem;
		}
		
		.section-divider {
			margin: 2.5rem auto;
			max-width: 8rem;
		}
		
		.hero-eyebrow {
			font-size: 0.6875rem;
			margin-bottom: 0.875rem;
		}
		
		.hero-title {
			font-size: 1.75rem;
			margin-bottom: 1rem;
			line-height: 1.15;
		}
		
		.title-line {
			font-size: 1.75rem;
		}
		
		.title-accent {
			font-size: 1.375rem;
			margin-top: 0.25rem;
		}
		
		.hero-subtitle {
			font-size: 0.9375rem;
			line-height: 1.5;
		}
		
		.how-it-works-container {
			margin-bottom: 3rem;
		}
		
		.step-card {
			padding: 1.5rem 1rem;
		}
		
		.step-number {
			width: 2rem;
			height: 2rem;
			font-size: 0.9375rem;
			margin-bottom: 0.875rem;
		}
		
		.step-title {
			font-size: 1rem;
		}
		
		.step-description {
			font-size: 0.8125rem;
			margin-bottom: 1rem;
			line-height: 1.55;
			max-width: 100%;
		}
		
		.step-visual {
			min-height: 3.5rem;
		}
		
		.qr-code-mini {
			padding: 0.375rem;
		}
		
		.qr-code-mini img {
			width: 50px;
			height: 50px;
		}
		
		.time-slots {
			min-height: 2rem;
			gap: 0.375rem;
		}
		
		.time-slot {
			padding: 0.25rem 0.5rem;
			font-size: 0.6875rem;
		}
		
		.booking-notification {
			padding: 0.5rem 0.875rem;
			min-height: 2.5rem;
		}
		
		.notification-icon {
			width: 1.5rem;
			height: 1.5rem;
		}
		
		.notification-text {
			font-size: 0.9375rem;
		}
		
		.calculator-card {
			padding: 1.75rem 1.25rem;
			border-radius: var(--radius-md);
		}
		
		.revenue-input {
			font-size: 1.125rem;
			padding: 0.875rem 0.875rem 0.875rem 2.25rem;
		}
		
		.option-button {
			font-size: 0.875rem;
			padding: 0.75rem 0.5rem;
		}
		
		.result-card {
			padding: 1.25rem 1rem;
		}
		
		.result-amount {
			font-size: 1.625rem;
		}
		
		.savings-highlight {
			padding: 1.5rem 1.25rem;
		}
		
		.savings-amount {
			font-size: 2.25rem;
		}
		
		.savings-period {
			font-size: 1.125rem;
		}
		
		.cta-title {
			font-size: 1.375rem;
			margin-bottom: 0.875rem;
		}
		
		.cta-badge {
			font-size: 0.625rem;
			padding: 0.325rem 0.75rem;
		}
		
		.cta-benefits {
			gap: 0.75rem;
			margin-bottom: 1.5rem;
		}
		
		.benefit {
			font-size: 0.875rem;
		}
		
		.calculator-cta button {
			padding: 0.875rem 1.25rem;
			font-size: 0.9375rem;
		}
	}
	
	/* Dark mode - backgrounds already use CSS variables, no override needed */
</style>

