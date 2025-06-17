<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
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
	import Calendar from 'lucide-svelte/icons/calendar';
	import Plus from 'lucide-svelte/icons/plus';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { formatDate, formatTime } from '$lib/utils/date-helpers.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	const queryClient = useQueryClient();
	let tourId = $derived(data.tourId);
	
	// TanStack Query for tour details
	let tourQuery = $derived(createQuery({
		queryKey: queryKeys.tourDetails(tourId),
		queryFn: () => queryFunctions.fetchTourDetails(tourId),
		staleTime: 1 * 60 * 1000, // 1 minute
		gcTime: 5 * 60 * 1000,    // 5 minutes
	}));

	// TanStack Query for schedule data
	let scheduleQuery = $derived(createQuery({
		queryKey: queryKeys.tourSchedule(tourId),
		queryFn: () => queryFunctions.fetchTourSchedule(tourId),
		staleTime: 30 * 1000, // 30 seconds - shorter for real-time updates
		gcTime: 2 * 60 * 1000, // 2 minutes
		refetchOnWindowFocus: true,
	}));

	let tour = $derived($tourQuery.data?.tour || null);
	let isLoading = $derived($tourQuery.isLoading);
	let isSubmitting = $state(false);

	// Schedule data
	let scheduleData = $derived($scheduleQuery.data || null);
	let scheduleStats = $derived(scheduleData?.scheduleStats || {});
	let timeSlots = $derived(scheduleData?.timeSlots || []);
	let upcomingSlots = $derived(timeSlots.filter((slot: any) => slot.isUpcoming).slice(0, 3));
	let slotsWithBookings = $derived(timeSlots.filter((slot: any) => slot.isUpcoming && slot.totalBookings > 0).length);
	let isScheduleLoading = $derived($scheduleQuery.isLoading);
	let error = $state<string | null>(form?.error || null);
	let validationErrors = $state<ValidationError[]>((form as any)?.validationErrors || []);
	let capacityError = $state((form as any)?.capacityError || null);
	let triggerValidation = $state(false);
	let showCancelModal = $state(false);
	let showDeleteModal = $state(false);
	let isDeleting = $state(false);

	// Booking constraints - fetch separately
	let bookingConstraints = $state<any>(null);
	let constraintsLoading = $state(false);

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
	const MAX_IMAGES = 5; // Reduced from 10 to 5 for better performance
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
		
		if (!target.files || target.files.length === 0) {
			console.log('❌ No files selected');
			return;
		}

		const newFiles = Array.from(target.files);
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
		uploadedImages = [...uploadedImages, ...finalFiles];
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
		uploadedImages = uploadedImages.filter((_, i) => i !== index);
	}

	function removeExistingImage(imageName: string) {
		imagesToRemove = [...imagesToRemove, imageName];
		existingImages = existingImages.filter(img => img !== imageName);
	}

	function getExistingImageUrl(imageName: string): string {
		// Use shared utility for consistency
		return `/api/images/${tourId}/${imageName}?size=medium`;
	}

	// Initialize form when tour data loads
	$effect(() => {
		if (tour && !isLoading) {
			initializeTour();
		}
	});

	// Fetch booking constraints when tour loads
	$effect(() => {
		if (tour && !constraintsLoading) {
			fetchBookingConstraints();
		}
	});

	async function fetchBookingConstraints() {
		if (!tour) return;
		
		constraintsLoading = true;
		try {
			const response = await fetch(`/api/tours/${tourId}/booking-constraints`);
			if (response.ok) {
				bookingConstraints = await response.json();
			}
		} catch (err) {
			console.error('Failed to fetch booking constraints:', err);
		} finally {
			constraintsLoading = false;
		}
	}

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
		existingImages = tour.images || [];
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
		if (!tour) return { color: 'bg-gray-100 text-gray-700', label: 'Unknown' };
		
		switch (tour.status) {
			case 'active':
				return { color: 'bg-green-100 text-green-700', label: 'Active' };
			case 'draft':
				return { color: 'bg-yellow-100 text-yellow-700', label: 'Draft' };
			default:
				return { color: 'bg-gray-100 text-gray-700', label: 'Unknown' };
		}
	}

	// Schedule helper functions
	function getNextSlotText(): string {
		if (!upcomingSlots.length) return 'No upcoming slots';
		
		const nextSlot = upcomingSlots[0];
		const slotDate = new Date(nextSlot.startTime);
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		
		let dateText = '';
		if (slotDate.toDateString() === today.toDateString()) {
			dateText = 'Today';
		} else if (slotDate.toDateString() === tomorrow.toDateString()) {
			dateText = 'Tomorrow';
		} else {
			dateText = formatDate(nextSlot.startTime);
		}
		
		return `${dateText} ${formatTime(nextSlot.startTime)}`;
	}

	function getThisWeekSlotsCount(): number {
		const now = new Date();
		const startOfWeek = new Date(now);
		startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
		startOfWeek.setHours(0, 0, 0, 0);
		
		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(startOfWeek.getDate() + 7);
		
		return timeSlots.filter((slot: any) => {
			const slotDate = new Date(slot.startTime);
			return slotDate >= startOfWeek && slotDate < endOfWeek && slot.isUpcoming;
		}).length;
	}

	function getOccupancyPercentage(slot: any): number {
		if (!slot.capacity || slot.capacity === 0) return 0;
		return Math.round((slot.totalParticipants / slot.capacity) * 100);
	}

	function getBookingStatusColor(bookingCount: number): string {
		if (bookingCount === 0) return 'bg-gray-100 text-gray-800';
		if (bookingCount <= 2) return 'bg-blue-100 text-blue-800';
		return 'bg-green-100 text-green-800';
	}

	// Quick action handlers
	async function handleAddSingleSlot() {
		// Check for validation errors first
		const validationErrors = validateForm();
		if (validationErrors.length > 0) {
			error = validationErrors[0]; // Show first error
			scrollToFirstError();
			return;
		}

		// Auto-save current changes first
		if (hasUnsavedChanges()) {
			const saved = await autoSaveChanges();
			if (!saved) {
				// Scroll to first error and focus it
				scrollToFirstError();
				return;
			}
		}
		
		// Navigate to add slot page
		goto(`/tours/${tourId}/schedule?new=true`);
	}

	async function handleExtendPattern() {
		// Check for validation errors first
		const validationErrors = validateForm();
		if (validationErrors.length > 0) {
			error = validationErrors[0]; // Show first error
			scrollToFirstError();
			return;
		}

		// Auto-save current changes first
		if (hasUnsavedChanges()) {
			const saved = await autoSaveChanges();
			if (!saved) {
				// Scroll to first error and focus it
				scrollToFirstError();
				return;
			}
		}
		
		// Navigate to schedule page with extend pattern mode
		goto(`/tours/${tourId}/schedule?action=extend`);
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
		const errorElement = document.querySelector('.error-message, [data-error="true"], .text-red-600, .text-red-700, .text-red-800');
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
		const errorBanner = document.querySelector('[style*="color-danger"], [style*="rgb(254 226 226)"]');
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
				formDataToSubmit.append('imagesToRemove', imageUrl);
			});
			
			// Add new images
			uploadedImages.forEach(image => {
				formDataToSubmit.append('images', image);
			});
			
			// Submit to server
			const response = await fetch(`/tours/${tourId}/edit`, {
				method: 'POST',
				body: formDataToSubmit
			});
			
			if (response.ok) {
				// Invalidate queries to refresh data
				queryClient.invalidateQueries({
					queryKey: queryKeys.tourDetails(tourId)
				});
				queryClient.invalidateQueries({
					queryKey: queryKeys.toursStats
				});
				
				// Clear uploaded images since they're now saved
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
				// Invalidate all tour-related queries
				queryClient.invalidateQueries({
					queryKey: queryKeys.toursStats
				});
				
				// Navigate back to tours list
				goto('/tours?deleted=true');
			} else {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || 'Failed to delete tour');
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
						icon: Calendar,
						label: 'Slots',
						value: `${scheduleStats.upcomingSlots || 0} upcoming`
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
			<div class="mb-6 rounded-xl p-4" style="background: rgb(254 226 226); border: 1px solid rgb(252 165 165);">
				<div class="flex gap-3">
					<AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
					<div>
						<p class="font-medium text-red-800">Error</p>
						<p class="text-sm text-red-700 mt-1">{error}</p>
						{#if capacityError}
							<p class="text-sm text-red-700 mt-2">
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
			<div class="mb-6 rounded-xl p-4" style="background: rgb(254 243 199); border: 1px solid rgb(252 211 77);">
				<div class="flex gap-3">
					<AlertCircle class="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
					<div>
						<p class="font-medium text-amber-800">Capacity Constraints</p>
						<p class="text-sm text-amber-700 mt-1">
							You have <strong>{bookingConstraints.maxBookedSpots} people booked</strong> in your busiest time slot.
							You can only reduce capacity to <strong>{bookingConstraints.maxBookedSpots} or higher</strong>.
						</p>
						{#if !bookingConstraints.canReduceCapacity}
							<p class="text-sm text-amber-700 mt-1">
								<em>Your tour is at maximum booking capacity. You can increase capacity but cannot reduce it.</em>
							</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}



		<!-- Schedule Overview Section -->
		<div class="mt-6 rounded-xl" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
							<Calendar class="h-4 w-4 text-blue-600" />
						</div>
						<div>
							<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Schedule Overview</h3>
							<p class="text-sm" style="color: var(--text-secondary);">Quick schedule management and upcoming slots</p>
						</div>
					</div>
					<button onclick={() => goto(`/tours/${tourId}/schedule`)} class="button-primary button--gap">
						<Calendar class="h-4 w-4" />
						Manage Full Schedule
					</button>
				</div>
			</div>
			<div class="p-4">
				{#if isScheduleLoading}
					<div class="p-6 text-center">
						<div class="w-6 h-6 mx-auto mb-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
						<p class="text-sm" style="color: var(--text-secondary);">Loading schedule...</p>
					</div>
				{:else if $scheduleQuery.isError}
					<div class="p-6 text-center">
						<AlertCircle class="h-8 w-8 mx-auto mb-2" style="color: var(--color-danger-600);" />
						<p class="text-sm font-medium mb-1" style="color: var(--text-primary);">Failed to load schedule</p>
						<p class="text-xs mb-3" style="color: var(--text-secondary);">Unable to fetch schedule data</p>
						<button onclick={() => $scheduleQuery.refetch()} class="button-secondary button--small">
							Try Again
						</button>
					</div>
				{:else}
					<!-- Schedule Stats -->
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
						<div class="text-center p-3 rounded-lg" style="background: var(--bg-primary);">
							<p class="text-lg font-semibold text-blue-600">{scheduleStats.upcomingSlots || 0}</p>
							<p class="text-xs" style="color: var(--text-tertiary);">Upcoming slots</p>
						</div>
						<div class="text-center p-3 rounded-lg" style="background: var(--bg-primary);">
							<p class="text-lg font-semibold text-green-600">{slotsWithBookings}</p>
							<p class="text-xs" style="color: var(--text-tertiary);">With bookings</p>
						</div>
						<div class="text-center p-3 rounded-lg" style="background: var(--bg-primary);">
							<p class="text-lg font-semibold text-orange-600">{getThisWeekSlotsCount()}</p>
							<p class="text-xs" style="color: var(--text-tertiary);">This week</p>
						</div>
						<div class="text-center p-3 rounded-lg" style="background: var(--bg-primary);">
							<p class="text-sm font-semibold" style="color: var(--text-primary);">Next: {getNextSlotText()}</p>
							<p class="text-xs" style="color: var(--text-tertiary);">Next tour</p>
						</div>
					</div>

					<!-- Schedule Status -->
					{#if tour?.status === 'draft'}
						<div class="mb-6 p-3 rounded-lg" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
							<div class="flex items-center gap-2">
								<span class="text-sm">📝</span>
								<p class="text-sm font-medium" style="color: var(--color-warning-900);">
									Draft Mode - {scheduleStats.upcomingSlots > 0 ? `${scheduleStats.upcomingSlots} slots ready` : 'No slots yet'}
								</p>
							</div>
						</div>
					{:else if scheduleStats.upcomingSlots === 0}
						<div class="mb-6 p-3 rounded-lg" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
							<div class="flex items-center gap-2">
								<span class="text-sm">⚠️</span>
								<p class="text-sm font-medium" style="color: var(--color-warning-900);">
									Active but no time slots - Add slots to accept bookings
								</p>
							</div>
						</div>
					{:else}
						<div class="mb-6 p-3 rounded-lg" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
							<div class="flex items-center gap-2">
								<span class="text-sm">🟢</span>
								<p class="text-sm font-medium" style="color: var(--color-success-900);">
									Live - {scheduleStats.upcomingSlots} slot{scheduleStats.upcomingSlots === 1 ? '' : 's'} accepting bookings
								</p>
							</div>
						</div>
					{/if}

					<!-- Quick Actions -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
						<button 
							type="button" 
							onclick={handleAddSingleSlot} 
							disabled={isSubmitting}
							class="button-secondary button--gap justify-start"
							title={hasUnsavedChanges() ? 'Will save changes first, then add time slot' : 'Add a new time slot'}
						>
							{#if isSubmitting}
								<div class="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
								Saving changes...
							{:else}
								<Plus class="h-4 w-4" />
								Add Single Slot
								{#if hasUnsavedChanges()}
									<span class="text-xs opacity-75">(will save first)</span>
								{/if}
							{/if}
						</button>
						<button 
							type="button" 
							onclick={handleExtendPattern} 
							disabled={!upcomingSlots.length || isSubmitting}
							class="button-secondary button--gap justify-start"
							title={!upcomingSlots.length ? 'No existing pattern to extend' : hasUnsavedChanges() ? 'Will save changes first, then extend pattern' : 'Extend current scheduling pattern'}
						>
							{#if isSubmitting}
								<div class="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
								Saving changes...
							{:else}
								<RefreshCw class="h-4 w-4" />
								Extend Current Pattern
								{#if hasUnsavedChanges() && upcomingSlots.length}
									<span class="text-xs opacity-75">(will save first)</span>
								{/if}
							{/if}
						</button>
					</div>

					<!-- Upcoming Slots Preview -->
					<div>
						<h4 class="font-medium mb-3" style="color: var(--text-primary);">Next 3 Upcoming Slots</h4>
						{#if upcomingSlots.length > 0}
							<div class="space-y-2">
								{#each upcomingSlots as slot}
									<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
										<div>
											<p class="font-medium text-sm" style="color: var(--text-primary);">
												{formatDate(slot.startTime)}
											</p>
											<p class="text-xs" style="color: var(--text-secondary);">
												{formatSlotTimeRange(slot.startTime, slot.endTime)}
											</p>
										</div>
										<div class="flex items-center gap-2">
											<span class="text-xs px-2 py-1 rounded-full {getBookingStatusColor(slot.totalBookings)}">
												{slot.totalBookings} booking{slot.totalBookings === 1 ? '' : 's'}
											</span>
											<span class="text-xs" style="color: var(--text-tertiary);">
												{getOccupancyPercentage(slot)}% full
											</span>
										</div>
									</div>
								{/each}
							</div>
							<div class="mt-3 text-center">
								<button onclick={() => goto(`/tours/${tourId}/schedule`)} class="text-sm" style="color: var(--color-primary-600);">
									View all upcoming slots →
								</button>
							</div>
						{:else}
							<div class="p-6 text-center rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
								<Calendar class="h-8 w-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
								<p class="text-sm font-medium mb-1" style="color: var(--text-primary);">No upcoming time slots</p>
								<p class="text-xs mb-3" style="color: var(--text-secondary);">Create time slots to start accepting bookings</p>
								<button onclick={handleAddSingleSlot} class="button-primary button--small button--gap">
									<Plus class="h-3 w-3" />
									Add First Slot
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>

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
					<div class="w-8 h-8 mx-auto mb-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
				<form method="POST" use:enhance={({ formData, cancel }) => {
					if (isSubmitting) {
						cancel();
						return;
					}
					
					isSubmitting = true;
					
					// Add images to remove
					imagesToRemove.forEach(imageUrl => {
						formData.append('imagesToRemove', imageUrl);
					});
					
					// Add new images
					uploadedImages.forEach(image => {
						formData.append('images', image);
					});
					
					return async ({ result, update }) => {
						if (result.type === 'success') {
							// Invalidate tour queries to refresh data
							queryClient.invalidateQueries({
								queryKey: queryKeys.tourDetails(tourId)
							});
							queryClient.invalidateQueries({
								queryKey: queryKeys.toursStats
							});
							
							// Clear uploaded images since they're now saved
							uploadedImages = [];
							imagesToRemove = [];
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
					<button type="button" onclick={handleDeleteTour} class="button--danger button--small" disabled={isDeleting}>
						{#if isDeleting}
							<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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
		style="position: fixed; bottom: 2rem; right: 2rem; z-index: 50;"
		title={isSubmitting ? 'Saving Changes...' : 'Save Changes'}
	>
		{#if isSubmitting}
			<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
	message={`This will permanently delete this tour and ALL associated data:

${scheduleStats.totalBookings > 0 ? `⚠️ ${scheduleStats.totalBookings} booking${scheduleStats.totalBookings === 1 ? '' : 's'} will be cancelled` : '• No active bookings'}
${scheduleStats.upcomingSlots > 0 ? `• ${scheduleStats.upcomingSlots} upcoming time slot${scheduleStats.upcomingSlots === 1 ? '' : 's'} will be removed` : '• No upcoming time slots'}
• All tour images and data will be lost
• Customer booking history will be deleted
• QR codes will stop working

${scheduleStats.totalBookings > 0 ? 'Customers with bookings will need to be notified manually.' : 'This action cannot be undone.'}`}
	confirmText={isDeleting ? 'Deleting...' : 'Yes, Delete Tour'}
	cancelText="Cancel"
	variant="danger"
	onConfirm={confirmDeleteTour}
	onCancel={cancelDeleteTour}
/> 