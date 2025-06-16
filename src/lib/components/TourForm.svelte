<script lang="ts">
	import NumberInput from './NumberInput.svelte';
	import { validateTourForm, getFieldError, hasFieldError, type ValidationError } from '$lib/validation.js';

	interface Props {
		formData: {
			name: string;
			description: string;
			price: number;
			duration: number;
			capacity: number;
			status: 'active' | 'draft';
			category: string;
			location: string;
			includedItems: string[];
			requirements: string[];
			cancellationPolicy: string;
			enablePricingTiers: boolean;
			pricingTiers: {
				adult: number;
				child?: number;
			};
		};
		uploadedImages?: File[];
		isSubmitting?: boolean;
		isEdit?: boolean;
		submitButtonText?: string;

		onCancel: () => void;
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
		// Booking constraints for capacity validation
		bookingConstraints?: {
			maxBookedSpots: number;
			minimumCapacity: number;
			canReduceCapacity: boolean;
		};
		// Hide status field for new tour creation
		hideStatusField?: boolean;
	}

	let {
		formData = $bindable(),
		uploadedImages = $bindable([]),
		isSubmitting = false,
		isEdit = false,
		submitButtonText = '',

		onCancel,
		onImageUpload,
		onImageRemove,
		existingImages = [],
		onExistingImageRemove,
		getExistingImageUrl,
		imageUploadErrors = [],
		serverErrors = [],
		triggerValidation = false,
		bookingConstraints,
		hideStatusField = false
	}: Props = $props();

	// Client-side validation state
	let validationErrors = $state<ValidationError[]>([]);
	let touchedFields = $state<Set<string>>(new Set());

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
			touchedFields.add('capacity');
			
			// Validate all fields using the same field-specific approach
			const validation = validateTourForm(formData);
			const requiredFields = ['name', 'description', 'price', 'duration', 'capacity'];
			
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
		touchedFields.add('capacity');
		
		// Use the same field-specific validation approach
		const validation = validateTourForm(formData);
		const requiredFields = ['name', 'description', 'price', 'duration', 'capacity'];
		
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
		touchedFields.add('capacity');
		
		// Use the same field-specific validation approach
		const validation = validateTourForm(formData);
		const requiredFields = ['name', 'description', 'price', 'duration', 'capacity'];
		
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

	// Smart list management for included items
	function handleIncludedItemInput(index: number, event: Event) {
		const target = event.target as HTMLInputElement;
		const value = target.value;
		
		// Update the value
		formData.includedItems[index] = value;
		
		// Auto-cleanup: remove empty items (except the last one)
		if (index < formData.includedItems.length - 1 && !value.trim()) {
			setTimeout(() => {
				if (formData.includedItems[index] === '' && index < formData.includedItems.length - 1) {
					formData.includedItems = formData.includedItems.filter((_, i) => i !== index);
				}
			}, 500); // Small delay to avoid removing while user is still typing
		}
	}

	function handleIncludedItemBlur(index: number, event: Event) {
		const target = event.target as HTMLInputElement;
		const value = target.value.trim();
		
		// Auto-expand: if this is the last item and it has content, add a new empty item
		if (index === formData.includedItems.length - 1 && value) {
			formData.includedItems = [...formData.includedItems, ''];
		}
	}

	function handleIncludedItemKeyDown(index: number, event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault(); // Prevent form submission
			const currentValue = formData.includedItems[index]?.trim();
			
			// If current field has content and it's the last field, add new field and focus it
			if (currentValue && index === formData.includedItems.length - 1) {
				formData.includedItems = [...formData.includedItems, ''];
				
				// Focus the new field after DOM update
				setTimeout(() => {
					const nextInput = document.querySelector(`input[name="includedItems"]:nth-of-type(${index + 2})`) as HTMLInputElement;
					if (nextInput) {
						nextInput.focus();
					}
				}, 10);
			}
		}
		
		if (event.key === 'Tab') {
			const currentValue = formData.includedItems[index]?.trim();
			
			// If current field has content and it's the last field, add new field
			if (currentValue && index === formData.includedItems.length - 1) {
				formData.includedItems = [...formData.includedItems, ''];
				// Don't prevent default for Tab - let it naturally focus the next field
			}
		}
		
		// Handle backspace on empty field to remove it
		if (event.key === 'Backspace' && !formData.includedItems[index] && formData.includedItems.length > 1) {
			event.preventDefault();
			formData.includedItems = formData.includedItems.filter((_, i) => i !== index);
			
			// Focus previous field
			setTimeout(() => {
				const prevIndex = Math.max(0, index - 1);
				const prevInput = document.querySelector(`input[name="includedItems"]:nth-of-type(${prevIndex + 1})`) as HTMLInputElement;
				if (prevInput) {
					prevInput.focus();
				}
			}, 10);
		}
	}

	// Smart list management for requirements
	function handleRequirementInput(index: number, event: Event) {
		const target = event.target as HTMLInputElement;
		const value = target.value;
		
		// Update the value
		formData.requirements[index] = value;
		
		// Auto-cleanup: remove empty items (except the last one)
		if (index < formData.requirements.length - 1 && !value.trim()) {
			setTimeout(() => {
				if (formData.requirements[index] === '' && index < formData.requirements.length - 1) {
					formData.requirements = formData.requirements.filter((_, i) => i !== index);
				}
			}, 500); // Small delay to avoid removing while user is still typing
		}
	}

	function handleRequirementBlur(index: number, event: Event) {
		const target = event.target as HTMLInputElement;
		const value = target.value.trim();
		
		// Auto-expand: if this is the last item and it has content, add a new empty item
		if (index === formData.requirements.length - 1 && value) {
			formData.requirements = [...formData.requirements, ''];
		}
	}

	function handleRequirementKeyDown(index: number, event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault(); // Prevent form submission
			const currentValue = formData.requirements[index]?.trim();
			
			// If current field has content and it's the last field, add new field and focus it
			if (currentValue && index === formData.requirements.length - 1) {
				formData.requirements = [...formData.requirements, ''];
				
				// Focus the new field after DOM update
				setTimeout(() => {
					const nextInput = document.querySelector(`input[name="requirements"]:nth-of-type(${index + 2})`) as HTMLInputElement;
					if (nextInput) {
						nextInput.focus();
					}
				}, 10);
			}
		}
		
		if (event.key === 'Tab') {
			const currentValue = formData.requirements[index]?.trim();
			
			// If current field has content and it's the last field, add new field
			if (currentValue && index === formData.requirements.length - 1) {
				formData.requirements = [...formData.requirements, ''];
				// Don't prevent default for Tab - let it naturally focus the next field
			}
		}
		
		// Handle backspace on empty field to remove it
		if (event.key === 'Backspace' && !formData.requirements[index] && formData.requirements.length > 1) {
			event.preventDefault();
			formData.requirements = formData.requirements.filter((_, i) => i !== index);
			
			// Focus previous field
			setTimeout(() => {
				const prevIndex = Math.max(0, index - 1);
				const prevInput = document.querySelector(`input[name="requirements"]:nth-of-type(${prevIndex + 1})`) as HTMLInputElement;
				if (prevInput) {
					prevInput.focus();
				}
			}, 10);
		}
	}

	// Get smart placeholder text based on position
	function getIncludedItemPlaceholder(index: number): string {
		const placeholders = [
			"e.g., Professional tour guide",
			"e.g., Historical insights and stories", 
			"e.g., Photo opportunities at key spots",
			"e.g., Small group experience (max 12 people)",
			"e.g., Route map and recommendations",
			"Add another item..."
		];
		return placeholders[Math.min(index, placeholders.length - 1)];
	}

	function getRequirementPlaceholder(index: number): string {
		const placeholders = [
			"e.g., Comfortable walking shoes",
			"e.g., Basic fitness level required",
			"e.g., Weather-appropriate clothing",
			"e.g., Ability to walk for 2+ hours",
			"e.g., Must be 16+ years old",
			"Add another requirement..."
		];
		return placeholders[Math.min(index, placeholders.length - 1)];
	}

	// Cancellation Policy Templates
	let selectedPolicyTemplate = $state('');
	let showCustomPolicy = $state(false);
	
	const policyTemplates = [
		{
			id: 'flexible',
			name: '🟢 Flexible',
			description: 'Free cancellation up to 24 hours',
			policy: 'Free cancellation up to 24 hours before the tour starts. Full refund guaranteed. For cancellations within 24 hours, 50% refund will be provided.'
		},
		{
			id: 'moderate',
			name: '🟡 Moderate', 
			description: 'Free cancellation up to 48 hours',
			policy: 'Free cancellation up to 48 hours before the tour starts. For cancellations between 48-24 hours: 50% refund. For cancellations within 24 hours: no refund.'
		},
		{
			id: 'strict',
			name: '🔴 Strict',
			description: 'Free cancellation up to 7 days',
			policy: 'Free cancellation up to 7 days before the tour starts. For cancellations between 7-3 days: 50% refund. For cancellations within 3 days: no refund.'
		},
		{
			id: 'weather',
			name: '🌦️ Weather-Dependent',
			description: 'Flexible for weather conditions',
			policy: 'Free cancellation up to 24 hours before the tour starts. Tours may be cancelled due to severe weather conditions with full refund. Alternative dates will be offered when possible.'
		},
		{
			id: 'group',
			name: '👥 Group-Friendly',
			description: 'Flexible for group bookings',
			policy: 'Free cancellation up to 48 hours before the tour starts. For group bookings (5+ people), free cancellation up to 72 hours. Partial cancellations allowed with 24-hour notice.'
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

	// Sticky save button state
	let showStickySave = $state(false);
	let saveButtonRef: HTMLElement | null = null;

	// Monitor scroll position to show/hide sticky save button
	function handleScroll() {
		if (typeof window === 'undefined' || !saveButtonRef) return;
		
		const saveButtonRect = saveButtonRef.getBoundingClientRect();
		const isButtonVisible = saveButtonRect.top >= 0 && saveButtonRect.bottom <= window.innerHeight;
		
		// Show sticky button when original is not visible and user has scrolled down
		showStickySave = !isButtonVisible && window.scrollY > 200;
	}

	// Set up scroll listener
	$effect(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('scroll', handleScroll, { passive: true });
			window.addEventListener('resize', handleScroll, { passive: true });
			
			return () => {
				window.removeEventListener('scroll', handleScroll);
				window.removeEventListener('resize', handleScroll);
			};
		}
	});

	// Handle sticky save button click
	function handleStickySave() {
		const form = document.querySelector('form');
		if (form) {
			form.requestSubmit();
		}
	}

	// Calculate form completion percentage
	let formProgress = $derived(() => {
		const requiredFields = [
			formData.name,
			formData.description,
			formData.price,
			formData.duration,
			formData.capacity
		];
		
		const optionalFields = [
			formData.category,
			formData.location,
			formData.cancellationPolicy,
			formData.includedItems.filter(item => item.trim()).length > 0,
			formData.requirements.filter(req => req.trim()).length > 0
		];
		
		const completedRequired = requiredFields.filter(field => 
			field !== null && field !== undefined && String(field).trim() !== ''
		).length;
		
		const completedOptional = optionalFields.filter(field => 
			field !== null && field !== undefined && field !== false && String(field).trim() !== ''
		).length;
		
		const requiredProgress = (completedRequired / requiredFields.length) * 70; // 70% for required
		const optionalProgress = (completedOptional / optionalFields.length) * 30; // 30% for optional
		
		return Math.round(requiredProgress + optionalProgress);
	});

	// Legacy functions for backward compatibility (kept for any existing references)
	function addIncludedItem() {
		formData.includedItems = [...formData.includedItems, ''];
	}

	function removeIncludedItem(index: number) {
		formData.includedItems = formData.includedItems.filter((_, i) => i !== index);
	}

	function addRequirement() {
		formData.requirements = [...formData.requirements, ''];
	}

	function removeRequirement(index: number) {
		formData.requirements = formData.requirements.filter((_, i) => i !== index);
	}

	function getImagePreview(file: File): string {
		return URL.createObjectURL(file);
	}

	// Mobile-specific file input handling for better compatibility
	function triggerFileInput() {
		const fileInput = document.getElementById('images-upload') as HTMLInputElement;
		if (fileInput) {
			fileInput.click();
		}
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

	// Enhanced validation functions with mobile scroll
	function validateFieldRealtimeWithScroll(fieldName: string) {
		validateFieldRealtime(fieldName);
	}

	function validateFieldWithScroll(fieldName: string) {
		validateField(fieldName);
	}

	// Enhanced validate function for mobile
	export function validateWithMobileSupport() {
		const isValid = validate();
		if (!isValid) {
			scrollToFirstError();
		}
		return isValid;
	}

	// Pricing tiers toggle handler
	function handlePricingTiersToggle() {
		if (formData.enablePricingTiers) {
			// Initialize pricing tiers with current price as adult price
			formData.pricingTiers = {
				adult: formData.price || 0,
				child: 0
			};
		} else {
			// When switching back to single pricing, use adult price as the main price
			if (formData.pricingTiers.adult > 0) {
				formData.price = formData.pricingTiers.adult;
			}
			// Reset pricing tiers
			formData.pricingTiers = {
				adult: 0,
				child: 0
			};
		}
	}

	// State for child price to handle undefined values
	let childPrice = $state(0);

	// Sync child price with formData
	$effect(() => {
		childPrice = formData.pricingTiers?.child ?? 0;
	});

	// Update formData when child price changes
	$effect(() => {
		if (formData.pricingTiers) {
			formData.pricingTiers.child = childPrice;
		}
	});


</script>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
	<!-- Mobile Error Summary - Only show on mobile when errors exist -->
	{#if allErrors.length > 0}
		<div class="lg:hidden mb-4 rounded-xl p-4 sticky top-4 z-10" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
			<div class="flex items-start gap-3">
				<div class="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
					<svg class="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
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
						<select
							id="category"
							name="category"
							bind:value={formData.category}
							class="form-select"
						>
							<option value="">Select category</option>
							<option value="walking">Walking Tour</option>
							<option value="food">Food Tour</option>
							<option value="cultural">Cultural Tour</option>
							<option value="historical">Historical Tour</option>
							<option value="art">Art Tour</option>
							<option value="adventure">Adventure Tour</option>
							<option value="other">Other</option>
						</select>
					</div>

					<div>
						<label for="location" class="form-label">
							Location
						</label>
						<input
							type="text"
							id="location"
							name="location"
							bind:value={formData.location}
							placeholder="e.g., Prague Castle Area"
							class="form-input"
						/>
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
							placeholder="Describe your tour, what makes it special, what guests will see and experience..."
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

		<!-- Tour Status (Edit Mode Only) -->
		{#if isEdit && !hideStatusField}
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h2 class="font-semibold" style="color: var(--text-primary);">Tour Status</h2>
				</div>
				<div class="p-4">
					<div class="flex items-center justify-between p-4 rounded-lg" style="background: var(--bg-secondary);">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 rounded-full flex items-center justify-center {formData.status === 'active' ? 'bg-green-100' : 'bg-amber-100'}">
								<span class="text-lg">
									{formData.status === 'active' ? '🟢' : '📝'}
								</span>
							</div>
							<div>
								<h3 class="font-medium" style="color: var(--text-primary);">
									{formData.status === 'active' ? 'Tour is Active' : 'Tour is Draft'}
								</h3>
								<p class="text-sm" style="color: var(--text-secondary);">
									{formData.status === 'active' 
										? 'Your tour is live and accepting bookings' 
										: 'Your tour is saved but not visible to customers'}
								</p>
							</div>
						</div>
						
						<div class="flex items-center gap-3">
							<!-- Hidden input to send the actual status value -->
							<input type="hidden" name="status" bind:value={formData.status} />
							<label class="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									checked={formData.status === 'active'}
									onchange={(e) => {
										const target = e.target as HTMLInputElement;
										formData.status = target.checked ? 'active' : 'draft';
									}}
									class="sr-only peer"
								/>
								<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
								<span class="ml-3 text-sm font-medium" style="color: var(--text-primary);">
									{formData.status === 'active' ? 'Active' : 'Draft'}
								</span>
							</label>
						</div>
					</div>
					
					<!-- Status Change Warning -->
					{#if formData.status === 'active'}
						<div class="mt-4 p-3 rounded-lg" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
							<div class="flex items-start gap-2">
								<svg class="w-4 h-4 flex-shrink-0 mt-0.5" style="color: var(--color-success-600);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<div>
									<p class="text-sm font-medium" style="color: var(--color-success-900);">Tour will be activated</p>
									<p class="text-xs mt-1" style="color: var(--color-success-700);">
										When you save, your tour will be live and customers can book it immediately.
									</p>
								</div>
							</div>
						</div>
					{:else}
						<div class="mt-4 p-3 rounded-lg" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
							<div class="flex items-start gap-2">
								<svg class="w-4 h-4 flex-shrink-0 mt-0.5" style="color: var(--color-warning-600);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
								</svg>
								<div>
									<p class="text-sm font-medium" style="color: var(--color-warning-900);">Tour will remain draft</p>
									<p class="text-xs mt-1" style="color: var(--color-warning-700);">
										Your tour will be saved but customers won't be able to see or book it yet.
									</p>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Pricing & Logistics -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<h2 class="font-semibold" style="color: var(--text-primary);">Pricing & Logistics</h2>
			</div>
			<div class="p-4">
			
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<!-- Only show single price field when pricing tiers are disabled -->
				{#if !formData.enablePricingTiers}
					<NumberInput
						id="price"
						name="price"
						label="Price per Person (€)"
						bind:value={formData.price}
						min={0.5}
						max={99999}
						step={0.5}
						placeholder="0.50"
						incrementLabel="Increase price"
						decrementLabel="Decrease price"
						error={getFieldError(allErrors, 'price')}
						hasError={hasFieldError(allErrors, 'price')}
						decimalPlaces={2}
						onblur={() => validateField('price')}
					/>
				{:else}
					<!-- Show pricing summary when tiers are enabled -->
					<div class="p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
						<div class="flex items-center gap-2 mb-2">
							<div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
								<span class="text-xs font-semibold text-blue-600">💰</span>
							</div>
							<h4 class="font-medium" style="color: var(--text-primary);">Pricing Tiers</h4>
						</div>
						<div class="space-y-1 text-sm">
							<div class="flex justify-between">
								<span style="color: var(--text-secondary);">Adult:</span>
								<span style="color: var(--text-primary);">€{formData.pricingTiers.adult || 0}</span>
							</div>
							<div class="flex justify-between">
								<span style="color: var(--text-secondary);">Child:</span>
								<span style="color: var(--text-primary);">€{formData.pricingTiers.child || 0}</span>
							</div>
						</div>
						<p class="text-xs mt-2" style="color: var(--text-tertiary);">
							Configure below in Pricing Tiers section
						</p>
					</div>
				{/if}

				<NumberInput
					id="duration"
					name="duration"
					label="Duration (minutes)"
					bind:value={formData.duration}
					min={1}
					max={1440}
					step={1}
					placeholder="60"
					incrementLabel="Increase duration"
					decrementLabel="Decrease duration"
					error={getFieldError(allErrors, 'duration')}
					hasError={hasFieldError(allErrors, 'duration')}
					integerOnly={true}
					onblur={() => validateField('duration')}
				/>

				<NumberInput
					id="capacity"
					name="capacity"
					label="Max Capacity"
					bind:value={formData.capacity}
					min={bookingConstraints?.minimumCapacity || 1}
					max={500}
					step={1}
					placeholder="10"
					incrementLabel="Increase capacity"
					decrementLabel="Decrease capacity"
					error={getFieldError(allErrors, 'capacity')}
					hasError={hasFieldError(allErrors, 'capacity')}
					integerOnly={true}
					onblur={() => validateField('capacity')}
				/>
				{#if bookingConstraints && bookingConstraints.maxBookedSpots > 0}
					<div class="md:col-span-3 mt-2">
						<p class="text-xs" style="color: var(--text-secondary);">
							⚠️ Minimum capacity: <strong>{bookingConstraints.minimumCapacity}</strong> 
							(you have {bookingConstraints.maxBookedSpots} people booked in your busiest time slot)
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Pricing Tiers -->
	<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="p-4 border-b" style="border-color: var(--border-primary);">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="font-semibold" style="color: var(--text-primary);">Pricing Tiers</h2>
					<p class="text-sm mt-1" style="color: var(--text-secondary);">Set different prices for adults and children</p>
				</div>
				<div class="flex items-center gap-3">
					<span class="text-sm font-medium transition-colors {!formData.enablePricingTiers ? 'text-gray-600' : 'text-gray-400'}" style="color: {!formData.enablePricingTiers ? 'var(--text-primary)' : 'var(--text-tertiary)'};">
						Single Price
					</span>
					<label class="relative inline-flex items-center cursor-pointer group">
						<input
							type="checkbox"
							name="enablePricingTiers"
							bind:checked={formData.enablePricingTiers}
							onchange={handlePricingTiersToggle}
							class="sr-only peer"
						/>
						<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 group-hover:peer-checked:bg-blue-600"></div>
						<!-- Tooltip on hover -->
						<div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
							{formData.enablePricingTiers ? 'Switch to Single Price' : 'Enable Pricing Tiers'}
						</div>
					</label>
					<span class="text-sm font-medium transition-colors {formData.enablePricingTiers ? 'text-blue-600' : 'text-gray-400'}" style="color: {formData.enablePricingTiers ? 'var(--color-primary-600)' : 'var(--text-tertiary)'};">
						Pricing Tiers
					</span>
				</div>
			</div>
		</div>
		<div class="p-4">
			{#if !formData.enablePricingTiers}
				<!-- Single Price Mode -->
				<div class="text-center py-8">
					<div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
						</svg>
					</div>
					<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Single Price for Everyone</h3>
					<p class="text-sm mb-4" style="color: var(--text-secondary);">
						Currently using <strong>€{formData.price}</strong> per person regardless of age
					</p>
					<p class="text-xs" style="color: var(--text-tertiary);">
						Enable pricing tiers above to set different prices for adults and children
					</p>
				</div>
			{:else}
				<!-- Pricing Tiers Mode -->
				<div class="space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
							<div class="flex items-center gap-2 mb-3">
								<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
									<span class="text-sm font-semibold text-blue-600">👨</span>
								</div>
								<div>
									<h4 class="font-medium" style="color: var(--text-primary);">Adult Price</h4>
									<p class="text-xs" style="color: var(--text-secondary);">Ages 13 and above</p>
								</div>
							</div>
							<NumberInput
								id="adultPrice"
								name="pricingTiers.adult"
								label="Adult Price (€)"
								bind:value={formData.pricingTiers.adult}
								min={0.5}
								max={99999}
								step={0.5}
								placeholder="0.50"
								incrementLabel="Increase adult price"
								decrementLabel="Decrease adult price"
								decimalPlaces={2}
							/>
						</div>

						<div class="p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
							<div class="flex items-center gap-2 mb-3">
								<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
									<span class="text-sm font-semibold text-green-600">👶</span>
								</div>
								<div>
									<h4 class="font-medium" style="color: var(--text-primary);">Child Price</h4>
									<p class="text-xs" style="color: var(--text-secondary);">Ages 3-12 (optional)</p>
								</div>
							</div>
							<NumberInput
								id="childPrice"
								name="pricingTiers.child"
								label="Child Price (€)"
								bind:value={childPrice}
								min={0}
								max={99999}
								step={0.5}
								placeholder="0.00 (free)"
								incrementLabel="Increase child price"
								decrementLabel="Decrease child price"
								decimalPlaces={2}
							/>
						</div>
					</div>

					<!-- Pricing Summary -->
					<div class="p-4 rounded-lg" style="background: var(--color-primary-50); border: 1px solid var(--color-primary-200);">
						<h4 class="font-medium mb-2" style="color: var(--color-primary-900);">Pricing Summary</h4>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
							<div class="flex justify-between">
								<span style="color: var(--color-primary-700);">Adults (13+):</span>
								<span class="font-medium" style="color: var(--color-primary-900);">
									€{formData.pricingTiers.adult || '0.00'}
								</span>
							</div>
							<div class="flex justify-between">
								<span style="color: var(--color-primary-700);">Children (3-12):</span>
								<span class="font-medium" style="color: var(--color-primary-900);">
									{#if formData.pricingTiers.child && formData.pricingTiers.child > 0}
										€{formData.pricingTiers.child}
									{:else}
										Free
									{/if}
								</span>
							</div>
						</div>
						<div class="mt-3 pt-3 border-t" style="border-color: var(--color-primary-200);">
							<p class="text-xs" style="color: var(--color-primary-600);">
								<strong>Note:</strong> Children under 3 are always free. If child price is not set or is €0, children aged 3-12 will be free.
							</p>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

		<!-- What's Included -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<div class="flex items-center justify-between">
					<h2 class="font-semibold" style="color: var(--text-primary);">What's Included</h2>
					<div class="text-xs px-2 py-1 rounded-full" style="background: var(--bg-secondary); color: var(--text-tertiary);">
						Press Enter to add more
					</div>
				</div>
			</div>
			<div class="p-4">
				<div class="space-y-3">
					{#each formData.includedItems as item, index (index)}
						<div class="flex gap-2 group">
							<div class="flex-1 relative">
								<input
									type="text"
									name="includedItems"
									value={formData.includedItems[index]}
									placeholder={getIncludedItemPlaceholder(index)}
									class="form-input w-full transition-all duration-200 {index === formData.includedItems.length - 1 && !item ? 'ring-1 ring-blue-200' : ''}"
									oninput={(e) => handleIncludedItemInput(index, e)}
									onblur={(e) => handleIncludedItemBlur(index, e)}
									onkeydown={(e) => handleIncludedItemKeyDown(index, e)}
								/>
								{#if index === formData.includedItems.length - 1 && !item}
									<div class="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style="color: var(--text-tertiary);">
										↵ Enter
									</div>
								{/if}
							</div>
							{#if formData.includedItems.length > 1 && (item || index < formData.includedItems.length - 1)}
								<button
									type="button"
									onclick={() => removeIncludedItem(index)}
									class="p-2 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
									aria-label="Remove included item"
									tabindex="-1"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							{/if}
						</div>
					{/each}
				</div>
				
				<!-- Helpful tip -->
				<div class="mt-4 p-3 rounded-lg" style="background: var(--bg-secondary);">
					<p class="text-xs" style="color: var(--text-secondary);">
						💡 <strong>Tip:</strong> Just start typing and press Enter to add more items. Empty items are automatically removed.
					</p>
				</div>
			</div>
		</div>

		<!-- Requirements -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<div class="flex items-center justify-between">
					<h2 class="font-semibold" style="color: var(--text-primary);">Requirements</h2>
					<div class="text-xs px-2 py-1 rounded-full" style="background: var(--bg-secondary); color: var(--text-tertiary);">
						Press Enter to add more
					</div>
				</div>
			</div>
			<div class="p-4">
				<div class="space-y-3">
					{#each formData.requirements as requirement, index (index)}
						<div class="flex gap-2 group">
							<div class="flex-1 relative">
								<input
									type="text"
									name="requirements"
									value={formData.requirements[index]}
									placeholder={getRequirementPlaceholder(index)}
									class="form-input w-full transition-all duration-200 {index === formData.requirements.length - 1 && !requirement ? 'ring-1 ring-blue-200' : ''}"
									oninput={(e) => handleRequirementInput(index, e)}
									onblur={(e) => handleRequirementBlur(index, e)}
									onkeydown={(e) => handleRequirementKeyDown(index, e)}
								/>
								{#if index === formData.requirements.length - 1 && !requirement}
									<div class="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style="color: var(--text-tertiary);">
										↵ Enter
									</div>
								{/if}
							</div>
							{#if formData.requirements.length > 1 && (requirement || index < formData.requirements.length - 1)}
								<button
									type="button"
									onclick={() => removeRequirement(index)}
									class="p-2 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
									aria-label="Remove requirement"
									tabindex="-1"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							{/if}
						</div>
					{/each}
				</div>
				
				<!-- Helpful tip -->
				<div class="mt-4 p-3 rounded-lg" style="background: var(--bg-secondary);">
					<p class="text-xs" style="color: var(--text-secondary);">
						💡 <strong>Tip:</strong> Just start typing and press Enter to add more requirements. Empty items are automatically removed.
					</p>
				</div>
			</div>
		</div>

		<!-- Cancellation Policy -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<div class="flex items-center justify-between">
					<h2 class="font-semibold" style="color: var(--text-primary);">Cancellation Policy</h2>
					<div class="text-xs px-2 py-1 rounded-full" style="background: var(--bg-secondary); color: var(--text-tertiary);">
						{showCustomPolicy ? 'Custom' : selectedPolicyTemplate ? 'Template' : 'Choose'}
					</div>
				</div>
			</div>
			<div class="p-4">
				{#if !showCustomPolicy}
					<!-- Policy Templates - Minimal Design -->
					<div class="space-y-3 mb-4">
						<p class="text-sm mb-4" style="color: var(--text-secondary);">Choose a cancellation policy:</p>
						
						<!-- Template Options as Radio-style List -->
						<div class="space-y-2">
							{#each policyTemplates as template}
								<label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm {selectedPolicyTemplate === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}">
									<input
										type="radio"
										name="policyTemplate"
										value={template.id}
										checked={selectedPolicyTemplate === template.id}
										onchange={() => selectPolicyTemplate(template.id)}
										class="form-radio mt-0.5"
									/>
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2 mb-1">
											<span class="text-sm">{template.name.split(' ')[0]}</span>
											<span class="font-medium text-sm" style="color: var(--text-primary);">
												{template.name.substring(2)}
											</span>
										</div>
										<p class="text-xs mb-2" style="color: var(--text-secondary);">{template.description}</p>
										{#if selectedPolicyTemplate === template.id}
											<div class="mt-2 p-2 rounded text-xs" style="background: var(--bg-secondary); color: var(--text-tertiary);">
												{template.policy}
											</div>
										{/if}
									</div>
								</label>
							{/each}
						</div>
					</div>

					<!-- Custom Policy Option -->
					<div class="pt-4 border-t" style="border-color: var(--border-primary);">
						<button
							type="button"
							onclick={enableCustomPolicy}
							class="w-full p-3 rounded-lg border border-dashed transition-colors text-center hover:bg-gray-50"
							style="border-color: var(--border-primary);"
						>
							<div class="flex items-center justify-center gap-2 mb-1">
								<svg class="w-4 h-4" style="color: var(--text-secondary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
								</svg>
								<span class="font-medium text-sm" style="color: var(--text-primary);">Write Custom Policy</span>
							</div>
							<p class="text-xs" style="color: var(--text-secondary);">Create your own cancellation terms</p>
						</button>
					</div>
				{:else}
					<!-- Custom Policy Editor -->
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<h3 class="font-medium" style="color: var(--text-primary);">Custom Cancellation Policy</h3>
							<button
								type="button"
								onclick={() => { showCustomPolicy = false; selectedPolicyTemplate = ''; }}
								class="text-sm px-3 py-1.5 rounded-md transition-colors button-secondary button--small"
							>
								← Back to Templates
							</button>
						</div>
						
						<textarea
							name="cancellationPolicy"
							bind:value={formData.cancellationPolicy}
							rows="4"
							placeholder="Write your custom cancellation policy here. Be clear about refund terms, time limits, and any special conditions..."
							class="form-textarea"
						></textarea>
						
						<!-- Custom Policy Tips -->
						<div class="p-3 rounded-lg" style="background: var(--bg-secondary);">
							<p class="text-xs font-medium mb-2" style="color: var(--text-primary);">💡 Tips for a good cancellation policy:</p>
							<ul class="text-xs space-y-1" style="color: var(--text-secondary);">
								<li>• Specify exact time limits (e.g., "24 hours before tour starts")</li>
								<li>• Be clear about refund percentages</li>
								<li>• Mention weather or emergency exceptions</li>
								<li>• Consider group booking flexibility</li>
								<li>• Keep it simple and easy to understand</li>
							</ul>
						</div>
					</div>
				{/if}

				<!-- Hidden input for form submission -->
				<input type="hidden" name="cancellationPolicy" bind:value={formData.cancellationPolicy} />
			</div>
		</div>
	</div>

	<!-- Sidebar -->
	<div class="space-y-6">
		<!-- Tour Images -->
		{#if onImageUpload && onImageRemove}
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h3 class="font-semibold" style="color: var(--text-primary);">Tour Images</h3>
				</div>
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
										onclick={() => onExistingImageRemove && onExistingImageRemove(imageName)}
										class="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center touch-manipulation"
										aria-label="Remove image"
									>
										×
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
				
				<!-- Image Upload Area -->
				<div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
					<svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
					</svg>
					<p class="text-sm text-gray-600 mb-2">{isEdit ? 'Add more images' : 'Upload tour images'}</p>
					<p class="text-xs text-gray-500 mb-4">JPEG, PNG, WebP up to 5MB each (max 10 images)</p>
					
					<!-- Mobile-optimized file input -->
					<input
						type="file"
						multiple
						accept="image/jpeg,image/jpg,image/png,image/webp"
						class="hidden"
						id="images-upload"
						name="images"
						onchange={onImageUpload}
					/>
					
					<!-- Unified upload button - works on all devices -->
					<label
						for="images-upload"
						class="button-secondary cursor-pointer inline-flex items-center gap-2 touch-manipulation"
					>
						<svg class="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						<svg class="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
						</svg>
						<span class="sm:hidden">Add Photos</span>
						<span class="hidden sm:inline">Choose Files</span>
					</label>

					<!-- Mobile instruction -->
					<div class="sm:hidden mt-3">
						<p class="text-xs text-gray-500">Tap to take photos or select from gallery</p>
					</div>
				</div>

				<!-- Mobile Image Upload Errors - Show directly in upload section -->
				{#if imageUploadErrors && imageUploadErrors.length > 0}
					<div class="mt-4 p-3 rounded-lg sm:hidden" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
						<div class="flex items-start gap-2">
							<svg class="w-4 h-4 flex-shrink-0 mt-0.5" style="color: var(--color-error-600);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
							</svg>
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
										onclick={() => onImageRemove && onImageRemove(index)}
										class="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center touch-manipulation"
										aria-label="Remove image"
									>
										×
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
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4">
			<div class="space-y-3">
				<button
					bind:this={saveButtonRef}
					type="submit"
					disabled={isSubmitting}
					class="button-primary button--full-width button--gap"
				>
					{#if isSubmitting}
						<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						{formData.status === 'active' && isEdit ? 'Activating...' : 'Saving...'}
					{:else}
						{#if formData.status === 'active' && isEdit}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							Save & Activate Tour
						{:else}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
							</svg>
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

<!-- Minimal Floating Save Button (appears when scrolled down) -->
{#if showStickySave}
	<div class="fixed z-50 transition-all duration-300 ease-out floating-save-container">
		<!-- Single elegant floating button with integrated progress -->
		<button
			type="button"
			onclick={handleStickySave}
			disabled={isSubmitting}
			class="floating-save-btn group"
			title="{isSubmitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Save Tour')} • {formProgress()}% complete"
			aria-label="{isSubmitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Save Tour')}"
		>
			<!-- Progress ring (subtle, integrated) -->
			<div class="absolute inset-0 rounded-full">
				<svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
					<circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" stroke-width="1" class="text-gray-200 opacity-30" />
					<circle 
						cx="18" cy="18" r="16" 
						fill="none" 
						stroke="currentColor" 
						stroke-width="1.5" 
						class="text-white transition-all duration-300"
						stroke-dasharray="100.53"
						stroke-dashoffset="{100.53 - (100.53 * formProgress() / 100)}"
						stroke-linecap="round"
					/>
				</svg>
			</div>
			
			<!-- Button content -->
			<div class="relative flex items-center justify-center">
				{#if isSubmitting}
					<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
				{:else}
					<svg class="w-4 h-4 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				{/if}
			</div>
			
			<!-- Tooltip on hover (desktop only) -->
			<div class="floating-save-tooltip">
				<div class="tooltip-content">
					<span class="font-medium">
						{#if isSubmitting}
							Saving...
						{:else if formData.status === 'active' && isEdit}
							Save & Activate
						{:else}
							{isEdit ? 'Save Changes' : 'Save Tour'}
						{/if}
					</span>
					<span class="text-xs opacity-75">{formProgress()}% complete</span>
				</div>
			</div>
		</button>
	</div>
{/if}
</div>

<style>
	/* Mobile touch optimization */
	.touch-manipulation {
		touch-action: manipulation;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
	}

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

	/* Minimal Floating Save Button */
	.floating-save-container {
		bottom: 2rem;
		right: 2rem;
	}

	/* Mobile positioning - account for bottom navigation */
	@media (max-width: 767px) {
		.floating-save-container {
			bottom: calc(env(safe-area-inset-bottom, 0px) + 5rem);
			right: 1.5rem;
		}
	}

	/* Desktop positioning - align with form content */
	@media (min-width: 1024px) {
		.floating-save-container {
			right: max(2rem, calc((100vw - 80rem) / 2 + 2rem));
		}
	}

	.floating-save-btn {
		position: relative;
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		border: none;
		cursor: pointer;
		color: white;
		background: var(--color-primary-600);
		box-shadow: 
			0 4px 12px rgba(0, 0, 0, 0.15),
			0 2px 4px rgba(0, 0, 0, 0.1);
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		backdrop-filter: blur(8px);
	}

	.floating-save-btn:hover {
		transform: translateY(-2px) scale(1.05);
		box-shadow: 
			0 8px 20px rgba(0, 0, 0, 0.2),
			0 4px 8px rgba(0, 0, 0, 0.15);
		background: var(--color-primary-700);
	}

	.floating-save-btn:active {
		transform: translateY(-1px) scale(1.02);
	}

	.floating-save-btn:disabled {
		opacity: 0.8;
		cursor: not-allowed;
		transform: none;
	}

	.floating-save-btn:disabled:hover {
		transform: none;
		box-shadow: 
			0 4px 12px rgba(0, 0, 0, 0.15),
			0 2px 4px rgba(0, 0, 0, 0.1);
	}

	/* Elegant tooltip */
	.floating-save-tooltip {
		position: absolute;
		right: calc(100% + 0.75rem);
		top: 50%;
		transform: translateY(-50%);
		opacity: 0;
		visibility: hidden;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		pointer-events: none;
		z-index: 10;
	}

	.tooltip-content {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		padding: 0.5rem 0.75rem;
		box-shadow: 
			0 4px 12px rgba(0, 0, 0, 0.1),
			0 2px 4px rgba(0, 0, 0, 0.06);
		white-space: nowrap;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	/* Show tooltip on hover (desktop only) */
	@media (min-width: 768px) {
		.floating-save-btn:hover .floating-save-tooltip {
			opacity: 1;
			visibility: visible;
			transform: translateY(-50%) translateX(-0.25rem);
		}
	}

	/* Hide tooltip on mobile */
	@media (max-width: 767px) {
		.floating-save-tooltip {
			display: none;
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
		.form-select.error {
			border-color: var(--color-error-500);
			box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2), 0 0 0 3px rgba(239, 68, 68, 0.1);
			outline: none;
		}
		
		/* Sticky error summary styling */
		.sticky {
			backdrop-filter: blur(8px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		}
		
		/* Adjust floating button position on mobile to avoid keyboard */
		.floating-save-btn {
			margin-bottom: env(keyboard-inset-height, 0);
		}
	}
</style>