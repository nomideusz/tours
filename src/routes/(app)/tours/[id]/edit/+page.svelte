<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	import TourForm from '$lib/components/TourForm.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';

	import type { Tour } from '$lib/types.js';
	import type { PageData, ActionData } from './$types.js';
	import type { ValidationError } from '$lib/validation.js';
	import { validateTourForm } from '$lib/validation.js';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { invalidatePublicTourData } from '$lib/queries/public-queries.js';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Save from 'lucide-svelte/icons/save';
	import X from 'lucide-svelte/icons/x';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Eye from 'lucide-svelte/icons/eye';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	
	// Onboarding utilities
	import { canActivateTours } from '$lib/utils/onboarding.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	// Get profile from layout data
	let profile = $derived(data.user);
	
	const queryClient = useQueryClient();
	let tourId = $derived(data.tourId);
	
	// TanStack Query for tour details
	let tourQuery = $derived(createQuery({
		queryKey: queryKeys.tourDetails(tourId),
		queryFn: () => queryFunctions.fetchTourDetails(tourId),
		staleTime: 0, // Always consider data potentially stale for immediate updates
		gcTime: 5 * 60 * 1000,    // 5 minutes
		refetchOnWindowFocus: true,
		refetchOnMount: true,
	}));

	let tour = $derived($tourQuery.data?.tour || null);
	let isLoading = $derived($tourQuery.isLoading);
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
	let capacityError = $state((form as any)?.capacityError || null);
	let triggerValidation = $state(false);
	let showCancelModal = $state(false);
	let showDeleteModal = $state(false);
	let isDeleting = $state(false);

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

	// Form data
	let formData = $state({
		name: '',
		description: '',
		price: 0,
		duration: 60,
		capacity: 10,
		status: 'draft' as Tour['status'],
		category: '',
		location: '',
		includedItems: [''],
		requirements: [''],
		cancellationPolicy: '',
		enablePricingTiers: false,
		pricingTiers: {
			adult: 0,
			child: 0
		}
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
			category: tour.category || '',
			location: tour.location || '',
			includedItems: tour.includedItems && tour.includedItems.length > 0 ? tour.includedItems : [''],
			requirements: tour.requirements && tour.requirements.length > 0 ? tour.requirements : [''],
			cancellationPolicy: tour.cancellationPolicy || '',
			enablePricingTiers: tour.enablePricingTiers || false,
			pricingTiers: tour.pricingTiers || {
				adult: parseFloat(tour.price) || 0,
				child: 0
			}
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

	function handleSave() {
		if (isSubmitting) return;
		
		// Trigger form submission
		const form = document.querySelector('form');
		if (form) {
			form.requestSubmit();
		}
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
		if (formData.price <= 0) {
			errors.push('Price must be greater than €0');
		}
		
		if (formData.price < 0.5) {
			errors.push('Price must be at least €0.50');
		}
		
		// Duration validation
		if (formData.duration <= 0) {
			errors.push('Duration must be greater than 0 minutes');
		}
		
		// Capacity validation
		if (formData.capacity <= 0) {
			errors.push('Capacity must be at least 1 person');
		}
		
		// Check booking constraints
		if (bookingConstraints?.minimumCapacity && formData.capacity < bookingConstraints.minimumCapacity) {
			errors.push(`Capacity must be at least ${bookingConstraints.minimumCapacity} due to existing bookings`);
		}
		
		// Pricing tiers validation (if enabled)
		if (formData.enablePricingTiers) {
			if (!formData.pricingTiers.adult || formData.pricingTiers.adult < 0.5) {
				errors.push('Adult price must be at least €0.50');
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
			formData.category !== tour.category ||
			formData.location !== tour.location ||
			formData.cancellationPolicy !== tour.cancellationPolicy ||
			formData.enablePricingTiers !== tour.enablePricingTiers ||
			JSON.stringify(formData.includedItems) !== JSON.stringify(tour.includedItems || ['']) ||
			JSON.stringify(formData.requirements) !== JSON.stringify(tour.requirements || ['']) ||
			uploadedImages.length > 0 ||
			imagesToRemove.length > 0
		);
	}

	async function autoSaveChanges(): Promise<boolean> {
		if (isSubmitting) return false;
		
		try {
			isSubmitting = true;
			
			// Create form data
			const formDataToSubmit = new FormData();
			
			// Add all form fields
			Object.entries(formData).forEach(([key, value]) => {
				if (key === 'includedItems' || key === 'requirements') {
					(value as string[]).forEach((item, index) => {
						if (item.trim()) {
							formDataToSubmit.append(`${key}[${index}]`, item.trim());
						}
					});
				} else if (key === 'pricingTiers') {
					formDataToSubmit.append('pricingTiers', JSON.stringify(value));
				} else {
					formDataToSubmit.append(key, String(value));
				}
			});
			
			// Add images to remove
			imagesToRemove.forEach(imageUrl => {
				formDataToSubmit.append('removeImages', imageUrl);
			});
			
			// Add new images
			console.log('📱 AutoSave: Adding images to FormData:', uploadedImages.length);
			uploadedImages.forEach((image, index) => {
				console.log(`📱 AutoSave: Image ${index}:`, image.name, image.size);
				formDataToSubmit.append('images', image);
			});
			
			// Submit to server
			const response = await fetch(`/tours/${tourId}/edit`, {
				method: 'POST',
				body: formDataToSubmit
			});
			
			if (response.ok) {
				// Invalidate queries to refetch when needed
				queryClient.invalidateQueries({ queryKey: queryKeys.tourDetails(tourId) });
				queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });
				queryClient.invalidateQueries({ queryKey: queryKeys.userTours });
				
				// Clear uploaded images and removed images since they're now saved
				uploadedImages = [];
				imagesToRemove = [];
				
				return true;
			} else {
				const errorData = await response.json().catch(() => ({}));
				
				// Set specific error message based on response
				if (response.status === 400) {
					error = errorData.error || 'Please check your form for errors and try again.';
				} else if (response.status === 413) {
					error = 'Files are too large. Please use smaller images.';
				} else {
					error = errorData.error || 'Failed to save changes. Please try again.';
				}
				
				return false;
			}
		} catch (err) {
			console.error('Auto-save failed:', err);
			error = 'Failed to save changes. Please try again.';
			return false;
		} finally {
			isSubmitting = false;
		}
	}

	// Delete tour functionality
	function handleDeleteTour() {
		showDeleteModal = true;
	}

	async function confirmDeleteTour() {
		if (isDeleting) return;
		
		isDeleting = true;
		
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
				const errorData = await response.json().catch(() => ({}));
				
				// Check if it's a structured error with details
				if (response.status === 400 && errorData.details) {
					const details = errorData.details;
					let message = errorData.error || 'Cannot delete tour';
					
					if (details.activeBookings > 0) {
						message = `Cannot delete tour with ${details.activeBookings} active booking${details.activeBookings !== 1 ? 's' : ''}.\n\n`;
						message += `• Total bookings: ${details.totalBookings}\n`;
						message += `• Active bookings: ${details.activeBookings}\n`;
						if (details.revenue > 0) {
							message += `• Revenue: €${details.revenue.toFixed(2)}\n`;
						}
						message += `\nPlease cancel all active bookings before deleting this tour.`;
					}
					
					alert(message);
				} else {
					throw new Error(errorData.error || errorData.message || 'Failed to delete tour');
				}
			}
		} catch (error) {
			console.error('Error deleting tour:', error);
			alert(error instanceof Error ? error.message : 'Failed to delete tour. Please try again.');
		} finally {
			isDeleting = false;
			showDeleteModal = false;
		}
	}

	function cancelDeleteTour() {
		showDeleteModal = false;
	}
</script>

<svelte:head>
	<title>Edit {tour?.name || 'Tour'} - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	{#if isLoading}
		<!-- Mobile Loading Header -->
		<div class="mb-6 sm:mb-8">
			<MobilePageHeader
				title="Edit Tour"
				secondaryInfo="Loading..."
				quickActions={[]}
				infoItems={[]}
			/>
			
			<!-- Desktop Loading Header -->
			<div class="hidden sm:block">
				<PageHeader 
					title="Edit Tour"
					subtitle="Loading tour details..."
				/>
			</div>
		</div>
		
		<div class="rounded-xl p-8" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="flex flex-col items-center justify-center py-12">
				<div class="form-spinner mb-4"></div>
				<p class="text-center" style="color: var(--text-secondary);">Loading tour details...</p>
			</div>
		</div>
	{:else}
		<!-- Mobile-First Header -->
		<div class="mb-6 sm:mb-8">
			<!-- Mobile Compact Header -->
			<MobilePageHeader
				title="Edit {tour?.name || 'Tour'}"
				secondaryInfo="{getTourStatusInfo().label} • €{tour?.price || 0}"
				quickActions={[
					{
						label: 'Save',
						icon: Save,
						onclick: handleSave,
						variant: 'primary'
					},
					{
						label: 'Cancel',
						icon: X,
						onclick: handleCancel,
						variant: 'secondary'
					},
					...(tour?.status === 'active' ? [{
						label: 'Preview',
						icon: ExternalLink,
						onclick: () => window.open(`/book/${tour?.qrCode}`, '_blank'),
						variant: 'secondary' as const,
						size: 'icon' as const
					}] : [])
				]}
				infoItems={[
					{
						icon: Clock,
						label: 'Duration',
						value: `${tour?.duration || 0}min`
					},
					{
						icon: Users,
						label: 'Capacity',
						value: `${tour?.capacity || 0} max`
					},
					{
						icon: Eye,
						label: 'Status',
						value: tour?.status === 'active' ? '🟢 Live' : '🟡 Draft'
					}
				]}
			/>

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
						<button onclick={handleCancel} class="button-secondary button--gap">
							<X class="h-4 w-4" />
							Cancel
						</button>
						<button onclick={handleSave} class="button-primary button--gap">
							<Save class="h-4 w-4" />
							Save Changes
						</button>
					</div>
				</PageHeader>
			</div>
		</div>

		{#if error}
			<div class="mb-6 rounded-xl p-4" style="background: var(--color-danger-light); border: 1px solid var(--color-danger-200);">
				<div class="flex gap-3">
					<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-danger-600);" />
					<div>
						<p class="font-medium" style="color: var(--color-danger-900);">Error</p>
						<p class="text-sm mt-1" style="color: var(--color-danger-700);">{error}</p>
						{#if capacityError}
							<p class="text-sm mt-2" style="color: var(--color-danger-700);">
								<strong>Capacity Issue:</strong> You tried to set capacity to {capacityError.attempted}, 
								but you need at least {capacityError.minimum} spots due to existing bookings.
							</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Capacity Warning (if bookings exist) -->
		{#if bookingConstraints?.maxBookedSpots > 0}
			<div class="mb-6 rounded-xl p-4" style="background: var(--color-warning-light); border: 1px solid var(--color-warning-200);">
				<div class="flex gap-3">
					<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-warning-600);" />
					<div>
						<p class="font-medium" style="color: var(--color-warning-900);">Capacity Constraints</p>
						<p class="text-sm mt-1" style="color: var(--color-warning-700);">
							You have <strong>{bookingConstraints.maxBookedSpots} people booked</strong> in your busiest time slot.
							You can only reduce capacity to <strong>{bookingConstraints.maxBookedSpots} or higher</strong>.
						</p>
						{#if !bookingConstraints.canReduceCapacity}
							<p class="text-sm mt-1" style="color: var(--color-warning-700);">
								<em>Your tour is at maximum booking capacity. You can increase capacity but cannot reduce it.</em>
							</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Booking Constraints Warning -->
		{#if capacityError}
			<div class="mt-6 rounded-xl p-4" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
				<div class="flex items-start gap-3">
					<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-danger-600);" />
					<div class="flex-1">
						<h3 class="font-medium" style="color: var(--color-danger-900);">Capacity Reduction Blocked</h3>
						<p class="text-sm mt-1" style="color: var(--color-danger-700);">
							{capacityError}
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Tour Form -->
		<div class="mt-6">
			{#if isLoading}
				<div class="p-8 text-center">
					<div class="w-8 h-8 mx-auto mb-2 rounded-full animate-spin" style="border: 2px solid var(--border-secondary); border-top-color: var(--color-primary-600);"></div>
					<p class="text-sm" style="color: var(--text-secondary);">Loading tour details...</p>
				</div>
			{:else if !tour}
				<div class="mb-6 rounded-xl p-4" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
					<div class="flex items-center justify-between">
						<div>
							<p class="font-medium" style="color: var(--color-danger-900);">Tour not found</p>
							<p class="text-sm mt-1" style="color: var(--color-danger-700);">The tour you're looking for doesn't exist or you don't have permission to edit it.</p>
						</div>
						<button onclick={() => goto('/tours')} class="button-secondary button--small">
							Back to Tours
						</button>
					</div>
				</div>
			{:else}
				<form method="POST" enctype="multipart/form-data" use:enhance={({ formData, cancel }) => {
					if (isSubmitting) {
						cancel();
						return;
					}
					
					isSubmitting = true;
					
					// Add images to remove
					console.log('📤 Images to remove before submission:', imagesToRemove);
					imagesToRemove.forEach(imageUrl => {
						console.log('📤 Adding to FormData for removal:', imageUrl);
						formData.append('removeImages', imageUrl);
					});
					
					// Add new images
					console.log('📱 Submitting form with uploaded images:', uploadedImages.length);
					uploadedImages.forEach((image, index) => {
						console.log(`📱 Adding image ${index}:`, image.name, image.size, image.type);
						formData.append('images', image);
					});
					
					// Debug: Log all FormData entries
					console.log('📱 FormData entries:');
					for (const [key, value] of formData.entries()) {
						if (key === 'images') {
							console.log(`  - ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
						}
					}
					
					return async ({ result, update }) => {
						if (result.type === 'success') {
							// Invalidate all related queries and wait for them to complete
							await Promise.all([
								queryClient.invalidateQueries({ queryKey: queryKeys.tourDetails(tourId) }),
								queryClient.invalidateQueries({ queryKey: queryKeys.tourBookingConstraints(tourId) }),
								queryClient.invalidateQueries({ queryKey: queryKeys.toursStats }),
								queryClient.invalidateQueries({ queryKey: queryKeys.userTours }),
								invalidatePublicTourData(queryClient, tour?.qrCode)
							]);
							
							// Clear uploaded images and removed images since they're now saved
							uploadedImages = [];
							imagesToRemove = [];
							
							// Navigate to tour detail page
							goto(`/tours/${tourId}`);
						}
						
						await update({ reset: false });
						isSubmitting = false;
					};
				}}>
					<TourForm
						bind:formData
						bind:uploadedImages
						{isSubmitting}
						submitButtonText="Save Changes"
						isEdit={true}
						onCancel={handleCancel}
						onImageUpload={handleImageUpload}
						onImageRemove={removeImage}
						{existingImages}
						onExistingImageRemove={removeExistingImage}
						{imageUploadErrors}
						serverErrors={[]}
						{triggerValidation}
						{bookingConstraints}
						getExistingImageUrl={getExistingImageUrl}
						{profile}
						{hasConfirmedLocation}
						{paymentStatus}
					/>
				</form>
			{/if}
		</div>

		<!-- Danger Zone -->
		<div class="mt-8 rounded-xl" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
			<div class="p-4 border-b" style="border-color: var(--color-danger-200);">
				<h3 class="font-semibold" style="color: var(--color-danger-900);">Danger Zone</h3>
			</div>
			<div class="p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="font-medium" style="color: var(--color-danger-900);">Delete this tour</p>
						<p class="text-sm mt-1" style="color: var(--color-danger-700);">
							This action cannot be undone. All bookings and data will be permanently deleted.
						</p>
					</div>
					<button type="button" onclick={handleDeleteTour} class="button-danger button--small" disabled={isDeleting}>
						{#if isDeleting}
							<div class="w-4 h-4 rounded-full animate-spin mr-2" style="border: 2px solid currentColor; border-top-color: transparent;"></div>
						{/if}
						Delete Tour
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Floating Save Button -->
{#if formData.name?.trim() !== '' || uploadedImages.length > 0}
	<button
		onclick={handleSave}
		disabled={isSubmitting}
		class="floating-save-btn"
		style="position: fixed; bottom: 2rem; right: 2rem; z-index: var(--z-dropdown);"
		title={isSubmitting ? 'Saving Changes...' : 'Save Changes'}
	>
		{#if isSubmitting}
			<div class="w-5 h-5 rounded-full animate-spin" style="border: 2px solid currentColor; border-top-color: transparent;"></div>
		{:else}
			<Save class="w-5 h-5" />
		{/if}
	</button>
{/if}

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
	message="This will permanently delete this tour and ALL associated data. This action cannot be undone."
	confirmText={isDeleting ? 'Deleting...' : 'Yes, Delete Tour'}
	cancelText="Cancel"
	variant="danger"
	onConfirm={confirmDeleteTour}
	onCancel={cancelDeleteTour}
/> 