<!--
================================================================================
TOUR FORM COMPONENT
================================================================================

Main form for creating and editing tours. Organized into clear sections:

1. BASIC INFORMATION - Name, categories, location, description, duration
2. PRICING - Pricing model, price, tiers, add-ons, capacity
3. TOUR DETAILS - Included items & requirements (extracted component)
4. CANCELLATION POLICY - Cancellation terms with templates
5. DANGER ZONE - Delete tour (edit mode only, shown in main content)
6. TOUR STATUS - Active/Draft status (edit mode only, shown in sidebar)
7. PUBLIC LISTING - Discovery toggle (edit mode only, shown in sidebar)
8. ACTION BUTTONS - Save, publish, cancel (shown in sidebar)

Smart button behavior:
- When editing active tours: "Save Changes" (keeps tour active)
- When editing draft tours: "Save & Activate" (activates tour)
- "Save as Draft" always available (saves/deactivates tour)

Key extracted components:
- pricing/PricingModelSelector - Choose pricing model
- pricing/ChildPricingSection - Adult/child pricing (ages 3-12)
- pricing/GroupPricingTiers - Manage group pricing tiers
- pricing/OptionalAddons - Manage optional add-ons
- tour-form/TourDetailsSection - Included items & requirements

================================================================================
-->

<script lang="ts">
	import NumberInput from './NumberInput.svelte';
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
	import Tooltip from './Tooltip.svelte';
	import Plus from 'lucide-svelte/icons/plus';
	import Globe from 'lucide-svelte/icons/globe';
	import Calendar from 'lucide-svelte/icons/calendar';
	import { isValidLocationLength } from '$lib/utils/location.js';
	
	// Import new pricing components
	import SimplifiedPricingSection from './pricing/SimplifiedPricingSection.svelte';
	import type { PricingModel, GroupPricingTier, GroupDiscountTier, OptionalAddon, ParticipantCategory } from '$lib/types.js';
	
	// Import tour form section components
	import TourDetailsSection from './tour-form/TourDetailsSection.svelte';
	import DurationInput from './DurationInput.svelte';

	interface Props {
		formData: {
			name: string;
			description: string;
			price: number;
			duration: number;
			capacity: number;
			minCapacity?: number;
			maxCapacity?: number;
			countInfantsTowardCapacity?: boolean;
			status: 'active' | 'draft';
			categories: string[];
			location: string;
			includedItems: string[];
			requirements: string[];
			cancellationPolicy: string;
			// Pricing configuration
			pricingModel?: PricingModel;
			enablePricingTiers: boolean;
			pricingTiers?: {
				adult: number;
				child?: number;
			};
			participantCategories?: {
				categories: ParticipantCategory[];
				minCapacity?: number;
				maxCapacity?: number;
			};
			privateTour?: {
				flatPrice: number;
				minCapacity?: number;
				maxCapacity?: number;
			};
			groupPricingTiers?: {
				tiers: GroupPricingTier[];
				privateBooking?: boolean;
				minCapacity?: number;
				maxCapacity?: number;
			};
			groupDiscounts?: {
				tiers: GroupDiscountTier[];
				enabled: boolean;
			};
			optionalAddons?: {
				addons: OptionalAddon[];
			};
			guidePaysStripeFee?: boolean;
			publicListing?: boolean;
		};
		uploadedImages?: File[];
		isSubmitting?: boolean;
		isEdit?: boolean;
		submitButtonText?: string;

		onCancel: () => void;
		onSubmit?: () => void;
		onSaveAsDraft?: () => void;
		onPublish?: () => void;
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
		// Delete functionality for edit mode
		onDelete?: () => void;
		hasFutureBookings?: boolean;
		isDeleting?: boolean;
		tourId?: string;
	}

	let {
		formData = $bindable(),
		uploadedImages = $bindable([]),
		isSubmitting = false,
		isEdit = false,
		submitButtonText = '',

		onCancel,
		onSubmit,
		onSaveAsDraft,
		onPublish,
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
		paymentStatus = { isSetup: false, loading: false },
		onDelete = undefined,
		hasFutureBookings = false,
		isDeleting = false,
		tourId = undefined
	}: Props = $props();
	
	// Migrate old capacity values to nested structures if needed
	const legacyMinCapacity = formData.minCapacity ?? 1;
	const legacyMaxCapacity = formData.maxCapacity ?? (formData.capacity || 20);
	
	if (formData.countInfantsTowardCapacity === undefined) {
		formData.countInfantsTowardCapacity = false;
	}
	
	// Initialize group discounts if not set
	if (!formData.groupDiscounts) {
		formData.groupDiscounts = {
			tiers: [],
			enabled: false
		};
	}

	// Client-side validation state
	let validationErrors = $state<ValidationError[]>([]);
	let touchedFields = $state<Set<string>>(new Set());
	
	// Track initial status to determine button text in edit mode
	let initialStatus = $state(formData.status);
	
	// Collapsible sections state
	let showAdvancedPricing = $state(false);
	let showTourDetails = $state(false);
	let showCancellationPolicy = $state(false);
	let showImages = $state(false);
	
	// Custom category state
	let showCustomCategoryInput = $state(false);
	let customCategoryInput = $state('');
	
	// Get currency symbol for display
	let currencySymbol = $derived(SUPPORTED_CURRENCIES[$userCurrency]?.symbol || '€');
	
	// Get minimum charge amount for current currency
	let minimumPrice = $derived($currentMinimumChargeAmount);
	
	// Get appropriate step value based on currency
	let priceStep = $derived(minimumPrice >= 10 ? 1 : 0.5);
	
	// Pricing validation state
	let pricingTouched = $state(false);
	
	// Get current tour price based on pricing model
	let currentTourPrice = $derived(() => {
		if (formData.pricingModel === 'participant_categories' && formData.participantCategories) {
			// Get adult price as base
			const adult = formData.participantCategories.categories.find(c => 
				c.id === 'adult' || c.label.toLowerCase().includes('adult')
			);
			return adult?.price || 0;
		}
		return formData.price || 0;
	});
	
	// Check if user can activate tours based on onboarding completion
	let activationCheck = $derived(canActivateTours(profile, hasConfirmedLocation, paymentStatus, formData.price));
	let canActivate = $derived(activationCheck.canActivate);
	let missingSteps = $derived(activationCheck.missingSteps);
	let onboardingMessage = $derived(getOnboardingMessage(missingSteps, formData.price === 0));
	let nextStep = $derived(getNextOnboardingStep(missingSteps));

	
	// Serialize for form submission - use state + effect instead of $derived
	let participantCategoriesJson = $state('{"categories":[]}');
	let groupDiscountsJson = $state('{"tiers":[],"enabled":false}');
	
	// Update serialized values when data changes
	$effect(() => {
		const data = formData.participantCategories || { categories: [] };
		participantCategoriesJson = JSON.stringify(data);
	});
	
	$effect(() => {
		const data = formData.groupDiscounts || { tiers: [], enabled: false };
		groupDiscountsJson = JSON.stringify(data);
	});
	
	// Track initial status only once when real tour data is loaded (not default values)
	// We detect "real" data by checking if tour has a name (empty name = default/uninitialized form)
	let hasInitializedStatus = $state(false);
	$effect(() => {
		if (isEdit && formData.name && !hasInitializedStatus) {
			initialStatus = formData.status;
			hasInitializedStatus = true;
		}
	});
	
	// Initialize pricing model and data
	$effect(() => {
		// Set default pricing model if not set
		if (!formData.pricingModel) {
			formData.pricingModel = 'participant_categories';
		}
		
		// Initialize guidePaysStripeFee if not set
		if (formData.guidePaysStripeFee === undefined) {
			formData.guidePaysStripeFee = false; // Default: customer pays fee
		}
		
		// Save initial per-person price if it's participant categories model
		if (formData.pricingModel === 'participant_categories' && 
				formData.price > 0 && savedPerPersonPrice === 25) {
			savedPerPersonPrice = formData.price;
		}
	});
	
	// Initialize pricing data based on model
	$effect(() => {
		// Initialize participant categories
		if (formData.pricingModel === 'participant_categories' && !formData.participantCategories) {
			// Check if we should migrate from old adult/child pricing tiers
			if (formData.enablePricingTiers && formData.pricingTiers) {
				const migratedCategories = [
					{ 
						id: 'adult', 
						label: 'Adult (18-64)', 
						price: formData.pricingTiers.adult || 25, 
						minAge: 18,
						maxAge: 64,
						sortOrder: 0, 
						countsTowardCapacity: true 
					}
				];
				
				// Only add child if it had a price set
				if (formData.pricingTiers.child !== undefined && formData.pricingTiers.child !== null) {
					migratedCategories.push({ 
						id: 'child', 
						label: 'Child (3-12)', 
						price: formData.pricingTiers.child,
						minAge: 3,
						maxAge: 12,
						sortOrder: 1, 
						countsTowardCapacity: true 
					});
				}
				
				formData.participantCategories = {
					categories: migratedCategories,
					minCapacity: legacyMinCapacity,
					maxCapacity: legacyMaxCapacity
				};
			} else {
				// Create default adult category
				const defaultPrice = savedPerPersonPrice || 25;
				formData.participantCategories = {
					categories: [
						{
							id: 'adult',
							label: 'Adult (18-64)',
							price: defaultPrice,
							minAge: 18,
							maxAge: 64,
							sortOrder: 0,
							countsTowardCapacity: true
						}
					],
					minCapacity: legacyMinCapacity,
					maxCapacity: legacyMaxCapacity
				};
			}
		} else if (formData.pricingModel === 'participant_categories' && formData.participantCategories) {
			// Migrate capacity to nested structure if not present
			if (formData.participantCategories.minCapacity === undefined) {
				formData.participantCategories.minCapacity = legacyMinCapacity;
			}
			if (formData.participantCategories.maxCapacity === undefined) {
				formData.participantCategories.maxCapacity = legacyMaxCapacity;
			}
		}
		
		// Initialize private tour
		if (formData.pricingModel === 'private_tour' && !formData.privateTour) {
			formData.privateTour = {
				flatPrice: savedPerPersonPrice * 6 || 300,
				minCapacity: 4,
				maxCapacity: 12
			};
		}
		
		// Initialize optional addons array if not present
		if (!formData.optionalAddons) {
			formData.optionalAddons = { addons: [] };
		}
	});
	
	// Auto-expand sections if they have content or errors
	$effect(() => {
		
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
			touchedFields.add('capacity');
			touchedFields.add('groupPricingTiers');
			
			// Validate all fields - use ALL validation errors, not just basic fields
			const validation = validateTourForm(formData);
			
			// Clear all validation errors first
			validationErrors = [];
			
			// Add ALL validation errors (including pricing tiers, add-ons, etc.)
			validationErrors = validation.errors;

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
		touchedFields.add('groupPricingTiers');
		
		// Validate all fields - use ALL validation errors
		const validation = validateTourForm(formData);
		
		// Clear all validation errors first
		validationErrors = [];
		
		// Add ALL validation errors (including pricing tiers, add-ons, etc.)
		validationErrors = validation.errors;
	}

	// Removed real-time validation to improve UX
	// Validation now only happens on blur and form submission

	// Trigger validation for specific field on blur
	function validateField(fieldName: string) {
		touchedFields.add(fieldName);
		
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
		// Mark all required fields as touched
		touchedFields.add('name');
		touchedFields.add('description');
		touchedFields.add('price');
		touchedFields.add('duration');
		touchedFields.add('capacity');
		touchedFields.add('groupPricingTiers');
		
		// Validate all fields - use ALL validation errors
		const validation = validateTourForm(formData);
		
		// Clear all validation errors first
		validationErrors = [];
		
		// Add ALL validation errors (including pricing tiers, add-ons, etc.)
		validationErrors = validation.errors;

		// Scroll to first error on mobile if validation failed
		if (!validation.isValid) {
			scrollToFirstError();
		}
		
		return validation.isValid;
	}

	// Custom category handling
	function addCustomCategory() {
		const trimmedCategory = customCategoryInput.trim();
		if (!trimmedCategory) return;
		
		if (!formData.categories) formData.categories = [];
		
		// Check if category already exists (case-insensitive)
		const existsAlready = formData.categories.some(
			cat => cat.toLowerCase() === trimmedCategory.toLowerCase()
		);
		
		if (existsAlready) return;
		
		// Check if we can add more categories
		if (formData.categories.length >= 5) return;
		
		// Add the category
		formData.categories = [...formData.categories, trimmedCategory];
		
		// Reset input state
		customCategoryInput = '';
		showCustomCategoryInput = false;
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

	// Store original per-person price for restoration when switching models
	let savedPerPersonPrice = $state(formData.price || 25);



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

	<!-- ================================================================ -->
	<!-- MAIN FORM CONTENT                                                -->
	<!-- ================================================================ -->
	<div class="lg:col-span-2 space-y-8">
		
		<!-- ============================================================ -->
		<!-- BASIC INFORMATION SECTION (Name, Categories, Location, Description, Duration) -->
		<!-- ============================================================ -->
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
						onblur={() => validateField('name')}
					/>
					{#if getFieldError(allErrors, 'name')}
						<div class="mt-3 p-3 rounded-lg" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
							<div class="flex items-start gap-2">
								<AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" style="color: var(--color-error-600);" />
								<p class="text-sm" style="color: var(--color-error-900);">
									{getFieldError(allErrors, 'name')}
								</p>
							</div>
						</div>
					{/if}
					</div>

					<div>
						<label for="categories" class="form-label">
							Categories
							<span class="text-xs" style="color: var(--text-tertiary); font-weight: normal;">
								(Select up to 5 categories)
							</span>
						</label>
						
						<!-- Selected Categories Display -->
						{#if formData.categories && formData.categories.length > 0}
							{@const categoryMap = [
								{ id: 'walking', name: 'Walking', icon: Users },
								{ id: 'food', name: 'Food', icon: Utensils },
								{ id: 'cultural', name: 'Cultural', icon: Building },
								{ id: 'historical', name: 'Historical', icon: BookOpen },
								{ id: 'art', name: 'Art', icon: Palette },
								{ id: 'adventure', name: 'Adventure', icon: Mountain }
							]}
							<div class="mb-3 flex flex-wrap gap-1.5">
								{#each formData.categories as selectedCategory, index}
									{@const categoryInfo = categoryMap.find(c => c.id === selectedCategory)}
									{@const displayName = categoryInfo?.name || selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
									<span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border"
										style="
											background: var(--color-primary-50);
											border-color: var(--color-primary-300);
											color: var(--color-primary-700);
										"
									>
										{displayName}
										<button
											type="button"
											onclick={() => {
												formData.categories = formData.categories.filter((_, i) => i !== index);
											}}
											class="hover:opacity-70 transition-opacity"
											aria-label="Remove {displayName}"
										>
											<X class="w-3 h-3" />
										</button>
									</span>
								{/each}
							</div>
						{/if}
						
						<!-- Available Categories -->
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
								{@const isSelected = formData.categories?.includes(category.id) || false}
								{@const canSelect = !isSelected && (formData.categories?.length || 0) < 5}
								<button
									type="button"
									disabled={!canSelect && !isSelected}
									onclick={() => { 
										if (!formData.categories) formData.categories = [];
										if (isSelected) {
											formData.categories = formData.categories.filter(c => c !== category.id);
										} else if (canSelect) {
											formData.categories = [...formData.categories, category.id];
										}
									}}
									class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									style="
										background: {isSelected ? 'var(--color-primary-50)' : 'var(--bg-primary)'};
										border-color: {isSelected ? 'var(--color-primary-300)' : 'var(--border-primary)'};
										color: {isSelected ? 'var(--color-primary-700)' : 'var(--text-secondary)'};
									"
								>
									<Icon class="w-3 h-3" />
									<span>{category.name}</span>
								</button>
							{/each}
							
							<!-- Custom Category Option -->
							<button
								type="button"
								disabled={!((formData.categories?.length || 0) < 5)}
								onclick={() => { 
									showCustomCategoryInput = !showCustomCategoryInput;
								}}
								class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								style="
									background: {showCustomCategoryInput ? 'var(--color-primary-50)' : 'var(--bg-primary)'};
									border-color: {showCustomCategoryInput ? 'var(--color-primary-300)' : 'var(--border-primary)'};
									color: {showCustomCategoryInput ? 'var(--color-primary-700)' : 'var(--text-secondary)'};
								"
							>
								<Edit class="w-3 h-3" />
								<span>Custom</span>
							</button>
						</div>

						{#if showCustomCategoryInput}
							<div class="mt-3">
								<input
									type="text"
									placeholder="Enter your custom category..."
									class="form-input"
									bind:value={customCategoryInput}
									onkeydown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											addCustomCategory();
										} else if (e.key === 'Escape') {
											showCustomCategoryInput = false;
											customCategoryInput = '';
										}
									}}
								/>
								<div class="flex gap-2 mt-2">
									<button
										type="button"
										onclick={addCustomCategory}
										disabled={!customCategoryInput.trim() || (formData.categories?.length || 0) >= 5}
										class="button-primary button-small"
									>
										Add Category
									</button>
									<button
										type="button"
										onclick={() => {
											showCustomCategoryInput = false;
											customCategoryInput = '';
										}}
										class="button-secondary button-small"
									>
										Cancel
									</button>
								</div>
							</div>
						{/if}

						<!-- Hidden input for form submission -->
						<input type="hidden" name="categories" value={JSON.stringify(formData.categories || [])} />
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
						<!-- Show info if location is near the character limit -->
						{#if formData.location && formData.location.length > 80}
							<p class="text-xs mt-1" style="color: var(--text-secondary);">
								Location: {formData.location.length}/100 characters
								{#if formData.location.length >= 100}
									<span style="color: var(--color-warning-600);">
										(automatically shortened)
									</span>
								{/if}
							</p>
						{/if}
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
						onblur={() => validateField('description')}
					></textarea>
					{#if getFieldError(allErrors, 'description')}
						<div class="mt-2 p-3 rounded-lg" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
							<div class="flex items-start gap-2">
								<AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" style="color: var(--color-error-600);" />
								<p class="text-sm" style="color: var(--color-error-900);">
									{getFieldError(allErrors, 'description')}
								</p>
							</div>
						</div>
					{/if}
					</div>
					
					<!-- Duration -->
					<div class="md:col-span-1">
						<label for="duration" class="form-label">
							Duration *
						</label>
						<DurationInput
							bind:value={formData.duration}
							error={hasFieldError(allErrors, 'duration')}
							onblur={() => validateField('duration')}
						/>
						{#if getFieldError(allErrors, 'duration')}
							<div class="mt-2 p-3 rounded-lg" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
								<div class="flex items-start gap-2">
									<AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" style="color: var(--color-error-600);" />
									<p class="text-sm" style="color: var(--color-error-900);">
										{getFieldError(allErrors, 'duration')}
									</p>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- ============================================================ -->
		<!-- PRICING SECTION (SIMPLIFIED) - Includes capacity           -->
		<!-- ============================================================ -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4">
			<SimplifiedPricingSection
				pricingModel={formData.pricingModel || 'participant_categories'}
				bind:participantCategories={formData.participantCategories}
				bind:privateTour={formData.privateTour}
				bind:groupDiscounts={formData.groupDiscounts}
				bind:optionalAddons={formData.optionalAddons}
				bind:guidePaysStripeFee={formData.guidePaysStripeFee}
				bind:countInfantsTowardCapacity={formData.countInfantsTowardCapacity}
				duration={formData.duration}
				capacity={formData.capacity}
				bind:pricingTouched
				{allErrors}
			onModelChange={(model) => {
				console.log('🔄 Pricing model changing from', formData.pricingModel, 'to', model);
				formData.pricingModel = model;
				
				// Clear pricing data and initialize based on selected model
				if (model === 'participant_categories') {
					// Per-person pricing - initialize participant categories
					if (!formData.participantCategories || formData.participantCategories.categories.length === 0) {
						const defaultPrice = savedPerPersonPrice || 25;
						formData.participantCategories = {
							categories: [
								{
									id: 'adult',
									label: 'Adult (18-64)',
									price: defaultPrice,
									minAge: 18,
									maxAge: 64,
									sortOrder: 0,
									countsTowardCapacity: true
								}
							],
							minCapacity: 1,
							maxCapacity: 20
						};
					}
					// Clear private tour data
					formData.privateTour = undefined;
					
				} else if (model === 'private_tour') {
					// Private tour - initialize flat rate
					if (!formData.privateTour) {
						formData.privateTour = {
							flatPrice: savedPerPersonPrice * 6 || 300,
							minCapacity: 4,
							maxCapacity: 12
						};
					}
					// Clear participant categories data
					formData.participantCategories = undefined;
					formData.groupDiscounts = undefined;
				}
				
				// Clear legacy fields for both models
				formData.groupPricingTiers = undefined;
				formData.enablePricingTiers = false;
				formData.pricingTiers = undefined;
				formData.price = 0;
				
				// Initialize add-ons for all models
				if (!formData.optionalAddons) {
					formData.optionalAddons = { addons: [] };
				}
			}}
			onParticipantCategoriesUpdate={(categories) => {
				if (!formData.participantCategories) {
					formData.participantCategories = { categories: [] };
				}
				formData.participantCategories.categories = categories;
				validateField('participantCategories');
			}}
			onPrivateTourUpdate={(flatPrice) => {
				if (!formData.privateTour) {
					formData.privateTour = { flatPrice: 0 };
				}
				formData.privateTour.flatPrice = flatPrice;
			}}
			onGroupDiscountsUpdate={(tiers, enabled) => {
						if (!formData.groupDiscounts) {
							formData.groupDiscounts = { tiers: [], enabled: false };
						}
						formData.groupDiscounts.tiers = tiers;
						formData.groupDiscounts.enabled = enabled;
					}}
					onAddonsUpdate={(addons) => {
						if (!formData.optionalAddons) {
							formData.optionalAddons = { addons: [] };
						}
						formData.optionalAddons.addons = addons;
					}}
					onStripeFeeUpdate={(guidePays) => {
						formData.guidePaysStripeFee = guidePays;
					}}
					onPriceUpdate={(price) => {
						// Update price based on current pricing model
						if (formData.pricingModel === 'participant_categories' && formData.participantCategories) {
							// Update adult price
							const adultIndex = formData.participantCategories.categories.findIndex(c => 
								c.id === 'adult' || c.label.toLowerCase().includes('adult')
							);
							if (adultIndex >= 0) {
								formData.participantCategories.categories[adultIndex].price = price;
							}
						} else {
							formData.price = price;
						}
					}}
					onValidate={validateField}
					{getFieldError}
				/>
				
				<!-- Hidden inputs for form submission -->
				<input type="hidden" name="pricingModel" value={formData.pricingModel || 'participant_categories'} />
				<input type="hidden" name="price" value="0" />
				<input type="hidden" name="participantCategories" value={participantCategoriesJson} />
				<input type="hidden" name="privateTour" value={formData.privateTour ? JSON.stringify(formData.privateTour) : ''} />
				<input type="hidden" name="groupDiscounts" value={groupDiscountsJson} />
				<input type="hidden" name="optionalAddons" value={JSON.stringify(formData.optionalAddons || { addons: [] })} />
				<input type="hidden" name="guidePaysStripeFee" value={formData.guidePaysStripeFee ? 'true' : 'false'} />
				<input type="hidden" name="enablePricingTiers" value="false" />
				<input type="hidden" name="duration" bind:value={formData.duration} />
				<input type="hidden" name="capacity" bind:value={formData.capacity} />
			<input type="hidden" name="minCapacity" value={
				(formData.participantCategories?.minCapacity) || ((formData.privateTour as any)?.minCapacity) || 1
			} />
			<input type="hidden" name="maxCapacity" value={
				(formData.participantCategories?.maxCapacity) || ((formData.privateTour as any)?.maxCapacity) || 20
			} />
				<input type="hidden" name="countInfantsTowardCapacity" value={formData.countInfantsTowardCapacity ? 'true' : 'false'} />
			</div>
		</div>

		<!-- ============================================================ -->
		<!-- TOUR DETAILS SECTION (Included Items & Requirements)        -->
		<!-- ============================================================ -->
		<TourDetailsSection
			bind:includedItems={formData.includedItems}
			bind:requirements={formData.requirements}
			bind:isExpanded={showTourDetails}
			onUpdate={(data) => {
				formData.includedItems = data.includedItems;
				formData.requirements = data.requirements;
			}}
		/>

		<!-- ============================================================ -->
		<!-- CANCELLATION POLICY SECTION                                 -->
		<!-- ============================================================ -->
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

		<!-- ============================================================ -->
		<!-- DANGER ZONE SECTION (Edit Mode Only)                        -->
		<!-- ============================================================ -->
		{#if isEdit && onDelete}
			<div class="rounded-xl" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
				<div class="p-4 border-b" style="border-color: var(--color-danger-200);">
					<h3 class="font-semibold" style="color: var(--color-danger-900);">Danger Zone</h3>
				</div>
				<div class="p-4">
					<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div class="flex-1">
							<p class="font-medium" style="color: var(--color-danger-900);">Delete this tour</p>
							{#if hasFutureBookings}
								<p class="text-sm mt-1" style="color: var(--color-danger-700);">
									Cannot delete tour with upcoming bookings. Cancel all future bookings first, then deletion will be available.
								</p>
								<p class="text-sm mt-2" style="color: var(--color-primary-600);">
									<a 
										href="/bookings?tour={tourId}"
										class="text-sm underline hover:no-underline"
										style="color: var(--color-primary-600);"
									>
										View bookings →
									</a>
								</p>
							{:else}
								<p class="text-sm mt-1" style="color: var(--color-danger-700);">
									This will permanently delete the tour and all data, including historical bookings. This action cannot be undone.
								</p>
							{/if}
						</div>
						<div class="flex-shrink-0">
							{#if hasFutureBookings}
								<Tooltip text="Cannot delete tour with upcoming bookings" position="top">
									<button 
										type="button" 
										class="button-secondary button--small w-full sm:w-auto cursor-not-allowed opacity-50" 
										disabled
									>
										<Calendar class="w-4 h-4 mr-2" />
										Has Upcoming Bookings
									</button>
								</Tooltip>
							{:else}
								<button 
									type="button" 
									onclick={onDelete} 
									class="button-danger button--small w-full sm:w-auto" 
									disabled={isDeleting}
									title="Delete this tour permanently"
								>
									{#if isDeleting}
										<div class="w-4 h-4 rounded-full animate-spin mr-2" style="border: 2px solid currentColor; border-top-color: transparent;"></div>
										Deleting...
									{:else}
										Delete Tour
									{/if}
								</button>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}
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

		<!-- ============================================================ -->
		<!-- TOUR STATUS SECTION (Edit Mode Only)                        -->
		<!-- ============================================================ -->
		{#if isEdit && !hideStatusField}
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h3 class="font-semibold" style="color: var(--text-primary);">Current Status</h3>
				</div>
				<div class="p-4">
					<div class="flex items-center gap-3 p-4 rounded-lg" style="background: var(--bg-secondary);">
						<div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" 
							style="background: {formData.status === 'active' ? 'var(--color-success-100)' : 'var(--color-warning-100)'};"
						>
							{#if formData.status === 'active'}
								<CheckCircle class="w-5 h-5 flex-shrink-0" style="color: var(--color-success-600);" />
							{:else}
								<FileText class="w-5 h-5 flex-shrink-0" style="color: var(--color-warning-600);" />
							{/if}
						</div>
						<div class="flex-1">
							<h3 class="font-medium" style="color: var(--text-primary);">
								{formData.status === 'active' ? 'Active' : 'Draft'}
							</h3>
							<p class="text-sm" style="color: var(--text-secondary);">
								{formData.status === 'active' 
									? 'Tour is live and accepting bookings'
									: 'Not visible to customers'}
							</p>
						</div>
					</div>
					<!-- Hidden input to send the actual status value -->
					<input type="hidden" name="status" bind:value={formData.status} />
				</div>
			</div>
		{/if}

		<!-- ============================================================ -->
		<!-- PUBLIC LISTING SECTION (Edit Mode Only)                     -->
		<!-- ============================================================ -->
		{#if isEdit}
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4">
					<div class="flex items-center justify-between gap-4">
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-1">
								<Globe class="h-5 w-5" style="color: var(--text-accent);" />
								<h3 class="font-semibold" style="color: var(--text-primary);">Public Discovery</h3>
							</div>
							<p class="text-sm" style="color: var(--text-secondary);">
								{#if formData.status === 'draft'}
									{formData.publicListing 
										? 'When activated, tour will be visible in public listings'
										: 'When activated, tour will only be accessible via QR code or direct link'}
								{:else}
									{formData.publicListing 
										? 'Tour is visible in public listings'
										: 'Tour is only accessible via QR code or direct link'}
								{/if}
							</p>
						</div>
						
						<div class="flex items-center gap-3 flex-shrink-0">
							<!-- Hidden input to send the actual publicListing value -->
							<input type="hidden" name="publicListing" value={formData.publicListing ? 'true' : 'false'} />
							<label class="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									bind:checked={formData.publicListing}
									class="sr-only peer"
								/>
								<div class="toggle-switch w-11 h-6 rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
								<span class="ml-3 text-sm font-medium whitespace-nowrap" style="color: var(--text-primary);">
									{formData.publicListing ? 'Listed' : 'Unlisted'}
								</span>
							</label>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- ============================================================ -->
		<!-- ACTION BUTTONS SECTION                                       -->
		<!-- Save, Publish, Cancel buttons                                -->
		<!-- ============================================================ -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4">
			<div class="space-y-3">
				{#if onPublish && onSaveAsDraft}
					<!-- Dual Action Buttons for Draft/Publish -->
					
					<!-- Validation Errors Notice -->
					{#if allErrors.length > 0}
						<div class="mb-2 p-3 rounded-lg" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
							<div class="flex items-start gap-2">
								<AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" style="color: var(--color-error-600);" />
								<div class="flex-1">
									<p class="text-xs font-medium" style="color: var(--color-error-900);">
										Please fix {allErrors.length} error{allErrors.length === 1 ? '' : 's'} to continue
									</p>
									<ul class="text-xs mt-1 space-y-0.5" style="color: var(--color-error-700);">
										{#each allErrors.slice(0, 3) as error}
											<li>• {error.message}</li>
										{/each}
										{#if allErrors.length > 3}
											<li class="mt-1" style="color: var(--color-error-600);">
												... and {allErrors.length - 3} more
											</li>
										{/if}
									</ul>
								</div>
							</div>
						</div>
					{/if}
					
					<!-- Onboarding Restriction Notice -->
					{#if !canActivate && missingSteps.length > 0}
						<div class="mb-2 p-3 rounded-lg" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
							<div class="flex items-start gap-2">
								<AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" style="color: var(--color-warning-600);" />
								<div class="flex-1">
									<p class="text-xs font-medium" style="color: var(--color-warning-700);">
										Complete setup to activate
									</p>
									<p class="text-xs mt-1" style="color: var(--color-warning-600);">
										{onboardingMessage}
									</p>
								</div>
							</div>
						</div>
					{/if}
					
					<button
						type="button"
						onclick={onPublish}
						disabled={isSubmitting || !canActivate || allErrors.length > 0}
						class="button-primary button--full-width button--gap"
						title={!canActivate ? 'Complete required setup steps to activate' : allErrors.length > 0 ? 'Fix validation errors to activate' : ''}
					>
						{#if isSubmitting && formData.status === 'active'}
							<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							Saving...
						{:else}
							{#if isEdit && initialStatus === 'active'}
								<Save class="w-4 h-4" />
								Save Changes
							{:else}
								<CheckCircle class="w-4 h-4" />
								{isEdit ? 'Save & Activate' : 'Activate Tour'}
							{/if}
						{/if}
					</button>
					
					<button
						type="button"
						onclick={onSaveAsDraft}
						disabled={isSubmitting || allErrors.length > 0}
						class="button-secondary button--full-width button--gap"
						title={allErrors.length > 0 ? 'Fix validation errors to save' : ''}
					>
						{#if isSubmitting && formData.status === 'draft'}
							<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
							Saving...
						{:else}
							<FileText class="w-4 h-4" />
							{isEdit ? 'Save as Draft' : 'Save as Draft'}
						{/if}
					</button>
				{:else}
					<!-- Single Action Button (fallback for old usage) -->
					
					<!-- Validation Errors Notice -->
					{#if allErrors.length > 0}
						<div class="mb-2 p-3 rounded-lg" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
							<div class="flex items-start gap-2">
								<AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" style="color: var(--color-error-600);" />
								<div class="flex-1">
									<p class="text-xs font-medium" style="color: var(--color-error-900);">
										Please fix {allErrors.length} error{allErrors.length === 1 ? '' : 's'} to continue
									</p>
									<ul class="text-xs mt-1 space-y-0.5" style="color: var(--color-error-700);">
										{#each allErrors.slice(0, 3) as error}
											<li>• {error.message}</li>
										{/each}
										{#if allErrors.length > 3}
											<li class="mt-1" style="color: var(--color-error-600);">
												... and {allErrors.length - 3} more
											</li>
										{/if}
									</ul>
								</div>
							</div>
						</div>
					{/if}
					
					<button
						type={onSubmit ? "button" : "submit"}
						onclick={onSubmit || handleSubmit}
						disabled={isSubmitting || allErrors.length > 0}
						class="button-primary button--full-width button--gap"
						title={allErrors.length > 0 ? 'Fix validation errors to save' : ''}
					>
						{#if isSubmitting}
							<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							Saving...
						{:else}
							<Save class="w-4 h-4" />
							{submitButtonText || (isEdit ? 'Save Changes' : 'Save Tour')}
						{/if}
					</button>
				{/if}
				
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
		/* Make error fields more prominent on mobile */
		.form-input.error,
		.form-textarea.error {
			border-width: 2px;
		}
		
		/* Sticky error summary styling */
		.sticky {
			backdrop-filter: blur(8px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		}
	}
</style>