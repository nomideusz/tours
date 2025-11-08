<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import TourForm from '$lib/components/TourForm.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';

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

<div class="tours-page-container px-0 sm:px-6 lg:px-8 py-2 sm:py-6 lg:py-8">
	<!-- Mobile-First Header -->
	<div class="mb-3 sm:mb-8 px-4 sm:px-0">
		<!-- Mobile Compact Header with inline title -->
		<div class="sm:hidden new-tour-mobile-header mb-3">
			<div class="flex items-center justify-between">
				<div class="py-1.5 px-4 rounded-lg" style="background: var(--color-primary-50);">
					<h1 class="text-base font-bold" style="color: var(--color-primary-700);">New Tour</h1>
				</div>
				<button
					onclick={() => goto('/tours')}
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
				title="New Tour"
				breadcrumbs={[
					{ label: 'Tours', href: '/tours' },
					{ label: 'New' }
				]}
			/>
		</div>
	</div>

	{#if validation.error}
		<div bind:this={validation.errorElement} class="mb-6 px-4 sm:px-0">
			{#if (form as any)?.showUpgradeButton}
				<div class="alert-warning rounded-xl p-4">
					<div class="flex gap-3">
						<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" />
						<div class="flex-1">
							<p class="font-medium">Tour Limit Reached</p>
							<p class="text-sm mt-1">{validation.error}</p>
							{#if (form as any)?.currentCount !== undefined && (form as any)?.limit !== undefined}
								<p class="text-sm mt-1">
									You currently have {(form as any).currentCount} tours out of {(form as any).limit} allowed.
								</p>
							{/if}
							<div class="mt-3">
								<a href="/subscription" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md" style="background: var(--color-warning-600); color: white;">
									Upgrade Your Plan
								</a>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<ErrorAlert variant="error" title="Error" message={validation.error} />
			{/if}
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
	/>
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
	.tours-page-container {
		width: 100%;
	}
</style>
