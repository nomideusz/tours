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
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';

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

	let tour = $derived($tourQuery.data?.tour || null);
	let isLoading = $derived($tourQuery.isLoading);
	let isSubmitting = $state(false);
	let error = $state<string | null>(form?.error || null);
	let validationErrors = $state<ValidationError[]>((form as any)?.validationErrors || []);
	let capacityError = $state((form as any)?.capacityError || null);
	let triggerValidation = $state(false);
	let showCancelModal = $state(false);

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
	const MAX_IMAGES = 10;
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
		if (!target.files) return;

		const newFiles = Array.from(target.files);
		const validFiles: File[] = [];
		const errors: string[] = [];

		// Calculate current total (existing + new uploaded images)
		const currentTotal = existingImages.length + uploadedImages.length;
		
		// Check total count limit
		if (currentTotal + newFiles.length > MAX_IMAGES) {
			errors.push(`Too many images. Maximum ${MAX_IMAGES} images allowed. You have ${currentTotal} and tried to add ${newFiles.length} more.`);
		}

		// Validate each file
		for (const file of newFiles) {
			const validation = validateImageFile(file);
			if (validation.isValid) {
				// Check for duplicates by name (both in existing and uploaded)
				const isDuplicateInUploaded = uploadedImages.some(existing => existing.name === file.name);
				const isDuplicateInExisting = existingImages.some(existing => existing.includes(file.name.split('.')[0]));
				
				if (!isDuplicateInUploaded && !isDuplicateInExisting) {
					validFiles.push(file);
				} else {
					errors.push(`Duplicate file: ${file.name}`);
				}
			} else {
				errors.push(validation.error!);
			}
		}

		// Only add files if we won't exceed the limit
		const remainingSlots = MAX_IMAGES - currentTotal;
		const finalFiles = validFiles.slice(0, remainingSlots);
		if (finalFiles.length < validFiles.length) {
			errors.push(`Some files were skipped to stay within the ${MAX_IMAGES} image limit.`);
		}

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
				secondaryInfo={getTourStatusInfo().label}
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
						icon: Eye,
						label: 'Price',
						value: `€${tour?.price || 0}`
					},
					{
						icon: AlertCircle,
						label: 'Duration',
						value: `${tour?.duration || 0}min`
					},
					{
						icon: Eye,
						label: 'Capacity',
						value: `${tour?.capacity || 0} max`
					},
					{
						icon: AlertCircle,
						label: 'Status',
						value: getTourStatusInfo().label
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

		<!-- Current Status & Save Actions -->
		<div class="mt-8 rounded-xl p-6" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<h3 class="text-lg font-semibold mb-3" style="color: var(--text-primary);">Current Status & Save Options</h3>
			
			<!-- Current Status -->
			<div class="mb-6 p-4 rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 rounded-full flex items-center justify-center {tour?.status === 'active' ? 'bg-green-100' : 'bg-amber-100'}">
						<span class="text-sm font-medium {tour?.status === 'active' ? 'text-green-600' : 'text-amber-600'}">
							{tour?.status === 'active' ? '✓' : '📝'}
						</span>
					</div>
					<div>
						<p class="font-semibold" style="color: var(--text-primary);">
							Currently: {tour?.status === 'active' ? 'Active' : 'Draft'}
						</p>
						<p class="text-sm" style="color: var(--text-secondary);">
							{tour?.status === 'active' ? 'Your tour is live and accepting bookings' : 'Your tour is saved but not visible to customers'}
						</p>
					</div>
				</div>
			</div>

			<!-- Save Actions Explanation -->
			<div class="space-y-3">
				<div class="flex items-start gap-3">
					<div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
						<span class="text-xs font-medium text-blue-600">💾</span>
					</div>
					<div>
						<p class="font-medium" style="color: var(--text-primary);">Save Changes</p>
						<p class="text-sm" style="color: var(--text-secondary);">
							{tour?.status === 'active' ? 'Keep your tour active with the updated information' : 'Keep your tour as draft with the updated information'}
						</p>
					</div>
				</div>
				{#if tour?.status === 'draft'}
					<div class="flex items-start gap-3">
						<div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
							<span class="text-xs font-medium text-green-600">🚀</span>
						</div>
						<div>
							<p class="font-medium" style="color: var(--text-primary);">Want to go live?</p>
							<p class="text-sm" style="color: var(--text-secondary);">
								Save your changes, then use the status button in the header to activate your tour.
							</p>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Form Container -->
		<div class="rounded-xl overflow-hidden shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-6" style="border-bottom: 1px solid var(--border-primary); background: var(--bg-secondary);">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
						</svg>
					</div>
					<div>
						<h2 class="text-xl font-semibold" style="color: var(--text-primary);">Tour Information</h2>
						<p class="text-sm mt-1" style="color: var(--text-secondary);">Update your tour details and make it even better</p>
					</div>
				</div>
			</div>
			
			<div class="p-6 sm:p-8">
				<!-- Image Upload Errors -->
				{#if imageUploadErrors.length > 0}
					<div class="mb-6 rounded-xl p-4" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
						<div class="flex gap-3">
							<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-error-600);" />
							<div class="flex-1">
								<p class="font-medium" style="color: var(--color-error-900);">Image Upload Issues</p>
								<ul class="text-sm mt-2 space-y-1" style="color: var(--color-error-700);">
									{#each imageUploadErrors as error}
										<li>• {error}</li>
									{/each}
								</ul>
							</div>
						</div>
					</div>
				{/if}

				<form method="POST" enctype="multipart/form-data" novalidate onsubmit={(e) => {
					// Force immediate validation by directly calling validateTourForm
					const validation = validateTourForm(formData);
					if (!validation.isValid) {
						e.preventDefault();
						// Trigger validation in TourForm component
						triggerValidation = true;
						return false;
					}
					
					isSubmitting = true;
				}} use:enhance={() => {
									return async ({ result }) => {
					isSubmitting = false;
					triggerValidation = false;
					if (result.type === 'redirect') {
							// Invalidate all tour-related queries to ensure fresh data
							queryClient.invalidateQueries({ queryKey: ['userTours'] });
							queryClient.invalidateQueries({ queryKey: ['toursStats'] });
							queryClient.invalidateQueries({ queryKey: ['tourDetails', tourId] });
							queryClient.invalidateQueries({ queryKey: ['tourSchedule', tourId] });
							
							// Invalidate public booking page cache
							if (tour?.qrCode) {
								invalidatePublicTourData(queryClient, tour.qrCode);
							}
							goto(result.location);
						}
					};
				}}>
					<!-- Hidden input for images to remove -->
					{#each imagesToRemove as imageToRemove}
						<input type="hidden" name="removeImages" value={imageToRemove} />
					{/each}

					<TourForm
						bind:formData
						bind:uploadedImages
						{isSubmitting}
						isEdit={true}
						onCancel={handleCancel}
						onImageUpload={handleImageUpload}
						onImageRemove={removeImage}
						{existingImages}
						onExistingImageRemove={removeExistingImage}
						{getExistingImageUrl}
						{imageUploadErrors}
						serverErrors={[]}
						{triggerValidation}
						bookingConstraints={bookingConstraints}
					/>
				</form>
			</div>
		</div>
	{/if}
</div>

<!-- Confirmation Modal -->
<ConfirmationModal
	bind:isOpen={showCancelModal}
	title="Cancel editing?"
	message="Are you sure you want to cancel editing this tour? Your unsaved changes will be lost."
	confirmText="Yes, cancel"
	cancelText="Keep editing"
	variant="warning"
	onConfirm={confirmCancel}
	onCancel={() => {}}
	onClose={() => {}}
/> 