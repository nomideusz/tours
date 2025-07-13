<script lang="ts">
	import NumberInput from './NumberInput.svelte';

	import DurationSlider from './DurationSlider.svelte';
	import PriceSlider from './PriceSlider.svelte';
	import { validateTourForm, getFieldError, hasFieldError, type ValidationError } from '$lib/validation.js';
	import { userCurrency, SUPPORTED_CURRENCIES } from '$lib/stores/currency.js';
	import { currentMinimumChargeAmount } from '$lib/utils/currency.js';
	import { canActivateTours, getOnboardingMessage, getNextOnboardingStep } from '$lib/utils/onboarding.js';
	
	// Import clean icons instead of using emojis
	import User from 'lucide-svelte/icons/user';
	import Users from 'lucide-svelte/icons/users';
	import Utensils from 'lucide-svelte/icons/utensils';
	import Building from 'lucide-svelte/icons/building';
	import BookOpen from 'lucide-svelte/icons/book-open';
	import Palette from 'lucide-svelte/icons/palette';
	import Mountain from 'lucide-svelte/icons/mountain';
	import Edit from 'lucide-svelte/icons/edit';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import FileText from 'lucide-svelte/icons/file-text';
	import Eye from 'lucide-svelte/icons/eye';
	import Camera from 'lucide-svelte/icons/camera';
	import Upload from 'lucide-svelte/icons/upload';
	import X from 'lucide-svelte/icons/x';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Save from 'lucide-svelte/icons/save';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import LocationPicker from './LocationPicker.svelte';
	import Plus from 'lucide-svelte/icons/plus';

	interface Props {
		formData: {
			name: string;
			description: string;
			price: number;
			duration: number;
			status: 'active' | 'draft';
			category: string;
			location: string;
			includedItems: string[];
			requirements: string[];
			cancellationPolicy: string;
			enablePricingTiers: boolean;
					pricingTiers?: {
			adult: number;
			child?: number;
		};
		};
		uploadedImages?: File[];
		isSubmitting?: boolean;
		isEdit?: boolean;
		submitButtonText?: string;

		onCancel: () => void;
		onSubmit?: () => void;
		onImageUpload?: (event: Event) => void;
		onImageRemove?: (index: number) => void;
		existingImages?: string[];
		onExistingImageRemove?: (imageName: string) => void;
		getExistingImageUrl?: (imageName: string) => string;
		// Image upload errors
		imageUploadErrors?: string[];
		// Server-side validation errors
		serverErrors?: ValidationError[];
		// Validation trigger
		triggerValidation?: boolean;
		// Hide status field for new tour creation
		hideStatusField?: boolean;
		// Onboarding status props for activation restrictions
		profile?: any;
		hasConfirmedLocation?: boolean;
		paymentStatus?: { isSetup: boolean; loading: boolean };
	}

	let {
		formData = $bindable(),
		uploadedImages = $bindable([]),
		isSubmitting = false,
		isEdit = false,
		submitButtonText = '',

		onCancel,
		onSubmit,
		onImageUpload,
		onImageRemove,
		existingImages = [],
		onExistingImageRemove,
		getExistingImageUrl,
		imageUploadErrors = [],
		serverErrors = [],
		triggerValidation = false,
		hideStatusField = false,
		profile = null,
		hasConfirmedLocation = false,
		paymentStatus = { isSetup: false, loading: false }
	}: Props = $props();

	// Client-side validation state
	let validationErrors = $state<ValidationError[]>([]);
	let touchedFields = $state<Set<string>>(new Set());
	
	// Collapsible sections state
	let showAdvancedPricing = $state(false);
	let showTourDetails = $state(false);
	let showCancellationPolicy = $state(false);
	let showImages = $state(false);
	
	// Get currency symbol for display
	let currencySymbol = $derived(SUPPORTED_CURRENCIES[$userCurrency]?.symbol || '€');
	
	// Get minimum charge amount for current currency
	let minimumPrice = $derived($currentMinimumChargeAmount);
	
	// Get appropriate step value based on currency
	let priceStep = $derived(minimumPrice >= 10 ? 1 : 0.5);
	
	// Check if user can activate tours based on onboarding completion
	let activationCheck = $derived(canActivateTours(profile, hasConfirmedLocation, paymentStatus));
	let canActivate = $derived(activationCheck.canActivate);
	let missingSteps = $derived(activationCheck.missingSteps);
	let onboardingMessage = $derived(getOnboardingMessage(missingSteps));
	let nextStep = $derived(getNextOnboardingStep(missingSteps));

	// Auto-expand sections if they have content or errors
	$effect(() => {
		// Auto-expand child pricing if it's already enabled
		if (formData.enablePricingTiers || showChildPrice) {
			showAdvancedPricing = true;
		}
		
		// Auto-expand tour details if there are items/requirements
		if (formData.includedItems.some(item => item.trim()) || formData.requirements.some(req => req.trim())) {
			showTourDetails = true;
		}
		
		// Auto-expand cancellation policy if there's content
		if (formData.cancellationPolicy?.trim()) {
			showCancellationPolicy = true;
		}
		
		// Auto-expand images if there are uploaded images or existing images
		if ((uploadedImages && uploadedImages.length > 0) || (existingImages && existingImages.length > 0)) {
			showImages = true;
		}
	});

	// Note: Reactive validation is handled by individual field validation functions
	// to avoid conflicts and ensure consistent error state management

	// Trigger validation when parent requests it
	$effect(() => {
		if (triggerValidation) {
			// Mark all required fields as touched when form is submitted
			touchedFields.add('name');
			touchedFields.add('description');
			touchedFields.add('price');
			touchedFields.add('duration');
			
			// Validate all fields using the same field-specific approach
			const validation = validateTourForm(formData);
			const requiredFields = ['name', 'description', 'price', 'duration'];
			
			// Clear all validation errors first
			validationErrors = [];
			
			// Add errors for each field that has issues
			requiredFields.forEach(fieldName => {
				const fieldError = validation.errors.find(error => error.field === fieldName);
				if (fieldError) {
					validationErrors = [...validationErrors, fieldError];
				}
			});

			// Scroll to first error on mobile if validation failed
			if (!validation.isValid) {
				scrollToFirstError();
			}
		}
	});

	// Combine client and server errors
	let allErrors = $derived([...validationErrors, ...serverErrors]);

	// Trigger validation when form is submitted
	function handleSubmit() {
		// Mark all required fields as touched
		touchedFields.add('name');
		touchedFields.add('description');
		touchedFields.add('price');
		touchedFields.add('duration');
		
		// Use the same field-specific validation approach
		const validation = validateTourForm(formData);
		const requiredFields = ['name', 'description', 'price', 'duration'];
		
		// Clear all validation errors first
		validationErrors = [];
		
		// Add errors for each field that has issues
		requiredFields.forEach(fieldName => {
			const fieldError = validation.errors.find(error => error.field === fieldName);
			if (fieldError) {
				validationErrors = [...validationErrors, fieldError];
			}
		});
	}

	// Debounced validation timeout
	let validationTimeout: NodeJS.Timeout | null = null;

	// Real-time field validation (on input with debouncing)
	function validateFieldRealtime(fieldName: string) {
		touchedFields.add(fieldName);
		
		// Clear existing timeout
		if (validationTimeout) {
			clearTimeout(validationTimeout);
		}
		
		// Debounce validation to avoid excessive calls while typing
		validationTimeout = setTimeout(() => {
			// Re-validate the specific field and update errors
			const validation = validateTourForm(formData);
			
			// Remove any existing errors for this field
			validationErrors = validationErrors.filter(error => error.field !== fieldName);
			
			// Add new error if field is invalid
			const fieldError = validation.errors.find(error => error.field === fieldName);
			if (fieldError) {
				validationErrors = [...validationErrors, fieldError];
			}
		}, 500); // 500ms delay for typing
	}

	// Trigger validation for specific field on blur (immediate)
	function validateField(fieldName: string) {
		touchedFields.add(fieldName);
		
		// Clear any pending debounced validation
		if (validationTimeout) {
			clearTimeout(validationTimeout);
		}
		
		// Immediate validation on blur
		const validation = validateTourForm(formData);
		
		// Remove any existing errors for this field
		validationErrors = validationErrors.filter(error => error.field !== fieldName);
		
		// Add new error if field is invalid
		const fieldError = validation.errors.find(error => error.field === fieldName);
		if (fieldError) {
			validationErrors = [...validationErrors, fieldError];
		}
	}

	// Export validation state for parent component
	export function isValid() {
		const validation = validateTourForm(formData);
		return validation.isValid;
	}

	export function validate() {
		// Clear any pending debounced validation to ensure immediate validation
		if (validationTimeout) {
			clearTimeout(validationTimeout);
			validationTimeout = null;
		}
		
		// Mark all required fields as touched
		touchedFields.add('name');
		touchedFields.add('description');
		touchedFields.add('price');
		touchedFields.add('duration');
		
		// Use the same field-specific validation approach
		const validation = validateTourForm(formData);
		const requiredFields = ['name', 'description', 'price', 'duration'];
		
		// Clear all validation errors first
		validationErrors = [];
		
		// Add errors for each field that has issues
		requiredFields.forEach(fieldName => {
			const fieldError = validation.errors.find(error => error.field === fieldName);
			if (fieldError) {
				validationErrors = [...validationErrors, fieldError];
			}
		});

		// Scroll to first error on mobile if validation failed
		if (!validation.isValid) {
			scrollToFirstError();
		}
		
		return validation.isValid;
	}



	// Cancellation Policy Templates
	let selectedPolicyTemplate = $state('');
	let showCustomPolicy = $state(false);
	
	const policyTemplates = [
		{
			id: 'flexible',
			name: 'Flexible',
			description: 'Free cancellation up to 24 hours',
			policy: 'Free cancellation up to 24 hours before the tour starts. Full refund guaranteed. For cancellations within 24 hours, 50% refund will be provided.',
			color: 'success'
		},
		{
			id: 'moderate',
			name: 'Moderate', 
			description: 'Free cancellation up to 48 hours',
			policy: 'Free cancellation up to 48 hours before the tour starts. For cancellations between 48-24 hours: 50% refund. For cancellations within 24 hours: no refund.',
			color: 'warning'
		},
		{
			id: 'strict',
			name: 'Strict',
			description: 'Free cancellation up to 7 days',
			policy: 'Free cancellation up to 7 days before the tour starts. For cancellations between 7-3 days: 50% refund. For cancellations within 3 days: no refund.',
			color: 'error'
		}
	];

	function selectPolicyTemplate(templateId: string) {
		const template = policyTemplates.find(t => t.id === templateId);
		if (template) {
			selectedPolicyTemplate = templateId;
			formData.cancellationPolicy = template.policy;
			showCustomPolicy = false;
		}
	}

	function enableCustomPolicy() {
		selectedPolicyTemplate = '';
		showCustomPolicy = true;
		// Keep existing policy text if any
	}

	// Initialize policy template selection based on existing policy
	$effect(() => {
		if (formData.cancellationPolicy && !selectedPolicyTemplate && !showCustomPolicy) {
			// Check if current policy matches any template
			const matchingTemplate = policyTemplates.find(t => t.policy === formData.cancellationPolicy);
			if (matchingTemplate) {
				selectedPolicyTemplate = matchingTemplate.id;
			} else if (formData.cancellationPolicy.trim()) {
				showCustomPolicy = true;
			}
		}
	});



	function getImagePreview(file: File): string {
		return URL.createObjectURL(file);
	}

	// Mobile error handling - scroll to first error
	function scrollToFirstError() {
		if (typeof window === 'undefined') return;
		
		// Wait for DOM to update
		setTimeout(() => {
			const firstErrorField = document.querySelector('.form-input.error, .form-textarea.error, .form-select.error');
			if (firstErrorField) {
				// Scroll with some offset for mobile header
				const yOffset = -100; // Adjust based on your mobile header height
				const y = firstErrorField.getBoundingClientRect().top + window.pageYOffset + yOffset;
				window.scrollTo({ top: y, behavior: 'smooth' });
			}
		}, 100);
	}

	// Enhanced validate function for mobile
	export function validateWithMobileSupport() {
		const isValid = validate();
		if (!isValid) {
			scrollToFirstError();
		}
		return isValid;
	}

	// Optional child pricing
	let showChildPrice = $state(false);
	let childPrice = $state(0);

	// Initialize child price visibility based on existing data
	$effect(() => {
		if (formData.enablePricingTiers && formData.pricingTiers?.child !== undefined) {
			showChildPrice = true;
			childPrice = formData.pricingTiers.child;
		}
	});

	// Sync child pricing state with formData
	$effect(() => {
		// Update enablePricingTiers based on showChildPrice
		formData.enablePricingTiers = showChildPrice;
		
		// Initialize pricingTiers if needed
		if (showChildPrice) {
			if (!formData.pricingTiers) {
				formData.pricingTiers = {
					adult: formData.price || 0,
					child: childPrice
				};
			} else {
				formData.pricingTiers.adult = formData.price || 0;
				formData.pricingTiers.child = childPrice;
			}
		} else {
			// Clear pricing tiers when disabled
			formData.pricingTiers = undefined;
		}
	});

	// Auto-adjust child price when adult price changes
	$effect(() => {
		if (showChildPrice && formData.price > 0 && childPrice > formData.price) {
			// Automatically reduce child price to match adult price if it exceeds
			childPrice = formData.price;
		}
	});

	// Set reasonable default for child price when enabling
	function enableChildPricing() {
		showChildPrice = true;
		// Set default to 70% of adult price (reasonable discount)
		const reasonableDefault = Math.round(formData.price * 0.7 * 2) / 2; // Round to nearest 0.5
		childPrice = Math.max(0, reasonableDefault);
	}


</script>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
	<!-- Mobile Error Summary - Only show on mobile when errors exist -->
	{#if allErrors.length > 0}
		<div class="lg:hidden mb-4 rounded-xl p-4 sticky top-4 z-10" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
			<div class="flex items-start gap-3">
				<div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style="background: var(--color-error-100);">
					<AlertCircle class="w-3 h-3" style="color: var(--color-error-600);" />
				</div>
				<div class="flex-1 min-w-0">
					<p class="font-medium text-sm" style="color: var(--color-error-900);">
						Please fix {allErrors.length} error{allErrors.length === 1 ? '' : 's'}:
					</p>
					<ul class="text-sm mt-2 space-y-1" style="color: var(--color-error-700);">
						{#each allErrors as error}
							<li class="flex items-start gap-2">
								<span class="text-xs mt-0.5">•</span>
								<button 
									type="button"
									onclick={() => {
										const field = document.getElementById(error.field);
										if (field) {
											field.focus();
											field.scrollIntoView({ behavior: 'smooth', block: 'center' });
										}
									}}
									class="text-left underline hover:no-underline"
								>
									{error.message}
								</button>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main form content -->
	<div class="lg:col-span-2 space-y-8">
		<!-- Basic Information -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<h2 class="font-semibold" style="color: var(--text-primary);">Basic Information</h2>
			</div>
			<div class="p-4">
				<!-- Hidden status field for form submission (when not showing visible toggle) -->
				{#if !isEdit || hideStatusField}
					<input type="hidden" name="status" bind:value={formData.status} />
				{/if}
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="md:col-span-2">
						<label for="name" class="form-label">
							Tour Name *
						</label>
						<input
							type="text"
							id="name"
							name="name"
							bind:value={formData.name}
							placeholder="e.g., Historic Walking Tour of Prague"
							class="form-input {hasFieldError(allErrors, 'name') ? 'error' : ''}"
							oninput={() => validateFieldRealtime('name')}
							onblur={() => validateField('name')}
						/>
						{#if getFieldError(allErrors, 'name')}
							<p class="form-error mobile-error-enhanced">{getFieldError(allErrors, 'name')}</p>
						{/if}
					</div>

					<div>
						<label for="category" class="form-label">
							Category
						</label>
						
						<div class="flex flex-wrap gap-2">
							{#each [
								{ id: 'walking', name: 'Walking', icon: Users },
								{ id: 'food', name: 'Food', icon: Utensils },
								{ id: 'cultural', name: 'Cultural', icon: Building },
								{ id: 'historical', name: 'Historical', icon: BookOpen },
								{ id: 'art', name: 'Art', icon: Palette },
								{ id: 'adventure', name: 'Adventure', icon: Mountain }
							] as category}
								{@const Icon = category.icon}
								<button
									type="button"
									onclick={() => { 
										formData.category = formData.category === category.id ? '' : category.id; 
									}}
									class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors"
									style="
										background: {formData.category === category.id ? 'var(--color-primary-50)' : 'var(--bg-primary)'};
										border-color: {formData.category === category.id ? 'var(--color-primary-300)' : 'var(--border-primary)'};
										color: {formData.category === category.id ? 'var(--color-primary-700)' : 'var(--text-secondary)'};
									"
								>
									<Icon class="w-3 h-3" />
									<span>{category.name}</span>
								</button>
							{/each}
							
							<!-- Custom Category Option -->
							<button
								type="button"
								onclick={() => { 
									if (formData.category === 'custom' || (formData.category && !['walking', 'food', 'cultural', 'historical', 'art', 'adventure'].includes(formData.category))) {
										formData.category = '';
									} else {
										formData.category = 'custom';
									}
								}}
								class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors"
								style="
									background: {(formData.category === 'custom' || (formData.category && !['walking', 'food', 'cultural', 'historical', 'art', 'adventure'].includes(formData.category))) ? 'var(--color-primary-50)' : 'var(--bg-primary)'};
									border-color: {(formData.category === 'custom' || (formData.category && !['walking', 'food', 'cultural', 'historical', 'art', 'adventure'].includes(formData.category))) ? 'var(--color-primary-300)' : 'var(--border-primary)'};
									color: {(formData.category === 'custom' || (formData.category && !['walking', 'food', 'cultural', 'historical', 'art', 'adventure'].includes(formData.category))) ? 'var(--color-primary-700)' : 'var(--text-secondary)'};
								"
							>
								<Edit class="w-3 h-3" />
								<span>Custom</span>
							</button>
						</div>

						{#if formData.category === 'custom' || (formData.category && !['walking', 'food', 'cultural', 'historical', 'art', 'adventure', ''].includes(formData.category))}
							<div class="mt-3">
								<input
									type="text"
									placeholder="Enter your custom category..."
									class="form-input"
									value={formData.category === 'custom' ? '' : formData.category}
									oninput={(e) => {
										const target = e.target as HTMLInputElement;
										formData.category = target.value || 'custom';
									}}
								/>
							</div>
						{/if}

						<!-- Hidden input for form submission -->
						<input type="hidden" name="category" bind:value={formData.category} />
					</div>

					<div>
						<LocationPicker
							bind:value={formData.location}
							label="Meeting Point"
							placeholder="Where does the tour start?"
							profileLocation={profile?.location}
							enableGeolocation={true}
							enableMapsIntegration={true}
							onLocationSelect={(location) => {
								formData.location = location;
							}}
						/>
						<!-- Hidden input for form submission -->
						<input type="hidden" name="location" bind:value={formData.location} />
					</div>

					<div class="md:col-span-2">
						<label for="description" class="form-label">
							Description *
						</label>
						<textarea
							id="description"
							name="description"
							bind:value={formData.description}
							rows="4"
							placeholder="What will guests experience on this tour?"
							class="form-textarea {hasFieldError(allErrors, 'description') ? 'error' : ''}"
							oninput={() => validateFieldRealtime('description')}
							onblur={() => validateField('description')}
						></textarea>
						{#if getFieldError(allErrors, 'description')}
							<p class="form-error mobile-error-enhanced">{getFieldError(allErrors, 'description')}</p>
						{/if}
					</div>
				</div>
			</div>
		</div>



		<!-- Pricing & Logistics -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<h2 class="font-semibold" style="color: var(--text-primary);">Pricing & Logistics</h2>
			</div>
			<div class="p-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<PriceSlider
							bind:value={formData.price}
							label="Price"
							min={minimumPrice}
							max={500}
							step={priceStep}
							required={true}
							error={hasFieldError(allErrors, 'price')}
							onChange={() => validateField('price')}
							currency={$userCurrency}
							currencySymbol={currencySymbol}
							defaultValue={25}
							showMarkers={false}
						/>
						{#if getFieldError(allErrors, 'price')}
							<p class="form-error mobile-error-enhanced">{getFieldError(allErrors, 'price')}</p>
						{/if}
						{#if minimumPrice > 0.5}
							<p class="text-xs mt-1 pt-2" style="color: var(--text-secondary);">
								Minimum price for {$userCurrency} is {currencySymbol}{minimumPrice % 1 === 0 ? minimumPrice.toFixed(0) : minimumPrice.toFixed(2)}
							</p>
						{/if}
						<!-- Hidden input for form submission -->
						<input type="hidden" name="price" bind:value={formData.price} />
						
						<!-- Mobile-only Child Price Option -->
						<div class="md:hidden mt-4">
							{#if !showChildPrice}
								<button
									type="button"
									onclick={() => {
										showChildPrice = true;
										enableChildPricing();
									}}
									class="flex items-center justify-center w-full p-3 rounded-lg border transition-colors hover:bg-opacity-80 gap-2"
									style="
										background: var(--bg-secondary);
										border-color: var(--border-primary);
										color: var(--text-primary);
									"
								>
									<Plus class="w-4 h-4" />
									<span class="font-medium">Add Child Price</span>
								</button>
							{:else}
								<div class="space-y-3">
									<div class="flex items-center justify-between">
										<span class="text-sm font-medium" style="color: var(--text-primary);">Child Price</span>
										<button
											type="button"
											onclick={() => { 
												showChildPrice = false; 
												childPrice = 0;
												formData.enablePricingTiers = false;
												formData.pricingTiers = undefined;
											}}
											class="button-secondary button--small button--icon"
											aria-label="Remove child pricing"
										>
											<X class="w-3 h-3" />
										</button>
									</div>
									<PriceSlider
										bind:value={childPrice}
										min={0}
										max={formData.price || 100}
										step={priceStep}
										error={hasFieldError(allErrors, 'pricingTiers.child')}
										onChange={() => validateField('pricingTiers.child')}
										currency={$userCurrency}
										currencySymbol={currencySymbol}
										defaultValue={0}
										showMarkers={false}
									/>
									{#if getFieldError(allErrors, 'pricingTiers.child')}
										<p class="form-error">{getFieldError(allErrors, 'pricingTiers.child')}</p>
									{/if}
									<div class="p-2 rounded-lg text-xs" style="background: var(--bg-secondary); color: var(--text-secondary);">
										{#if childPrice === 0}
											<div class="flex items-center gap-1">
												<CheckCircle class="w-3 h-3" style="color: var(--color-success-600);" />
												<span class="font-medium" style="color: var(--color-success-700);">Children go free</span>
											</div>
										{:else if formData.price > 0}
											{@const discount = Math.floor(((formData.price - childPrice) / formData.price) * 100)}
											{#if discount > 0}
												<div class="flex items-center gap-1">
													<CheckCircle class="w-3 h-3" style="color: var(--color-success-600);" />
													<span class="font-medium">{discount}% discount for children</span>
												</div>
											{:else}
												<span class="font-medium">Same price for all ages</span>
											{/if}
										{:else}
											<span>Set adult price first</span>
										{/if}
									</div>
									<!-- Hidden input for form submission -->
									<input type="hidden" name="pricingTiers.child" bind:value={childPrice} />
								</div>
							{/if}
						</div>
					</div>

				<div>
					<DurationSlider
						bind:value={formData.duration}
						label="Duration"
						min={15}
						max={480}
						step={15}
						required={true}
						error={hasFieldError(allErrors, 'duration')}
						onChange={() => validateField('duration')}
						defaultValue={120}
						showMarkers={false}
					/>
					{#if getFieldError(allErrors, 'duration')}
						<p class="form-error mobile-error-enhanced">{getFieldError(allErrors, 'duration')}</p>
					{/if}
					<!-- Hidden input for form submission -->
					<input type="hidden" name="duration" bind:value={formData.duration} />
				</div>


	</div>

				<!-- Advanced Pricing Section (Collapsible) - Desktop Only -->
				<div class="mt-6 hidden md:block">
					{#if !showChildPrice}
						<button
							type="button"
							onclick={() => {
								showChildPrice = true;
								showAdvancedPricing = true;
								enableChildPricing();
							}}
							class="flex items-center justify-center w-full p-3 rounded-lg border transition-colors hover:bg-opacity-80 gap-2"
							style="
								background: var(--bg-secondary);
								border-color: var(--border-primary);
								color: var(--text-primary);
							"
						>
							<Plus class="w-4 h-4" />
							<span class="font-medium">Child Price</span>
						</button>
					{:else}
						<button
							type="button"
							onclick={() => showAdvancedPricing = !showAdvancedPricing}
							class="flex items-center justify-between w-full p-3 rounded-lg border transition-colors hover:bg-opacity-80"
							style="
								background: var(--bg-secondary);
								border-color: var(--border-primary);
								color: var(--text-primary);
							"
						>
							<div class="flex items-center gap-2">
								{#if showAdvancedPricing}
									<ChevronDown class="w-4 h-4" />
								{:else}
									<ChevronRight class="w-4 h-4" />
								{/if}
								<span class="font-medium">Child Price</span>
								<span class="text-xs px-2 py-1 rounded-full" style="background: var(--color-success-100); color: var(--color-success-700);">
									Active
								</span>
							</div>
						</button>
					{/if}

					{#if showAdvancedPricing && showChildPrice}
						<div class="mt-4 space-y-4">
							<div class="p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
								<div class="flex items-center justify-between mb-3">
									<h4 class="text-sm font-medium" style="color: var(--text-primary);">Ages 3-12</h4>
									<button
									type="button"
									onclick={() => { 
										showChildPrice = false; 
										childPrice = 0;
										formData.enablePricingTiers = false;
										formData.pricingTiers = undefined;
										showAdvancedPricing = false;
									}}
									class="button-secondary button--small button--icon"
									aria-label="Remove child pricing"
								>
									<X class="w-3 h-3" />
								</button>
								</div>
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<PriceSlider
											bind:value={childPrice}
											label=""
											min={0}
											max={formData.price || 100}
											step={priceStep}
											error={hasFieldError(allErrors, 'pricingTiers.child')}
											onChange={() => validateField('pricingTiers.child')}
											currency={$userCurrency}
											currencySymbol={currencySymbol}
											defaultValue={0}
											showMarkers={false}
										/>
										{#if getFieldError(allErrors, 'pricingTiers.child')}
											<p class="form-error">{getFieldError(allErrors, 'pricingTiers.child')}</p>
										{/if}
										<!-- Hidden input for form submission -->
										<input type="hidden" name="pricingTiers.child" bind:value={childPrice} />
									</div>
									<div class="flex items-end">
										<div class="p-3 rounded-lg w-full" style="background: var(--bg-primary);">
											<p class="text-xs font-medium mb-1" style="color: var(--text-secondary);">Pricing Comparison</p>
											<div class="text-sm" style="color: var(--text-primary);">
												{#if childPrice === 0}
													<div class="flex items-center gap-1">
														<CheckCircle class="w-3 h-3" style="color: var(--color-success-600);" />
														<span class="font-medium" style="color: var(--color-success-700);">Children go free</span>
													</div>
												{:else if formData.price > 0}
													{@const discount = Math.floor(((formData.price - childPrice) / formData.price) * 100)}
													{#if discount > 0}
														<div class="flex items-center gap-1">
															<CheckCircle class="w-3 h-3" style="color: var(--color-success-600);" />
															<span class="font-medium">{discount}% discount</span>
														</div>
													{:else}
														<span class="font-medium">Same price for all</span>
													{/if}
												{:else}
													<span style="color: var(--text-tertiary);">Set adult price first</span>
												{/if}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Hidden inputs for pricing tiers -->
				<input type="hidden" name="enablePricingTiers" value={showChildPrice ? 'true' : 'false'} />
				{#if showChildPrice}
					<input type="hidden" name="pricingTiers.adult" value={formData.price} />
				{/if}

		</div>
	</div>

				<!-- Tour Details (Collapsible) -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<button
				type="button"
				onclick={() => showTourDetails = !showTourDetails}
				class="flex items-center justify-between w-full p-4 transition-colors hover:bg-opacity-80 {showTourDetails ? 'border-b' : ''}"
				style="{showTourDetails ? 'border-color: var(--border-primary);' : ''}"
			>
				<div class="flex items-center gap-2">
					{#if showTourDetails}
						<ChevronDown class="w-4 h-4" />
					{:else}
						<ChevronRight class="w-4 h-4" />
					{/if}
					<h2 class="font-semibold text-base sm:text-lg" style="color: var(--text-primary);">Tour Details</h2>
					{#if formData.includedItems.some(item => item.trim()) || formData.requirements.some(req => req.trim())}
						<span class="text-xs px-2 py-1 rounded-full" style="background: var(--color-primary-100); color: var(--color-primary-700);">
							{formData.includedItems.filter(item => item.trim()).length + formData.requirements.filter(req => req.trim()).length} items
						</span>
					{/if}
				</div>
				<span class="text-xs" style="color: var(--text-secondary);">
					{showTourDetails ? 'Hide' : 'Show'} included items & requirements
				</span>
			</button>
			
			{#if showTourDetails}
				<div class="p-4">
					<!-- What's Included Section -->
					<div class="mb-8">
						<h3 class="font-medium text-sm mb-3" style="color: var(--text-primary);">What's Included</h3>
						
						<!-- Suggested Items -->
						<div class="mb-4">
							<p class="text-sm mb-2" style="color: var(--text-secondary);">Quick add popular items:</p>
							<div class="flex flex-wrap gap-2">
								{#each ['Professional tour guide', 'Historical insights', 'Photo opportunities', 'Small group experience', 'Route map', 'Local recommendations'] as suggestion}
									<button
										type="button"
										onclick={() => {
											if (!formData.includedItems.includes(suggestion)) {
												formData.includedItems = [...formData.includedItems.filter(item => item.trim()), suggestion];
											}
										}}
										class="text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-gray-50"
										style="border-color: var(--border-primary); color: var(--text-secondary);"
										disabled={formData.includedItems.includes(suggestion)}
									>
										{suggestion}
									</button>
								{/each}
							</div>
						</div>

						<!-- Selected Items as Tags -->
						{#if formData.includedItems.filter(item => item.trim()).length > 0}
							<div class="mb-4">
								<p class="text-sm mb-2" style="color: var(--text-secondary);">Included items:</p>
								<div class="flex flex-wrap gap-2">
									{#each formData.includedItems.filter(item => item.trim()) as item, index (item)}
										<span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border" style="background: var(--bg-secondary); border-color: var(--border-primary); color: var(--text-primary);">
											{item}
											<button
												type="button"
												onclick={() => {
													formData.includedItems = formData.includedItems.filter(i => i !== item);
												}}
												class="ml-1 transition-colors"
												style="color: var(--text-tertiary);"
												aria-label="Remove {item}"
											>
												<X class="w-3 h-3" />
											</button>
										</span>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Custom Item Input -->
						<div class="flex gap-2">
							<input
								type="text"
								placeholder="Add custom item..."
								class="form-input flex-1"
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										const input = e.target as HTMLInputElement;
										const value = input.value.trim();
										if (value && !formData.includedItems.includes(value)) {
											formData.includedItems = [...formData.includedItems.filter(item => item.trim()), value];
											input.value = '';
										}
									}
								}}
							/>
							<button
								type="button"
								onclick={(e) => {
									const button = e.target as HTMLButtonElement;
									const input = button.parentElement?.querySelector('input') as HTMLInputElement;
									const value = input?.value.trim();
									if (value && !formData.includedItems.includes(value)) {
										formData.includedItems = [...formData.includedItems.filter(item => item.trim()), value];
										input.value = '';
									}
								}}
								class="button-secondary button--small"
							>
								Add
							</button>
						</div>

						<!-- Hidden inputs for form submission -->
						{#each formData.includedItems.filter(item => item.trim()) as item}
							<input type="hidden" name="includedItems" value={item} />
						{/each}
					</div>

					<!-- Requirements Section -->
					<div>
						<h3 class="font-medium text-sm mb-3" style="color: var(--text-primary);">Requirements</h3>
						
						<!-- Suggested Requirements -->
						<div class="mb-4">
							<p class="text-sm mb-2" style="color: var(--text-secondary);">Quick add common requirements:</p>
							<div class="flex flex-wrap gap-2">
								{#each ['Comfortable walking shoes', 'Basic fitness level', 'Weather-appropriate clothing', 'Minimum age 12+', 'No mobility issues', 'English speaking'] as suggestion}
									<button
										type="button"
										onclick={() => {
											if (!formData.requirements.includes(suggestion)) {
												formData.requirements = [...formData.requirements.filter(req => req.trim()), suggestion];
											}
										}}
										class="text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-gray-50"
										style="border-color: var(--border-primary); color: var(--text-secondary);"
										disabled={formData.requirements.includes(suggestion)}
									>
										{suggestion}
									</button>
								{/each}
							</div>
						</div>

						<!-- Selected Requirements as Tags -->
						{#if formData.requirements.filter(req => req.trim()).length > 0}
							<div class="mb-4">
								<p class="text-sm mb-2" style="color: var(--text-secondary);">Requirements:</p>
								<div class="flex flex-wrap gap-2">
									{#each formData.requirements.filter(req => req.trim()) as requirement, index (requirement)}
										<span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border" style="background: var(--bg-secondary); border-color: var(--border-primary); color: var(--text-primary);">
											{requirement}
											<button
												type="button"
												onclick={() => {
													formData.requirements = formData.requirements.filter(r => r !== requirement);
												}}
												class="ml-1 transition-colors"
												style="color: var(--text-tertiary);"
												aria-label="Remove {requirement}"
											>
												<X class="w-3 h-3" />
											</button>
										</span>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Custom Requirement Input -->
						<div class="flex gap-2">
							<input
								type="text"
								placeholder="Add custom requirement..."
								class="form-input flex-1"
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										const input = e.target as HTMLInputElement;
										const value = input.value.trim();
										if (value && !formData.requirements.includes(value)) {
											formData.requirements = [...formData.requirements.filter(req => req.trim()), value];
											input.value = '';
										}
									}
								}}
							/>
							<button
								type="button"
								onclick={(e) => {
									const button = e.target as HTMLButtonElement;
									const input = button.parentElement?.querySelector('input') as HTMLInputElement;
									const value = input?.value.trim();
									if (value && !formData.requirements.includes(value)) {
										formData.requirements = [...formData.requirements.filter(req => req.trim()), value];
										input.value = '';
									}
								}}
								class="button-secondary button--small"
							>
								Add
							</button>
						</div>

						<!-- Hidden inputs for form submission -->
						{#each formData.requirements.filter(req => req.trim()) as requirement}
							<input type="hidden" name="requirements" value={requirement} />
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Cancellation Policy (Collapsible) -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<button
				type="button"
				onclick={() => showCancellationPolicy = !showCancellationPolicy}
				class="flex items-center justify-between w-full p-4 transition-colors hover:bg-opacity-80 {showCancellationPolicy ? 'border-b' : ''}"
				style="{showCancellationPolicy ? 'border-color: var(--border-primary);' : ''}"
			>
				<div class="flex items-center gap-2">
					{#if showCancellationPolicy}
						<ChevronDown class="w-4 h-4" />
					{:else}
						<ChevronRight class="w-4 h-4" />
					{/if}
					<h2 class="font-semibold text-base sm:text-lg" style="color: var(--text-primary);">Cancellation Policy</h2>
					{#if formData.cancellationPolicy?.trim() || selectedPolicyTemplate}
						<span class="text-xs px-2 py-1 rounded-full" style="background: var(--color-primary-100); color: var(--color-primary-700);">
							{selectedPolicyTemplate || 'Custom'} policy set
						</span>
					{/if}
				</div>
				<span class="text-xs" style="color: var(--text-secondary);">
					{showCancellationPolicy ? 'Hide' : 'Show'} cancellation terms
				</span>
			</button>
			
			{#if showCancellationPolicy}
				<div class="p-4">
					<div class="space-y-3">
						<!-- Template Options -->
						{#each policyTemplates as template}
							<label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors" 
								style="
									background: {selectedPolicyTemplate === template.id ? 'var(--color-primary-50)' : 'var(--bg-primary)'};
									border-color: {selectedPolicyTemplate === template.id ? 'var(--color-primary-300)' : 'var(--border-primary)'};
								"
							>
								<input
									type="radio"
									name="policyTemplate"
									value={template.id}
									checked={selectedPolicyTemplate === template.id}
									onchange={() => selectPolicyTemplate(template.id)}
									class="form-radio mt-0.5"
								/>
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<div class="w-2 h-2 rounded-full" 
											style="background: var(--color-{template.color}-500);"
										></div>
										<div class="font-medium text-sm" style="color: var(--text-primary);">
											{template.name}
										</div>
									</div>
									<p class="text-xs" style="color: var(--text-secondary);">{template.description}</p>
								</div>
							</label>
						{/each}

						<!-- Custom Policy Option -->
						<label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
							style="
								background: {showCustomPolicy ? 'var(--color-primary-50)' : 'var(--bg-primary)'};
								border-color: {showCustomPolicy ? 'var(--color-primary-300)' : 'var(--border-primary)'};
							"
						>
							<input
								type="radio"
								name="policyTemplate"
								checked={showCustomPolicy}
								onchange={enableCustomPolicy}
								class="form-radio mt-0.5"
							/>
							<div class="flex-1">
								<div class="flex items-center gap-2 mb-1">
									<Edit class="w-3 h-3" style="color: var(--text-secondary);" />
									<div class="font-medium text-sm" style="color: var(--text-primary);">
										Custom Policy
									</div>
								</div>
								<p class="text-xs" style="color: var(--text-secondary);">Write your own cancellation terms</p>
							</div>
						</label>
							</div>
							
					{#if showCustomPolicy}
						<div class="mt-4">
							<textarea
								name="cancellationPolicy"
								bind:value={formData.cancellationPolicy}
								rows="4"
								placeholder="Write your custom cancellation policy here. Be clear about refund terms, time limits, and any special conditions..."
								class="form-textarea"
							></textarea>
						</div>
					{/if}

					<!-- Hidden input for form submission -->
					<input type="hidden" name="cancellationPolicy" bind:value={formData.cancellationPolicy} />
				</div>
			{/if}
		</div>
	</div>

	<!-- Sidebar -->
	<div class="space-y-6">
		<!-- Tour Images -->
		{#if onImageUpload && onImageRemove}
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<button
					type="button"
					onclick={() => showImages = !showImages}
					class="flex items-center justify-between w-full p-4 transition-colors hover:bg-opacity-80 {showImages ? 'border-b' : ''}"
					style="{showImages ? 'border-color: var(--border-primary);' : ''}"
				>
					<div class="flex items-center gap-2">
						{#if showImages}
							<ChevronDown class="w-4 h-4" />
						{:else}
							<ChevronRight class="w-4 h-4" />
						{/if}
						<h3 class="font-semibold text-base sm:text-lg" style="color: var(--text-primary);">Tour Images</h3>
						{#if (uploadedImages && uploadedImages.length > 0) || (existingImages && existingImages.length > 0)}
							{@const totalImages = (uploadedImages?.length || 0) + (existingImages?.length || 0)}
							<span class="text-xs px-2 py-1 rounded-full" style="background: var(--color-primary-100); color: var(--color-primary-700);">
								{totalImages} image{totalImages === 1 ? '' : 's'}
							</span>
						{/if}
					</div>
					<span class="text-xs" style="color: var(--text-secondary);">
						{showImages ? 'Hide' : 'Show'} image gallery
					</span>
				</button>
				
				{#if showImages}
					<div class="p-4">
					
					<!-- Existing Images (for edit mode) -->
					{#if isEdit && existingImages && existingImages.length > 0 && onExistingImageRemove && getExistingImageUrl}
						<div class="mb-6">
							<h4 class="text-sm font-medium text-gray-700 mb-3">Current Images</h4>
							<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
								{#each existingImages as imageName, index (imageName)}
									<div class="relative group aspect-square">
										<img 
											src={getExistingImageUrl(imageName)} 
											alt="Tour image {index + 1}"
											class="w-full h-full object-cover rounded-lg border border-gray-200"
											loading="lazy"
										/>
										<button
											type="button"
											onclick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												if (onExistingImageRemove) {
													onExistingImageRemove(imageName);
												}
											}}
											ontouchend={(e) => {
												e.preventDefault();
												e.stopPropagation();
												if (onExistingImageRemove) {
													onExistingImageRemove(imageName);
												}
											}}
											class="absolute -top-2 -right-2 w-8 h-8 sm:w-6 sm:h-6 rounded-full text-sm sm:text-xs transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center z-10 shadow-sm"
											style="
												background: var(--color-error-500);
												color: white;
												touch-action: manipulation;
												-webkit-tap-highlight-color: transparent;
											"
											aria-label="Remove image"
										>
											<X class="w-3 h-3" />
										</button>
									</div>
								{/each}
							</div>
						</div>
					{/if}
					
					<!-- Image Upload Area -->
					<div class="border-2 border-dashed rounded-lg p-6 text-center transition-colors"
						style="border-color: var(--border-secondary); background: var(--bg-secondary);"
					>
						<Upload class="w-8 h-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
						<p class="text-sm mb-2" style="color: var(--text-primary);">{isEdit ? 'Add more images' : 'Upload tour images'}</p>
						<p class="text-xs mb-4" style="color: var(--text-secondary);">JPEG, PNG, WebP up to 5MB each (max 6 images)</p>
						
						<!-- Mobile-optimized file input -->
						<input
							type="file"
							multiple
							accept="image/jpeg,image/jpg,image/png,image/webp"
							capture="environment"
							class="hidden"
							id="images-upload"
							name="images"
							onchange={onImageUpload}
						/>
						
						<!-- Unified upload button - works on all devices -->
						<label
							for="images-upload"
							class="button-secondary cursor-pointer inline-flex items-center gap-2"
							style="touch-action: manipulation; -webkit-tap-highlight-color: transparent;"
						>
							<Camera class="w-4 h-4 sm:hidden" />
							<Upload class="w-4 h-4 hidden sm:block" />
							<span class="sm:hidden">Take Photo / Add Photos</span>
							<span class="hidden sm:inline">Choose Files</span>
						</label>

						<!-- Mobile instruction -->
						<div class="sm:hidden mt-3">
							<p class="text-xs" style="color: var(--text-tertiary);">Tap to take a photo with camera or select from gallery</p>
						</div>
					</div>

					<!-- Image Upload Errors - Show on all screen sizes -->
					{#if imageUploadErrors && imageUploadErrors.length > 0}
						<div class="mt-4 p-3 rounded-lg" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
							<div class="flex items-start gap-2">
								<AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" style="color: var(--color-error-600);" />
								<div class="flex-1">
									<p class="text-sm font-medium" style="color: var(--color-error-900);">Upload Issues:</p>
									<ul class="text-xs mt-1 space-y-1" style="color: var(--color-error-700);">
										{#each imageUploadErrors as error}
											<li>• {error}</li>
										{/each}
									</ul>
								</div>
							</div>
						</div>
					{/if}



					<!-- Image Previews -->
					{#if uploadedImages && uploadedImages.length > 0}
						<div class="mt-6">
							<h4 class="text-sm font-medium text-gray-700 mb-3">{isEdit ? 'New Images' : 'Selected Images'} ({uploadedImages.length})</h4>
							<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
								{#each uploadedImages as image, index (index)}
									<div class="relative group aspect-square">
										<img 
											src={getImagePreview(image)} 
											alt="Tour preview {index + 1}"
											class="w-full h-full object-cover rounded-lg border border-gray-200"
											loading="lazy"
										/>
										<button
											type="button"
											onclick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												if (onImageRemove) {
													onImageRemove(index);
												}
											}}
											ontouchend={(e) => {
												e.preventDefault();
												e.stopPropagation();
												if (onImageRemove) {
													onImageRemove(index);
												}
											}}
											class="absolute -top-2 -right-2 w-8 h-8 sm:w-6 sm:h-6 rounded-full text-sm sm:text-xs transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center z-10 shadow-sm"
											style="
												background: var(--color-error-500);
												color: white;
												touch-action: manipulation;
												-webkit-tap-highlight-color: transparent;
											"
											aria-label="Remove image"
										>
											<X class="w-3 h-3" />
										</button>
										<div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
											{image.name.length > 15 ? image.name.substring(0, 15) + '...' : image.name}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Tour Status -->
		{#if !hideStatusField}
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h3 class="font-semibold" style="color: var(--text-primary);">Tour Status</h3>
				</div>
				<div class="p-4">
					<!-- Onboarding Restriction Notice -->
					{#if !canActivate && (formData.status === 'active' || missingSteps.length > 0)}
						<div class="mb-4 p-4 rounded-lg" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
							<div class="flex items-start gap-3">
								<AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5" style="color: var(--color-warning-600);" />
								<div class="flex-1">
									<p class="text-sm" style="color: var(--color-warning-700);">
										{onboardingMessage}
									</p>
									{#if nextStep}
										<p class="text-xs mt-1" style="color: var(--color-warning-600);">
											{nextStep.action}
										</p>
									{/if}
								</div>
							</div>
						</div>
					{/if}

					<div class="flex items-center justify-between p-4 rounded-lg" style="background: var(--bg-secondary);">
						<div class="flex items-center gap-3 min-w-0 flex-1">
							<div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" 
								style="background: {formData.status === 'active' ? 'var(--color-success-100)' : 'var(--color-warning-100)'};"
							>
								{#if formData.status === 'active'}
									<CheckCircle class="w-5 h-5 flex-shrink-0" style="color: var(--color-success-600);" />
								{:else}
									<FileText class="w-5 h-5 flex-shrink-0" style="color: var(--color-warning-600);" />
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<h3 class="font-medium" style="color: var(--text-primary);">
									{formData.status === 'active' ? 'Active' : 'Draft'}
								</h3>
								<p class="text-sm" style="color: var(--text-secondary);">
									{#if !canActivate && formData.status === 'active'}
										Complete setup to activate
									{:else}
										{formData.status === 'active' 
											? 'Accepting bookings'
											: 'Not visible to customers'}
									{/if}
								</p>
							</div>
						</div>
						
						<div class="flex items-center gap-3 flex-shrink-0">
							<!-- Hidden input to send the actual status value -->
							<input type="hidden" name="status" bind:value={formData.status} />
							<label class="relative inline-flex items-center {canActivate ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}">
								<input
									type="checkbox"
									checked={formData.status === 'active'}
									disabled={!canActivate}
									onchange={(e) => {
										const target = e.target as HTMLInputElement;
										if (canActivate || !target.checked) {
											formData.status = target.checked ? 'active' : 'draft';
										} else {
											// Reset to draft if trying to activate without onboarding
											target.checked = false;
											formData.status = 'draft';
										}
									}}
									class="sr-only peer"
								/>
								<div class="toggle-switch w-11 h-6 rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all {!canActivate ? 'opacity-50' : ''}"></div>
								<span class="ml-3 text-sm font-medium whitespace-nowrap" style="color: var(--text-primary);">
									{formData.status === 'active' ? 'Active' : 'Draft'}
								</span>
							</label>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4">
			<div class="space-y-3">
				<button
					type="button"
					onclick={onSubmit}
					disabled={isSubmitting}
					class="button-primary button--full-width button--gap"
				>
					{#if isSubmitting}
						<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						{formData.status === 'active' && isEdit ? 'Activating...' : 'Saving...'}
					{:else}
						{#if formData.status === 'active' && isEdit}
							<CheckCircle class="w-4 h-4" />
							Save & Activate Tour
						{:else}
							<Save class="w-4 h-4" />
							{submitButtonText || (isEdit ? 'Save Changes' : 'Save Tour')}
						{/if}
					{/if}
				</button>
				
				<button
					type="button"
					onclick={onCancel}
					disabled={isSubmitting}
					class="button-secondary button--full-width"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
</div>


</div>

<style>

	/* Ensure proper aspect ratio for mobile image previews */
	.aspect-square {
		aspect-ratio: 1 / 1;
	}

	/* Fallback for browsers that don't support aspect-ratio */
	@supports not (aspect-ratio: 1 / 1) {
		.aspect-square::before {
			content: '';
			display: block;
			padding-top: 100%;
		}
		
		.aspect-square > * {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
		}
	}

	/* Mobile file input enhancement */
	@media (max-width: 640px) {
		#images-upload {
			/* Ensure file input is accessible on mobile */
			opacity: 0;
			position: absolute;
			z-index: -1;
		}
		
		label[for="images-upload"] {
			/* Make label more touch-friendly on mobile */
			min-height: 44px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
		}
	}



	/* Mobile-enhanced error styling */
	@media (max-width: 768px) {
		.mobile-error-enhanced {
			font-size: 1rem;
			font-weight: 500;
			padding: 0.5rem 0.75rem;
			border-radius: 0.5rem;
			border-left: 4px solid var(--color-error-500);
			background: var(--color-error-50);
			color: var(--color-error-800);
			margin-top: 0.75rem;
			box-shadow: 0 2px 4px rgba(239, 68, 68, 0.1);
		}
		
		/* Make error fields more prominent on mobile */
		.form-input.error,
		.form-textarea.error,
		
		/* Sticky error summary styling */
		.sticky {
			backdrop-filter: blur(8px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		}
		

	}
</style>