<script lang="ts">
	/**
	 * Tour Form Showcase
	 * 
	 * Interactive demo of the tour creation form for marketing page
	 * Shows pre-filled beautiful example with feature highlights
	 * Mobile-first design with 95% smartphone users in mind
	 */
	import TourForm from '$lib/components/TourForm.svelte';
	
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
</script>

<section class="tour-form-showcase">
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-16 py-8 sm:py-20">
		
		<!-- Section Divider -->
		<hr class="section-divider" aria-hidden="true" />
		
	<!-- Header -->
	<div class="showcase-header">
		<h2 class="showcase-title">Create Tours in Minutes</h2>
		<p class="showcase-subtitle">
				Explore our intuitive tour creation form
		</p>
	</div>
	
	<!-- Form Demo -->
	<div class="form-container">
		<div class="form-wrapper">
			<TourForm
				bind:formData={demoFormData}
				bind:uploadedImages={demoUploadedImages}
				isSubmitting={false}
				isEdit={false}
				onCancel={() => {}}
				onSaveAsDraft={() => {}}
				onPublish={() => {}}
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
	
	</div>
</section>

<style>
	/* Section Background - Clean & Professional */
	.tour-form-showcase {
		background: linear-gradient(
			180deg,
			var(--bg-secondary) 0%,
			var(--bg-primary) 100%
		);
		position: relative;
		overflow: hidden;
	}
	
	/* Section Divider */
	.section-divider {
		border: none;
		max-width: 14rem;
		height: 8px;
		background: transparent;
		margin: 0 auto 4rem;
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
		box-shadow: 0 0 0 2px var(--bg-secondary);
	}
	
	/* Header */
	.showcase-header {
		text-align: center;
		margin-bottom: 3rem;
		max-width: 48rem;
		margin-left: auto;
		margin-right: auto;
	}
	
	.showcase-title {
		font-size: 2rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 1rem;
		line-height: 1.2;
		letter-spacing: -0.025em;
	}
	
	.showcase-subtitle {
		font-size: 1.0625rem;
		color: var(--text-secondary);
		line-height: 1.6;
		letter-spacing: -0.01em;
		max-width: 36rem;
		margin: 0 auto;
	}
	
	/* Form Container */
	.form-container {
		position: relative;
		background: var(--bg-secondary);
		border: 2px solid var(--border-primary);
		border-radius: 0.75rem;
		overflow: hidden;
		margin-bottom: 2rem;
		box-shadow: 
			0 4px 16px rgba(0, 0, 0, 0.08),
			0 0 0 1px rgba(var(--color-accent-600-rgb), 0.05);
	}
	
	.form-wrapper {
		padding: 0.75rem;
		max-height: 70vh;
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
	}
	
	/* Mobile improvements */
	@media (max-width: 767px) {
		/* Section spacing */
		.section-divider {
			margin: 0 auto 3rem;
			max-width: 10rem;
		}
		
		/* Header spacing */
		.showcase-header {
			margin-bottom: 2rem;
			padding: 0;
		}
		
		.showcase-title {
			font-size: 1.75rem;
			line-height: 1.15;
			margin-bottom: 0.75rem;
		}
		
		.showcase-subtitle {
			font-size: 0.9375rem;
			line-height: 1.5;
		}
		
		/* Form container on mobile - remove padding since outer wrapper already provides it */
		.form-wrapper {
			max-height: none;
			overflow-y: visible;
			padding: 0;
		}
		
		/* Better spacing for form sections */
		.form-wrapper :global(.form-section),
		.form-wrapper :global(.tour-form-section),
		.form-wrapper :global(.form-field) {
			margin-bottom: 1.25rem;
		}
		
		/* Tour Name input needs top padding - first field in form */
		.form-wrapper :global(.tour-form-main > div:first-child),
		.form-wrapper :global(.tour-form-main > div:first-child .form-field-wrapper),
		.form-wrapper :global(.tour-name-input) {
			padding-top: 1rem;
			margin-top: 0;
		}
		
		/* Target the grid container that holds Tour Name */
		.form-wrapper :global(.grid:first-child) {
			margin-top: 1rem;
		}
	}
	
	/* Hide form buttons/sidebar for demo */
	.form-wrapper :global(.tour-form-sidebar),
	.form-wrapper :global(.action-buttons-section) {
		display: none;
	}
	
	/* Base radio button size for all screens - custom styled like cancellation policies */
	.form-wrapper :global(input[type="radio"]),
	.form-wrapper :global(.form-radio),
	.form-wrapper :global(input.form-radio),
	.form-wrapper :global(label input[type="radio"]),
	.form-wrapper :global(.cancellation-policy-card input[type="radio"]),
	.form-wrapper :global(* input[type="radio"]) {
		width: 1.125rem !important;
		height: 1.125rem !important;
		min-width: 1.125rem !important;
		min-height: 1.125rem !important;
		max-width: 1.125rem !important;
		max-height: 1.125rem !important;
		flex-shrink: 0 !important;
		padding: 0 !important;
		opacity: 1 !important;
		visibility: visible !important;
		display: inline-block !important;
		appearance: none !important;
		-webkit-appearance: none !important;
		-moz-appearance: none !important;
		cursor: pointer !important;
		vertical-align: middle !important;
		margin: 0 !important;
		position: relative !important;
		/* Custom radio button styling */
		color: var(--color-accent-600) !important;
		border: 2px solid var(--border-primary) !important;
		background-color: var(--bg-primary) !important;
		border-radius: 50% !important;
		transition: all var(--transition-fast) ease !important;
	}
	
	/* Custom radio button hover state */
	.form-wrapper :global(input[type="radio"]:hover),
	.form-wrapper :global(.form-radio:hover),
	.form-wrapper :global(input.form-radio:hover) {
		border-color: var(--color-accent-400) !important;
	}
	
	/* Custom radio button focus state */
	.form-wrapper :global(input[type="radio"]:focus),
	.form-wrapper :global(.form-radio:focus),
	.form-wrapper :global(input.form-radio:focus) {
		outline: none !important;
		outline-offset: 0 !important;
		border-color: var(--color-accent-600) !important;
		box-shadow: 0 0 0 3px rgba(var(--color-accent-600-rgb), 0.1) !important;
	}
	
	.form-wrapper :global(input[type="radio"]:focus-visible),
	.form-wrapper :global(.form-radio:focus-visible),
	.form-wrapper :global(input.form-radio:focus-visible) {
		outline: none !important;
		border-color: var(--color-accent-600) !important;
		box-shadow: 0 0 0 3px rgba(var(--color-accent-600-rgb), 0.1) !important;
	}
	
	/* Custom radio button checked state */
	.form-wrapper :global(input[type="radio"]:checked),
	.form-wrapper :global(.form-radio:checked),
	.form-wrapper :global(input.form-radio:checked) {
		border-color: var(--color-accent-600) !important;
		background-color: var(--color-accent-600) !important;
	}
	
	/* Custom radio button checked inner circle */
	.form-wrapper :global(input[type="radio"]:checked)::before,
	.form-wrapper :global(.form-radio:checked)::before,
	.form-wrapper :global(input.form-radio:checked)::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 0.375rem;
		height: 0.375rem;
		background-color: white;
		border-radius: 50%;
	}
	
	/* Custom radio button checked hover state */
	.form-wrapper :global(input[type="radio"]:checked:hover),
	.form-wrapper :global(.form-radio:checked:hover),
	.form-wrapper :global(input.form-radio:checked:hover) {
		border-color: var(--color-accent-700) !important;
		background-color: var(--color-accent-700) !important;
	}
	
	/* Custom radio button checked focus state */
	.form-wrapper :global(input[type="radio"]:checked:focus),
	.form-wrapper :global(.form-radio:checked:focus),
	.form-wrapper :global(input.form-radio:checked:focus) {
		border-color: var(--color-accent-600) !important;
		background-color: var(--color-accent-600) !important;
		box-shadow: 0 0 0 3px rgba(var(--color-accent-600-rgb), 0.1) !important;
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
		/* Only fix the left icon (map pin), keep the X button at top */
		.form-wrapper :global(.location-picker-wrapper .absolute.left-3) {
			transform: none !important;
			bottom: auto !important;
			margin-top: 0 !important;
		}
		
		/* Position the X button and search icon at top with no transform */
		.form-wrapper :global(.location-picker-wrapper .absolute.right-3),
		.form-wrapper :global(.location-picker-wrapper button[aria-label="Clear location"]) {
			transform: none !important;
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
			margin-bottom: 1.5rem;
		}
		
		/* Better form field spacing */
		.form-wrapper :global(label),
		.form-wrapper :global(.form-label) {
			font-size: 0.875rem;
			margin-bottom: 0.5rem;
		}
		
		/* Better input spacing */
		.form-wrapper :global(input),
		.form-wrapper :global(textarea),
		.form-wrapper :global(select) {
			font-size: 1rem;
			padding: 0.75rem;
		}
		
		/* Exclude radio buttons from general padding - they have their own sizing */
		.form-wrapper :global(input[type="radio"]),
		.form-wrapper :global(.form-radio),
		.form-wrapper :global(input.form-radio) {
			padding: 0 !important;
			font-size: inherit !important;
			opacity: 1 !important;
			visibility: visible !important;
			display: inline-block !important;
			width: 1rem !important;
			height: 1rem !important;
			appearance: none !important;
			-webkit-appearance: none !important;
			-moz-appearance: none !important;
			border: 2px solid var(--border-primary) !important;
			background-color: var(--bg-primary) !important;
			border-radius: 50% !important;
			vertical-align: middle !important;
		}
		
		/* Align all radio button labels to middle */
		.form-wrapper :global(.stripe-fee-selector .option),
		.form-wrapper :global(label:has(input[type="radio"])) {
			align-items: center !important;
		}
		
		.form-wrapper :global(.stripe-fee-selector .option input[type="radio"]),
		.form-wrapper :global(label:has(input[type="radio"]) input[type="radio"]) {
			margin-top: 0 !important;
			vertical-align: middle !important;
			align-self: center !important;
		}
		
		/* Exclude discount inputs from general padding - they have their own sizing */
		.form-wrapper :global(.discount-number-input),
		.form-wrapper :global(.discount-input),
		.form-wrapper :global(.custom-discount-input input),
		.form-wrapper :global(input.discount-number-input),
		.form-wrapper :global(input.discount-input) {
			padding: 0.25rem 0.375rem !important;
			font-size: 0.75rem !important;
			min-height: 2rem !important;
			height: 2rem !important;
			max-height: 2rem !important;
		}
		
		/* Tour Name input top padding on mobile */
		.form-wrapper :global(.tour-name-input) {
			margin-top: 1rem;
		}
		
		/* Smaller font size for tour description editor on mobile */
		.form-wrapper :global(.tipex-description-editor),
		.form-wrapper :global(.tipex-description-editor .ProseMirror),
		.form-wrapper :global(.tipex-description-editor p),
		.form-wrapper :global(.tipex-description-editor h2),
		.form-wrapper :global(.tipex-description-editor h3),
		.form-wrapper :global(.tipex-description-editor ul),
		.form-wrapper :global(.tipex-description-editor li) {
			font-size: 0.875rem;
		}
		
		.form-wrapper :global(.tipex-description-editor h2) {
			font-size: 1rem;
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
			align-content: center !important;
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
		
		/* Fix language chip content alignment - flag and text together */
		.form-wrapper :global(.language-chip) {
			display: flex !important;
			align-items: center !important;
			justify-content: flex-start !important;
			gap: 0.25rem !important;
		}
		
		/* Group flag and text together on the left */
		.form-wrapper :global(.language-chip > span:not(button)) {
			display: inline-flex !important;
			align-items: center !important;
			gap: 0.25rem !important;
			flex: 0 1 auto !important;
			text-align: left !important;
			justify-content: flex-start !important;
			margin-right: auto !important;
		}
		
		/* Ensure language chip text (chip-name) is left-aligned */
		.form-wrapper :global(.language-chip .chip-name),
		.form-wrapper :global(.language-chip span:not(.chip-flag):not(button)) {
			text-align: left !important;
			justify-content: flex-start !important;
		}
		
		/* Ensure flag icon is properly aligned and smaller */
		.form-wrapper :global(.language-chip .chip-flag) {
			flex-shrink: 0 !important;
			flex-grow: 0 !important;
			text-align: left !important;
			font-size: 0.875rem !important;
			width: auto !important;
			min-width: 0 !important;
			max-width: none !important;
			line-height: 1 !important;
			margin-right: 0.25rem !important;
			display: inline-block !important;
		}
		
		/* Ensure chip-name is left-aligned and not taking too much space */
		.form-wrapper :global(.language-chip .chip-name) {
			text-align: left !important;
			flex: 0 1 auto !important;
			margin-left: 0 !important;
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
			justify-content: flex-start !important;
		}
		
		/* Consistent badge heights and alignment */
		.form-wrapper :global(.category-chip),
		.form-wrapper :global(.language-chip),
		.form-wrapper :global(.selected-categories > *),
		.form-wrapper :global(.selected-languages > *) {
			height: 2.75rem !important;
			min-height: 2.75rem !important;
			max-height: 2.75rem !important;
			display: flex !important;
			align-items: center !important;
			justify-content: space-between !important;
			padding: 0.5rem 0.75rem !important;
			gap: 0.5rem !important;
		}
		
		/* Language chip specific - flag and text together on left */
		.form-wrapper :global(.language-chip) {
			justify-content: flex-start !important;
		}
		
		/* Group flag and name together */
		.form-wrapper :global(.language-chip .chip-flag),
		.form-wrapper :global(.language-chip .chip-name) {
			margin-right: 0.25rem !important;
		}
		
		/* Push button to the right */
		.form-wrapper :global(.language-chip .chip-remove) {
			margin-left: auto !important;
		}
		
		/* Item and requirement chips use grid for Opera compatibility */
		.form-wrapper :global(.item-chip),
		.form-wrapper :global(.requirement-chip),
		.form-wrapper :global(.chip-input .chip-item) {
			height: 2.75rem !important;
			min-height: 2.75rem !important;
			max-height: 2.75rem !important;
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
			flex: 0 1 auto !important;
			text-align: left !important;
			display: flex !important;
			align-items: center !important;
			gap: 0.375rem !important;
		}
		
		/* Item and requirement chips use grid, not flex */
		.form-wrapper :global(.item-chip > span:first-child),
		.form-wrapper :global(.requirement-chip > span:first-child),
		.form-wrapper :global(.item-chip > span:not(button)),
		.form-wrapper :global(.requirement-chip > span:not(button)),
		.form-wrapper :global(.item-chip .chip-text),
		.form-wrapper :global(.requirement-chip .chip-text) {
			grid-column: 1 !important;
			text-align: left !important;
			overflow-wrap: break-word !important;
			word-break: break-word !important;
			display: block !important;
			align-self: center !important;
			line-height: 1.5 !important;
			margin: 0 !important;
			padding: 0 !important;
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
		.form-wrapper :global(.item-chip .chip-remove),
		.form-wrapper :global(.requirement-chip .chip-remove),
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
			align-self: center !important;
			flex-shrink: 0 !important;
			margin: 0 !important;
			margin-left: auto !important;
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
		
		/* Add bottom padding to cancellation policy card */
		.form-wrapper :global(.form-section-card) {
			padding-bottom: 1.5rem !important;
			margin-bottom: 1.5rem !important;
		}
		
		/* Make cancellation policy card more distinctive */
		.form-wrapper :global(.form-section-card) {
			background: transparent !important;
			border: none !important;
			border-radius: var(--radius-xl) !important;
			box-shadow: none !important;
		}
		
		/* Fix cancellation policy radio buttons */
		.form-wrapper :global(.cancellation-policy-card),
		.form-wrapper :global(label:has(input[type="radio"])) {
			max-width: 100% !important;
			width: 100% !important;
			padding: 0.625rem !important;
			display: flex !important;
			align-items: center !important;
		}
		
		/* Add bottom padding to cancellation policy card content */
		.form-wrapper :global(.form-section-card > div:last-child) {
			padding-bottom: 1rem !important;
		}
		
		/* Cancellation Policy section - reduce padding and spacing */
		.form-wrapper :global(.cancellation-policy-card > div),
		.form-wrapper :global(.cancellation-policy-card .space-y-3) {
			gap: 0.5rem !important;
		}
		
		.form-wrapper :global(input[type="radio"]),
		.form-wrapper :global(.form-radio),
		.form-wrapper :global(input.form-radio),
		.form-wrapper :global(label input[type="radio"]),
		.form-wrapper :global(.cancellation-policy-card input[type="radio"]) {
			width: 1rem !important;
			height: 1rem !important;
			max-width: 1rem !important;
			max-height: 1rem !important;
			flex-shrink: 0 !important;
			min-width: 1rem !important;
			min-height: 1rem !important;
			appearance: none !important;
			-webkit-appearance: none !important;
			-moz-appearance: none !important;
			border: 2px solid var(--border-primary) !important;
			background-color: var(--bg-primary) !important;
			border-radius: 50% !important;
			margin-top: 0 !important;
			align-self: center !important;
			vertical-align: middle !important;
		}
		
		/* Custom radio button checked inner circle on mobile */
		.form-wrapper :global(input[type="radio"]:checked)::before,
		.form-wrapper :global(.form-radio:checked)::before,
		.form-wrapper :global(input.form-radio:checked)::before {
			width: 0.375rem !important;
			height: 0.375rem !important;
		}
		
		/* Better spacing for radio content in cancellation policy - exclude pricing model selector */
		.form-wrapper :global(.cancellation-policy-card label:has(input[type="radio"]) > div),
		.form-wrapper :global(label:has(input[type="radio"]):not(.model-option) > div) {
			margin-left: 0.5rem !important;
			flex: 1 !important;
			display: flex !important;
			flex-direction: column !important;
			align-items: flex-start !important;
		}
		
		/* Ensure pricing model selector stays inline */
		.form-wrapper :global(.pricing-model-selector .option-content),
		.form-wrapper :global(.model-option .option-content) {
			display: flex !important;
			flex-direction: row !important;
			align-items: center !important;
			flex-wrap: nowrap !important;
		}
		
		/* Reduce font sizes in cancellation policy labels */
		.form-wrapper :global(.cancellation-policy-card label .font-medium) {
			font-size: 0.875rem !important;
		}
		
		.form-wrapper :global(.cancellation-policy-card label .text-xs) {
			font-size: 0.75rem !important;
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
	
	/* Tablet and larger */
	@media (min-width: 768px) {
		.showcase-title {
			font-size: 2.25rem;
		}
		
		.showcase-subtitle {
			font-size: 1.125rem;
		}
		
		.form-container {
			border-radius: 1rem;
			margin-bottom: 3rem;
			border-width: 2px;
			border-color: var(--border-secondary);
			box-shadow: 
				0 8px 32px rgba(0, 0, 0, 0.12),
				0 0 0 1px rgba(var(--color-accent-600-rgb), 0.08);
		}
		
		.form-wrapper {
			padding: 2rem;
			max-height: 800px;
		}
		
		/* Make cancellation policy card more distinctive on larger screens */
		.form-wrapper :global(.form-section-card) {
			background: transparent !important;
			border: none !important;
			border-radius: var(--radius-xl) !important;
			box-shadow: none !important;
		}
	}
	
	/* Desktop */
	@media (min-width: 1024px) {
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
		/* Section spacing */
		.section-divider {
			margin: 0 auto 2.5rem;
			max-width: 8rem;
		}
		
		.showcase-header {
			width: 100%;
			max-width: 100%;
			margin-bottom: 1.75rem;
			padding: 0;
		}
		
		.showcase-title {
			font-size: 1.625rem;
			line-height: 1.15;
			margin-bottom: 0.625rem;
		}
		
		.showcase-subtitle {
			font-size: 0.875rem;
			line-height: 1.5;
		}
		
		.form-container {
			width: 100%;
			max-width: 100%;
			margin-bottom: 1.25rem;
		}
		
		.form-wrapper {
			padding: 0;
	}
	
		/* Tighter spacing for form fields on small screens */
		.form-wrapper :global(.form-section),
		.form-wrapper :global(.tour-form-section),
		.form-wrapper :global(.form-field) {
			margin-bottom: 1rem;
		}
		
		/* Even smaller font size for tour description on very small screens */
		.form-wrapper :global(.tipex-description-editor),
		.form-wrapper :global(.tipex-description-editor .ProseMirror),
		.form-wrapper :global(.tipex-description-editor p),
		.form-wrapper :global(.tipex-description-editor ul),
		.form-wrapper :global(.tipex-description-editor li) {
			font-size: 0.8125rem;
		}
		
		.form-wrapper :global(.tipex-description-editor h2) {
			font-size: 0.9375rem;
		}
		}
		
	@media (max-width: 360px) {
		.showcase-title {
			font-size: 1.5rem;
			line-height: 1.1;
		}
		
		.showcase-subtitle {
			font-size: 0.8125rem;
			line-height: 1.4;
		}
		
		.form-wrapper {
			padding: 0;
		}
		
		/* Even tighter spacing on very small screens */
		.form-wrapper :global(.form-section),
		.form-wrapper :global(.tour-form-section),
		.form-wrapper :global(.form-field) {
			margin-bottom: 0.875rem;
		}
		
		/* Radio buttons on very small screens - custom styled */
		.form-wrapper :global(input[type="radio"]),
		.form-wrapper :global(.form-radio),
		.form-wrapper :global(input.form-radio) {
			width: 0.875rem !important;
			height: 0.875rem !important;
			max-width: 0.875rem !important;
			max-height: 0.875rem !important;
			min-width: 0.875rem !important;
			min-height: 0.875rem !important;
			appearance: none !important;
			-webkit-appearance: none !important;
			-moz-appearance: none !important;
			border: 2px solid var(--border-primary) !important;
			background-color: var(--bg-primary) !important;
			border-radius: 50% !important;
			vertical-align: middle !important;
		}
		
		/* Custom radio button checked inner circle on very small screens */
		.form-wrapper :global(input[type="radio"]:checked)::before,
		.form-wrapper :global(.form-radio:checked)::before,
		.form-wrapper :global(input.form-radio:checked)::before {
			width: 0.25rem !important;
			height: 0.25rem !important;
		}
		
		/* Even tighter cancellation policy spacing on very small screens */
		.form-wrapper :global(.cancellation-policy-card label:has(input[type="radio"])) {
			padding: 0.5rem !important;
			display: flex !important;
			align-items: center !important;
		}
		
		.form-wrapper :global(.cancellation-policy-card label:has(input[type="radio"]) input[type="radio"]) {
			margin-top: 0 !important;
			align-self: center !important;
		}
		
		.form-wrapper :global(.cancellation-policy-card label .font-medium) {
			font-size: 0.8125rem !important;
		}
		
		.form-wrapper :global(.cancellation-policy-card label .text-xs) {
			font-size: 0.6875rem !important;
		}
		
		/* Ensure pricing model selector stays inline on very small screens */
		.form-wrapper :global(.pricing-model-selector .option-content),
		.form-wrapper :global(.model-option .option-content) {
			display: flex !important;
			flex-direction: row !important;
			align-items: center !important;
			flex-wrap: nowrap !important;
		}
	}
	
	/* Light mode - make form more distinctive */
	:root[data-theme='light'] .tour-form-showcase,
	:root:not([data-theme]) .tour-form-showcase {
		.form-container {
			background: var(--bg-primary);
			border-color: var(--border-secondary);
			box-shadow: 
				0 8px 32px rgba(0, 0, 0, 0.12),
				0 4px 16px rgba(0, 0, 0, 0.08),
				0 0 0 1px rgba(var(--color-accent-600-rgb), 0.12);
		}
		
		@media (min-width: 768px) {
			.form-container {
				box-shadow: 
					0 12px 48px rgba(0, 0, 0, 0.15),
					0 8px 24px rgba(0, 0, 0, 0.1),
					0 0 0 1px rgba(var(--color-accent-600-rgb), 0.15);
		}
		}
	}
	
	/* Dark mode adjustments */
	:root[data-theme='dark'] .tour-form-showcase {
		.form-container {
			background: var(--bg-secondary);
			border-color: var(--border-secondary);
			box-shadow: 
				0 8px 32px rgba(0, 0, 0, 0.4),
				0 0 0 1px rgba(var(--color-accent-500-rgb), 0.1);
		}
		
		.form-overlay {
			background: linear-gradient(to bottom, transparent 0%, var(--bg-primary) 100%);
		}
		
		/* Fix radio button visibility in dark mode - custom styling */
		.form-wrapper :global(input[type="radio"]),
		.form-wrapper :global(.form-radio),
		.form-wrapper :global(input.form-radio) {
			border-color: var(--border-primary) !important;
			background-color: var(--bg-secondary) !important;
			opacity: 1 !important;
			visibility: visible !important;
		}
		
		.form-wrapper :global(input[type="radio"]:checked),
		.form-wrapper :global(.form-radio:checked),
		.form-wrapper :global(input.form-radio:checked) {
			border-color: var(--color-accent-500) !important;
			background-color: var(--color-accent-500) !important;
		}
		
		/* Ensure radio button container has proper contrast */
		.form-wrapper :global(.cancellation-policy-card),
		.form-wrapper :global(label:has(input[type="radio"])) {
			background: rgba(255, 255, 255, 0.03);
			border-color: var(--border-secondary);
		}
		
		/* Make cancellation policy card more distinctive in dark mode */
		.form-wrapper :global(.form-section-card) {
			background: transparent !important;
			border: none !important;
			box-shadow: none !important;
			}
		
		/* Ensure colored dots are visible in dark mode */
		.form-wrapper :global(.w-2.h-2.rounded-full),
		.form-wrapper :global(div.w-2.h-2.rounded-full),
		.form-wrapper :global(.cancellation-policy-card .w-2.h-2.rounded-full),
		.form-wrapper :global(.cancellation-policy-card div[class*="w-2"][class*="h-2"]) {
			opacity: 1 !important;
			filter: brightness(1.3) saturate(1.2) !important;
		}
		
		/* Specific color adjustments for dark mode visibility - override inline styles */
		.form-wrapper :global(div[style*="var(--color-success-500)"]),
		.form-wrapper :global(div[style*="--color-success-500"]) {
			background: var(--color-success-400) !important;
			opacity: 1 !important;
		}
		
		.form-wrapper :global(div[style*="var(--color-warning-500)"]),
		.form-wrapper :global(div[style*="--color-warning-500"]) {
			background: var(--color-warning-400) !important;
			opacity: 1 !important;
		}
		
		.form-wrapper :global(div[style*="var(--color-error-500)"]),
		.form-wrapper :global(div[style*="--color-error-500"]),
		.form-wrapper :global(div[style*="var(--color-danger-500)"]),
		.form-wrapper :global(div[style*="--color-danger-500"]) {
			background: var(--color-error-400) !important;
			opacity: 1 !important;
		}
		
		/* Brighten success colors for better visibility */
		.form-wrapper :global(div[style*="var(--color-success"]),
		.form-wrapper :global(div[style*="--color-success"]) {
			filter: brightness(1.4) !important;
		}
		
		/* Brighten warning colors for better visibility */
		.form-wrapper :global(div[style*="var(--color-warning"]),
		.form-wrapper :global(div[style*="--color-warning"]) {
			filter: brightness(1.3) !important;
		}
		
		/* Brighten error/danger colors for better visibility */
		.form-wrapper :global(div[style*="var(--color-error"]),
		.form-wrapper :global(div[style*="--color-error"]),
		.form-wrapper :global(div[style*="var(--color-danger"]),
		.form-wrapper :global(div[style*="--color-danger"]) {
			filter: brightness(1.3) !important;
		}
	}
</style>