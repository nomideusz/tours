<script lang="ts">
	/**
	 * Tour Form Showcase
	 * 
	 * Interactive demo of the tour creation form for marketing page
	 * Shows pre-filled beautiful example with feature highlights
	 * Mobile-first design with 95% smartphone users in mind
	 */
	import TourForm from '$lib/components/TourForm.svelte';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Check from 'lucide-svelte/icons/check';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Edit3 from 'lucide-svelte/icons/edit-3';
	import Camera from 'lucide-svelte/icons/camera';
	
	// Pre-filled demo tour data
	let demoFormData = $state({
		name: 'Ancient Athens Walking Tour',
		description: '<h2>Discover Ancient Greece</h2><p>Join us for an unforgettable journey through the heart of ancient Athens. Walk in the footsteps of Socrates and Plato as we explore the iconic Acropolis, the historic Plaka district, and hidden gems known only to locals.</p><p><strong>Highlights:</strong></p><ul><li>Parthenon and Acropolis exploration</li><li>Ancient Agora marketplace</li><li>Traditional Greek neighborhood tour</li><li>Local food tastings</li></ul>',
		price: 45,
		duration: 180, // 3 hours
		capacity: 12,
		status: 'active' as const,
		categories: ['historical', 'cultural', 'walking'],
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
	
	// Feature highlights
	let highlights = [
		{
			id: 'location',
			title: 'Smart Location',
			description: 'Places API',
			icon: MapPin
		},
		{
			id: 'pricing',
			title: 'Flexible Pricing',
			description: 'All options',
			icon: DollarSign
		},
		{
			id: 'rich-editor',
			title: 'Rich Editor',
			description: 'Easy formatting',
			icon: Edit3
		},
		{
			id: 'photos',
			title: 'Easy Photos',
			description: 'Drag & drop',
			icon: Camera
		}
	];
	
	function scrollToCTA() {
		const cta = document.getElementById('form-demo-cta');
		cta?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}
</script>

<section class="tour-form-showcase">
	<!-- Header -->
	<div class="showcase-header">
		<div class="showcase-icon">
			<Sparkles class="w-8 h-8" />
		</div>
		<h2 class="showcase-title">Create Tours in Minutes</h2>
		<p class="showcase-subtitle">
			Try our intuitive tour creation form
		</p>
	</div>
	
	<!-- Feature Pills -->
	<div class="feature-grid">
		{#each highlights as feature}
			<div class="feature-pill">
				<div class="feature-icon">
					{#if feature.icon}
						{@const Icon = feature.icon}
						<Icon class="w-5 h-5" />
					{/if}
				</div>
				<div class="feature-content">
					<h3 class="feature-title">{feature.title}</h3>
					<p class="feature-desc">{feature.description}</p>
				</div>
			</div>
		{/each}
	</div>
	
	<!-- Demo Badge -->
	<div class="demo-notice">
		<div class="demo-badge">
			<Sparkles class="w-4 h-4" />
			<span>Interactive Demo</span>
		</div>
		<p>Preview mode - explore the features!</p>
	</div>
	
	<!-- Form Demo -->
	<div class="form-container">
		<div class="form-wrapper">
			<TourForm
				bind:formData={demoFormData}
				bind:uploadedImages={demoUploadedImages}
				isSubmitting={false}
				isEdit={false}
				onCancel={scrollToCTA}
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
		<div class="form-overlay"></div>
	</div>
	
	<!-- CTA Section -->
	<div id="form-demo-cta" class="cta-section">
		<h3 class="cta-title">Ready to Start?</h3>
		<p class="cta-text">
			Join our beta today
		</p>
		
		<div class="cta-buttons">
			<a href="/beta-2/apply" class="btn-primary">
				Start Creating Tours
				<ArrowRight class="w-5 h-5" />
			</a>
			<a href="#pricing" class="btn-secondary">
				View Pricing
			</a>
		</div>
		
		<div class="trust-indicators">
			<div class="trust-item">
				<Check class="w-4 h-4" />
				<span>No credit card required</span>
			</div>
			<div class="trust-item">
				<Check class="w-4 h-4" />
				<span>4 months free for beta users</span>
			</div>
			<div class="trust-item">
				<Check class="w-4 h-4" />
				<span>20% lifetime discount</span>
			</div>
		</div>
	</div>
</section>

<style>
	/* Mobile-first design with clean, maintainable CSS */
	.tour-form-showcase {
		padding: 0.75rem;
		overflow-x: hidden;
		width: 100%;
		max-width: 100vw;
	}
	
	/* Header */
	.showcase-header {
		text-align: center;
		margin-bottom: 2rem;
	}
	
	.showcase-icon {
		display: flex;
		justify-content: center;
		margin-bottom: 1rem;
		color: var(--color-primary-600);
	}
	
	.showcase-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
		line-height: 1.3;
	}
	
	.showcase-subtitle {
		font-size: 0.9375rem;
		color: var(--text-secondary);
		line-height: 1.5;
		max-width: 500px;
		margin: 0 auto;
	}
	
	/* Feature Grid */
	.feature-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	
	.feature-pill {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 0.75rem;
		display: flex;
		gap: 0.625rem;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}
	
	.feature-icon {
		flex-shrink: 0;
		color: var(--color-primary-600);
	}
	
	.feature-content {
		flex: 1;
		min-width: 0;
	}
	
	.feature-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.125rem;
		line-height: 1.2;
	}
	
	.feature-desc {
		font-size: 0.6875rem;
		color: var(--text-secondary);
		line-height: 1.3;
	}
	
	/* Demo Notice */
	.demo-notice {
		background: var(--bg-secondary);
		border: 1px solid var(--color-primary-200);
		border-radius: 0.75rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
		text-align: center;
	}
	
	.demo-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		background: var(--color-primary-600);
		color: white;
		padding: 0.375rem 0.875rem;
		border-radius: 2rem;
		font-size: 0.75rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}
	
	.demo-notice p {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.4;
	}
	
	/* Form Container */
	.form-container {
		position: relative;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		overflow: hidden;
		margin-bottom: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}
	
	.form-wrapper {
		padding: 0.75rem;
		max-height: 70vh;
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
	}
	
	/* Remove scroll container on mobile */
	@media (max-width: 767px) {
		.form-wrapper {
			max-height: none;
			overflow-y: visible;
		}
	}
	
	/* Hide form buttons/sidebar for demo */
	.form-wrapper :global(.tour-form-sidebar),
	.form-wrapper :global(.action-buttons-section) {
		display: none;
	}
	
	.form-wrapper :global(.tour-form-grid) {
		grid-template-columns: 1fr;
	}
	
	/* Fix Meeting Point input X button positioning */
	.form-wrapper :global(.location-picker-wrapper) {
		position: relative;
	}
	
	.form-wrapper :global(.location-picker-wrapper input) {
		padding-right: 2.5rem !important;
		padding-left: 2.5rem !important;
	}
	
	/* Map icon */
	.form-wrapper :global(.location-picker-wrapper .absolute.left-3) {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		z-index: 10;
	}
	
	/* Clear button (X) */
	.form-wrapper :global(.location-picker-wrapper .absolute.right-3),
	.form-wrapper :global(.location-picker-wrapper button[aria-label="Clear location"]) {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		z-index: 10;
	}
	
	/* Fix icon positioning on narrow phones */
	@media (max-width: 430px) {
		.form-wrapper :global(.location-picker-wrapper .absolute.left-3),
		.form-wrapper :global(.location-picker-wrapper .absolute.right-3),
		.form-wrapper :global(.location-picker-wrapper button[aria-label="Clear location"]) {
			transform: none !important;
			top: 0.75rem !important;
			bottom: auto !important;
			margin-top: 0 !important;
		}
	}
	
	/* Mobile: Center/stretch badges and chips */
	@media (max-width: 767px) {
		/* Remove border on mobile for cleaner look */
		.form-container {
			border: none;
			box-shadow: none;
			background: transparent;
		}
		
		.form-wrapper :global(.category-chip),
		.form-wrapper :global(.language-chip),
		.form-wrapper :global(.item-chip),
		.form-wrapper :global(.requirement-chip),
		.form-wrapper :global(.chip-input .chip-item),
		.form-wrapper :global(.selected-categories > *),
		.form-wrapper :global(.selected-languages > *) {
			width: 100%;
			justify-content: space-between;
			text-align: left;
		}
		
		/* Fix categories alignment */
		.form-wrapper :global(.category-chip) {
			justify-content: flex-start !important;
		}
		
		/* Fix what's included and requirements text visibility - Opera compatible */
		.form-wrapper :global(.item-chip),
		.form-wrapper :global(.requirement-chip) {
			display: grid !important;
			grid-template-columns: 1fr auto !important;
			align-items: center !important;
			gap: 0.5rem !important;
			padding: 0.5rem 0.75rem !important;
		}
		
		.form-wrapper :global(.item-chip > span:first-of-type),
		.form-wrapper :global(.requirement-chip > span:first-of-type),
		.form-wrapper :global(.item-chip > :not(button)),
		.form-wrapper :global(.requirement-chip > :not(button)) {
			grid-column: 1 !important;
			display: block !important;
			white-space: normal !important;
			word-break: break-word !important;
			text-align: left !important;
			overflow-wrap: break-word !important;
		}
		
		/* Fix language chip content alignment */
		.form-wrapper :global(.language-chip > span:not(button)) {
			display: inline-flex !important;
			align-items: center !important;
			gap: 0.375rem !important;
			flex: 1 !important;
		}
		
		.form-wrapper :global(.chip-container),
		.form-wrapper :global(.selected-categories),
		.form-wrapper :global(.selected-languages),
		.form-wrapper :global(.chip-input-wrapper) {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}
		
		.form-wrapper :global(.category-selector),
		.form-wrapper :global(.language-selector) {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}
		
		.form-wrapper :global(.category-selector button),
		.form-wrapper :global(.language-selector button) {
			width: 100%;
			justify-content: center;
		}
		
		/* Ensure all form fields use full width on mobile */
		.form-wrapper :global(.form-input),
		.form-wrapper :global(.form-textarea),
		.form-wrapper :global(.form-select),
		.form-wrapper :global(input),
		.form-wrapper :global(textarea),
		.form-wrapper :global(select) {
			width: 100%;
		}
		
		/* Location action buttons should be stacked */
		.form-wrapper :global(.location-actions-container) {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}
		
		.form-wrapper :global(.location-action-button) {
			width: 100%;
			justify-content: center;
		}
	}
	
	/* Narrow phones specific fixes */
	@media (max-width: 430px) {
		/* Center the form container */
		.form-container {
			margin-left: auto;
			margin-right: auto;
			max-width: calc(100vw - 1rem);
		}
		
		/* Fix categories and languages alignment */
		.form-wrapper :global(.category-chip),
		.form-wrapper :global(.language-chip) {
			display: flex !important;
			align-items: center !important;
		}
		
		.form-wrapper :global(.category-chip) {
			justify-content: flex-start !important;
		}
		
		.form-wrapper :global(.language-chip) {
			justify-content: space-between !important;
		}
		
		/* Consistent badge heights and alignment */
		.form-wrapper :global(.category-chip),
		.form-wrapper :global(.language-chip),
		.form-wrapper :global(.selected-categories > *),
		.form-wrapper :global(.selected-languages > *) {
			height: 2.75rem !important;
			min-height: 2.75rem !important;
			display: flex !important;
			align-items: center !important;
			justify-content: space-between !important;
			padding: 0.5rem 0.75rem !important;
			gap: 0.5rem !important;
		}
		
		/* Item and requirement chips use grid for Opera compatibility */
		.form-wrapper :global(.item-chip),
		.form-wrapper :global(.requirement-chip),
		.form-wrapper :global(.chip-input .chip-item) {
			min-height: 2.75rem !important;
			display: grid !important;
			grid-template-columns: 1fr auto !important;
			align-items: center !important;
			padding: 0.5rem 0.75rem !important;
			gap: 0.5rem !important;
		}
		
		/* Badge text content */
		.form-wrapper :global(.category-chip > span:first-child),
		.form-wrapper :global(.language-chip > span:first-child),
		.form-wrapper :global(.category-chip > span:not(button)),
		.form-wrapper :global(.language-chip > span:not(button)) {
			flex: 1 !important;
			text-align: left !important;
			display: flex !important;
			align-items: center !important;
			gap: 0.375rem !important;
		}
		
		/* Item and requirement chips use grid, not flex */
		.form-wrapper :global(.item-chip > span:first-child),
		.form-wrapper :global(.requirement-chip > span:first-child),
		.form-wrapper :global(.item-chip > span:not(button)),
		.form-wrapper :global(.requirement-chip > span:not(button)) {
			grid-column: 1 !important;
			text-align: left !important;
			overflow-wrap: break-word !important;
			word-break: break-word !important;
		}
		
		/* Fix X button alignment in badges - Opera compatible */
		.form-wrapper :global(.category-chip button),
		.form-wrapper :global(.language-chip button) {
			margin-left: auto !important;
			position: relative !important;
			right: 0 !important;
			width: 1.5rem !important;
			height: 1.5rem !important;
			min-width: 1.5rem !important;
			padding: 0 !important;
			display: flex !important;
			align-items: center !important;
			justify-content: center !important;
			flex-shrink: 0 !important;
		}
		
		/* Fix X button for what's included and requirements - Grid layout for Opera */
		.form-wrapper :global(.item-chip button),
		.form-wrapper :global(.requirement-chip button),
		.form-wrapper :global(.chip-input .chip-item button) {
			grid-column: 2 !important;
			width: 1.5rem !important;
			height: 1.5rem !important;
			min-width: 1.5rem !important;
			max-width: 1.5rem !important;
			padding: 0 !important;
			display: flex !important;
			align-items: center !important;
			justify-content: center !important;
			flex-shrink: 0 !important;
			margin: 0 !important;
		}
		
		/* Stretch Add buttons */
		.form-wrapper :global(.chip-input button),
		.form-wrapper :global(.chip-input-wrapper button),
		.form-wrapper :global(button:has(.lucide-plus)),
		.form-wrapper :global(.chip-input > div:first-child button),
		.form-wrapper :global(.chip-input-actions button) {
			width: 100% !important;
			justify-content: center !important;
			height: 2.75rem !important;
			min-height: 2.75rem !important;
		}
		
		/* Fix cancellation policy radio buttons */
		.form-wrapper :global(.cancellation-policy-card),
		.form-wrapper :global(label:has(input[type="radio"])) {
			max-width: 100% !important;
			width: 100% !important;
			padding: 0.75rem !important;
		}
		
		.form-wrapper :global(input[type="radio"]) {
			width: 1.25rem !important;
			height: 1.25rem !important;
			flex-shrink: 0 !important;
		}
		
		/* Better spacing for radio content */
		.form-wrapper :global(label:has(input[type="radio"]) > div) {
			margin-left: 0.5rem !important;
		}
	}
	
	/* Scrollbar styling */
	.form-wrapper::-webkit-scrollbar {
		width: 6px;
	}
	
	.form-wrapper::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.form-wrapper::-webkit-scrollbar-thumb {
		background: var(--border-secondary);
		border-radius: 3px;
	}
	
	/* Fade overlay */
	.form-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 100px;
		background: linear-gradient(to bottom, transparent 0%, var(--bg-primary) 100%);
		pointer-events: none;
		z-index: 1;
	}
	
	/* Hide overlay on mobile since form isn't scrollable */
	@media (max-width: 767px) {
		.form-overlay {
			display: none;
		}
	}
	
	/* CTA Section */
	.cta-section {
		background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-600));
		border-radius: 0.75rem;
		padding: 2rem 1.5rem;
		text-align: center;
		color: white;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	}
	
	.cta-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.75rem;
		line-height: 1.3;
	}
	
	.cta-text {
		font-size: 0.9375rem;
		margin-bottom: 1.5rem;
		opacity: 0.95;
		line-height: 1.5;
	}
	
	.cta-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	
	.btn-primary,
	.btn-secondary {
		padding: 0.875rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.9375rem;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		width: 100%;
	}
	
	.btn-primary {
		background: white;
		color: var(--color-primary-600);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}
	
	.btn-secondary {
		background: transparent;
		color: white;
		border: 2px solid rgba(255, 255, 255, 0.9);
	}
	
	/* Trust Indicators */
	.trust-indicators {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
	}
	
	.trust-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		opacity: 0.95;
	}
	
	.trust-item :global(svg) {
		color: #10b981;
	}
	
	/* Tablet and larger */
	@media (min-width: 768px) {
		.tour-form-showcase {
			padding: 2rem;
		}
		
		.showcase-header {
			margin-bottom: 3rem;
		}
		
		.showcase-title {
			font-size: 2.25rem;
			margin-bottom: 1rem;
		}
		
		.showcase-subtitle {
			font-size: 1.125rem;
			max-width: 600px;
		}
		
		.feature-grid {
			grid-template-columns: repeat(4, 1fr);
			gap: 1rem;
			margin-bottom: 2.5rem;
		}
		
		.feature-pill {
			padding: 1rem;
		}
		
		.feature-pill:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		}
		
		.feature-title {
			font-size: 0.875rem;
			margin-bottom: 0.25rem;
		}
		
		.feature-desc {
			font-size: 0.75rem;
		}
		
		.demo-notice {
			padding: 1.5rem;
			margin-bottom: 2.5rem;
			border-radius: 1rem;
		}
		
		.demo-badge {
			font-size: 0.875rem;
			padding: 0.5rem 1rem;
			margin-bottom: 0.75rem;
		}
		
		.demo-notice p {
			font-size: 0.9375rem;
		}
		
		.form-container {
			border-radius: 1rem;
			margin-bottom: 3rem;
			border-width: 2px;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
		}
		
		.form-wrapper {
			padding: 2rem;
			max-height: 800px;
		}
		
		.cta-section {
			padding: 3rem 2rem;
			border-radius: 1rem;
		}
		
		.cta-title {
			font-size: 2rem;
			margin-bottom: 1rem;
		}
		
		.cta-text {
			font-size: 1.125rem;
			margin-bottom: 2rem;
		}
		
		.cta-buttons {
			flex-direction: row;
			justify-content: center;
			margin-bottom: 2rem;
		}
		
		.btn-primary,
		.btn-secondary {
			width: auto;
			padding: 1rem 2rem;
			font-size: 1.125rem;
		}
		
		.btn-primary:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
		}
		
		.btn-secondary:hover {
			background: rgba(255, 255, 255, 0.1);
			transform: translateY(-2px);
		}
		
		.trust-indicators {
			flex-direction: row;
			gap: 2rem;
		}
		
		.trust-item {
			font-size: 0.875rem;
		}
	}
	
	/* Desktop */
	@media (min-width: 1024px) {
		.tour-form-showcase {
			padding: 3rem;
			max-width: 1400px;
			margin: 0 auto;
		}
		
		.showcase-title {
			font-size: 2.5rem;
		}
		
		.form-wrapper {
			max-height: 1000px;
		}
		
		.form-overlay {
			height: 120px;
		}
	}
	
	/* Very small screens */
	@media (max-width: 480px) {
		.tour-form-showcase {
			padding: 0.5rem;
			display: flex;
			flex-direction: column;
			align-items: center;
		}
		
		.showcase-header,
		.feature-grid,
		.demo-notice,
		.form-container,
		.cta-section {
			width: 100%;
			max-width: 100%;
		}
		
		.form-wrapper {
			padding: 0.5rem;
		}
		
		.demo-notice {
			padding: 0.75rem;
		}
		
		.cta-section {
			padding: 1.5rem 1rem;
		}
	}
	
	@media (max-width: 360px) {
		.tour-form-showcase {
			padding: 0.375rem;
		}
		
		.showcase-title {
			font-size: 1.5rem;
		}
		
		.showcase-subtitle {
			font-size: 0.875rem;
		}
		
		.feature-grid {
			gap: 0.5rem;
			grid-template-columns: 1fr;
		}
		
		.feature-pill {
			padding: 0.625rem;
		}
		
		.form-wrapper {
			padding: 0.375rem;
		}
	}
	
	/* Dark mode adjustments */
	:root[data-theme='dark'] .tour-form-showcase {
		.showcase-icon {
			color: var(--color-primary-400);
		}
		
		.feature-pill {
			background: rgba(255, 255, 255, 0.05);
			border-color: var(--border-secondary);
			
			&:hover {
				background: rgba(255, 255, 255, 0.08);
				border-color: var(--color-primary-400);
			}
		}
		
		.feature-icon {
			color: var(--color-primary-400);
		}
		
		.demo-notice {
			background: rgba(255, 255, 255, 0.05);
			border-color: var(--color-primary-400);
		}
		
		.demo-badge {
			background: var(--color-primary-500);
		}
		
		.form-container {
			background: var(--bg-primary);
			border-color: var(--border-secondary);
			box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
		}
		
		.form-overlay {
			background: linear-gradient(to bottom, transparent 0%, var(--bg-primary) 100%);
		}
		
		/* Enhanced CTA section for dark mode */
		.cta-section {
			background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
			border: 1px solid rgba(255, 255, 255, 0.1);
		}
		
		.cta-title {
			color: white !important;
			text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		}
		
		.cta-text {
			color: rgba(255, 255, 255, 0.95) !important;
		}
		
		.btn-primary {
			background: white !important;
			color: #1e3a8a !important;
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
		}
		
		.btn-secondary {
			border-color: rgba(255, 255, 255, 0.9) !important;
			color: white !important;
			
			&:hover {
				background: rgba(255, 255, 255, 0.15) !important;
			}
		}
		
		.trust-item {
			color: rgba(255, 255, 255, 0.95) !important;
		}
		
		.trust-item :global(svg) {
			color: #10b981 !important;
		}
		
		/* Fix radio button visibility in dark mode */
		.form-wrapper :global(input[type="radio"]) {
			accent-color: var(--color-primary-400) !important;
			background-color: var(--bg-secondary) !important;
			border-color: var(--border-primary) !important;
			opacity: 1 !important;
		}
		
		.form-wrapper :global(input[type="radio"]:checked) {
			accent-color: var(--color-primary-400) !important;
		}
		
		/* Ensure radio button container has proper contrast */
		.form-wrapper :global(.cancellation-policy-card),
		.form-wrapper :global(label:has(input[type="radio"])) {
			background: rgba(255, 255, 255, 0.03);
			border-color: var(--border-secondary);
		}
	}
</style>