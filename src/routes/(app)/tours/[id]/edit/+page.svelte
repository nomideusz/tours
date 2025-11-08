<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import TourForm from '$lib/components/TourForm.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import ConfirmationModal from '$lib/components/modals/ConfirmationModal.svelte';

	// Composables
	import { useTourImages } from '$lib/composables/useTourImages.svelte.js';
	import { useOnboarding } from '$lib/composables/useOnboarding.svelte.js';
	import { useTourValidation } from '$lib/composables/useTourValidation.svelte.js';
	import { useTourSubmission } from '$lib/composables/useTourSubmission.svelte.js';

	import type { Tour } from '$lib/types.js';
	import type { PageData, ActionData } from './$types.js';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Save from 'lucide-svelte/icons/save';
	import X from 'lucide-svelte/icons/x';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';

	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Get profile from layout data
	let profile = $derived(data.user);

	const queryClient = useQueryClient();
	let tourId = $derived(data.tourId);

	// Initialize composables
	const imageHandler = useTourImages();
	const onboarding = useOnboarding(profile);
	const validation = useTourValidation();
	const submission = useTourSubmission({
		isEdit: true,
		tourId,
		queryClient,
		onError: (error) => {
			validation.setError(error);
			validation.scrollToFirstError();
		}
	});

	// Initialize onboarding status
	$effect(() => {
		onboarding.initializeOnboardingStatus();
	});

	// TanStack Query for tour details
	let tourQuery = $derived(createQuery({
		queryKey: queryKeys.tourDetails(tourId),
		queryFn: () => queryFunctions.fetchTourDetails(tourId),
		staleTime: 0,
		gcTime: 5 * 60 * 1000,
		refetchOnWindowFocus: 'always',
		refetchOnMount: 'always',
		refetchInterval: false,
		networkMode: 'always'
	}));

	// Use server-side data initially, then TanStack Query data when available
	let tour = $derived($tourQuery.data?.tour || (data as any).tour || null);
	let isLoading = $derived($tourQuery.isLoading && !(data as any).tour);

	// Booking constraints query
	let constraintsQuery = $derived(createQuery({
		queryKey: queryKeys.tourBookingConstraints(tourId),
		queryFn: () => queryFunctions.fetchTourBookingConstraints(tourId),
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false,
		enabled: !!tour
	}));

	let hasFutureBookings = $derived(tour?.hasFutureBookings || false);

	// State
	let showCancelModal = $state(false);
	let showDeleteModal = $state(false);
	let isDeleting = $state(false);

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
		locationPlaceId: null as string | null,
		languages: ['en'],
		includedItems: [],
		requirements: [],
		cancellationPolicy: '',
		cancellationPolicyId: 'flexible',
		pricingModel: 'participant_categories' as Tour['pricingModel'],
		enablePricingTiers: false,
		pricingTiers: { adult: 0, child: 0 },
		participantCategories: undefined as any,
		privateTour: undefined as any,
		groupPricingTiers: { tiers: [] },
		groupDiscounts: undefined as any,
		optionalAddons: { addons: [] },
		guidePaysStripeFee: false,
		countInfantsTowardCapacity: false,
		publicListing: true
	});

	// Initialize form when tour data loads or changes
	$effect(() => {
		if (tour && !isLoading) {
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
			locationPlaceId: tour.locationPlaceId || null,
			languages: tour.languages || ['en'],
			includedItems: tour.includedItems || [],
			requirements: tour.requirements || [],
			cancellationPolicy: tour.cancellationPolicy || '',
			cancellationPolicyId: tour.cancellationPolicyId || 'flexible',
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
		imageHandler.initializeExistingImages(tour.images || []);
	}

	function getExistingImageUrl(imageName: string): string {
		return `/api/images/${tourId}/${imageName}?size=medium`;
	}

	// Handlers
	function handleCancel() {
		showCancelModal = true;
	}

	function confirmCancel() {
		goto(`/tours/${tourId}`);
	}

	async function handleSaveAsDraft() {
		if (submission.isSubmitting) return;

		// Clear any previous errors
		validation.clearErrors();

		// Validate form
		const validationResult = validation.validate(formData);
		if (!validationResult.isValid) {
			validation.triggerValidation = true;
			validation.scrollToFirstError();
			return;
		}

		// Set status to draft and submit
		formData.status = 'draft';

		await submission.submitAndNavigate(
			formData,
			imageHandler.uploadedImages,
			imageHandler.imagesToRemove
		);
	}

	async function handlePublish() {
		if (submission.isSubmitting) return;

		// Clear any previous errors
		validation.clearErrors();

		// Validate form
		const validationResult = validation.validate(formData);
		if (!validationResult.isValid) {
			validation.triggerValidation = true;
			validation.scrollToFirstError();
			return;
		}

		// Check onboarding requirements
		const canActivate = onboarding.canActivateTours();
		if (!canActivate.allowed) {
			validation.setError(`Complete onboarding before activating tours: ${canActivate.missingSteps.join(', ')}`);
			validation.scrollToFirstError();
			return;
		}

		// Set status to active and submit
		formData.status = 'active';

		await submission.submitAndNavigate(
			formData,
			imageHandler.uploadedImages,
			imageHandler.imagesToRemove
		);
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

	// Delete tour functionality
	function handleDeleteTour() {
		if (isLoading || !tour) {
			console.log('🚫 Delete blocked - data not ready:', { isLoading, tour: !!tour });
			return;
		}

		if (hasFutureBookings) {
			console.log('🚫 Delete blocked - tour has future bookings:', hasFutureBookings);
			validation.setError('Cannot delete tour with upcoming bookings. Cancel all future bookings first.');
			return;
		}

		console.log('✅ Delete allowed - proceeding with confirmation modal');
		validation.setError(null);
		showDeleteModal = true;
	}

	async function confirmDeleteTour() {
		if (isDeleting) return;

		if (hasFutureBookings) {
			console.log('🚫 Confirm delete blocked - tour has future bookings');
			validation.setError('Cannot delete tour with upcoming bookings. Please refresh the page and try again.');
			showDeleteModal = false;
			return;
		}

		isDeleting = true;
		validation.setError(null);

		try {
			const response = await fetch(`/api/tours/${tourId}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' }
			});

			if (response.ok) {
				queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });
				queryClient.invalidateQueries({ queryKey: queryKeys.userTours });
				queryClient.invalidateQueries({ queryKey: queryKeys.tourDetails(tourId) });

				goto('/tours?deleted=true');
			} else {
				const errorData = await response.json().catch(() => ({ error: 'Failed to delete tour' }));
				validation.setError(errorData?.error || errorData?.message || 'Failed to delete tour');
			}
		} catch (err) {
			console.error('Error deleting tour:', err);
			validation.setError(err instanceof Error ? err.message : 'Failed to delete tour. Please try again.');
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
						<button onclick={handlePublish} class="button-primary button-gap">
							<Save class="h-4 w-4" />
							Save Changes
						</button>
					</div>
				</PageHeader>
			</div>
		</div>

		{#if validation.error}
			<div class="mb-6 rounded-xl p-4 mx-4 sm:mx-0" style="background: var(--color-danger-light); border: 1px solid var(--color-danger-200);">
				<div class="flex gap-3">
					<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-danger-600);" />
					<div>
						<p class="font-medium" style="color: var(--color-danger-900);">Error</p>
						<p class="text-sm mt-1" style="color: var(--color-danger-700);">{validation.error}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Image Upload Errors -->
		{#if imageHandler.imageUploadErrors.length > 0}
			<div class="alert-error mb-6 rounded-xl p-4 mx-4 sm:mx-0">
				<div class="flex gap-3">
					<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" />
					<div class="flex-1">
						<p class="font-medium">Image Upload Issues</p>
						<ul class="text-sm mt-2 space-y-1">
							{#each imageHandler.imageUploadErrors as error}
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
				bind:uploadedImages={imageHandler.uploadedImages}
				isSubmitting={submission.isSubmitting}
				isEdit={true}
				onCancel={handleCancel}
				onSaveAsDraft={handleSaveAsDraft}
				onPublish={handlePublish}
				onImageUpload={imageHandler.handleImageUpload}
				onImageRemove={imageHandler.removeImage}
				existingImages={imageHandler.existingImages}
				onExistingImageRemove={imageHandler.removeExistingImage}
				imageUploadErrors={imageHandler.imageUploadErrors}
				serverErrors={[]}
				triggerValidation={validation.triggerValidation}
				getExistingImageUrl={getExistingImageUrl}
				profile={profile}
				hasConfirmedLocation={onboarding.hasConfirmedLocation}
				paymentStatus={onboarding.paymentStatus}
				onDelete={handleDeleteTour}
				hasFutureBookings={hasFutureBookings}
				isDeleting={isDeleting}
				tourId={tourId}
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

<style>
	.tours-page-container {
		width: 100%;
	}
</style>
