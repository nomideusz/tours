<script lang="ts">
	import { goto } from '$app/navigation';

	import { browser } from '$app/environment';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import TourForm from '$lib/components/TourForm.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';

	import type { Tour } from '$lib/types.js';
	import type { PageData, ActionData } from './$types.js';
	import type { ValidationError } from '$lib/validation.js';
	import { validateTourForm } from '$lib/validation.js';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { invalidatePublicTourData } from '$lib/queries/public-queries.js';
	import { updateTourWithFormDataMutation } from '$lib/queries/mutations.js';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Save from 'lucide-svelte/icons/save';
	import X from 'lucide-svelte/icons/x';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	
	// Onboarding utilities
	import { canActivateTours } from '$lib/utils/onboarding.js';
	
	// Umami tracking
	import { trackTourEvent } from '$lib/utils/umami-tracking.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	// Get profile from layout data
	let profile = $derived(data.user);
	
	const queryClient = useQueryClient();
	let tourId = $derived(data.tourId);
	
	// Initialize mutation for tour updates
	let updateTourMutation = $derived(updateTourWithFormDataMutation(tourId));
	
	// TanStack Query for tour details
	let tourQuery = $derived(createQuery({
		queryKey: queryKeys.tourDetails(tourId),
		queryFn: () => queryFunctions.fetchTourDetails(tourId),
		staleTime: 0, // Always consider data potentially stale for immediate updates
		gcTime: 5 * 60 * 1000,    // 5 minutes
		refetchOnWindowFocus: 'always',
		refetchOnMount: 'always',
		// Force fresh data - don't use any cached data for critical delete logic
		refetchInterval: false, // Don't auto-refetch
		networkMode: 'always'
	}));

	// Use server-side data initially, then TanStack Query data when available
	// This ensures hasFutureBookings is available immediately from server data
	let tour = $derived($tourQuery.data?.tour || (data as any).tour || null);
	let isLoading = $derived($tourQuery.isLoading && !(data as any).tour);
	let isSubmitting = $state(false);
	
	// Onboarding status
	let hasConfirmedLocation = $state(false);
	let paymentStatus = $state({ isSetup: false, loading: true });
	
	// Initialize onboarding status
	$effect(() => {
		if (browser && profile) {
			// Check if location is confirmed from localStorage
			hasConfirmedLocation = localStorage.getItem('locationConfirmed') === 'true';
			
			// Also consider location confirmed if user has country+currency or stripe account
			if ((profile.country && profile.currency) || profile.stripeAccountId) {
				hasConfirmedLocation = true;
				localStorage.setItem('locationConfirmed', 'true');
			}
			
			// Check payment status
			checkPaymentStatus();
		}
	});
	
	// Check payment status
	async function checkPaymentStatus() {
		if (!profile?.stripeAccountId) {
			paymentStatus = { isSetup: false, loading: false };
			return;
		}

		try {
			const response = await fetch('/api/payments/connect/status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: profile.id })
			});

			if (response.ok) {
				const data = await response.json();
				paymentStatus = {
					isSetup: data.canReceivePayments || false,
					loading: false
				};
			} else {
				paymentStatus = { isSetup: false, loading: false };
			}
		} catch (error) {
			console.error('Error checking payment status:', error);
			paymentStatus = { isSetup: false, loading: false };
		}
	}

	let error = $state<string | null>(form?.error || null);
	let validationErrors = $state<ValidationError[]>((form as any)?.validationErrors || []);

	let triggerValidation = $state(false);
	let showCancelModal = $state(false);
	let showDeleteModal = $state(false);
	let isDeleting = $state(false);
	
	// Delete error modal state
	let showDeleteErrorModal = $state(false);
	let deleteErrorData = $state<{
		tourName: string;
		activeBookings: number;
		totalBookings: number;
		revenue: number;
	} | null>(null);

	// Booking constraints query
	let constraintsQuery = $derived(createQuery({
		queryKey: queryKeys.tourBookingConstraints(tourId),
		queryFn: () => queryFunctions.fetchTourBookingConstraints(tourId),
		staleTime: 5 * 60 * 1000, // 5 minutes - reduce excessive refetching
		gcTime: 10 * 60 * 1000, // 10 minutes
		refetchOnWindowFocus: false, // Disable window focus refetching
		enabled: !!tour, // Only fetch when tour is loaded
	}));

	let bookingConstraints = $derived($constraintsQuery.data || null);
	let constraintsLoading = $derived($constraintsQuery.isLoading);
	
	// Check if tour has future bookings that prevent deletion
	// Use the same logic as the tours list - only future bookings prevent deletion
	let hasFutureBookings = $derived(tour?.hasFutureBookings || false);
	
	// Debug logging for delete button
	$effect(() => {
		if (tour) {
			const dataSource = $tourQuery.data?.tour ? 'TanStack Query' : 'Server-side';
			console.log('🔍 Delete button check - hasFutureBookings:', hasFutureBookings, 'tour.hasFutureBookings:', tour.hasFutureBookings, 'tour:', tour.name, 'source:', dataSource);
		}
	});

	// Form data
	let formData = $state({
		name: '',
		description: '',
		price: 0,
		duration: 60,
		capacity: 10,
		status: 'draft' as Tour['status'],
		categories: [],
		location: '',
		languages: ['en'],
		includedItems: [],
		requirements: [],
		cancellationPolicy: '',
		cancellationPolicyId: 'flexible',
		// Pricing configuration
		pricingModel: 'participant_categories' as Tour['pricingModel'],
		enablePricingTiers: false,
		pricingTiers: {
			adult: 0,
			child: 0
		},
		participantCategories: undefined as any,
		privateTour: undefined as any,
		groupPricingTiers: { tiers: [] },
		groupDiscounts: undefined as any,
		optionalAddons: { addons: [] },
		guidePaysStripeFee: false,
		countInfantsTowardCapacity: false,
		publicListing: true
	});

	// Image upload state
	let uploadedImages: File[] = $state([]);
	let existingImages: string[] = $state([]);
	let imagesToRemove: string[] = $state([]);

	// Image validation constants (matching server-side)
	const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
	const MAX_IMAGES = 6; // Maximum 6 images per tour
	const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
	let imageUploadErrors: string[] = $state([]);

	function validateImageFile(file: File): { isValid: boolean; error?: string } {
		if (!file || !(file instanceof File)) {
			return { isValid: false, error: 'Invalid file' };
		}

		if (file.size > MAX_FILE_SIZE) {
			return { isValid: false, error: `File too large (max 5MB): ${file.name}` };
		}

		if (!ALLOWED_TYPES.includes(file.type)) {
			return { isValid: false, error: `Invalid file type: ${file.name}. Allowed: JPEG, PNG, WebP` };
		}

		return { isValid: true };
	}

	function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		console.log('🔍 Image upload event triggered (edit mode)');
		console.log('🔍 Target:', target);
		console.log('🔍 Target files:', target.files);
		console.log('🔍 User agent:', navigator.userAgent);
		
		if (!target.files || target.files.length === 0) {
			console.log('❌ No files selected');
			return;
		}

		// iOS Safari workaround - ensure files are properly converted
		let newFiles: File[] = [];
		try {
			// Use FileList.item() method for better mobile compatibility
			for (let i = 0; i < target.files.length; i++) {
				const file = target.files.item(i);
				if (file) {
					// Create a new File object to ensure proper handling on mobile
					const newFile = new File([file], file.name, {
						type: file.type,
						lastModified: file.lastModified
					});
					newFiles.push(newFile);
				}
			}
		} catch (e) {
			console.error('❌ Error processing files:', e);
			// Fallback to Array.from
			newFiles = Array.from(target.files);
		}
		console.log('📁 Raw files from input:', newFiles.map(f => ({
			name: f.name,
			size: f.size,
			type: f.type,
			lastModified: f.lastModified
		})));

		const validFiles: File[] = [];
		const errors: string[] = [];

		// Calculate current total (existing + new uploaded images)
		const currentTotal = existingImages.length + uploadedImages.length;
		
		// Check total count limit
		if (currentTotal + newFiles.length > MAX_IMAGES) {
			errors.push(`Too many images. Maximum ${MAX_IMAGES} images allowed. You have ${currentTotal} and tried to add ${newFiles.length} more.`);
		}

		// Check total size limit (warn at 8MB to leave buffer for form data)
		const currentUploadedSize = uploadedImages.reduce((sum, file) => sum + file.size, 0);
		const newFilesSize = newFiles.reduce((sum, file) => sum + file.size, 0);
		const totalSize = currentUploadedSize + newFilesSize;
		const maxTotalSize = 8 * 1024 * 1024; // 8MB warning threshold
		
		if (totalSize > maxTotalSize) {
			errors.push(`Total upload size too large (${Math.round(totalSize / 1024 / 1024)}MB). Please reduce image sizes or use fewer images. Maximum recommended: 8MB total.`);
		}

		// Validate each file
		for (const file of newFiles) {
			console.log(`🔍 Validating file: ${file.name} (${file.size} bytes, ${file.type})`);
			
			const validation = validateImageFile(file);
			console.log(`✅ Validation result for ${file.name}:`, validation);
			
			if (validation.isValid) {
				// Check for duplicates by name (both in existing and uploaded)
				const isDuplicateInUploaded = uploadedImages.some(existing => existing.name === file.name);
				const isDuplicateInExisting = existingImages.some(existing => existing.includes(file.name.split('.')[0]));
				
				if (!isDuplicateInUploaded && !isDuplicateInExisting) {
					validFiles.push(file);
					console.log(`✅ Added ${file.name} to valid files`);
				} else {
					errors.push(`Duplicate file: ${file.name}`);
					console.log(`❌ Duplicate file: ${file.name}`);
				}
			} else {
				errors.push(validation.error!);
				console.log(`❌ Invalid file: ${file.name} - ${validation.error}`);
			}
		}

		// Only add files if we won't exceed the limit
		const remainingSlots = MAX_IMAGES - currentTotal;
		const finalFiles = validFiles.slice(0, remainingSlots);
		if (finalFiles.length < validFiles.length) {
			errors.push(`Some files were skipped to stay within the ${MAX_IMAGES} image limit.`);
		}

		console.log(`📊 Final results: ${finalFiles.length} valid files, ${errors.length} errors`);
		console.log('📊 Final files:', finalFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));

		// Update state
		console.log('📱 Before update - uploadedImages:', uploadedImages.length);
		uploadedImages = [...uploadedImages, ...finalFiles];
		console.log('📱 After update - uploadedImages:', uploadedImages.length);
		console.log('📱 uploadedImages state:', uploadedImages.map(f => ({ name: f.name, size: f.size })));
		imageUploadErrors = errors;

		// Clear the input so the same files can be selected again if needed
		target.value = '';

		// Auto-clear errors after 5 seconds
		if (errors.length > 0) {
			setTimeout(() => {
				imageUploadErrors = [];
			}, 5000);
		}
	}

	function removeImage(index: number) {
		console.log('🗑️ Mobile/Desktop: Removing new image at index:', index);
		console.log('🗑️ Touch event type:', window.event?.type);
		uploadedImages = uploadedImages.filter((_, i) => i !== index);
		console.log('🗑️ Remaining uploaded images:', uploadedImages.length);
		// Force UI update on mobile
		uploadedImages = uploadedImages;
	}

	function removeExistingImage(imageName: string) {
		console.log('🗑️ Mobile/Desktop: Removing existing image:', imageName);
		console.log('🗑️ Touch event type:', window.event?.type);
		imagesToRemove = [...imagesToRemove, imageName];
		existingImages = existingImages.filter(img => img !== imageName);
		console.log('🗑️ Images marked for removal:', imagesToRemove);
		console.log('🗑️ Remaining existing images:', existingImages);
		// Force UI update on mobile
		existingImages = existingImages;
	}

	function getExistingImageUrl(imageName: string): string {
		// Use shared utility for consistency
		return `/api/images/${tourId}/${imageName}?size=medium`;
	}

	// Initialize form when tour data loads or changes
	$effect(() => {
		if (tour && !isLoading) {
			// Always initialize when tour data is available
			// This ensures we get fresh data even if the component is reused
			console.log('🔄 Initializing form with tour data:', tour.id, tour.updatedAt);
			initializeTour();
		}
	});



	function initializeTour() {
		if (!tour) return;
		
		// Populate form data with existing tour data
		formData = {
			name: tour.name || '',
			description: tour.description || '',
			price: tour.price || 0,
			duration: tour.duration || 60,
			capacity: tour.capacity || 10,
			status: tour.status || 'draft',
			categories: tour.categories || [],
			location: tour.location || '',
			languages: tour.languages || ['en'],
			includedItems: tour.includedItems || [],
			requirements: tour.requirements || [],
			cancellationPolicy: tour.cancellationPolicy || '',
			cancellationPolicyId: tour.cancellationPolicyId || 'flexible',
			// Pricing configuration
			pricingModel: tour.pricingModel || 'participant_categories',
			enablePricingTiers: tour.enablePricingTiers || false,
			pricingTiers: tour.pricingTiers || {
				adult: parseFloat(tour.price) || 0,
				child: 0
			},
			participantCategories: tour.participantCategories ? {
				...tour.participantCategories,
				minCapacity: tour.minCapacity,
				maxCapacity: tour.maxCapacity
			} : undefined,
			privateTour: tour.privateTour ? {
				...tour.privateTour,
				// Use privateTour-specific capacity, or fall back to tour-level capacity
				minCapacity: tour.privateTour.minCapacity ?? tour.minCapacity,
				maxCapacity: tour.privateTour.maxCapacity ?? tour.maxCapacity
			} : undefined,
			groupPricingTiers: tour.groupPricingTiers || { tiers: [] },
			groupDiscounts: tour.groupDiscounts || undefined,
			optionalAddons: tour.optionalAddons || { addons: [] },
			guidePaysStripeFee: tour.guidePaysStripeFee ?? false,
			countInfantsTowardCapacity: tour.countInfantsTowardCapacity ?? false,
			publicListing: tour.publicListing ?? true
		};

		// Initialize existing images
		// Only reset if we don't have images marked for removal
		if (imagesToRemove.length === 0) {
			existingImages = tour.images || [];
		} else {
			// Keep the current state if we have pending removals
			console.log('🖼️ Keeping current image state due to pending removals:', imagesToRemove);
		}
	}

	function handleCancel() {
		showCancelModal = true;
	}

	function confirmCancel() {
		goto(`/tours/${tourId}`);
	}

	async function performSave() {
		// Validate form before submission
		const formValidation = validateForm();
		if (formValidation.length > 0) {
			error = formValidation[0];
			scrollToFirstError();
			return;
		}
		
		try {
			isSubmitting = true;
			error = null;
			
			// Create form data
			const formDataToSubmit = new FormData();
			
			// Add all form fields
			Object.entries(formData).forEach(([key, value]) => {
				if (key === 'includedItems' || key === 'requirements') {
					(value as string[]).forEach(item => {
						if (item.trim()) {
							formDataToSubmit.append(key, item.trim());
						}
					});
				} else if (key === 'categories' || key === 'languages') {
					// JSON.stringify arrays for categories and languages
					formDataToSubmit.append(key, JSON.stringify(value));
				} else if (key === 'pricingTiers') {
					if (formData.enablePricingTiers && value) {
						formDataToSubmit.append('pricingTiers.adult', String((value as any).adult));
						formDataToSubmit.append('pricingTiers.child', String((value as any).child));
					}
				} else if (key === 'participantCategories' || key === 'privateTour' || key === 'groupDiscounts' || key === 'optionalAddons') {
					// JSON.stringify objects for new pricing features
					formDataToSubmit.append(key, JSON.stringify(value));
				} else if (key === 'guidePaysStripeFee' || key === 'countInfantsTowardCapacity') {
					// Boolean fields
					formDataToSubmit.append(key, value ? 'true' : 'false');
				} else {
					formDataToSubmit.append(key, String(value));
				}
			});
			
			// Add enablePricingTiers separately
			formDataToSubmit.append('enablePricingTiers', formData.enablePricingTiers ? 'true' : 'false');
			
			// Add capacity fields from participantCategories or privateTour or defaults
			const minCap = (formData.participantCategories?.minCapacity) || ((formData.privateTour as any)?.minCapacity) || 1;
			const maxCap = (formData.participantCategories?.maxCapacity) || ((formData.privateTour as any)?.maxCapacity) || formData.capacity;
			formDataToSubmit.append('minCapacity', String(minCap));
			formDataToSubmit.append('maxCapacity', String(maxCap));
			
			// Add images to remove
			imagesToRemove.forEach(imageUrl => {
				formDataToSubmit.append('removeImages', imageUrl);
			});
			
			// Add new images
			uploadedImages.forEach(image => {
				formDataToSubmit.append('images', image);
			});
			
			// Use mutation instead of form submission
			const result = await $updateTourMutation.mutateAsync(formDataToSubmit);
			
			console.log('✅ Tour updated successfully via mutation:', result);
			
			// Track tour update event
			trackTourEvent('update', tourId, {
				tour_name: tour?.name,
				status: formData.status,
				pricing_model: formData.pricingModel
			});
			
			// Clear uploaded images and removed images since they're now saved
			uploadedImages = [];
			imagesToRemove = [];
			
			// Navigate to tour detail page
			if (result.redirected) {
				goto(`/tours/${tourId}`);
			} else {
				goto(`/tours/${tourId}?edited=true`);
			}
			
		} catch (err) {
			console.error('❌ Tour update failed:', err);
			error = err instanceof Error ? err.message : 'Failed to save changes. Please try again.';
			scrollToFirstError();
		} finally {
			isSubmitting = false;
		}
	}

	async function handleSave() {
		if (isSubmitting) return;
		await performSave();
	}

	async function handleSaveAsDraft() {
		if (isSubmitting) return;
		// Set status to draft before saving
		formData.status = 'draft';
		await performSave();
	}

	async function handlePublish() {
		if (isSubmitting) return;
		// Set status to active before saving
		formData.status = 'active';
		await performSave();
	}

	function getTourStatusInfo() {
		if (!tour) return { color: 'var(--bg-secondary)', textColor: 'var(--text-secondary)', label: 'Unknown' };
		
		switch (tour.status) {
			case 'active':
				return { color: 'var(--color-success-light)', textColor: 'var(--color-success-700)', label: 'Active' };
			case 'draft':
				return { color: 'var(--color-warning-light)', textColor: 'var(--color-warning-700)', label: 'Draft' };
			default:
				return { color: 'var(--bg-secondary)', textColor: 'var(--text-secondary)', label: 'Unknown' };
		}
	}

	function validateForm(): string[] {
		const errors: string[] = [];
		
		// Required field validation
		if (!formData.name || formData.name.trim().length === 0) {
			errors.push('Tour name is required');
		}
		
		if (!formData.description || formData.description.trim().length === 0) {
			errors.push('Tour description is required');
		}
		
		// Price validation
		if (formData.price < 0) {
			errors.push('Price cannot be negative');
		}
		
		// Only check minimum price for paid tours
		if (formData.price > 0 && formData.price < 0.5) {
			errors.push('Minimum price for paid tours is €0.50');
		}
		
		// Duration validation
		if (formData.duration <= 0) {
			errors.push('Duration must be greater than 0 minutes');
		}
		

		
		// Pricing tiers validation (if enabled)
		if (formData.enablePricingTiers) {
			if (formData.pricingTiers.adult === undefined || formData.pricingTiers.adult === null) {
				errors.push('Adult price is required');
			} else if (formData.pricingTiers.adult < 0) {
				errors.push('Adult price cannot be negative');
			} else if (formData.pricingTiers.adult > 0 && formData.pricingTiers.adult < 0.5) {
				errors.push('Minimum price for paid tours is €0.50');
			}
			
			if (formData.pricingTiers.child < 0) {
				errors.push('Child price cannot be negative');
			}
		}
		
		return errors;
	}

	function scrollToFirstError() {
		// First check for specific field errors based on current error message
		if (error?.includes('name')) {
			const nameInput = document.querySelector('input[name="name"], #name') as HTMLElement;
			if (nameInput) {
				nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
				setTimeout(() => nameInput.focus(), 300);
				return;
			}
		}
		
		if (error?.includes('description')) {
			const descInput = document.querySelector('textarea[name="description"], #description') as HTMLElement;
			if (descInput) {
				descInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
				setTimeout(() => descInput.focus(), 300);
				return;
			}
		}
		
		if (error?.includes('price') || error?.includes('Price')) {
			const priceInput = document.querySelector('input[name="price"], #price') as HTMLElement;
			if (priceInput) {
				priceInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
				setTimeout(() => priceInput.focus(), 300);
				return;
			}
		}
		
		if (error?.includes('capacity') || error?.includes('Capacity')) {
			const capacityInput = document.querySelector('input[name="capacity"], #capacity') as HTMLElement;
			if (capacityInput) {
				capacityInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
				setTimeout(() => capacityInput.focus(), 300);
				return;
			}
		}

		// Fallback: try to find any visible error message
		const errorElement = document.querySelector('.error-message, [data-error="true"]');
		if (errorElement) {
			errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
			
			// Try to focus the associated input
			const input = errorElement.closest('.form-group')?.querySelector('input, textarea, select') as HTMLElement;
			if (input) {
				setTimeout(() => input.focus(), 300);
			}
			return;
		}

		// If no error element found, scroll to the general error banner
		const errorBanner = document.querySelector('[style*="--color-danger"]');
		if (errorBanner) {
			errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	function hasUnsavedChanges(): boolean {
		if (!tour) return false;
		
		// Check if form data differs from original tour data
		return (
			formData.name !== tour.name ||
			formData.description !== tour.description ||
			formData.price !== tour.price ||
			formData.duration !== tour.duration ||
			formData.capacity !== tour.capacity ||
			formData.status !== tour.status ||
			JSON.stringify(formData.categories) !== JSON.stringify(tour.categories || []) ||
			formData.location !== tour.location ||
			formData.cancellationPolicy !== tour.cancellationPolicy ||
			formData.enablePricingTiers !== tour.enablePricingTiers ||
			JSON.stringify(formData.includedItems) !== JSON.stringify(tour.includedItems || ['']) ||
			JSON.stringify(formData.requirements) !== JSON.stringify(tour.requirements || ['']) ||
			uploadedImages.length > 0 ||
			imagesToRemove.length > 0
		);
	}



	// Delete tour functionality
	function handleDeleteTour() {
		// Safety check - prevent deletion if data isn't loaded or tour has future bookings
		if (isLoading || !tour) {
			console.log('🚫 Delete blocked - data not ready:', { isLoading, tour: !!tour });
			return;
		}
		
		if (hasFutureBookings) {
			console.log('🚫 Delete blocked - tour has future bookings:', hasFutureBookings);
			// This shouldn't happen with the UI logic, but safety first
			error = 'Cannot delete tour with upcoming bookings. Cancel all future bookings first.';
			return;
		}
		
		console.log('✅ Delete allowed - proceeding with confirmation modal');
		// Clear any previous errors
		error = '';
		showDeleteModal = true;
	}

	async function confirmDeleteTour() {
		if (isDeleting) return;
		
		// Double-check before deletion - safety first
		if (hasFutureBookings) {
			console.log('🚫 Confirm delete blocked - tour has future bookings');
			error = 'Cannot delete tour with upcoming bookings. Please refresh the page and try again.';
			showDeleteModal = false;
			return;
		}
		
		isDeleting = true;
		// Clear any previous errors
		error = '';
		
		try {
			const response = await fetch(`/api/tours/${tourId}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' }
			});
			
			if (response.ok) {
				// Just invalidate queries - tours page will refetch when mounted
				queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });
				queryClient.invalidateQueries({ queryKey: queryKeys.userTours });
				queryClient.invalidateQueries({ queryKey: queryKeys.tourDetails(tourId) });
				
				// Navigate back to tours list
				goto('/tours?deleted=true');
			} else {
				let errorData: any = {};
				
				try {
					// Parse the error response as JSON
					errorData = await response.json();
				} catch (e) {
					// If JSON parsing fails, try text
					const errorText = await response.text();
					
					try {
						// Try to extract JSON from error message
						const messageMatch = errorText.match(/\{.*\}/);
						if (messageMatch) {
							errorData = JSON.parse(messageMatch[0]);
						} else {
							errorData = { error: errorText };
						}
					} catch (e2) {
						errorData = { error: errorText || 'Failed to delete tour' };
					}
				}
				
				// This shouldn't happen with the new UX, but keep as fallback
				if (errorData?.details?.activeBookings > 0) {
					// Show custom modal for tours with active bookings (fallback)
					error = '';
					deleteErrorData = {
						tourName: tour?.name || 'Unknown Tour',
						activeBookings: errorData.details.activeBookings,
						totalBookings: errorData.details.totalBookings,
						revenue: errorData.details.revenue || 0
					};
					showDeleteErrorModal = true;
				} else {
					// Generic error - show in error banner
					error = errorData?.error || errorData?.message || 'Failed to delete tour';
				}
			}
		} catch (err) {
			console.error('Error deleting tour:', err);
			error = err instanceof Error ? err.message : 'Failed to delete tour. Please try again.';
		} finally {
			isDeleting = false;
			showDeleteModal = false;
		}
	}

	function cancelDeleteTour() {
		showDeleteModal = false;
	}
	
	function handleDeleteErrorViewBookings() {
		showDeleteErrorModal = false;
		if (tour) {
			// Navigate to tour bookings page
								goto(`/bookings?tour=${tour.id}`);
		}
		deleteErrorData = null;
	}
	
	function handleDeleteErrorClose() {
		showDeleteErrorModal = false;
		deleteErrorData = null;
	}
</script>

<svelte:head>
	<title>Edit {tour?.name || 'Tour'} - Zaur</title>
</svelte:head>

<div class="tours-page-container px-0 sm:px-6 lg:px-8 py-2 sm:py-6 lg:py-8">
	{#if isLoading}
		<!-- Mobile Loading Header -->
		<div class="mb-3 sm:mb-8 px-4 sm:px-0">
			<div class="sm:hidden">
				<div class="py-1.5 px-4 rounded-lg inline-block" style="background: var(--color-primary-50);">
					<h1 class="text-base font-bold" style="color: var(--color-primary-700);">Edit Tour</h1>
				</div>
			</div>
			
			<!-- Desktop Loading Header -->
			<div class="hidden sm:block">
				<PageHeader 
					title="Edit Tour"
					subtitle="Loading tour details..."
				/>
			</div>
		</div>
		
		<div class="rounded-xl p-8 mx-4 sm:mx-0" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="flex flex-col items-center justify-center py-12">
				<div class="form-spinner mb-4"></div>
				<p class="text-center" style="color: var(--text-secondary);">Loading tour details...</p>
			</div>
		</div>
	{:else}
		<!-- Mobile-First Header -->
		<div class="mb-3 sm:mb-8 px-4 sm:px-0">
			<!-- Mobile Compact Header with inline title -->
			<div class="sm:hidden mb-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="py-1.5 px-4 rounded-lg" style="background: var(--color-primary-50);">
							<h1 class="text-base font-bold" style="color: var(--color-primary-700);">Edit Tour</h1>
						</div>
						<span class="text-xs px-2 py-1 rounded-md font-medium" style="background: {getTourStatusInfo().color}; color: {getTourStatusInfo().textColor};">
							{getTourStatusInfo().label}
						</span>
					</div>
					<button
						onclick={() => goto(`/tours/${tourId}`)}
						class="flex items-center gap-2 text-sm font-medium transition-all duration-200 py-1.5 px-3 rounded-lg active:scale-95"
						style="color: var(--color-primary-600); background: var(--color-primary-50);"
					>
						Back
						<ArrowLeft class="h-4 w-4" />
					</button>
				</div>
			</div>

			<!-- Desktop Header -->
			<div class="hidden sm:block">
				<PageHeader 
					title="Edit Tour"
					subtitle="Update your tour details and settings"
					breadcrumbs={[
						{ label: 'Tours', href: '/tours' },
						{ label: tour?.name || 'Tour', href: `/tours/${tourId}` },
						{ label: 'Edit' }
					]}
				>
					<div class="hidden sm:flex gap-3">
						<button onclick={handleCancel} class="button-secondary button-gap">
							<X class="h-4 w-4" />
							Cancel
						</button>
						<button onclick={handleSave} class="button-primary button-gap">
							<Save class="h-4 w-4" />
							Save Changes
						</button>
					</div>
				</PageHeader>
			</div>
		</div>

		{#if error}
			<div class="mb-6 rounded-xl p-4 mx-4 sm:mx-0" style="background: var(--color-danger-light); border: 1px solid var(--color-danger-200);">
				<div class="flex gap-3">
					<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-danger-600);" />
					<div>
						<p class="font-medium" style="color: var(--color-danger-900);">Error</p>
						<p class="text-sm mt-1" style="color: var(--color-danger-700);">{error}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Image Upload Errors -->
		{#if imageUploadErrors.length > 0}
			<div class="alert-error mb-6 rounded-xl p-4 mx-4 sm:mx-0">
				<div class="flex gap-3">
					<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" />
					<div class="flex-1">
						<p class="font-medium">Image Upload Issues</p>
						<ul class="text-sm mt-2 space-y-1">
							{#each imageUploadErrors as error}
								<li>• {error}</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
		{/if}

		{#if !tour}
			<div class="mb-6 rounded-xl p-4 mx-4 sm:mx-0" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
				<div class="flex items-center justify-between">
					<div>
						<p class="font-medium" style="color: var(--color-danger-900);">Tour not found</p>
						<p class="text-sm mt-1" style="color: var(--color-danger-700);">The tour you're looking for doesn't exist or you don't have permission to edit it.</p>
					</div>
					<button onclick={() => goto('/tours')} class="button-secondary button-small">
						Back to Tours
					</button>
				</div>
			</div>
		{:else}
			<TourForm
				bind:formData
				bind:uploadedImages
				{isSubmitting}
				isEdit={true}
				onCancel={handleCancel}
				onSaveAsDraft={handleSaveAsDraft}
				onPublish={handlePublish}
				onImageUpload={handleImageUpload}
				onImageRemove={removeImage}
				{existingImages}
				onExistingImageRemove={removeExistingImage}
				{imageUploadErrors}
				serverErrors={[]}
				{triggerValidation}
				getExistingImageUrl={getExistingImageUrl}
				{profile}
				{hasConfirmedLocation}
				{paymentStatus}
				onDelete={handleDeleteTour}
				{hasFutureBookings}
				{isDeleting}
				{tourId}
			/>
		{/if}
	{/if}
</div>



<!-- Confirmation Modals -->
<ConfirmationModal
	bind:isOpen={showCancelModal}
	title="Discard changes?"
	message="Are you sure you want to discard your changes? Any unsaved modifications will be lost."
	confirmText="Yes, discard"
	cancelText="Keep editing"
	variant="warning"
	onConfirm={confirmCancel}
/>

	<ConfirmationModal
		bind:isOpen={showDeleteModal}
		title="Delete Tour: {tour?.name || 'Unknown Tour'}?"
		message="This will permanently delete this tour and all associated data, including historical bookings and analytics. This action cannot be undone."
		confirmText={isDeleting ? 'Deleting...' : 'Yes, Delete Tour'}
		cancelText="Cancel"
		variant="danger"
		onConfirm={confirmDeleteTour}
		onCancel={cancelDeleteTour}
	/>

<!-- Delete Error Modal - Tours with Active Bookings -->
{#if deleteErrorData}
	<ConfirmationModal
		bind:isOpen={showDeleteErrorModal}
		title="Cannot Delete Tour"
		message={`Cannot delete "${deleteErrorData.tourName}" because it has ${deleteErrorData.activeBookings} upcoming booking${deleteErrorData.activeBookings !== 1 ? 's' : ''}.\n\nUpcoming bookings: ${deleteErrorData.activeBookings}\nTotal bookings: ${deleteErrorData.totalBookings}${deleteErrorData.revenue > 0 ? `\nRevenue at risk: ${$globalCurrencyFormatter(deleteErrorData.revenue)}` : ''}\n\nYou must cancel or refund all upcoming bookings before deleting this tour.`}
		variant="warning"
		icon={AlertCircle}
		confirmText="View Bookings"
		cancelText="Close"
		onConfirm={handleDeleteErrorViewBookings}
		onCancel={handleDeleteErrorClose}
	/>
{/if}

<style>
	.tours-page-container {
		width: 100%;
	}
</style> 