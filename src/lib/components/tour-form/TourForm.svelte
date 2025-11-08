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
	import NumberInput from '../form/inputs/NumberInput.svelte';
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
	import Mountain from 'lucide-svelte/icons/mountain';
	import Edit from 'lucide-svelte/icons/edit';
	import FileText from 'lucide-svelte/icons/file-text';
	import Eye from 'lucide-svelte/icons/eye';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import LocationPicker from '../LocationPicker.svelte';
	import Plus from 'lucide-svelte/icons/plus';
	import Calendar from 'lucide-svelte/icons/calendar';
	import { isValidLocationLength } from '$lib/utils/location.js';
	
	// Import new pricing components
	import SimplifiedPricingSection from '../pricing/SimplifiedPricingSection.svelte';
	import type { PricingModel, GroupPricingTier, GroupDiscountTier, OptionalAddon, ParticipantCategory } from '$lib/types.js';
	
	// Import tour form section components
	import DurationInput from '../form/inputs/DurationInput.svelte';
	import { Tipex, defaultExtensions } from '@friendofsvelte/tipex';
	import '@friendofsvelte/tipex/styles/index.css';
	import CharacterCount from '@tiptap/extension-character-count';
	import TourDescriptionControls from '../tour/TourDescriptionControls.svelte';
	import TourImagesSection from './TourImagesSection.svelte';
	import DangerZoneSection from './DangerZoneSection.svelte';
	import StatusVisibilitySection from './StatusVisibilitySection.svelte';
	import CancellationPolicySection from './CancellationPolicySection.svelte';
	import ActionButtonsSection from './ActionButtonsSection.svelte';
	import TagsSection from './TagsSection.svelte';

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
			locationPlaceId?: string | null;
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
		// Hide field labels for demo/showcase mode
		hideLabels?: boolean;
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
		hideLabels = true,
		profile = null,
		hasConfirmedLocation = false,
		paymentStatus = { isSetup: false, loading: false },
		onDelete = undefined,
		hasFutureBookings = false,
		isDeleting = false,
		tourId = undefined
	}: Props = $props();
	
	// Tipex editor instance for managing description content
	let descriptionEditor = $state<any>(undefined);
	
	// Track initial load to prevent overwriting user edits
	let initialDescriptionLoaded = $state(false);
	
	// Character count tracking
	const MAX_DESCRIPTION_LENGTH = 2000;
	let descriptionCharCount = $state(0);
	let descriptionWordCount = $state(0);
	
	// Configure Tipex extensions with CharacterCount
	const tourDescriptionExtensions = [
		...defaultExtensions,
		CharacterCount.configure({
			limit: MAX_DESCRIPTION_LENGTH,
		}),
	];
	
	// Check if content is HTML or Markdown
	function isHTML(text: string): boolean {
		if (!text) return false;
		return /<\/?[a-z][\s\S]*>/i.test(text);
	}
	
	// Convert markdown to HTML for Tipex
	function markdownToHTML(text: string): string {
		if (!text) return '';
		
		let html = text;
		
		// Headers (must be processed before other formatting)
		html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
		html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
		html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
		
		// Bold
		html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
		html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
		
		// Italic
		html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
		html = html.replace(/_(.*?)_/g, '<em>$1</em>');
		
		// Links
		html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
		
		// Lists - Convert to HTML lists
		const lines = html.split('\n');
		const processedLines: string[] = [];
		let inList = false;
		let listType: 'ul' | 'ol' | null = null;
		
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const trimmedLine = line.trim();
			
			// Check for ordered list
			const orderedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
			if (orderedMatch) {
				if (!inList || listType !== 'ol') {
					if (inList && listType) {
						processedLines.push(`</${listType}>`);
					}
					processedLines.push('<ol>');
					listType = 'ol';
					inList = true;
				}
				processedLines.push(`<li>${orderedMatch[2]}</li>`);
				continue;
			}
			
			// Check for unordered list
			const unorderedMatch = trimmedLine.match(/^[\*\-]\s+(.+)$/);
			if (unorderedMatch) {
				if (!inList || listType !== 'ul') {
					if (inList && listType) {
						processedLines.push(`</${listType}>`);
					}
					processedLines.push('<ul>');
					listType = 'ul';
					inList = true;
				}
				processedLines.push(`<li>${unorderedMatch[1]}</li>`);
				continue;
			}
			
			// Not a list item
			if (inList && listType) {
				processedLines.push(`</${listType}>`);
				inList = false;
				listType = null;
			}
			
			// Regular line - wrap in <p> if not empty and not already a heading
			if (trimmedLine && !trimmedLine.startsWith('<h')) {
				processedLines.push(`<p>${line}</p>`);
			} else if (trimmedLine) {
				processedLines.push(line);
			}
		}
		
		// Close any open list
		if (inList && listType) {
			processedLines.push(`</${listType}>`);
		}
		
		return processedLines.join('\n');
	}
	
	// Sync editor content when formData.description changes (e.g., when loading existing tour)
	$effect(() => {
		if (descriptionEditor && formData.description && !initialDescriptionLoaded) {
			// Load initial content from existing tour
			const currentContent = descriptionEditor.getHTML();
			if (currentContent !== formData.description && formData.description.trim() !== '') {
				// Convert markdown to HTML if needed
				const contentToLoad = isHTML(formData.description) 
					? formData.description 
					: markdownToHTML(formData.description);
				
				descriptionEditor.commands.setContent(contentToLoad);
				initialDescriptionLoaded = true;
			}
		}
	});
	
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
	
	// Initialize languages if not set
	if (!formData.languages) {
		formData.languages = [];
	}

	// Client-side validation state
	let validationErrors = $state<ValidationError[]>([]);
	let touchedFields = $state<Set<string>>(new Set());
	let currentlyTypingFields = $state<Set<string>>(new Set());
	
	// Track initial status to determine button text in edit mode
	let initialStatus = $state(formData.status);
	
	// Collapsible sections state
	let showAdvancedPricing = $state(false);
	
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
		
		return Boolean(hasName && hasDescription && hasDuration && hasLanguages && hasValidPricing);
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

		// Mark description as touched immediately (since rich text editor blur events may not work reliably)
		if (fieldName === 'description') {
			touchedFields.add(fieldName);
		}

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
		// For name, never show errors while typing
		if (fieldName === 'name' && currentlyTypingFields.has(fieldName)) {
			return false;
		}
		// For description, show errors after field has been touched (even while typing)
		if (fieldName === 'description') {
			return touchedFields.has(fieldName);
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
			<div class="space-y-2 sm:space-y-3">
				<!-- Hidden status field for form submission (when not showing visible toggle) -->
				{#if !isEdit || hideStatusField}
					<input type="hidden" name="status" bind:value={formData.status} />
				{/if}

		<!-- Two-Column Layout: Primary Fields (Left) + Tag Fields (Right) -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-5">
			<!-- Left Column: Primary Fields (Name & Description) -->
			<div class="lg:col-span-2 space-y-2 sm:space-y-3">
				<!-- Name -->
				<div>
					{#if !hideLabels}
						<label for="name" class="form-label flex items-center gap-2 hidden sm:flex">
							<Edit class="w-4 h-4" style="color: var(--text-tertiary);" />
							<span>Name *</span>
						</label>
					{/if}
					<div class="form-field-wrapper">
						<input
							type="text"
							id="name"
							name="name"
							bind:value={formData.name}
							placeholder="Name *"
							class="form-input form-input--no-transform tour-name-input {hasFieldError(allErrors, 'name') && shouldShowError('name') ? 'error' : ''}"
							oninput={() => handleFieldInput('name')}
							onblur={() => validateField('name')}
							maxlength="100"
						/>
						<div class="form-field-helper">
							{#if getFieldError(allErrors, 'name') && shouldShowError('name')}
								<span class="form-error-message">{getFieldError(allErrors, 'name')}</span>
							{:else}
								<span class="form-field-spacer"></span>
							{/if}
							<span class="text-xs form-field-counter hidden sm:inline" style="color: {hasFieldError(allErrors, 'name') && shouldShowError('name') ? 'var(--color-error-500)' : 'var(--text-tertiary)'}; opacity: {formData.name && formData.name.length > 0 ? 1 : 0};">
								{formData.name?.length || 0}/100
							</span>
						</div>
					</div>
				</div>

				<!-- Description -->
				<div>
					{#if !hideLabels}
						<label for="description" class="form-label flex items-center gap-2 hidden sm:flex">
							<FileText class="w-4 h-4" style="color: var(--text-tertiary);" />
							<span>Description *</span>
						</label>
					{/if}
					<div class="form-field-wrapper description-field-wrapper">
						<Tipex
							body={formData.description || ''}
							bind:tipex={descriptionEditor}
							extensions={tourDescriptionExtensions}
							floating
							focal
							autofocus={false}
							onupdate={({ editor }) => {
								if (editor) {
									formData.description = editor.getHTML();
									handleFieldInput('description');
									// Update character and word count
									descriptionCharCount = editor.storage.characterCount.characters();
									descriptionWordCount = editor.storage.characterCount.words();

									// Trigger validation for description
									const validation = validateTourForm(formData);
									allErrors = validation.errors;
								}
							}}
							oncreate={({ editor }) => {
								if (editor) {
									// Initialize character count
									descriptionCharCount = editor.storage.characterCount.characters();
									descriptionWordCount = editor.storage.characterCount.words();
								}
							}}
							class="tipex-description-editor {hasFieldError(allErrors, 'description') && shouldShowError('description') ? 'tipex-error' : ''} {descriptionCharCount >= MAX_DESCRIPTION_LENGTH ? 'at-limit' : descriptionCharCount > MAX_DESCRIPTION_LENGTH * 0.9 ? 'near-limit' : ''}"
							style="min-height: 200px;"
						>
							{#snippet controlComponent(tipex)}
								<TourDescriptionControls {tipex} />
							{/snippet}
						</Tipex>
						<input
							type="hidden"
							id="description"
							name="description"
							value={formData.description}
							onblur={() => validateField('description')}
						/>
						<div class="form-field-helper">
							{#if getFieldError(allErrors, 'description') && shouldShowError('description')}
								<span class="form-error-message">{getFieldError(allErrors, 'description')}</span>
							{:else}
								<span class="form-field-spacer"></span>
							{/if}
							<span class="form-field-counter" class:counter-warning={descriptionCharCount > MAX_DESCRIPTION_LENGTH * 0.9} class:counter-error={descriptionCharCount >= MAX_DESCRIPTION_LENGTH}>
								{descriptionCharCount}/{MAX_DESCRIPTION_LENGTH}
							</span>
						</div>
					</div>
				</div>

				<!-- Meeting Point (Location Info) -->
				<div>
					{#if !hideLabels}
						<label class="form-label flex items-center gap-2 hidden sm:flex">
							<MapPin class="w-4 h-4" style="color: var(--text-tertiary);" />
							<span>Meeting Point</span>
						</label>
					{/if}
					<div class="form-field-wrapper">
						<div class="location-picker-wrapper">
							<LocationPicker
								bind:value={formData.location}
								bind:placeId={formData.locationPlaceId}
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
						<div class="form-field-helper">
							<span class="form-field-spacer"></span>
							<span class="text-xs form-field-counter" style="color: var(--text-tertiary); opacity: {formData.location && formData.location.length > 100 ? 1 : 0};">
								{formData.location?.length || 0}/255
								{#if formData.location && formData.location.length > 255}
									<span style="color: var(--color-warning-600);"> (too long)</span>
								{/if}
							</span>
						</div>
					</div>
					<input type="hidden" name="location" bind:value={formData.location} />
					<input type="hidden" name="locationPlaceId" bind:value={formData.locationPlaceId} />
				</div>
			</div>

			<!-- Right Column: Quick Info & Tag Fields -->
			<div class="space-y-2 sm:space-y-3">
				<!-- Duration (Required - Important Info) -->
				<div>
					{#if !hideLabels}
						<label for="duration" class="form-label flex items-center gap-2 hidden sm:flex">
							<Calendar class="w-4 h-4" style="color: var(--text-tertiary);" />
							<span>Duration *</span>
						</label>
					{/if}
					<div class="form-field-wrapper">
						<DurationInput
							bind:value={formData.duration}
							error={hasFieldError(allErrors, 'duration') && shouldShowError('duration')}
							oninput={() => handleFieldInput('duration')}
							onblur={() => validateField('duration')}
						/>
						<div class="form-field-helper">
							{#if getFieldError(allErrors, 'duration') && shouldShowError('duration')}
								<span class="form-error-message">{getFieldError(allErrors, 'duration')}</span>
							{:else}
								<span class="form-field-spacer"></span>
							{/if}
						</div>
					</div>
				</div>

				<!-- Tags: Categories, Languages, Included Items, Requirements -->
				<TagsSection
					bind:formData
					{allErrors}
					{hideLabels}
					{includedItemsSuggestions}
					{requirementsSuggestions}
					{shouldShowError}
				/>
			</div>
		</div>
			</div>
		</div>

		<!-- ============================================================ -->
		<!-- TOUR IMAGES SECTION (Moved from sidebar)                    -->
		<!-- ============================================================ -->
		<TourImagesSection
			{isEdit}
			{existingImages}
			{onExistingImageRemove}
			{getExistingImageUrl}
			{uploadedImages}
			{onImageUpload}
			{onImageRemove}
			{imageUploadErrors}
		/>

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
		<CancellationPolicySection bind:formData />


		<!-- ============================================================ -->
		<!-- DANGER ZONE SECTION (Edit Mode Only)                        -->
		<!-- ============================================================ -->
		{#if isEdit}
			<DangerZoneSection
				{tourId}
				{hasFutureBookings}
				{isDeleting}
				{onDelete}
			/>
		{/if}
		</div>

		<!-- Sidebar -->
		<div class="tour-form-sidebar">
			<!-- ============================================================ -->
			<!-- COMBINED STATUS & VISIBILITY SECTION (Edit Mode Only)       -->
			<!-- ============================================================ -->
			{#if isEdit}
				<StatusVisibilitySection bind:formData {hideStatusField} />
			{/if}

		<!-- ============================================================ -->
		<!-- ACTION BUTTONS SECTION                                       -->
		<!-- Save, Publish, Cancel buttons                                -->
		<!-- ============================================================ -->
		<ActionButtonsSection
			{isSubmitting}
			{isEdit}
			formStatus={formData.status}
			{initialStatus}
			{submitButtonText}
			{canActivate}
			{missingSteps}
			{onboardingMessage}
			hasErrors={allErrors.length > 0}
			hasMinimumRequiredFields={hasMinimumRequiredFields()}
			{onPublish}
			{onSaveAsDraft}
			{onSubmit}
			{onCancel}
			{handleSubmit}
		/>
		</div>
	</div>
</div>

<style>
	/* Form Field Wrapper - Consistent spacing for inputs with counters/errors */
	.form-field-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Special handling for description field to ensure proper layout */
	.description-field-wrapper {
		position: relative;
		isolation: isolate; /* Create new stacking context */
		z-index: 1; /* Ensure it doesn't interfere with other elements */
	}

	/* Ensure description form-field-helper is properly positioned */
	.description-field-wrapper .form-field-helper {
		position: relative;
		z-index: 2;
		margin-top: 0.25rem; /* Extra spacing for description field */
	}

	/* Ensure languages form-field-helper has proper spacing */
	.languages-field-wrapper .form-field-helper {
		position: relative;
		z-index: 1;
		margin-top: 0.25rem;
	}
	
	/* Form Field Helper - Error messages and counters row */
	.form-field-helper {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
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
		transition: all 0.15s ease;
		white-space: nowrap;
		font-size: 0.6875rem;
		color: var(--text-tertiary);
		font-weight: 500;
	}
	
	.form-field-counter.counter-warning {
		color: var(--color-warning-600);
		font-weight: 600;
	}
	
	.form-field-counter.counter-error {
		color: var(--color-error-600);
		font-weight: 700;
	}
	
	/* Override default form-input focus styles to use accent color */
	:global(.form-input.form-input--no-transform) {
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}
	
	:global(.form-input.form-input--no-transform:focus) {
		transform: none !important;
		box-shadow: 0 0 0 1px var(--color-accent-200) !important;
		border-color: var(--color-accent-500) !important;
		outline: none !important;
	}
	
	:global(.form-input.form-input--no-transform.error) {
		color: var(--color-error-700);
	}
	
	:global(.form-textarea.form-input--no-transform:focus) {
		transform: none !important;
		box-shadow: 0 0 0 1px var(--color-accent-200) !important;
		border-color: var(--color-accent-500) !important;
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
			font-size: 1.125rem;
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
			font-size: 1.125rem;
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
		gap: 1rem;
	}

	.tour-form-sidebar {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Mobile landscape and up */
	@media (min-width: 640px) {
		.tour-form-main {
			gap: 1.25rem;
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
			gap: 1.5rem;
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
			gap: 2rem;
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

	
	/* Tipex Editor Styling - Match form design */
	:global(.tipex-description-editor) {
		border: 1px solid var(--border-primary) !important;
		border-radius: 0.5rem;
		background: var(--bg-primary);
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}
	
	/* Focus state with higher specificity */
	:global(.tipex-description-editor:focus-within),
	:global(.tipex-description-editor.focused),
	:global(.tipex-description-editor:has(.ProseMirror:focus)) {
		border-color: var(--color-accent-500) !important;
		box-shadow: 0 0 0 1px var(--color-accent-200) !important;
		outline: none;
	}
	
	:global(.tipex-description-editor.tipex-error) {
		border-color: var(--color-error-500);
	}
	
	:global(.tipex-description-editor.tipex-error:focus-within) {
		border-color: var(--color-error-500);
		box-shadow: 0 0 0 1px var(--color-error-200);
	}
	
	/* Character limit warning */
	:global(.tipex-description-editor.at-limit) {
		border-color: var(--color-error-400);
	}
	
	:global(.tipex-description-editor.near-limit) {
		border-color: var(--color-warning-400);
	}
	
	/* Tipex content area styling */
	:global(.tipex-description-editor .ProseMirror) {
		padding: 0.75rem;
		min-height: 200px;
		color: var(--text-primary);
		font-size: 0.9375rem;
		line-height: 1.6;
	}
	
	:global(.tipex-description-editor .ProseMirror:focus) {
		outline: none;
	}
	
	/* Tipex placeholder (handled by Placeholder extension) */
	:global(.tipex-description-editor .ProseMirror .is-empty::before) {
		color: var(--text-tertiary);
		opacity: 0.5;
		content: "Describe your tour experience... *";
		pointer-events: none;
	}
	
	/* Mobile-specific adjustments for Tipex */
	@media (max-width: 640px) {
		/* Better padding on mobile for easier editing */
		:global(.tipex-description-editor .ProseMirror) {
			padding: 1rem;
			font-size: 1rem;
			line-height: 1.7;
		}
	}
	
	/* Horizontal rule styling in editor */
	:global(.tipex-description-editor .ProseMirror hr) {
		border: none;
		border-top: 2px solid var(--border-secondary);
		margin: 1.5rem 0;
		cursor: pointer;
	}
	
	:global(.tipex-description-editor .ProseMirror hr:hover) {
		border-top-color: var(--border-primary);
	}
	
	/* Paragraph spacing for better readability */
	:global(.tipex-description-editor .ProseMirror p) {
		margin-bottom: 0.75rem;
	}
	
	:global(.tipex-description-editor .ProseMirror p:last-child) {
		margin-bottom: 0;
	}
	
	/* Better spacing for headings after paragraphs */
	:global(.tipex-description-editor .ProseMirror h2, 
	        .tipex-description-editor .ProseMirror h3) {
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
	}
	
	:global(.tipex-description-editor .ProseMirror h2:first-child, 
	        .tipex-description-editor .ProseMirror h3:first-child) {
		margin-top: 0;
	}
</style>