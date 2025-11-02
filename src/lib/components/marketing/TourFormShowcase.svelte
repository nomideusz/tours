<script lang="ts">
	/**
	 * Tour Form Showcase
	 * 
	 * Interactive demo of the tour creation form for marketing page
	 * Shows pre-filled beautiful example with feature highlights
	 * Read-only mode - demonstrates ease of use without actual submission
	 */
	import { onMount } from 'svelte';
	import TourForm from '$lib/components/TourForm.svelte';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Check from 'lucide-svelte/icons/check';
	
	// Pre-filled demo tour data
	let demoFormData = $state({
		name: 'Ancient Athens Walking Tour',
		description: '<h2>Discover Ancient Greece</h2><p>Join us for an unforgettable journey through the heart of ancient Athens. Walk in the footsteps of Socrates and Plato as we explore the iconic Acropolis, the historic Plaka district, and hidden gems known only to locals.</p><p><strong>Highlights:</strong></p><ul><li>Parthenon and Acropolis exploration</li><li>Ancient Agora marketplace</li><li>Traditional Greek neighborhood tour</li><li>Local food tastings</li></ul>',
		price: 45,
		duration: 180, // 3 hours
		capacity: 12,
		status: 'active' as const,
		categories: ['historical', 'cultural', 'walking'], // Use preset category IDs
		location: 'Acropolis, Athens, Greece',
		locationPlaceId: 'ChIJs9QmWRG9oRQR6rfRK66vt8E',
		languages: ['en', 'el'],
		includedItems: [
			'Professional tour guide',
			'Historical insights',
			'Photo opportunities',
			'Greek snack tasting',
			'Map and recommendations'
		],
		requirements: [
			'Comfortable walking shoes',
			'Basic fitness level',
			'Sun protection (summer)',
			'Water bottle recommended'
		],
		cancellationPolicy: '• Full refund if cancelled 24+ hours before tour\n• No refund if cancelled less than 24 hours before tour',
		cancellationPolicyId: 'flexible',
		pricingModel: 'participant_categories' as const,
		enablePricingTiers: false,
		participantCategories: {
			categories: [
				{
					id: 'adult',
					label: 'Adult (18-64)',
					price: 45,
					minAge: 18,
					maxAge: 64,
					sortOrder: 0,
					countsTowardCapacity: true
				},
				{
					id: 'child',
					label: 'Child (6-17)',
					price: 25,
					minAge: 6,
					maxAge: 17,
					sortOrder: 1,
					countsTowardCapacity: true
				},
				{
					id: 'senior',
					label: 'Senior (65+)',
					price: 35,
					minAge: 65,
					maxAge: 99,
					sortOrder: 2,
					countsTowardCapacity: true
				}
			],
			minCapacity: 2,
			maxCapacity: 12
		},
		groupDiscounts: {
			tiers: [
				{
					id: '1',
					minParticipants: 6,
					maxParticipants: 8,
					discountType: 'percentage' as const,
					discountValue: 10,
					label: 'Group of 6-8: 10% off'
				},
				{
					id: '2',
					minParticipants: 9,
					maxParticipants: 12,
					discountType: 'percentage' as const,
					discountValue: 15,
					label: 'Group of 9-12: 15% off'
				}
			],
			enabled: true
		},
		optionalAddons: {
			addons: [
				{
					id: '1',
					name: 'Museum Entry Tickets',
					description: 'Skip-the-line access to Acropolis Museum',
					price: 15,
					availableQuantity: 1,
					required: false
				}
			]
		},
		guidePaysStripeFee: false,
		countInfantsTowardCapacity: false,
		publicListing: true
	});
	
	let demoUploadedImages: File[] = $state([]);
	
	// Feature highlights that appear with scroll/animation
	let highlights = [
		{
			id: 'location',
			title: 'Smart Location Picker',
			description: 'Places API autocomplete with Street View preview',
			icon: '📍'
		},
		{
			id: 'pricing',
			title: 'Flexible Pricing Models',
			description: 'Per-person, private tours, group discounts, and add-ons',
			icon: '💰'
		},
		{
			id: 'rich-editor',
			title: 'Beautiful Rich Text Editor',
			description: 'Format your tour description with ease',
			icon: '✏️'
		},
		{
			id: 'photos',
			title: 'Drag & Drop Photos',
			description: 'Upload up to 6 images, automatic optimization',
			icon: '📸'
		}
	];
	
	function handleDemoCancel() {
		// Just scroll to CTA - don't actually cancel
		scrollToCTA();
	}
	
	function scrollToCTA() {
		const cta = document.getElementById('form-demo-cta');
		cta?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}
</script>

<div class="form-showcase">
	<!-- Section Header -->
	<div class="showcase-header">
		<h2 class="showcase-title">
			<Sparkles class="inline w-8 h-8 mr-2" style="color: var(--color-primary-600);" />
			Create Beautiful Tours in Minutes
		</h2>
		<p class="showcase-subtitle">
			Our intuitive form makes it easy to create professional tour listings. 
			Try the demo below - it's just like the real thing!
		</p>
	</div>
	
	<!-- Feature Highlights Bar -->
	<div class="features-bar">
		{#each highlights as highlight}
			<div class="feature-pill">
				<span class="feature-icon">{highlight.icon}</span>
				<div class="feature-text">
					<div class="feature-title">{highlight.title}</div>
					<div class="feature-desc">{highlight.description}</div>
				</div>
			</div>
		{/each}
	</div>
	
	<!-- Demo Notice Banner -->
	<div class="demo-notice">
		<div class="demo-badge">
			<Sparkles class="w-4 h-4" />
			<span>Interactive Demo</span>
		</div>
		<p>This is a preview of our tour creation form. Click around to explore the features!</p>
	</div>
	
	<!-- Form Container with Demo Overlay -->
	<div class="form-demo-container">
		<!-- Semi-transparent overlay to indicate it's a demo -->
		<div class="demo-overlay"></div>
		
		<!-- Actual Form (read-only style, but functional for demo purposes) -->
		<div class="form-wrapper">
			<TourForm
				bind:formData={demoFormData}
				bind:uploadedImages={demoUploadedImages}
				isSubmitting={false}
				isEdit={false}
				onCancel={handleDemoCancel}
				onSaveAsDraft={scrollToCTA}
				onPublish={scrollToCTA}
				imageUploadErrors={[]}
				serverErrors={[]}
				triggerValidation={false}
				hideStatusField={true}
				profile={{
					id: 'demo',
					username: 'demo-guide',
					name: 'Demo Guide',
					email: 'demo@example.com',
					emailVerified: true,
					stripeAccountId: 'demo_stripe_account',
					country: 'GR',
					currency: 'EUR',
					location: 'Athens, Greece',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				}}
				hasConfirmedLocation={true}
				paymentStatus={{ isSetup: true, loading: false }}
			/>
		</div>
	</div>
	
	<!-- CTA Section -->
	<div id="form-demo-cta" class="cta-section">
		<div class="cta-content">
			<h3 class="cta-title">Ready to Create Your Tours?</h3>
			<p class="cta-text">
				Join our beta and start creating professional tour listings in minutes. 
				No setup fees, no commitments.
			</p>
			<div class="cta-buttons">
				<a href="/beta-2/apply" class="button-primary button-large">
					Start Creating Tours
					<ArrowRight class="w-5 h-5 ml-2" />
				</a>
				<a href="#pricing" class="button-secondary button-large">
					View Pricing
				</a>
			</div>
			
			<!-- Trust indicators -->
			<div class="trust-indicators">
				<div class="trust-item">
					<Check class="w-4 h-4" style="color: var(--color-success-600);" />
					<span>No credit card required</span>
				</div>
				<div class="trust-item">
					<Check class="w-4 h-4" style="color: var(--color-success-600);" />
					<span>4 months free for beta users</span>
				</div>
				<div class="trust-item">
					<Check class="w-4 h-4" style="color: var(--color-success-600);" />
					<span>20% lifetime discount</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.form-showcase {
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
	}
	
	/* Header */
	.showcase-header {
		text-align: center;
		margin-bottom: 3rem;
	}
	
	.showcase-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.showcase-subtitle {
		font-size: 1.125rem;
		color: var(--text-secondary);
		max-width: 700px;
		margin: 0 auto;
	}
	
	/* Features Bar */
	.features-bar {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}
	
	.feature-pill {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		transition: all 0.2s ease;
	}
	
	.feature-pill:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		border-color: var(--color-primary-300);
	}
	
	.feature-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}
	
	.feature-text {
		flex: 1;
	}
	
	.feature-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}
	
	.feature-desc {
		font-size: 0.75rem;
		color: var(--text-secondary);
		line-height: 1.4;
	}
	
	/* Demo Notice */
	.demo-notice {
		background: linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-accent-50) 100%);
		border: 2px solid var(--color-primary-200);
		border-radius: 1rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
		text-align: center;
	}
	
	.demo-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--color-primary-600);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 2rem;
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
	}
	
	.demo-notice p {
		font-size: 0.9375rem;
		color: var(--text-secondary);
		margin: 0;
	}
	
	/* Form Container */
	.form-demo-container {
		position: relative;
		border-radius: 1rem;
		overflow: hidden;
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
		margin-bottom: 3rem;
	}
	
	.demo-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 8px; /* Account for scrollbar */
		bottom: 0;
		background: linear-gradient(
			to bottom,
			transparent 0%,
			transparent 90%,
			rgba(255, 255, 255, 0.4) 95%,
			rgba(255, 255, 255, 0.85) 100%
		);
		pointer-events: none;
		z-index: 10;
	}
	
	.form-wrapper {
		position: relative;
		padding: 2rem;
		max-height: 1200px; /* Taller to show pricing section */
		overflow-y: auto; /* Allow scrolling within the form */
		overflow-x: hidden;
	}
	
	/* Fix LocationPicker layout for demo */
	.form-wrapper :global(.location-picker-wrapper) {
		position: relative;
		isolation: isolate;
	}
	
	/* Ensure input has proper padding for icons */
	.form-wrapper :global(#location-input) {
		padding-left: 2.5rem !important;
		padding-right: 2.5rem !important;
	}
	
	/* Fix icon positioning - use translateY(0) for proper centering */
	.form-wrapper :global(.location-picker-wrapper .absolute.left-3) {
		left: 0.75rem !important;
		top: 50% !important;
		transform: translateY(0) !important;
		margin-top: 0 !important;
		position: absolute !important;
		z-index: 10 !important;
	}
	
	/* Specifically fix the clear button (X) positioning */
	.form-wrapper :global(.location-picker-wrapper .absolute.right-3) {
		right: 0.75rem !important;
		top: 50% !important;
		transform: translateY(0) !important;
		margin-top: 0 !important;
		position: absolute !important;
		z-index: 10 !important;
	}
	
	/* Hide the sidebar (save buttons) - not needed for demo */
	.form-wrapper :global(.tour-form-sidebar) {
		display: none !important;
	}
	
	/* Make form full-width without sidebar */
	.form-wrapper :global(.tour-form-grid) {
		grid-template-columns: 1fr !important;
	}
	
	/* Hide action buttons section */
	.form-wrapper :global(.action-buttons-section) {
		display: none !important;
	}
	
	/* AGGRESSIVE: Force all badge-like elements to exact same height */
	.form-wrapper :global(.category-chip),
	.form-wrapper :global(.language-chip),
	.form-wrapper :global(.requirement-chip),
	.form-wrapper :global(.item-chip),
	.form-wrapper :global(.location-action-button),
	.form-wrapper :global(button.category-chip),
	.form-wrapper :global(span.language-chip),
	.form-wrapper :global(button.language-chip),
	.form-wrapper :global(.category-selector button),
	.form-wrapper :global(.language-selector button),
	.form-wrapper :global(.chip-input .chip-item) {
		/* Force exact dimensions */
		height: 2rem !important;
		min-height: 2rem !important;
		max-height: 2rem !important;
		
		/* Force exact padding */
		padding-top: 0.5rem !important;
		padding-bottom: 0.5rem !important;
		padding-left: 0.75rem !important;
		padding-right: 0.75rem !important;
		
		/* Force layout */
		display: inline-flex !important;
		align-items: center !important;
		justify-content: center !important;
		gap: 0.375rem !important;
		
		/* Force text */
		line-height: 1 !important;
		font-size: 0.875rem !important;
		
		/* Force box model */
		box-sizing: border-box !important;
		vertical-align: middle !important;
	}
	
	/* Force icons inside badges to be consistent */
	.form-wrapper :global(.category-chip svg),
	.form-wrapper :global(.language-chip svg),
	.form-wrapper :global(.item-chip svg) {
		width: 0.875rem !important;
		height: 0.875rem !important;
		flex-shrink: 0 !important;
	}
	
	/* Make Meeting Point section visually balanced with Categories+Languages column */
	/* Target the specific row with Meeting Point */
	.form-wrapper :global(.grid.lg\\:grid-cols-2.gap-4) {
		align-items: start !important;
	}
	
	/* Set minimum height for both columns to be equal */
	.form-wrapper :global(.grid.lg\\:grid-cols-2.gap-4 > div) {
		min-height: 12rem !important;
		display: flex !important;
		flex-direction: column !important;
	}
	
	/* Make form-field-wrapper in Meeting Point expand */
	.form-wrapper :global(.grid.lg\\:grid-cols-2.gap-4 > div .form-field-wrapper) {
		flex: 1 !important;
		display: flex !important;
		flex-direction: column !important;
		justify-content: space-between !important;
	}
	
	/* Push location action buttons to the bottom */
	.form-wrapper :global(.location-actions-container) {
		margin-top: auto !important;
		padding-top: 0.5rem !important;
	}
	
	/* Custom scrollbar for form demo */
	.form-wrapper::-webkit-scrollbar {
		width: 10px;
	}
	
	.form-wrapper::-webkit-scrollbar-track {
		background: var(--bg-secondary);
		border-radius: 5px;
		margin: 0.5rem 0;
	}
	
	.form-wrapper::-webkit-scrollbar-thumb {
		background: var(--color-primary-300);
		border-radius: 5px;
		border: 2px solid var(--bg-secondary);
	}
	
	.form-wrapper::-webkit-scrollbar-thumb:hover {
		background: var(--color-primary-500);
	}
	
	/* CTA Section */
	.cta-section {
		background: linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-accent-600) 100%);
		border-radius: 1rem;
		padding: 3rem 2rem;
		text-align: center;
		color: white;
	}
	
	.cta-content {
		max-width: 600px;
		margin: 0 auto;
	}
	
	.cta-title {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: white;
	}
	
	.cta-text {
		font-size: 1.125rem;
		margin-bottom: 2rem;
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.6;
	}
	
	.cta-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}
	
	.button-large {
		padding: 1rem 2rem;
		font-size: 1.125rem;
		font-weight: 600;
		border-radius: 0.75rem;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		transition: all 0.2s ease;
	}
	
	.button-primary {
		background: white;
		color: var(--color-primary-600);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	
	.button-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
	}
	
	.button-secondary {
		background: transparent;
		color: white;
		border: 2px solid white;
	}
	
	.button-secondary:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: translateY(-2px);
	}
	
	/* Trust Indicators */
	.trust-indicators {
		display: flex;
		gap: 2rem;
		justify-content: center;
		flex-wrap: wrap;
	}
	
	.trust-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.9);
	}
	
	/* Mobile Responsiveness */
	@media (max-width: 768px) {
		.showcase-title {
			font-size: 1.875rem;
		}
		
		.showcase-subtitle {
			font-size: 1rem;
		}
		
		.features-bar {
			grid-template-columns: 1fr;
		}
		
		.form-wrapper {
			padding: 1rem;
			max-height: 600px;
		}
		
		.cta-title {
			font-size: 1.5rem;
		}
		
		.cta-text {
			font-size: 1rem;
		}
		
		.cta-buttons {
			flex-direction: column;
		}
		
		.button-large {
			width: 100%;
			justify-content: center;
		}
		
		.trust-indicators {
			flex-direction: column;
			gap: 0.75rem;
		}
	}
	
	/* Dark mode adjustments */
	:root[data-theme='dark'] .demo-overlay {
		background: linear-gradient(
			to bottom,
			transparent 0%,
			transparent 70%,
			rgba(0, 0, 0, 0.7) 85%,
			rgba(0, 0, 0, 0.95) 100%
		);
	}
	
	:root[data-theme='dark'] .demo-overlay {
		background: linear-gradient(
			to bottom,
			transparent 0%,
			transparent 90%,
			rgba(0, 0, 0, 0.5) 95%,
			rgba(0, 0, 0, 0.85) 100%
		);
	}
</style>

