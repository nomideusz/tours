<script lang="ts">
	import { goto } from '$app/navigation';
	import Check from 'lucide-svelte/icons/check';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Euro from 'lucide-svelte/icons/euro';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import QrCode from 'lucide-svelte/icons/qr-code';
	
	function handleCreateTour() {
		goto('/beta/apply');
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
		<div class="card card--elevated step-card h-full flex flex-col">
			<div class="step-number-container mb-6 mx-auto">
				<div class="step-number step-number-coral">1</div>
			</div>
			<h3 class="card-title text-center mb-4">Create Your Tour</h3>
			<p class="card-description text-center pb-6">
				Add your tour details, set your price, and choose when you're available. Takes 2 minutes.
			</p>
			<div class="step-content-area flex-grow">
				<div class="card-item tour-preview-item">
					<div class="space-y-3 text-sm">
						<div class="flex justify-between items-center">
							<span class="text-primary font-medium">Walking Tour of Old Town</span>
							<span class="font-bold text-primary">€25</span>
						</div>
						<div class="text-secondary text-xs">Duration: 2 hours</div>
						<div class="flex gap-2 mt-3 justify-center">
							<span class="time-slot">10:00 AM</span>
							<span class="time-slot">2:00 PM</span>
							<span class="time-slot">5:00 PM</span>
						</div>
					</div>
				</div>
			</div>
		</div>
		<!-- Professional Arrow -->
		<div class="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
			<div class="professional-arrow">
				<ChevronRight class="w-4 h-4 text-primary" strokeWidth={2.5} />
			</div>
		</div>
	</div>
	
	<!-- Step 2: Get Your QR Code -->
	<div class="relative">
		<div class="card card--elevated step-card h-full flex flex-col">
			<div class="step-number-container mb-6 mx-auto">
				<div class="step-number step-number-orange">2</div>
			</div>
			<h3 class="card-title text-center mb-4">Get Your QR Code</h3>
			<p class="card-description text-center pb-6">
				Download your unique QR code. Print it on flyers, business cards, or display it anywhere.
			</p>
			<div class="step-content-area flex-grow">
				<div class="card-item qr-showcase-item">
					<div class="qr-code-display">
						<img 
							src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://zaur.app/?demo=true"
							alt="QR Code - Scan to see Zaur in action"
							class="w-20 h-20"
							title="Scan me to see Zaur in action!"
						/>
					</div>
				</div>
			</div>
		</div>
		<!-- Professional Arrow -->
		<div class="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
			<div class="professional-arrow">
				<ChevronRight class="w-4 h-4 text-primary" strokeWidth={2.5} />
			</div>
		</div>
	</div>
	
	<!-- Step 3: Get Instant Bookings -->
	<div class="card card--elevated step-card h-full flex flex-col">
		<div class="step-number-container mb-6 mx-auto">
			<div class="step-number step-number-success">
				<Check class="w-8 h-8 text-white" strokeWidth={2.5} />
			</div>
		</div>
		<h3 class="card-title text-center mb-4">Get Instant Bookings</h3>
		<p class="card-description text-center pb-6">
			Tourists scan your code, pick a time, pay securely, and you get a notification. That's it!
		</p>
		<div class="step-content-area flex-grow">
			<div class="card-item booking-notification-item">
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
</div>

<!-- Professional CTA -->
<div class="text-center mt-16">
	<p class="text-secondary mb-6 text-lg">Ready to start getting bookings?</p>
	<button onclick={handleCreateTour} class="button-primary button--large button--gap">
		Apply for Beta Access
		<ArrowRight class="w-4 h-4" strokeWidth={2} />
	</button>
</div>

<style>
	/* Professional badge with subtle retro border - matches HeroSection */
	.professional-badge {
		display: inline-block;
		background: var(--bg-primary);
		border: 2px solid var(--primary);
		color: var(--text-primary);
		padding: 0.5rem 1.5rem;
		border-radius: 2rem;
		font-weight: 600;
		font-size: 0.875rem;
		box-shadow: var(--shadow-sm);
	}

	/* Step cards - Enhanced with card system */
	.step-card {
		/* Card system handles base styling */
		text-align: center;
		overflow: visible; /* Allow step numbers to extend above */
		min-height: 350px; /* Ensure consistent minimum height */
	}
	
	/* Step content area for consistent height */
	.step-content-area {
		display: flex;
		flex-direction: column;
		justify-content: center; /* Center content vertically */
		min-height: 120px; /* Consistent content area height */
	}

	/* Make all step card items consistent height */
	.tour-preview-item,
	.qr-showcase-item,
	.booking-notification-item {
		min-height: 100px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Tour preview and QR showcase stack content vertically */
	.tour-preview-item,
	.qr-showcase-item {
		flex-direction: column;
	}

	/* Booking notification keeps horizontal layout */
	.booking-notification-item {
		flex-direction: row;
	}

	/* Ensure tour preview content flows properly */
	.tour-preview-item > * {
		width: 100%;
	}
	
	/* Top border animation removed for cleaner hover effect */

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
		background: var(--primary);
	}

	.step-number-orange {
		background: var(--warning);
	}

	.step-number-success {
		background: var(--success);
	}

	/* Card system handles most styling for tour preview, QR showcase, and booking notification */

	.time-slot {
		padding: 0.375rem 0.75rem;
		background: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		font-size: 0.75rem;
		font-weight: 500;
	}

	/* QR Code Showcase - inherits consistent height and centering from base rule above */

	.qr-code-display {
		background: white;
		padding: 1rem;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
		border: 1px solid var(--border-secondary);
	}

	/* QR code image styling for dark mode compatibility */

	/* Booking Notification - enhanced with card item */
	.booking-notification-item {
		border: 2px solid var(--primary);
		background: var(--bg-primary);
		/* Inherits consistent height and centering from base rule above */
	}

	.notification-icon {
		width: 3rem;
		height: 3rem;
		background: var(--primary);
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
		color: var(--primary);
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
		.step-card {
			min-height: auto; /* Remove fixed height on mobile */
		}
		
		.step-content-area {
			min-height: 100px; /* Smaller content area on mobile */
		}

		.tour-preview-item,
		.qr-showcase-item,
		.booking-notification-item {
			min-height: 80px; /* Smaller consistent height on mobile */
		}

		/* Maintain layout directions on mobile */
		.tour-preview-item,
		.qr-showcase-item {
			flex-direction: column;
		}

		.booking-notification-item {
			flex-direction: row;
		}

		.step-number {
			width: 3rem;
			height: 3rem;
			font-size: 1.25rem;
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