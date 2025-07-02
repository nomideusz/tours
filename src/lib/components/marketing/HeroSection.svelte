<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	// State for copy feedback
	let showCopied = $state(false);
	
	// Calendar preview state
	let currentDate = $state(new Date());
	let calendarMounted = $state(false);

	onMount(() => {
		calendarMounted = true;
	});

	async function copyPromoCode() {
		try {
			await navigator.clipboard.writeText('EARLY2025');
			showCopied = true;
			setTimeout(() => {
				showCopied = false;
			}, 2000);
		} catch (err) {
			// Fallback for older browsers
			console.log('Fallback: Copy EARLY2025');
		}
	}

	// Generate simple calendar for preview
	const calendarDays = $derived.by(() => {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const firstDayOfWeek = firstDay.getDay();
		
		const days = [];
		
		// Add empty cells for days before the first day of month
		for (let i = 0; i < firstDayOfWeek; i++) {
			days.push({ date: null, isCurrentMonth: false, hasSlots: false });
		}
		
		// Add all days of the current month
		for (let day = 1; day <= lastDay.getDate(); day++) {
			const date = new Date(year, month, day);
			const isToday = date.toDateString() === new Date().toDateString();
			
			// Add some sample tour slots for demo purposes
			const hasSlots = day % 3 === 0 || day % 7 === 1;
			
			days.push({ 
				date, 
				isCurrentMonth: true, 
				isToday,
				hasSlots
			});
		}
		
		return days;
	});

	function formatMonth(date: Date): string {
		return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	}
</script>

<!-- Hero Section -->
<section class="py-12 pb-20" style="border-bottom: none;">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<!-- Trust indicators -->
		<div class="text-center mb-8" in:fade={{ delay: 100 }}>
			<div class="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm" style="color: var(--text-tertiary);">
				<span class="flex items-center gap-2">
					<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					No credit card required
				</span>
				<span class="hidden sm:inline">•</span>
				<span class="flex items-center gap-2">
					<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					Setup in 5 minutes
				</span>
			</div>
		</div>
		
		<!-- Main hero content -->
		<div class="text-center max-w-4xl mx-auto" in:fly={{ y: 20, duration: 600, delay: 200 }}>
			<h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight" style="color: var(--text-primary);">
				Skip Platform Fees.
				<span class="block sm:inline" style="color: var(--color-primary-600);">Get Direct Bookings.</span>
			</h1>
			<p class="text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed" style="color: var(--text-secondary);">
				Professional QR booking system for independent tour guides. Tourists scan your code and book instantly — you keep 100% of earnings.
			</p>
			
			<!-- Promo Code Display -->
			<div class="max-w-md mx-auto mb-8">
				<div class="promo-code-container">
					<div class="promo-header">
						<span class="promo-label">Early Access Code</span>
						<span class="promo-badge">Limited Time</span>
					</div>
					<button 
						class="promo-code-button" 
						onclick={copyPromoCode}
						title="Click to copy"
					>
						<span class="promo-code">EARLY2025</span>
						<svg class="w-5 h-5 copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
						</svg>
					</button>
					{#if showCopied}
						<p class="copy-feedback" in:fade={{ duration: 200 }}>
							✓ Code copied! Use it when signing up
						</p>
					{/if}
				</div>
				
				<div class="action-button-container">
					<a href="/auth/register" class="cta-button">
						Get Started Free
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
						</svg>
					</a>
				</div>
			</div>
			
			<!-- Social proof -->
			<div class="flex flex-col items-center justify-center gap-3 text-sm" style="color: var(--text-tertiary);">
				<span class="text-center">🎯 Use code EARLY2025 for founding member benefits</span>
				<span class="text-center" style="color: var(--text-tertiary);">Join the first tour guides building with Zaur</span>
			</div>
			
			<!-- Trust indicators grid -->
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 max-w-3xl mx-auto">
				<div class="trust-indicator">
					<div class="trust-icon">⚡</div>
					<div class="trust-value">&lt; 5 min</div>
					<div class="trust-label">Setup Time</div>
				</div>
				<div class="trust-indicator">
					<div class="trust-icon">💸</div>
					<div class="trust-value">0%</div>
					<div class="trust-label">Platform Fee</div>
				</div>
				<div class="trust-indicator">
					<div class="trust-icon">🔒</div>
					<div class="trust-value">Stripe</div>
					<div class="trust-label">Secure Payments</div>
				</div>
				<div class="trust-indicator">
					<div class="trust-icon">🌍</div>
					<div class="trust-value">40+</div>
					<div class="trust-label">Countries</div>
				</div>
			</div>
		</div>

		<!-- Interactive Calendar Preview -->
		<div class="mt-16">
			<div class="calendar-preview-container">
				<div class="calendar-preview-header">
					<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">
						Your Tour Calendar
					</h3>
					<p class="text-sm" style="color: var(--text-secondary);">
						Real-time availability and booking management
					</p>
				</div>
				{#if calendarMounted}
					<div class="calendar-preview-card" in:fade={{ duration: 300 }}>
						<!-- Calendar Header -->
						<div class="calendar-header">
							<h4 class="calendar-title">{formatMonth(currentDate)}</h4>
							<div class="calendar-badge">Interactive Calendar</div>
						</div>
						
						<!-- Calendar Grid -->
						<div class="calendar-body">
							<!-- Day headers -->
							<div class="day-headers">
								{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
									<div class="day-header">{day}</div>
								{/each}
							</div>
							
							<!-- Calendar Days -->
							<div class="calendar-grid">
								{#each calendarDays as day, index}
									<div 
										class="calendar-day {day.isCurrentMonth ? 'current-month' : 'other-month'} {day.isToday ? 'today' : ''}"
										in:fade={{ duration: 200, delay: index * 8 }}
									>
										{#if day.date}
											<span class="day-number">{day.date.getDate()}</span>
											{#if day.hasSlots}
												<div class="slot-indicator"></div>
											{/if}
										{/if}
									</div>
								{/each}
							</div>
						</div>
						
						<!-- Calendar Footer -->
						<div class="calendar-footer">
							<div class="calendar-stats">
								<div class="stat">
									<span class="stat-value">8</span>
									<span class="stat-label">Tours</span>
								</div>
								<div class="stat">
									<span class="stat-value">24</span>
									<span class="stat-label">Bookings</span>
								</div>
								<div class="stat">
									<span class="stat-value">92%</span>
									<span class="stat-label">Filled</span>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
	/* Trust indicators */
	.trust-indicator {
		text-align: center;
		padding: 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		transition: all 0.2s ease;
	}
	
	.trust-indicator:hover {
		border-color: var(--color-primary-300);
		box-shadow: var(--shadow-sm);
		transform: translateY(-1px);
	}
	
	.trust-icon {
		font-size: 1.5rem;
		margin-bottom: 0.25rem;
		line-height: 1;
	}
	
	.trust-value {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
		line-height: 1;
	}
	
	.trust-label {
		font-size: 0.625rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		line-height: 1;
	}
	
	@media (max-width: 640px) {
		.trust-indicator {
			padding: 0.5rem;
		}
		
		.trust-icon {
			font-size: 1.25rem;
		}
		
		.trust-value {
			font-size: 0.875rem;
		}
		
		.trust-label {
			font-size: 0.5625rem;
		}
	}
	
	/* Promo Code Styles */
	.promo-code-container {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		padding: 1.5rem;
		margin-bottom: 1rem;
		box-shadow: var(--shadow-sm);
	}
	
	.promo-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}
	
	.promo-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
	}
	
	.promo-badge {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.25rem 0.75rem;
		background: var(--color-warning-100);
		color: var(--color-warning-700);
		border-radius: 9999px;
	}
	
	.promo-code-button {
		width: 100%;
		background: var(--bg-secondary);
		border: 2px dashed var(--color-primary-300);
		border-radius: 0.75rem;
		padding: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}
	
	.promo-code-button:hover {
		background: var(--color-primary-50);
		border-color: var(--color-primary-500);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}
	
	.promo-code {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: 0.1em;
	}
	
	.copy-icon {
		color: var(--text-tertiary);
		transition: color 0.2s ease;
	}
	
	.promo-code-button:hover .copy-icon {
		color: var(--color-primary-600);
	}
	
	.copy-feedback {
		font-size: 0.875rem;
		color: var(--color-success-600);
		text-align: center;
		margin-top: 0.5rem;
	}
	
	.action-button-container {
		margin-top: 1rem;
	}
	
	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 2rem;
		background: var(--color-primary-600);
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 1rem;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
	}
	
	.cta-button:hover {
		background: var(--color-primary-700);
		transform: translateY(-1px);
		box-shadow: 0 6px 8px rgba(37, 99, 235, 0.3);
	}
	
	@media (max-width: 768px) {
		.promo-code-container {
			padding: 1rem;
		}
		
		.promo-code {
			font-size: 1rem;
		}
		
		.cta-button {
			padding: 0.75rem 1.5rem;
			font-size: 0.9rem;
		}
		
		.calendar-preview-container {
			padding: 0 1rem;
		}
		
		.calendar-preview-header {
			text-align: center;
			margin-bottom: 1rem;
		}
	}
	
	/* Calendar Preview Styles */
	.calendar-preview-container {
		max-width: 900px;
		margin: 0 auto;
	}
	
	.calendar-preview-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}
	
	.calendar-preview-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		padding: 1.5rem;
		box-shadow: var(--shadow-lg);
		transition: all 0.3s ease;
	}
	
	.calendar-preview-card:hover {
		box-shadow: var(--shadow-xl);
		border-color: var(--border-secondary);
	}
	
	/* Calendar Preview Styles */
	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-primary);
	}
	
	.calendar-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}
	
	.calendar-badge {
		padding: 0.25rem 0.75rem;
		background: var(--color-primary-100);
		color: var(--color-primary-700);
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}
	
	.calendar-body {
		padding: 1rem 1.5rem;
	}
	
	.day-headers {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 1px;
		margin-bottom: 0.5rem;
	}
	
	.day-header {
		padding: 0.5rem;
		text-align: center;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
	}
	
	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 1px;
		background: var(--border-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		overflow: hidden;
	}
	
	.calendar-day {
		background: var(--bg-primary);
		padding: 0.75rem 0.5rem;
		min-height: 3.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		position: relative;
		transition: all 0.2s ease;
		cursor: pointer;
	}
	
	.calendar-day:hover {
		background: var(--bg-secondary);
	}
	
	.calendar-day.other-month {
		background: var(--bg-tertiary);
		color: var(--text-tertiary);
	}
	
	.calendar-day.today {
		background: var(--color-primary-50);
		border: 2px solid var(--color-primary-500);
	}
	
	.day-number {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}
	
	.calendar-day.other-month .day-number {
		color: var(--text-tertiary);
	}
	
	.slot-indicator {
		width: 0.375rem;
		height: 0.375rem;
		border-radius: 50%;
		background: var(--color-primary-500);
		margin-top: auto;
	}
	
	.calendar-footer {
		background: var(--bg-secondary);
		border-top: 1px solid var(--border-primary);
		padding: 1rem 1.5rem;
	}
	
	.calendar-stats {
		display: flex;
		justify-content: space-around;
	}
	
	.stat {
		text-align: center;
	}
	
	.stat-value {
		display: block;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1;
	}
	
	.stat-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}
	
	@media (max-width: 640px) {
		.calendar-preview-card {
			padding: 1rem;
		}
		
		.calendar-header {
			padding: 0.75rem 1rem;
			flex-direction: column;
			gap: 0.5rem;
		}
		
		.calendar-body {
			padding: 0.75rem 1rem;
		}
		
		.calendar-day {
			min-height: 2.5rem;
			padding: 0.5rem 0.25rem;
		}
		
		.day-number {
			font-size: 0.75rem;
		}
		
		.calendar-footer {
			padding: 0.75rem 1rem;
		}
		
		.stat-value {
			font-size: 1rem;
		}
	}
</style>

 