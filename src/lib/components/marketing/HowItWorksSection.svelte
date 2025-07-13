<script lang="ts">
	import { goto } from '$app/navigation';
	import Check from 'lucide-svelte/icons/check';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Euro from 'lucide-svelte/icons/euro';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import QrCode from 'lucide-svelte/icons/qr-code';
	
	function handleCreateTour() {
		goto('/auth/register');
	}
</script>

<div class="text-center mb-16">
	<div class="professional-badge mb-6">
		<span>How It Works</span>
	</div>
	<h2 class="marketing-heading marketing-heading-lg mb-4">
		Start Getting Bookings in Minutes
	</h2>
	<p class="text-lg text-secondary max-w-2xl mx-auto">
		No technical skills needed.
	</p>
</div>

<div class="grid md:grid-cols-3 gap-8">
	<!-- Step 1: Create Your Tour -->
	<div class="relative">
		<div class="professional-card h-full flex flex-col">
			<div class="step-number-container mb-6 mx-auto">
				<div class="step-number step-number-coral">1</div>
			</div>
			<h3 class="step-title text-center mb-4">Create Your Tour</h3>
			<p class="step-description text-center flex-grow mb-6">
				Add your tour details, set your price, and choose when you're available. Takes 2 minutes.
			</p>
			<div class="tour-preview-card">
				<div class="space-y-3 text-sm">
					<div class="flex justify-between items-center">
						<span class="text-primary font-medium">Walking Tour of Old Town</span>
						<span class="font-bold text-primary">€25</span>
					</div>
					<div class="text-secondary text-xs">Duration: 2 hours</div>
					<div class="flex gap-2 mt-3">
						<span class="time-slot">10:00 AM</span>
						<span class="time-slot">2:00 PM</span>
						<span class="time-slot">5:00 PM</span>
					</div>
				</div>
			</div>
		</div>
		<!-- Professional Arrow -->
		<div class="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
			<div class="professional-arrow">
				<ChevronRight class="w-4 h-4 text-coral" strokeWidth={2.5} />
			</div>
		</div>
	</div>
	
	<!-- Step 2: Get Your QR Code -->
	<div class="relative">
		<div class="professional-card h-full flex flex-col">
			<div class="step-number-container mb-6 mx-auto">
				<div class="step-number step-number-orange">2</div>
			</div>
			<h3 class="step-title text-center mb-4">Get Your QR Code</h3>
			<p class="step-description text-center flex-grow mb-6">
				Download your unique QR code. Print it on flyers, business cards, or display it anywhere.
			</p>
			<div class="qr-showcase-container">
				<div class="qr-code-display">
					<QrCode class="w-20 h-20 text-secondary" strokeWidth={1.5} />
				</div>
			</div>
		</div>
		<!-- Professional Arrow -->
		<div class="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
			<div class="professional-arrow">
				<ChevronRight class="w-4 h-4 text-coral" strokeWidth={2.5} />
			</div>
		</div>
	</div>
	
	<!-- Step 3: Get Instant Bookings -->
	<div class="professional-card h-full flex flex-col">
		<div class="step-number-container mb-6 mx-auto">
			<div class="step-number step-number-success">
				<Check class="w-8 h-8 text-white" strokeWidth={2.5} />
			</div>
		</div>
		<h3 class="step-title text-center mb-4">Get Instant Bookings</h3>
		<p class="step-description text-center flex-grow mb-6">
			Tourists scan your code, pick a time, pay securely, and you get a notification. That's it!
		</p>
		<div class="booking-notification">
			<div class="flex items-start gap-4">
				<div class="notification-icon">
					<Euro class="w-6 h-6 text-white" strokeWidth={2} />
				</div>
				<div class="notification-content">
					<div class="notification-title">New booking received!</div>
					<div class="notification-message">Sarah booked Walking Tour • +€25</div>
					<div class="notification-time">Just now</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Professional CTA -->
<div class="text-center mt-16">
	<p class="text-secondary mb-6 text-lg">Ready to start getting bookings?</p>
	<button onclick={handleCreateTour} class="button-coral button--large button--gap">
		Create Your First Tour
		<ArrowRight class="w-4 h-4" strokeWidth={2} />
	</button>
</div>

<style>
	/* Professional badge with subtle retro border - matches HeroSection */
	.professional-badge {
		display: inline-block;
		background: var(--bg-primary);
		border: 2px solid var(--color-coral-500);
		color: var(--text-primary);
		padding: 0.5rem 1.5rem;
		border-radius: 2rem;
		font-weight: 600;
		font-size: 0.875rem;
		box-shadow: var(--shadow-sm);
	}

	/* Professional cards - matches HeroSection trust cards */
	.professional-card {
		text-align: center;
		padding: 2rem 1.5rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		transition: all var(--transition-base) ease;
		box-shadow: var(--shadow-sm);
		position: relative;
		overflow: hidden;
	}
	
	/* Subtle accent line on hover - matches HeroSection */
	.professional-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-coral-500);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}
	
	.professional-card:hover::before {
		transform: scaleX(1);
	}
	
	.professional-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: var(--border-secondary);
	}

	/* Step Number Styling */
	.step-number-container {
		position: relative;
	}

	.step-number {
		width: 4rem;
		height: 4rem;
		border-radius: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 700;
		color: white;
		box-shadow: var(--shadow-lg);
	}

	.step-number-coral {
		background: var(--color-coral-500);
	}

	.step-number-orange {
		background: var(--color-warm-orange-500);
	}

	.step-number-success {
		background: var(--color-pro-teal-500);
	}

	/* Step Content Styling */
	.step-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.step-description {
		color: var(--text-secondary);
		line-height: 1.6;
	}

	/* Tour Preview Card - matches HeroSection promo card */
	.tour-preview-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		box-shadow: var(--shadow-md);
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

	/* QR Code Showcase */
	.qr-showcase-container {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		display: flex;
		justify-content: center;
		box-shadow: var(--shadow-sm);
	}

	.qr-code-display {
		background: white;
		padding: 1rem;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
		border: 1px solid var(--border-secondary);
	}

	/* Booking Notification */
	.booking-notification {
		background: var(--bg-primary);
		border: 2px solid var(--color-coral-500);
		border-radius: var(--radius-lg);
		padding: 1.25rem;
		box-shadow: var(--shadow-md);
	}

	.notification-icon {
		width: 3rem;
		height: 3rem;
		background: var(--color-coral-500);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		box-shadow: var(--shadow-md);
	}

	.notification-title {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 1rem;
	}

	.notification-message {
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}

	.notification-time {
		color: var(--color-coral-600);
		font-size: 0.75rem;
		margin-top: 0.25rem;
		font-weight: 500;
	}

	/* Professional Arrows - matches HeroSection style */
	.professional-arrow {
		width: 2rem;
		height: 2rem;
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--shadow-md);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.step-number {
			width: 3rem;
			height: 3rem;
			font-size: 1.25rem;
		}

		.step-title {
			font-size: 1.125rem;
		}

		.step-description {
			font-size: 0.9rem;
		}

		.time-slot {
			font-size: 0.6875rem;
			padding: 0.25rem 0.5rem;
		}

		.notification-icon {
			width: 2.5rem;
			height: 2.5rem;
		}

		.notification-title {
			font-size: 0.9rem;
		}

		.notification-message {
			font-size: 0.875rem;
		}
	}
</style> 