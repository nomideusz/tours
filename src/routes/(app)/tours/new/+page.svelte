<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import TourForm from '$lib/components/tour-form/TourForm.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import ErrorAlert from '$lib/components/ui/feedback/ErrorAlert.svelte';
	import ConfirmationModal from '$lib/components/modals/ConfirmationModal.svelte';

	// Composables
	import { useTourImages } from '$lib/composables/useTourImages.svelte.js';
	import { useOnboarding } from '$lib/composables/useOnboarding.svelte.js';
	import { useTourValidation } from '$lib/composables/useTourValidation.svelte.js';
	import { useTourSubmission } from '$lib/composables/useTourSubmission.svelte.js';

	import type { PageData, ActionData } from './$types.js';

	// TanStack Query
	import { useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys } from '$lib/queries/shared-stats.js';

	// Icons
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Get profile from layout data
	let profile = $derived(data.user);

	// TanStack Query client for cache invalidation
	const queryClient = useQueryClient();

	// Initialize composables
	const imageHandler = useTourImages();
	const onboarding = useOnboarding(profile);
	const validation = useTourValidation();
	const submission = useTourSubmission({
		isEdit: false,
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

	// State
	let showCancelModal = $state(false);

	// Check if we should auto-activate based on URL parameter
	let shouldActivate = browser && new URLSearchParams(window.location.search).get('activate') === 'true';

	// Form data
	let formData = $state({
		name: (form as any)?.formData?.name || '',
		description: (form as any)?.formData?.description || '',
		price: (form as any)?.formData?.price || 25,
		duration: (form as any)?.formData?.duration || 120,
		capacity: (form as any)?.formData?.capacity || 10,
		status: ((form as any)?.formData?.status as 'active' | 'draft') || (shouldActivate ? 'active' : 'draft'),
		categories: (form as any)?.formData?.categories || [],
		location: (form as any)?.formData?.location || '',
		locationPlaceId: (form as any)?.formData?.locationPlaceId || null,
		languages: (form as any)?.formData?.languages || ['en'],
		includedItems: (form as any)?.formData?.includedItems || [],
		requirements: (form as any)?.formData?.requirements || [],
		cancellationPolicy: (form as any)?.formData?.cancellationPolicy || '',
		cancellationPolicyId: (form as any)?.formData?.cancellationPolicyId || 'flexible',
		// Pricing configuration
		pricingModel: (form as any)?.formData?.pricingModel || 'participant_categories',
		enablePricingTiers: (form as any)?.formData?.enablePricingTiers || false,
		pricingTiers: (form as any)?.formData?.pricingTiers || {
			adult: (form as any)?.formData?.price || 25,
			child: 0
		},
		groupPricingTiers: (form as any)?.formData?.groupPricingTiers || { tiers: [] },
		optionalAddons: (form as any)?.formData?.optionalAddons || { addons: [] },
		guidePaysStripeFee: (form as any)?.formData?.guidePaysStripeFee || false,
		countInfantsTowardCapacity: (form as any)?.formData?.countInfantsTowardCapacity || false,
		publicListing: (form as any)?.formData?.publicListing !== false
	});

	// Handle initial server errors
	$effect(() => {
		if (form?.error) {
			validation.setError(form.error);
		}
		if ((form as any)?.validationErrors) {
			validation.validationErrors = (form as any).validationErrors;
		}
	});

	// Scheduling state - New flexible pattern-based approach
	let enableScheduling = $state(false);
	let selectedPattern = $state<'daily' | 'weekend' | 'custom' | 'manual' | null>(null);

	// Pattern configurations
	let dailyPattern = $state({
		times: [{ startTime: '10:00', endTime: '11:00' }],
		startDate: '',
		duration: '1month' as '1week' | '2weeks' | '1month' | '3months' | '6months' | 'custom',
		customEndDate: ''
	});

	let weekendPattern = $state({
		times: [{ startTime: '10:00', endTime: '11:00' }],
		startDate: '',
		duration: '1month' as '1week' | '2weeks' | '1month' | '3months' | '6months' | 'custom',
		customEndDate: ''
	});

	let customPattern = $state({
		selectedDays: [] as string[],
		times: [{ startTime: '10:00', endTime: '11:00' }],
		startDate: '',
		duration: '1month' as '1week' | '2weeks' | '1month' | '3months' | '6months' | 'custom',
		customEndDate: ''
	});

	let manualSlots = $state([
		{ date: '', startTime: '10:00', endTime: '11:00' }
	]);

	// Handlers
	function handleCancel() {
		showCancelModal = true;
	}

	function confirmCancel() {
		goto('/tours');
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

		// Prepare schedule data if enabled
		const scheduleData = enableScheduling && selectedPattern ? {
			selectedPattern,
			dailyPattern,
			weekendPattern,
			customPattern,
			manualSlots
		} : undefined;

		await submission.submitAndNavigate(
			formData,
			imageHandler.uploadedImages,
			[],
			scheduleData
		);
	}

	async function handleSaveAndActivate() {
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

		// Prepare schedule data if enabled
		const scheduleData = enableScheduling && selectedPattern ? {
			selectedPattern,
			dailyPattern,
			weekendPattern,
			customPattern,
			manualSlots
		} : undefined;

		await submission.submitAndNavigate(
			formData,
			imageHandler.uploadedImages,
			[],
			scheduleData
		);
	}

	// Reactive effect to reset pattern when scheduling is disabled
	$effect(() => {
		if (!enableScheduling) {
			selectedPattern = null;
		}
	});
</script>

<svelte:head>
	<title>Create New Tour - Zaur</title>
</svelte:head>

<!-- Page Container with consistent layout -->
<div class="new-tour-page">
	<!-- Page Header -->
	<div class="page-header-section">
		<div class="page-container">
			<!-- Mobile Header -->
			<div class="sm:hidden mobile-header">
				<div class="flex items-center justify-between py-3">
					<div class="flex items-center gap-3">
						<button
							onclick={() => goto('/tours')}
							class="flex items-center gap-2 text-sm font-medium transition-all duration-200 py-2 px-3 rounded-lg hover:bg-gray-100 active:scale-95"
							style="color: var(--color-primary-600);"
						>
							<ArrowLeft class="h-4 w-4" />
							Back
						</button>
						<h1 class="text-lg font-semibold" style="color: var(--text-primary);">New Tour</h1>
					</div>
				</div>
			</div>

			<!-- Desktop Header -->
			<div class="hidden sm:block desktop-header">
				<PageHeader
					title="Create New Tour"
					subtitle="Set up your tour details and pricing"
					breadcrumbs={[
						{ label: 'Tours', href: '/tours' },
						{ label: 'New Tour' }
					]}
				/>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="page-content">
		<div class="page-container">
			<!-- Error Messages -->
			{#if validation.error || imageHandler.imageUploadErrors.length > 0}
				<div class="error-section mb-6" bind:this={validation.errorElement}>
					{#if validation.error}
						{#if (form as any)?.showUpgradeButton}
							<div class="upgrade-alert">
								<div class="flex gap-3">
									<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-warning-600);" />
									<div class="flex-1">
										<p class="font-medium" style="color: var(--color-warning-800);">Tour Limit Reached</p>
										<p class="text-sm mt-1" style="color: var(--color-warning-700);">{validation.error}</p>
										{#if (form as any)?.currentCount !== undefined && (form as any)?.limit !== undefined}
											<p class="text-sm mt-1" style="color: var(--color-warning-700);">
												You currently have {(form as any).currentCount} tours out of {(form as any).limit} allowed.
											</p>
										{/if}
										<div class="mt-3">
											<a href="/subscription" class="upgrade-button">
												Upgrade Your Plan
											</a>
										</div>
									</div>
								</div>
							</div>
						{:else}
							<ErrorAlert variant="error" title="Error" message={validation.error} />
						{/if}
					{/if}

					{#if imageHandler.imageUploadErrors.length > 0}
						<div class="image-error-alert">
							<div class="flex gap-3">
								<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-error-600);" />
								<div class="flex-1">
									<p class="font-medium" style="color: var(--color-error-800);">Image Upload Issues</p>
									<ul class="text-sm mt-2 space-y-1" style="color: var(--color-error-700);">
										{#each imageHandler.imageUploadErrors as error}
											<li>• {error}</li>
										{/each}
									</ul>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Tour Form -->
			<div class="form-section">
				<TourForm
					bind:formData
					bind:uploadedImages={imageHandler.uploadedImages}
					isSubmitting={submission.isSubmitting}
					isEdit={false}
					onCancel={handleCancel}
					onSaveAsDraft={handleSaveAsDraft}
					onPublish={handleSaveAndActivate}
					onImageUpload={imageHandler.handleImageUpload}
					onImageRemove={imageHandler.removeImage}
					imageUploadErrors={imageHandler.imageUploadErrors}
					serverErrors={validation.validationErrors}
					triggerValidation={validation.triggerValidation}
					hideStatusField={true}
					profile={profile}
					hasConfirmedLocation={onboarding.hasConfirmedLocation}
					paymentStatus={onboarding.paymentStatus}
					showStickyActions={true}
				/>
			</div>
		</div>
	</div>
</div>

<!-- Confirmation Modal -->
<ConfirmationModal
	bind:isOpen={showCancelModal}
	title="Cancel tour creation?"
	message="Are you sure you want to cancel creating this tour? Your entered information will be lost."
	confirmText="Yes, cancel"
	cancelText="Keep working"
	variant="warning"
	onConfirm={confirmCancel}
/>

<style>
	/* New Tour Page Layout */
	.new-tour-page {
		min-height: 100vh;
		background: var(--color-bg-primary);
	}

	/* Page Header Section */
	.page-header-section {
		border-bottom: 1px solid var(--color-border-200);
		background: var(--color-bg-primary);
	}

	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	/* Mobile Header */
	.mobile-header {
		padding: 0.75rem 0;
	}

	/* Desktop Header */
	.desktop-header {
		padding: 2rem 0 1.5rem 0;
	}

	/* Page Content */
	.page-content {
		flex: 1;
		padding-bottom: 8rem; /* Extra padding for fixed action buttons */
	}

	/* Error Section */
	.error-section {
		max-width: 800px;
		margin-left: auto;
		margin-right: auto;
	}

	.upgrade-alert {
		background: var(--color-warning-50);
		border: 1px solid var(--color-warning-200);
		border-radius: 0.75rem;
		padding: 1rem;
	}

	.upgrade-button {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.375rem;
		background: var(--color-warning-600);
		color: white;
		text-decoration: none;
		transition: background-color 0.15s ease;
	}

	.upgrade-button:hover {
		background: var(--color-warning-700);
	}

	.image-error-alert {
		background: var(--color-error-50);
		border: 1px solid var(--color-error-200);
		border-radius: 0.75rem;
		padding: 1rem;
		margin-top: 1rem;
	}

	/* Form Section */
	.form-section {
		max-width: 900px;
		margin: 0 auto;
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.page-container {
			padding: 0 0.75rem;
		}

		.form-section {
			max-width: 100%;
		}
	}
</style>
