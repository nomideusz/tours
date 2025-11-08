<script lang="ts">
	import { goto } from '$app/navigation';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Calendar from 'lucide-svelte/icons/calendar';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Euro from 'lucide-svelte/icons/euro';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import BetaBadge from '$lib/components/ui/BetaBadge.svelte';
	
	function handleJoinWaitlist() {
		goto('/beta-2/apply');
	}
</script>

<!-- Simple Header -->
<div class="section-header">
	<BetaBadge text="Simple. Powerful. QR-Based." icon={QrCode} variant="large" class="mb-6" />
	<h2 class="section-title">
		The Simplest Booking System with QR Codes
	</h2>
	<p class="section-subtitle">
		Three steps. No complications. Just results.
	</p>
</div>

<!-- Simple Process with Visual Examples -->
<div class="process-container">
	<div class="simple-process">
		<!-- Step 1: Create & Schedule -->
		<div class="process-step group">
			<div class="process-dot process-dot--primary">
				<QrCode class="w-5 h-5" />
			</div>
			<div class="process-content">
				<div class="process-number">1</div>
				<h3 class="process-title">Create Your QR Code</h3>
				<p class="process-description">
					Add tour details and schedule in 2 minutes. Get your unique QR code instantly.
				</p>
				<!-- Visual Example -->
				<div class="process-example">
					<div class="qr-code-mini">
						<img 
							src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=https://zaur.app/?demo=true"
							alt="QR Code Example"
							class="w-15 h-15"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Step 2: Share Anywhere -->
		<div class="process-step group">
			<div class="process-dot process-dot--primary">
				<Calendar class="w-5 h-5" />
			</div>
			<div class="process-content">
				<div class="process-number">2</div>
				<h3 class="process-title">Share Anywhere</h3>
				<p class="process-description">
					Print on flyers, business cards, or display digitally. Customers scan to see availability.
				</p>
				<!-- Visual Example -->
				<div class="process-example">
					<div class="time-slots-preview">
						<span class="time-slot">10:00</span>
						<span class="time-slot">14:00</span>
						<span class="time-slot">17:00</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Step 3: Get Paid -->
		<div class="process-step group">
			<div class="process-dot process-dot--primary">
				<CreditCard class="w-5 h-5" />
			</div>
			<div class="process-content">
				<div class="process-number">3</div>
				<h3 class="process-title">Get Booked & Paid</h3>
				<p class="process-description">
					Instant bookings, secure payments. You keep 100% of the revenue.
				</p>
				<!-- Visual Example -->
				<div class="process-example">
					<div class="booking-notification">
						<div class="notification-dot">
							<Euro class="w-3 h-3" />
						</div>
						<span class="notification-text">New booking! +€25</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Simple Promise -->
<div class="cta-section">
	<div class="cta-content">
		<h3 class="cta-title">
			That's it. Really.
		</h3>
		<p class="cta-description">
			No complicated dashboards. No overwhelming features. Just the simplest way to turn QR codes into bookings.
		</p>
		<div class="cta-actions">
			<button onclick={handleJoinWaitlist} class="button-primary button-large button-gap">
				Apply for Beta 2
				<ArrowRight class="w-4 h-4" />
			</button>
		</div>
	</div>
</div>

<style>
	/* Process Container */
	.process-container {
		max-width: 64rem; /* 1024px - matches typical content width */
		margin: 0 auto;
	}
	
	/* Simple Process Flow - clean and minimal */
	.simple-process {
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	.process-step {
		display: flex;
		align-items: flex-start;
		gap: 1.5rem;
		transition: all 0.3s ease;
	}

	.process-step:hover {
		transform: translateX(8px);
	}

	.process-dot {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.process-dot--primary {
		background: var(--primary);
		color: white;
	}

	.group:hover .process-dot {
		transform: scale(1.1);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
	}

	.process-content {
		flex: 1;
		padding-top: 0.5rem;
	}

	.process-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		background: var(--bg-secondary);
		color: var(--text-tertiary);
		border-radius: 50%;
		font-size: 0.75rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
	}

	.process-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
		transition: color 0.3s ease;
	}

	.group:hover .process-title {
		color: var(--primary);
	}

	.process-description {
		color: var(--text-secondary);
		line-height: 1.6;
		margin-bottom: 1rem;
	}

	/* Visual Examples */
	.process-example {
		margin-top: 1rem;
	}

	.qr-code-mini {
		display: inline-block;
		background: white;
		padding: 0.5rem;
		border-radius: var(--radius-md);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border: 1px solid var(--border-secondary);
	}

	.time-slots-preview {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.time-slot {
		padding: 0.375rem 0.75rem;
		background: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		font-size: 0.75rem;
		font-weight: 500;
	}

	.booking-notification {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--primary);
		border-radius: var(--radius-md);
	}

	.notification-dot {
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
		color: var(--text-primary);
		font-weight: 500;
		font-size: 0.875rem;
	}

	/* Section Header */
	.section-header {
		text-align: center;
		margin-bottom: 3rem;
		max-width: 48rem; /* Constrain header width like other sections */
		margin-left: auto;
		margin-right: auto;
	}
	
	.section-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.2;
		margin-bottom: 1rem;
	}
	
	.section-subtitle {
		font-size: 1.125rem;
		color: var(--text-secondary);
		max-width: 42rem;
		margin: 0 auto;
	}
	
	/* CTA Section */
	.cta-section {
		margin-top: 3rem;
		text-align: center;
	}
	
	.cta-content {
		max-width: 32rem;
		margin: 0 auto;
	}
	
	.cta-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}
	
	.cta-description {
		font-size: 1rem;
		color: var(--text-secondary);
		margin-bottom: 2rem;
		line-height: 1.6;
	}
	
	.cta-actions {
		display: flex;
		justify-content: center;
	}
	
	/* Mobile responsive */
	@media (max-width: 640px) {
		/* Header adjustments */
		.section-header {
			margin-bottom: 2rem;
		}
		
		.section-title {
			font-size: 1.75rem;
			line-height: 1.15;
			margin-bottom: 0.75rem;
		}
		
		.section-subtitle {
			font-size: 0.9375rem;
			line-height: 1.5;
		}
		
		/* Process adjustments */
		.simple-process {
			gap: 2rem;
		}
		
		.process-step {
			gap: 1rem;
		}
		
		.process-dot {
			width: 2.75rem;
			height: 2.75rem;
		}
		
		.process-number {
			width: 1.25rem;
			height: 1.25rem;
			font-size: 0.625rem;
			margin-bottom: 0.5rem;
		}
		
		.process-title {
			font-size: 1.125rem;
			line-height: 1.3;
		}
		
		.process-description {
			font-size: 0.875rem;
			line-height: 1.5;
		}
		
		/* Visual examples */
		.process-example {
			margin-top: 0.75rem;
		}
		
		.qr-code-mini {
			padding: 0.375rem;
		}
		
		.qr-code-mini img {
			width: 50px;
			height: 50px;
		}

		.time-slot {
			font-size: 0.625rem;
			padding: 0.25rem 0.5rem;
		}

		.booking-notification {
			padding: 0.5rem 0.75rem;
			font-size: 0.75rem;
		}

		.notification-dot {
			width: 1.5rem;
			height: 1.5rem;
		}

		.notification-text {
			font-size: 0.75rem;
		}
		
		/* CTA section */
		.cta-section {
			margin-top: 2.5rem;
		}
		
		.cta-title {
			font-size: 1.125rem;
			margin-bottom: 0.75rem;
		}
		
		.cta-description {
			font-size: 0.875rem;
			margin-bottom: 1.5rem;
		}
		
		/* Full-width button on mobile */
		.cta-actions button {
			width: 100%;
			padding: 1rem;
			font-size: 1rem;
		}
	}
	
	/* Very small phones */
	@media (max-width: 360px) {
		.section-title {
			font-size: 1.5rem;
		}
		
		.process-title {
			font-size: 1rem;
		}
		
		.process-description {
			font-size: 0.8125rem;
		}
	}

	/* Tablet and up - horizontal layout */
	@media (min-width: 768px) {
		.simple-process {
			flex-direction: row;
			gap: 2rem;
			align-items: flex-start;
		}

		.process-step {
			flex: 1;
			flex-direction: column;
			text-align: center;
			gap: 1rem;
		}

		.process-step:hover {
			transform: translateY(-8px);
		}

		.process-dot {
			margin: 0 auto;
		}

		.process-content {
			padding-top: 0;
		}

		.process-number {
			margin: 0 auto 0.75rem auto;
		}

		.process-example {
			display: flex;
			justify-content: center;
		}
	}
</style> 