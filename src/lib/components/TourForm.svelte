<!--
================================================================================
TOUR FORM COMPONENT
================================================================================

Main form for creating and editing tours. Organized into clear sections:

1. BASIC INFORMATION - Name, categories, location, description, duration
2. PRICING - Pricing model, price, tiers, add-ons, capacity
3. INCLUSIONS & REQUIREMENTS - Included items & requirements (extracted component)
4. CANCELLATION POLICY - Cancellation terms with templates
5. DANGER ZONE - Delete tour (edit mode only, shown in main content)
6. TOUR STATUS - Active/Draft status (edit mode only, shown in sidebar)
7. UNLISTED MODE - Hide from public search (edit mode only, shown in sidebar)
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
- tour-form/TourDetailsSection - Inclusions & requirements

================================================================================
-->

<script lang="ts">
	import { onDestroy } from 'svelte';
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
	import LanguageSelector from './LanguageSelector.svelte';
	import CategorySelector from './CategorySelector.svelte';
	import Tooltip from './Tooltip.svelte';
	import Plus from 'lucide-svelte/icons/plus';
	import Globe from 'lucide-svelte/icons/globe';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Package from 'lucide-svelte/icons/package';
	import { isValidLocationLength } from '$lib/utils/location.js';
	
	// Import new pricing components
	import SimplifiedPricingSection from './pricing/SimplifiedPricingSection.svelte';
	import type { PricingModel, GroupPricingTier, GroupDiscountTier, OptionalAddon, ParticipantCategory } from '$lib/types.js';
	
	// Import tour form section components
	import DurationInput from './DurationInput.svelte';
	import MarkdownEditor from './ui/MarkdownEditor.svelte';
	import ChipInput from './ChipInput.svelte';

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
			languages: string[];
			includedItems: string[];
			requirements: string[];
			cancellationPolicy: string;
			cancellationPolicyId?: string;
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

	// Initialize pricing data immediately to prevent "missing section" issue
	if (!formData.pricingModel) {
		formData.pricingModel = 'participant_categories';
	}

	// Initialize participant categories if model is per-person but data is missing or empty
	if (formData.pricingModel === 'participant_categories' && 
	    (!formData.participantCategories || !formData.participantCategories.categories || formData.participantCategories.categories.length === 0)) {
		const defaultPrice = 25;
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

	// Initialize private tour if model is private but data is missing
	if (formData.pricingModel === 'private_tour' && !formData.privateTour) {
		formData.privateTour = {
			flatPrice: 300,
			minCapacity: 4,
			maxCapacity: 12
		};
	}

	// Initialize optional addons if not set
	if (!formData.optionalAddons) {
		formData.optionalAddons = { addons: [] };
	}

	// Initialize guidePaysStripeFee if not set (prevents binding to undefined)
	if (formData.guidePaysStripeFee === undefined) {
		formData.guidePaysStripeFee = false;
	}
	
	// Initialize languages if not set (default to English)
	if (!formData.languages || formData.languages.length === 0) {
		formData.languages = ['en'];
	}

	// Client-side validation state
	let validationErrors = $state<ValidationError[]>([]);
	let touchedFields = $state<Set<string>>(new Set());
	let currentlyTypingFields = $state<Set<string>>(new Set());
	
	// Track initial status to determine button text in edit mode
	let initialStatus = $state(formData.status);
	
	// Collapsible sections state
	let showAdvancedPricing = $state(false);
	let showCancellationPolicy = $state(false);
	
	// Custom category state
	
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
	
	// Check if basic required fields are filled (for disabling save buttons on new tours)
	let hasMinimumRequiredFields = $derived(() => {
		// Required fields for saving
		const hasName = formData.name && formData.name.trim().length > 0;
		const hasDescription = formData.description && formData.description.trim().length > 0;
		const hasDuration = formData.duration && formData.duration > 0;
		const hasLanguages = formData.languages && formData.languages.length > 0;
		
		// Check pricing based on model
		let hasValidPricing = false;
		if (formData.pricingModel === 'participant_categories' && formData.participantCategories) {
			hasValidPricing = formData.participantCategories.categories.some(c => c.price > 0);
		} else if (formData.pricingModel === 'private_tour' && formData.privateTour) {
			hasValidPricing = formData.privateTour.flatPrice > 0;
		}
		
		return hasName && hasDescription && hasDuration && hasLanguages && hasValidPricing;
	});
	
	// Suggestions for What's Included and Requirements
	const includedItemsSuggestions = [
		'Professional tour guide',
		'Historical insights',
		'Photo opportunities',
		'Small group experience',
		'Route map',
		'Local recommendations'
	];

	const requirementsSuggestions = [
		'Comfortable walking shoes',
		'Basic fitness level',
		'Weather-appropriate clothing',
		'Minimum age 12+',
		'No mobility issues',
		'English speaking'
	];

	
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
	
	// Initialize pricing data based on model (runs reactively)
	$effect(() => {
		// Initialize participant categories if missing or empty
		const needsParticipantInit = formData.pricingModel === 'participant_categories' && 
		    (!formData.participantCategories || 
		     !formData.participantCategories.categories || 
		     formData.participantCategories.categories.length === 0);
		
		if (needsParticipantInit) {
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
		} else if (formData.pricingModel === 'participant_categories' && formData.participantCategories && formData.participantCategories.categories && formData.participantCategories.categories.length > 0) {
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

	// Typing timeout tracker
	let typingTimeouts = new Map<string, NodeJS.Timeout>();
	
	// Track when user starts typing to hide errors temporarily
	function handleFieldInput(fieldName: string) {
		currentlyTypingFields.add(fieldName);
		currentlyTypingFields = currentlyTypingFields; // trigger reactivity
		
		// For specific fields, clear errors while typing
		if (fieldName === 'name' || fieldName === 'description') {
			validationErrors = validationErrors.filter(error => error.field !== fieldName);
		}
		
		// Clear any existing timeout for this field
		const existingTimeout = typingTimeouts.get(fieldName);
		if (existingTimeout) {
			clearTimeout(existingTimeout);
		}
		
		// Set a new timeout to remove from typing state after 2 seconds of no input
		// This ensures currentlyTypingFields gets cleared even if blur doesn't fire
		const timeout = setTimeout(() => {
			currentlyTypingFields.delete(fieldName);
			currentlyTypingFields = currentlyTypingFields;
			typingTimeouts.delete(fieldName);
		}, 2000);
		
		typingTimeouts.set(fieldName, timeout);
	}

	// Trigger validation for specific field on blur
	function validateField(fieldName: string) {
		// Remove from currently typing when field loses focus
		currentlyTypingFields.delete(fieldName);
		currentlyTypingFields = currentlyTypingFields; // trigger reactivity
		
		// Clear any pending timeout for this field
		const existingTimeout = typingTimeouts.get(fieldName);
		if (existingTimeout) {
			clearTimeout(existingTimeout);
			typingTimeouts.delete(fieldName);
		}
		
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

	// Helper to check if error should be shown
	function shouldShowError(fieldName: string): boolean {
		// For name and description, never show errors while typing
		if ((fieldName === 'name' || fieldName === 'description') && currentlyTypingFields.has(fieldName)) {
			return false;
		}
		return touchedFields.has(fieldName);
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

	// Cancellation Policy Templates (using new structured policies)
	import { CANCELLATION_POLICIES, getCancellationPolicyText } from '$lib/utils/cancellation-policies.js';
	
	let selectedPolicyTemplate = $state('flexible'); // Default to flexible
	let showCustomPolicy = $state(false);
	let customPolicyHours = $state(24); // Default 24 hours for custom policy
	
	// Convert our structured policies to template format for the UI
	const policyTemplates = [
		{
			id: 'veryFlexible',
			name: 'Very Flexible',
			description: '100% refund up to 2 hours before',
			policy: getCancellationPolicyText('veryFlexible'),
			color: 'success',
			recommended: false
		},
		{
			id: 'flexible',
			name: 'Flexible ⭐',
			description: '100% refund up to 24 hours before',
			policy: getCancellationPolicyText('flexible'),
			color: 'success',
			recommended: true
		},
		{
			id: 'moderate',
			name: 'Moderate', 
			description: '100% refund up to 48 hours before',
			policy: getCancellationPolicyText('moderate'),
			color: 'warning',
			recommended: false
		},
		{
			id: 'strict',
			name: 'Strict',
			description: '100% refund up to 7 days before',
			policy: getCancellationPolicyText('strict'),
			color: 'warning',
			recommended: false
		},
		{
			id: 'nonRefundable',
			name: 'Non-Refundable',
			description: 'No refunds • Immediate payout',
			policy: getCancellationPolicyText('nonRefundable'),
			color: 'error',
			recommended: false
		}
	];

	function selectPolicyTemplate(templateId: string) {
		const template = policyTemplates.find(t => t.id === templateId);
		if (template) {
			selectedPolicyTemplate = templateId;
			// Store both the ID (for structured queries) and text (for backward compatibility)
			formData.cancellationPolicyId = templateId;
			formData.cancellationPolicy = template.policy;
			showCustomPolicy = false;
		}
	}

	function enableCustomPolicy() {
		selectedPolicyTemplate = '';
		showCustomPolicy = true;
		
		// Set cancellationPolicyId to the hours value (e.g., "custom_24" for 24 hours)
		updateCustomPolicyId();
	}
	
	// Store for optional custom notes (separate from auto-generated rules)
	let customPolicyNotes = $state('');
	
	// Validate and constrain custom policy hours
	function validateCustomHours(hours: number): number {
		// Constrain to reasonable bounds
		if (hours < 1) return 1;
		if (hours > 168) return 168; // Max 7 days (1 week)
		return Math.floor(hours); // Ensure integer
	}
	
	// Update policy ID when custom hours change
	function updateCustomPolicyId() {
		// Validate hours before using
		customPolicyHours = validateCustomHours(customPolicyHours);
		
		formData.cancellationPolicyId = `custom_${customPolicyHours}`;
		
		// Generate policy text from the hours value (binary: full refund or no refund)
		let policyText = `• Full refund if cancelled ${customPolicyHours}+ hours before tour\n` +
			`• No refund if cancelled less than ${customPolicyHours} hours before tour`;
		
		// Add custom notes if provided
		if (customPolicyNotes.trim()) {
			policyText += `\n\nAdditional Information:\n${customPolicyNotes.trim()}`;
		}
		
		formData.cancellationPolicy = policyText;
	}
	
	// Watch for changes to custom hours or notes
	$effect(() => {
		if (showCustomPolicy && customPolicyHours) {
			updateCustomPolicyId();
		}
	});
	
	// Watch for changes to custom notes
	$effect(() => {
		if (showCustomPolicy) {
			updateCustomPolicyId();
		}
	});

	// Initialize policy template selection based on existing policy
	// Watch cancellationPolicyId to update when tour data loads
	$effect(() => {
		// Check if it's a custom policy (format: "custom_24")
		if (formData.cancellationPolicyId?.startsWith('custom_')) {
			const hours = parseInt(formData.cancellationPolicyId.split('_')[1]);
			if (!isNaN(hours) && hours > 0) {
				selectedPolicyTemplate = ''; // Clear any template selection
				showCustomPolicy = true;
				customPolicyHours = hours;
				
				// Extract custom notes if they exist in the policy text
				if (formData.cancellationPolicy?.includes('Additional Information:')) {
					const parts = formData.cancellationPolicy.split('Additional Information:');
					if (parts[1]) {
						customPolicyNotes = parts[1].trim();
					}
				}
				return;
			}
		}
		
		// If we have a predefined policyId, use that
		if (formData.cancellationPolicyId && !formData.cancellationPolicyId.startsWith('custom_')) {
			const matchingTemplate = policyTemplates.find(t => t.id === formData.cancellationPolicyId);
			if (matchingTemplate) {
				selectedPolicyTemplate = formData.cancellationPolicyId;
				showCustomPolicy = false;
				return;
			}
		}
		
		// Set default if no policy set (new tour)
		if (!formData.cancellationPolicyId && !formData.cancellationPolicy) {
			selectedPolicyTemplate = 'flexible';
			showCustomPolicy = false;
			// Initialize the form data with the default flexible policy
			selectPolicyTemplate('flexible');
		}
	});



	function getImagePreview(file: File): string {
		return URL.createObjectURL(file);
	}

	// Mobile error handling - scroll to first error
	function scrollToFirstError() {
		if (typeof window === 'undefined') return;
		
		// Don't scroll if user is actively typing in any field
		// This prevents disruptive scrolling on mobile
		if (currentlyTypingFields.size > 0) {
			return;
		}
		
		// Wait for DOM to update
		setTimeout(() => {
			const firstErrorField = document.querySelector('.form-input.error, .form-textarea.error, .form-select.error');
			if (firstErrorField) {
				// Don't scroll if the error field is already in viewport
				const rect = firstErrorField.getBoundingClientRect();
				const isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;
				
				if (!isInViewport) {
					// Scroll with some offset for mobile header
					const yOffset = -100; // Adjust based on your mobile header height
					const y = rect.top + window.pageYOffset + yOffset;
					window.scrollTo({ top: y, behavior: 'smooth' });
				}
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
	
	// Cleanup on component destroy
	onDestroy(() => {
		// Clear all typing timeouts to prevent memory leaks
		typingTimeouts.forEach(timeout => clearTimeout(timeout));
		typingTimeouts.clear();
	});


</script>

<div class="tour-form-container">
	<div class="tour-form-grid">
		<!-- ================================================================ -->
		<!-- MAIN FORM CONTENT                                                -->
		<!-- ================================================================ -->
		<div class="tour-form-main">
		
		<!-- ============================================================ -->
		<!-- BASIC INFORMATION SECTION                                    -->
		<!-- ============================================================ -->
		<div class="form-section-minimal">
			<div class="space-y-5 sm:space-y-6">
				<!-- Hidden status field for form submission (when not showing visible toggle) -->
				{#if !isEdit || hideStatusField}
					<input type="hidden" name="status" bind:value={formData.status} />
				{/if}
				
				<!-- Row 1: Name and Duration -->
				<div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
					<!-- Name -->
					<div class="lg:col-span-3">
						<label for="name" class="form-label flex items-center gap-2 hidden sm:flex">
							<Edit class="w-4 h-4" style="color: var(--text-tertiary);" />
							<span>Name *</span>
						</label>
						<div class="form-field-wrapper">
							<input
								type="text"
								id="name"
								name="name"
								bind:value={formData.name}
								placeholder="Name *"
								class="form-input form-input--no-transform tour-name-input {hasFieldError(allErrors, 'name') ? 'error' : ''}"
								oninput={() => handleFieldInput('name')}
								onblur={() => validateField('name')}
								maxlength="100"
							/>
					<div class="form-field-footer">
						{#if getFieldError(allErrors, 'name') && shouldShowError('name')}
							<span class="form-error-message">{getFieldError(allErrors, 'name')}</span>
						{:else}
							<span class="form-field-spacer"></span>
						{/if}
						<span class="text-xs form-field-counter hidden sm:inline" style="color: {hasFieldError(allErrors, 'name') ? 'var(--color-error-500)' : 'var(--text-tertiary)'}; opacity: {formData.name && formData.name.length > 0 ? 1 : 0};">
							{formData.name?.length || 0}/100
						</span>
					</div>
						</div>
					</div>

					<!-- Duration -->
					<div>
						<label for="duration" class="form-label flex items-center gap-2 hidden sm:flex">
							<Calendar class="w-4 h-4" style="color: var(--text-tertiary);" />
							<span>Duration *</span>
						</label>
						<div class="form-field-wrapper">
							<DurationInput
								bind:value={formData.duration}
								error={hasFieldError(allErrors, 'duration')}
								oninput={() => handleFieldInput('duration')}
								onblur={() => validateField('duration')}
							/>
					<div class="form-field-footer">
						{#if getFieldError(allErrors, 'duration') && shouldShowError('duration')}
							<span class="form-error-message">{getFieldError(allErrors, 'duration')}</span>
						{:else}
							<span class="form-field-spacer"></span>
						{/if}
					</div>
						</div>
					</div>
				</div>

				<!-- Row 2: Meeting Point | Categories + Languages -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<!-- Meeting Point -->
					<div>
						<label class="form-label flex items-center gap-2 hidden sm:flex">
							<MapPin class="w-4 h-4" style="color: var(--text-tertiary);" />
							<span>Meeting Point</span>
						</label>
						<div class="form-field-wrapper">
							<div class="location-picker-wrapper">
								<LocationPicker
									bind:value={formData.location}
									placeholder="Meeting Point"
									profileLocation={profile?.location}
									enableGeolocation={true}
									enableMapsIntegration={true}
									label=""
									onLocationSelect={(location) => {
										formData.location = location;
									}}
								/>
							</div>
							<div class="form-field-footer">
								<span class="form-field-spacer"></span>
								<span class="text-xs form-field-counter" style="color: var(--text-tertiary); opacity: {formData.location && formData.location.length > 50 ? 1 : 0};">
									{formData.location?.length || 0}/100
									{#if formData.location && formData.location.length >= 100}
										<span style="color: var(--color-warning-600);"> (truncated)</span>
									{/if}
								</span>
							</div>
						</div>
						<input type="hidden" name="location" bind:value={formData.location} />
					</div>

					<!-- Categories & Languages Column -->
					<div class="space-y-4">
						<!-- Categories -->
						<div>
							<label for="categories" class="form-label flex items-center gap-2 hidden sm:flex">
								<Palette class="w-4 h-4" style="color: var(--text-tertiary);" />
								<span>Categories</span>
							</label>
							<div class="form-field-wrapper">
								<CategorySelector
									bind:selectedCategories={formData.categories}
									error={hasFieldError(allErrors, 'categories')}
								/>
								<div class="form-field-footer">
									{#if getFieldError(allErrors, 'categories') && shouldShowError('categories')}
										<span class="form-error-message">{getFieldError(allErrors, 'categories')}</span>
									{:else}
										<span class="form-field-spacer"></span>
									{/if}
								</div>
								<!-- Hidden input for form submission -->
								<input type="hidden" name="categories" value={JSON.stringify(formData.categories || [])} />
							</div>
						</div>

						<!-- Languages -->
						<div>
							<label for="languages" class="form-label flex items-center gap-2 hidden sm:flex">
								<Globe class="w-4 h-4" style="color: var(--text-tertiary);" />
								<span>Languages Offered *</span>
							</label>
							<div class="form-field-wrapper">
								<LanguageSelector
									bind:selectedLanguages={formData.languages}
									error={hasFieldError(allErrors, 'languages')}
								/>
								<div class="form-field-footer">
									{#if getFieldError(allErrors, 'languages') && shouldShowError('languages')}
										<span class="form-error-message">{getFieldError(allErrors, 'languages')}</span>
									{:else}
										<span class="form-field-spacer"></span>
									{/if}
								</div>
							</div>
							<!-- Hidden input for form submission -->
							<input type="hidden" name="languages" value={JSON.stringify(formData.languages || [])} />
						</div>
					</div>
				</div>

				<!-- Row 4: What's Included and Requirements -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<!-- What's Included -->
					<div>
						<label class="form-label flex items-center gap-2 hidden sm:flex">
							<Package class="w-4 h-4" style="color: var(--text-tertiary);" />
							<span>What's Included</span>
						</label>
						<div class="form-field-wrapper">
							<ChipInput
								bind:items={formData.includedItems}
								suggestions={includedItemsSuggestions}
								placeholder="Add included items..."
								addButtonText="Add"
							/>
							<div class="form-field-footer">
								<span class="form-field-spacer"></span>
							</div>
							<!-- Hidden inputs for form submission -->
							{#each formData.includedItems.filter(item => item.trim()) as item}
								<input type="hidden" name="includedItems" value={item} />
							{/each}
						</div>
					</div>

					<!-- Requirements -->
					<div>
						<label class="form-label flex items-center gap-2 hidden sm:flex">
							<AlertCircle class="w-4 h-4" style="color: var(--text-tertiary);" />
							<span>Requirements</span>
						</label>
						<div class="form-field-wrapper">
							<ChipInput
								bind:items={formData.requirements}
								suggestions={requirementsSuggestions}
								placeholder="Add requirements..."
								addButtonText="Add"
							/>
							<div class="form-field-footer">
								<span class="form-field-spacer"></span>
							</div>
							<!-- Hidden inputs for form submission -->
							{#each formData.requirements.filter(req => req.trim()) as requirement}
								<input type="hidden" name="requirements" value={requirement} />
							{/each}
						</div>
					</div>
				</div>

				<!-- Row 5: Description - Full Width -->
				<div>
					<label for="description" class="form-label flex items-center gap-2 hidden sm:flex">
						<FileText class="w-4 h-4" style="color: var(--text-tertiary);" />
						<span>Description *</span>
					</label>
					<div class="form-field-wrapper">
						<MarkdownEditor
							bind:value={formData.description}
							id="description"
							name="description"
							placeholder="Describe your tour experience... Use markdown for formatting!"
							maxlength={2000}
							rows={6}
							error={hasFieldError(allErrors, 'description')}
							oninput={() => handleFieldInput('description')}
							onblur={() => validateField('description')}
						/>
						<div class="form-field-footer">
							{#if getFieldError(allErrors, 'description') && shouldShowError('description')}
								<span class="form-error-message">{getFieldError(allErrors, 'description')}</span>
							{:else}
								<span class="form-field-spacer"></span>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- ============================================================ -->
		<!-- TOUR IMAGES SECTION (Moved from sidebar)                    -->
		<!-- ============================================================ -->
		{#if onImageUpload && onImageRemove}
			<div class="form-section-minimal">
				<div>
					
					<!-- Existing Images (for edit mode) -->
					{#if isEdit && existingImages && existingImages.length > 0 && onExistingImageRemove && getExistingImageUrl}
						<div class="mb-4 sm:mb-6">
							<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
								{#each existingImages as imageName, index (imageName)}
									<div class="relative group aspect-square">
										<img 
											src={getExistingImageUrl(imageName)} 
											alt="Tour image {index + 1}"
											class="w-full h-full object-cover rounded-lg"
											style="border: 1px solid var(--border-primary);"
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
											class="image-remove-btn absolute -top-2 -right-2 w-8 h-8 sm:w-6 sm:h-6 rounded-full text-sm sm:text-xs transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center z-10 shadow-sm"
											style="
												background: var(--color-error-500);
												color: white;
												touch-action: manipulation;
												-webkit-tap-highlight-color: transparent;
											"
											aria-label="Remove image"
										>
											<X class="w-3 h-3 flex-shrink-0" />
										</button>
									</div>
								{/each}
							</div>
						</div>
					{/if}
					
					<!-- Image Upload Area -->
					<div class="border-2 border-dashed rounded-lg p-3 sm:p-6 text-center transition-colors"
						style="border-color: var(--border-secondary); background: var(--bg-secondary);"
					>
						<p class="text-xs mb-3 hidden sm:block" style="color: var(--text-secondary);">JPEG, PNG, WebP • Max 6 images</p>
						
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
							Add Photos
						</label>
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
						<div class="mt-4 sm:mt-6">
							<h4 class="text-sm font-medium mb-3 hidden sm:block" style="color: var(--text-primary);">{isEdit ? 'New Images' : 'Selected Images'} ({uploadedImages.length})</h4>
							<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
								{#each uploadedImages as image, index (index)}
									<div class="relative group aspect-square">
										<img 
											src={getImagePreview(image)} 
											alt="Tour preview {index + 1}"
											class="w-full h-full object-cover rounded-lg"
											style="border: 1px solid var(--border-primary);"
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
											class="image-remove-btn absolute -top-2 -right-2 w-8 h-8 sm:w-6 sm:h-6 rounded-full text-sm sm:text-xs transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center z-10 shadow-sm"
											style="
												background: var(--color-error-500);
												color: white;
												touch-action: manipulation;
												-webkit-tap-highlight-color: transparent;
											"
											aria-label="Remove image"
										>
											<X class="w-3 h-3 flex-shrink-0" />
										</button>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- ============================================================ -->
		<!-- PRICING SECTION (SIMPLIFIED) - Includes capacity           -->
		<!-- ============================================================ -->
		<div class="form-section-minimal">
			<div>
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
		<!-- CANCELLATION POLICY SECTION                                 -->
		<!-- ============================================================ -->
		<!-- Cancellation Policy (Collapsible) -->
		<div class="rounded-xl form-section-card" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<button
				type="button"
				onclick={() => showCancellationPolicy = !showCancellationPolicy}
				class="flex items-center justify-between w-full px-4 py-4 sm:p-4 transition-colors hover:bg-opacity-80 {showCancellationPolicy ? 'border-b' : ''}"
				style="{showCancellationPolicy ? 'border-color: var(--border-primary);' : ''}"
			>
				<div class="flex items-center gap-2">
					{#if showCancellationPolicy}
						<ChevronDown class="w-4 h-4" />
					{:else}
						<ChevronRight class="w-4 h-4" />
					{/if}
					<h2 class="font-semibold" style="color: var(--text-primary);">Cancellation Policy</h2>
					{#if formData.cancellationPolicy?.trim() || selectedPolicyTemplate}
						<span class="text-xs px-2 py-1 rounded-full" style="background: var(--color-accent-100); color: var(--color-accent-700);">
							{selectedPolicyTemplate === 'veryFlexible' ? 'Very Flexible' : 
							 selectedPolicyTemplate === 'flexible' ? 'Flexible' :
							 selectedPolicyTemplate === 'moderate' ? 'Moderate' :
							 selectedPolicyTemplate === 'strict' ? 'Strict' :
							 selectedPolicyTemplate === 'nonRefundable' ? 'Non-Refundable' :
							 'Custom'}
						</span>
					{/if}
				</div>
			</button>
			
			{#if showCancellationPolicy}
				<div class="px-4 py-3 sm:p-5">
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
						<div class="mt-4 space-y-4">
							<div class="p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
								<h4 class="text-sm font-semibold mb-3" style="color: var(--text-primary);">Custom Refund Rules</h4>
								
								<div class="space-y-3">
									<!-- Full Refund Window -->
									<div>
										<label for="customPolicyHours" class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary);">
											Full Refund Window (100%)
										</label>
										<div class="flex items-center gap-2">
											<input
												id="customPolicyHours"
												type="number"
												bind:value={customPolicyHours}
												min="1"
												max="168"
												step="1"
												class="form-input"
												style="max-width: 100px;"
												onfocus={(e) => e.currentTarget.select()}
												onblur={() => { customPolicyHours = validateCustomHours(customPolicyHours); }}
											/>
											<span class="text-sm" style="color: var(--text-secondary);">hours before tour</span>
										</div>
										<p class="text-xs mt-1" style="color: var(--text-tertiary);">
											Range: 1-168 hours (1 hour to 7 days)
										</p>
										<p class="text-xs mt-0.5" style="color: var(--text-tertiary);">
											Common: 2h, 12h, 24h, 48h, 72h, 168h
										</p>
									</div>
									
									<!-- Preview -->
									<div class="p-3 rounded-lg" style="background: var(--color-primary-50); border: 1px solid var(--color-primary-200);">
										<p class="text-xs font-medium mb-1" style="color: var(--color-primary-900);">Your Policy:</p>
										<p class="text-xs" style="color: var(--color-primary-800);">
											• Full refund if cancelled {customPolicyHours}+ hours before tour<br/>
											• No refund if cancelled less than {customPolicyHours} hours before
										</p>
									</div>
									
									<!-- Optional custom notes -->
									<div>
										<label for="customPolicyNotes" class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary);">
											Additional Notes (Optional)
										</label>
										<textarea
											id="customPolicyNotes"
											bind:value={customPolicyNotes}
											rows="2"
											placeholder="e.g., 'Contact us for special circumstances' or 'Emergency cancellations always considered'"
											class="form-textarea text-sm"
										></textarea>
										<p class="text-xs mt-1" style="color: var(--text-tertiary);">
											Extra information for customers - doesn't affect automatic refund calculations
										</p>
									</div>
								</div>
							</div>
							
							<div class="p-3 rounded-lg" style="background: var(--color-info-50); border: 1px solid var(--color-info-200);">
								<p class="text-xs" style="color: var(--color-info-800);">
									<strong>💸 Payment Schedule:</strong> Funds will be held on the platform for <strong>{customPolicyHours + 1} hours</strong> after booking, then automatically transferred to your account {customPolicyHours + 1} hours before the tour starts.
								</p>
							</div>
							<div class="p-3 rounded-lg" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
								<p class="text-xs" style="color: var(--color-warning-800);">
									<strong>⚠️ Remember:</strong> More flexible policies = happier customers and higher bookings, but funds are held longer to ensure refunds are always available.
								</p>
							</div>
						</div>
					{/if}

					<!-- Hidden inputs for form submission -->
					<input type="hidden" name="cancellationPolicy" bind:value={formData.cancellationPolicy} />
					<input type="hidden" name="cancellationPolicyId" bind:value={formData.cancellationPolicyId} />
				</div>
			{/if}
		</div>


		<!-- ============================================================ -->
		<!-- DANGER ZONE SECTION (Edit Mode Only)                        -->
		<!-- ============================================================ -->
		{#if isEdit && onDelete}
			<!-- Mobile: Compact Danger Zone -->
			<div class="sm:hidden px-4">
				<div class="p-3 rounded-lg danger-zone-container-mobile">
					<div class="flex items-center justify-between gap-3">
						<div class="flex-1">
							<p class="text-sm font-semibold" style="color: var(--color-danger-900);">Delete Tour</p>
							<p class="text-xs mt-0.5" style="color: var(--color-danger-700);">
								{#if hasFutureBookings}
									Has upcoming bookings
								{:else}
									Permanent action
								{/if}
							</p>
						</div>
						<div>
							{#if hasFutureBookings}
								<button 
									type="button" 
									class="text-xs px-3 py-2 rounded-lg font-medium cursor-not-allowed opacity-50" 
									style="background: var(--bg-secondary); color: var(--text-secondary);"
									disabled
								>
									Locked
								</button>
							{:else}
								<button 
									type="button" 
									onclick={onDelete} 
									class="text-xs px-3 py-2 rounded-lg font-medium" 
									style="background: var(--color-danger-600); color: white;"
									disabled={isDeleting}
								>
									{#if isDeleting}
										Deleting...
									{:else}
										Delete
									{/if}
								</button>
							{/if}
						</div>
					</div>
					{#if hasFutureBookings}
						<div class="mt-2 pt-2 border-t" style="border-color: var(--color-danger-200);">
							<a 
								href="/bookings?tour={tourId}"
								class="text-xs font-medium underline"
								style="color: var(--color-primary-600);"
							>
								View bookings →
							</a>
						</div>
					{/if}
				</div>
			</div>
			
			<!-- Desktop: Full Danger Zone -->
			<div class="hidden sm:block rounded-xl danger-zone-container">
				<div class="px-4 py-4 sm:p-4 border-b danger-zone-header">
					<h3 class="font-semibold danger-zone-title">Danger Zone</h3>
				</div>
				<div class="px-4 py-4 sm:p-4">
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
										class="button-secondary button-small w-full sm:w-auto cursor-not-allowed opacity-50" 
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
									class="button-danger button-small w-full sm:w-auto" 
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
		<div class="tour-form-sidebar">
			<!-- ============================================================ -->
			<!-- COMBINED STATUS & VISIBILITY SECTION (Edit Mode Only)       -->
			<!-- ============================================================ -->
			{#if isEdit}
				<!-- Mobile: Combined compact view -->
				<div class="sm:hidden px-4">
					<div class="space-y-3">
					<!-- Status display -->
					{#if !hideStatusField}
						<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-secondary);">
							<div class="flex items-center gap-2">
								{#if formData.status === 'active'}
									<CheckCircle class="w-4 h-4" style="color: var(--color-success-600);" />
								{:else}
									<FileText class="w-4 h-4" style="color: var(--color-warning-600);" />
								{/if}
								<div>
									<p class="text-sm font-semibold" style="color: var(--text-primary);">
										{formData.status === 'active' ? 'Active' : 'Draft'}
									</p>
									<p class="text-xs" style="color: var(--text-secondary);">
										{formData.status === 'active' ? 'Live & accepting bookings' : 'Not visible to customers'}
									</p>
								</div>
							</div>
							<!-- Hidden input -->
							<input type="hidden" name="status" bind:value={formData.status} />
						</div>
					{/if}
					
					<!-- Show in Search toggle (only when Active) -->
					{#if formData.status === 'active'}
						<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-secondary);">
							<div class="flex items-center gap-2">
								<Globe class="w-4 h-4" style="color: var(--text-accent);" />
								<div>
									<p class="text-sm font-semibold" style="color: var(--text-primary);">Show in Search</p>
									<p class="text-xs" style="color: var(--text-secondary);">
										{formData.publicListing ? 'Listed' : 'Unlisted'}
									</p>
								</div>
							</div>
							<div>
								<input type="hidden" name="publicListing" value={formData.publicListing ? 'true' : 'false'} />
								<label class="relative inline-flex items-center cursor-pointer">
									<input
										type="checkbox"
										bind:checked={formData.publicListing}
										class="sr-only peer"
									/>
									<div class="toggle-switch w-11 h-6 rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
								</label>
							</div>
						</div>
					{/if}
				</div>
			</div>
			
			<!-- Desktop: Separate cards -->
			<div class="hidden sm:block space-y-6">
				<!-- Current Status -->
				{#if !hideStatusField}
					<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="px-4 py-4 sm:p-4 border-b" style="border-color: var(--border-primary);">
							<h3 class="font-semibold" style="color: var(--text-primary);">Current Status</h3>
						</div>
						<div class="px-4 py-4 sm:p-4">
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

				<!-- Search Visibility (only shown when Active) -->
				{#if formData.status === 'active'}
					<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="px-4 py-4 sm:p-4">
							<div class="flex items-center justify-between gap-4">
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<Globe class="h-5 w-5" style="color: var(--text-accent);" />
										<h3 class="font-semibold" style="color: var(--text-primary);">Show in Search</h3>
									</div>
									<p class="text-sm" style="color: var(--text-secondary);">
										{formData.publicListing 
											? 'Listed - visible in public browse & search'
											: 'Unlisted - accessible only via QR code or direct link'}
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
				{:else}
					<!-- Hidden input for draft tours - always default to public listing when activated -->
					<input type="hidden" name="publicListing" value="true" />
				{/if}
			</div>
		{/if}

		<!-- ============================================================ -->
		<!-- ACTION BUTTONS SECTION                                       -->
		<!-- Save, Publish, Cancel buttons                                -->
		<!-- ============================================================ -->
		<div class="rounded-xl action-buttons-section" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="px-4 py-4 sm:p-4">
			<div class="space-y-3">
				{#if onPublish && onSaveAsDraft}
					<!-- Dual Action Buttons for Draft/Publish -->
					
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
						disabled={isSubmitting || !canActivate || allErrors.length > 0 || !hasMinimumRequiredFields}
						class="button-primary button--full-width button-gap"
						title={!canActivate ? 'Complete required setup steps to activate' : allErrors.length > 0 ? 'Fix validation errors to activate' : !hasMinimumRequiredFields ? 'Fill in all required fields' : ''}
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
						disabled={isSubmitting || allErrors.length > 0 || !hasMinimumRequiredFields}
						class="button-secondary button--full-width button-gap"
						title={allErrors.length > 0 ? 'Fix validation errors to save' : !hasMinimumRequiredFields ? 'Fill in all required fields' : ''}
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
					
					<button
						type={onSubmit ? "button" : "submit"}
						onclick={onSubmit || handleSubmit}
						disabled={isSubmitting || allErrors.length > 0 || !hasMinimumRequiredFields}
						class="button-primary button--full-width button-gap"
						title={allErrors.length > 0 ? 'Fix validation errors to save' : !hasMinimumRequiredFields ? 'Fill in all required fields' : ''}
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
</div>

<style>
	/* Form Field Wrapper - Consistent spacing for inputs with counters/errors */
	.form-field-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	
	/* Form Field Footer - Consistent height for error/counter row */
	.form-field-footer {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		min-height: 1.25rem; /* Reserve space to prevent layout jumps */
		gap: 0.5rem;
	}
	
	/* Form Field Spacer - Takes up space when no error is shown */
	.form-field-spacer {
		flex: 1;
		display: block;
	}
	
	/* Elegant error message styling */
	.form-error-message {
		flex: 1;
		font-size: 0.6875rem;
		color: var(--color-error-600);
		line-height: 1.2;
		font-weight: 500;
		opacity: 0.9;
		animation: fadeIn 0.2s ease;
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-2px);
		}
		to {
			opacity: 0.9;
			transform: translateY(0);
		}
	}
	
	/* Form Field Counter - Always present but hidden when empty */
	.form-field-counter {
		flex-shrink: 0;
		transition: opacity 0.15s ease;
		white-space: nowrap;
	}
	
	/* Override default form-input focus styles to prevent layout shifts */
	:global(.form-input.form-input--no-transform) {
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}
	
	:global(.form-input.form-input--no-transform:focus) {
		transform: none !important;
		box-shadow: 0 0 0 1px var(--color-primary-200) !important;
		border-color: var(--color-primary-500) !important;
		outline: none !important;
	}
	
	/* Tour name input uses accent color on mobile */
	@media (max-width: 640px) {
		:global(.form-input.tour-name-input:focus) {
			box-shadow: 0 0 0 1px var(--color-accent-200) !important;
			border-color: var(--color-accent-500) !important;
		}
	}
	
	:global(.form-input.form-input--no-transform.error) {
		color: var(--color-error-700);
	}
	
	:global(.form-textarea.form-input--no-transform:focus) {
		transform: none !important;
		box-shadow: 0 0 0 1px var(--color-primary-200) !important;
		border-color: var(--color-primary-500) !important;
		outline: none !important;
	}
	
	:global(.form-textarea.form-input--no-transform.error) {
		color: var(--color-error-700);
	}
	
	/* Location Picker Wrapper - Hide nested label */
	.location-picker-wrapper {
		width: 100%;
	}
	
	.location-picker-wrapper :global(.form-label) {
		display: none;
	}
	
	/* Location Input - Truncate long text */
	.location-picker-wrapper :global(.form-input) {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding-right: 3rem; /* Space for icons */
	}
	
	/* Ensure focus styles work properly for location picker */
	.location-picker-wrapper :global(.form-input:focus) {
		box-shadow: 0 0 0 1px var(--color-primary-200) !important;
		transform: none !important;
	}

	/* Section header styling */

	/* Smooth transitions for form sections */
	.form-section-card {
		transition: all 0.2s ease-in-out;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
		position: relative;
		overflow: hidden;
	}

	.form-section-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
		transform: translateY(-1px);
	}
	
	/* Add subtle animation on form field focus */
	.form-field-wrapper {
		transition: all 0.15s ease;
	}
	
	.form-field-wrapper:has(:focus) {
		transform: scale(1.005);
	}
	
	/* Add subtle hover effect on chip containers */
	:global(.chip-container),
	:global(.category-container),
	:global(.language-container) {
		transition: border-color 0.2s ease;
	}
	
	:global(.chip-container:hover),
	:global(.category-container:hover),
	:global(.language-container:hover) {
		border-color: var(--border-secondary) !important;
	}

	/* Smooth expand/collapse animations */
	div[class*="p-5"],
	div[class*="p-4"] {
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Danger Zone Styling */
	.danger-zone-container {
		background: var(--color-danger-50);
		border: 1px solid var(--color-danger-200);
	}

	.danger-zone-header {
		border-color: var(--color-danger-200);
	}

	.danger-zone-title {
		color: var(--color-danger-900);
	}
	
	/* Mobile Danger Zone */
	.danger-zone-container-mobile {
		background: var(--color-danger-50);
		border: 1px solid var(--color-danger-200);
	}

	/* Danger Zone Dark Mode - Softer colors */
	:root[data-theme='dark'] .danger-zone-container {
		background: rgba(220, 38, 38, 0.08);
		border-color: rgba(220, 38, 38, 0.25);
	}

	:root[data-theme='dark'] .danger-zone-header {
		border-color: rgba(220, 38, 38, 0.2);
	}

	:root[data-theme='dark'] .danger-zone-title {
		color: #fca5a5;
	}
	
	:root[data-theme='dark'] .danger-zone-container-mobile {
		background: rgba(220, 38, 38, 0.08);
		border-color: rgba(220, 38, 38, 0.25);
	}

	/* Success/Warning/Info boxes dark mode */
	:root[data-theme='dark'] div[style*="--color-success-50"] {
		background: rgba(34, 197, 94, 0.08) !important;
		border-color: rgba(34, 197, 94, 0.25) !important;
	}

	:root[data-theme='dark'] div[style*="--color-warning-50"] {
		background: rgba(245, 158, 11, 0.08) !important;
		border-color: rgba(245, 158, 11, 0.25) !important;
	}

	:root[data-theme='dark'] div[style*="--color-info-50"] {
		background: rgba(59, 130, 246, 0.08) !important;
		border-color: rgba(59, 130, 246, 0.25) !important;
	}

	:root[data-theme='dark'] div[style*="--color-error-50"] {
		background: rgba(220, 38, 38, 0.08) !important;
		border-color: rgba(220, 38, 38, 0.25) !important;
	}

	:root[data-theme='dark'] p[style*="--color-danger"] {
		color: #fca5a5 !important;
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

	/* Image remove button - ensure proper aspect ratio */
	.image-remove-btn {
		aspect-ratio: 1 / 1;
		padding: 0;
		min-width: 0;
		min-height: 0;
	}
	
	.image-remove-btn :global(svg) {
		flex-shrink: 0;
		display: block;
	}

	/* Mobile Enhancements - Better touch targets */
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

		/* Increase touch targets for all buttons */
		button[type="button"]:not(.tag-remove):not(.remove-btn):not(.image-remove-btn) {
			min-height: 44px;
		}

	}



	/* Mobile-enhanced error styling */
	@media (max-width: 768px) {
		/* Make error fields more prominent on mobile */
		.form-input.error {
			border-width: 2px;
		}
		
		/* Smaller error messages on mobile */
		.form-error-message {
			font-size: 0.625rem;
		}
		
		/* Mobile: Centered highlighted tour name */
		.tour-name-input {
			text-align: center;
			font-weight: 600;
			font-size: 1rem;
			background: var(--color-accent-50);
			border-color: var(--color-accent-200);
			color: var(--color-accent-900);
		}
		
		.tour-name-input:focus {
			background: var(--bg-primary);
			border-color: var(--color-accent-500);
			color: var(--text-primary);
		}
		
		.tour-name-input::placeholder {
			text-align: center;
			font-weight: 500;
			font-size: 0.875rem;
			color: var(--color-accent-400);
		}
		
		/* Mobile: Centered placeholders for all inputs */
		.form-textarea::placeholder,
		.form-input::placeholder {
			text-align: center;
			font-size: 0.875rem;
			color: var(--text-tertiary);
		}
		
		/* Mobile: Center textarea text */
		.form-textarea {
			text-align: center;
		}
		
		/* Mobile: Remove section borders for cleaner look */
		.form-section-card,
		.action-buttons-section {
			border: none !important;
			box-shadow: none !important;
			background: transparent !important;
		}
		
		/* Mobile: Center section titles */
		.form-section-card button {
			justify-content: center !important;
			text-align: center;
		}
		
		.form-section-card button > div {
			justify-content: center !important;
		}
		
		/* Mobile: Add visual dividers between sections */
		.form-section-card::after {
			content: '';
			display: block;
			height: 1px;
			background: linear-gradient(to right, transparent, var(--border-primary), transparent);
			margin: 0.5rem 0;
		}
	}
	
	/* Desktop: Normal tour name appearance */
	@media (min-width: 640px) {
		.tour-name-input {
			text-align: left;
			font-weight: 500;
			background: var(--bg-primary);
			border-color: var(--border-secondary);
			color: var(--text-primary);
		}
		
		.tour-name-input::placeholder {
			text-align: left;
			font-weight: 400;
			font-size: 0.875rem;
		}
		
		/* Desktop: Left-aligned placeholders */
		.form-textarea::placeholder,
		.form-input::placeholder {
			text-align: left;
		}
		
		/* Desktop: Left-aligned textarea */
		.form-textarea {
			text-align: left;
		}
		
		/* Desktop: Remove border from action buttons section too */
		.action-buttons-section {
			border: none !important;
			background: transparent !important;
		}
	}

	/* Modern Tour Form Layout */
	.tour-form-container {
		width: 100%;
	}

	.tour-form-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
	}

	.tour-form-main {
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	.tour-form-sidebar {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Mobile landscape and up */
	@media (min-width: 640px) {
		.tour-form-main {
			gap: 3.5rem;
		}
	}

	/* Desktop layout */
	@media (min-width: 1024px) {
		.tour-form-grid {
			grid-template-columns: 1fr 340px;
			gap: 2.5rem;
			align-items: start;
		}
		
		.tour-form-main {
			gap: 4rem;
		}

		.tour-form-sidebar {
			position: sticky;
			top: 5rem;
			max-height: calc(100vh - 6rem);
			overflow-y: auto;
		}

		/* Custom scrollbar for sidebar */
		.tour-form-sidebar::-webkit-scrollbar {
			width: 6px;
		}

		.tour-form-sidebar::-webkit-scrollbar-track {
			background: var(--bg-secondary);
			border-radius: 3px;
		}

		.tour-form-sidebar::-webkit-scrollbar-thumb {
			background: var(--border-secondary);
			border-radius: 3px;
		}

		.tour-form-sidebar::-webkit-scrollbar-thumb:hover {
			background: var(--border-primary);
		}
	}

	/* Large desktop - wider sidebar */
	@media (min-width: 1536px) {
		.tour-form-grid {
			grid-template-columns: 1fr 380px;
			gap: 3rem;
		}
		
		.tour-form-main {
			gap: 5rem;
		}
	}

	/* Form sections visual enhancement */
	.form-section-card {
		transition: box-shadow 0.2s ease, transform 0.2s ease;
	}

	.form-section-card:hover {
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
	}

	/* Responsive padding adjustments */
	@media (max-width: 639px) {
		.tour-form-sidebar {
			margin-top: 1rem;
		}
	}
	
	/* ============================================================ */
	/* Minimal Apple-Style Sections                                */
	/* ============================================================ */
	/* Pure spacing approach - no visual dividers */
	.form-section-minimal {
		position: relative;
	}
	
	/* Add horizontal padding on mobile for form sections */
	@media (max-width: 640px) {
		.form-section-minimal {
			padding-left: 1rem;
			padding-right: 1rem;
		}
	}
</style>