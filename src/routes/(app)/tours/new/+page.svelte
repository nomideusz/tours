<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	import TourForm from '$lib/components/TourForm.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import type { PageData, ActionData } from './$types.js';
	import type { ValidationError } from '$lib/validation.js';
	
	// TanStack Query
	import { useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys } from '$lib/queries/shared-stats.js';
	
	// Icons
	import Save from 'lucide-svelte/icons/save';
	import X from 'lucide-svelte/icons/x';
	import FileText from 'lucide-svelte/icons/file-text';
	import Eye from 'lucide-svelte/icons/eye';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Clock from 'lucide-svelte/icons/clock';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	// TanStack Query client for cache invalidation
	const queryClient = useQueryClient();
	
	let isSubmitting = $state(false);
	let error = $state<string | null>(form?.error || null);
	let validationErrors = $state<ValidationError[]>((form as any)?.validationErrors || []);
	let triggerValidation = $state(false);
	let showCancelModal = $state(false);

	// Check if we should auto-activate based on URL parameter
	let shouldActivate = $derived(browser && new URLSearchParams(window.location.search).get('activate') === 'true');

	// Form data
	let formData = $state({
		name: (form as any)?.formData?.name || '',
		description: (form as any)?.formData?.description || '',
		price: (form as any)?.formData?.price || 10, // reasonable default price
		duration: (form as any)?.formData?.duration || 60, // in minutes
		capacity: (form as any)?.formData?.capacity || 10,
		status: ((form as any)?.formData?.status as 'active' | 'draft') || (shouldActivate ? 'active' : 'draft'),
		category: (form as any)?.formData?.category || '',
		location: (form as any)?.formData?.location || '',
		includedItems: (form as any)?.formData?.includedItems || [''],
		requirements: (form as any)?.formData?.requirements || [''],
		cancellationPolicy: (form as any)?.formData?.cancellationPolicy || ''
	});

	// Image upload state
	let uploadedImages: File[] = $state([]);

	function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			const newFiles = Array.from(target.files);
			uploadedImages = [...uploadedImages, ...newFiles];
		}
	}

	function removeImage(index: number) {
		uploadedImages = uploadedImages.filter((_, i) => i !== index);
	}

	function handleCancel() {
		showCancelModal = true;
	}

	function confirmCancel() {
		goto('/tours');
	}

	function handleSave() {
		if (isSubmitting) return;
		
		// Trigger form submission
		const form = document.querySelector('form');
		if (form) {
			form.requestSubmit();
		}
	}

	function handleSaveAsDraft() {
		if (isSubmitting) return;
		
		// Set status to draft and submit
		formData.status = 'draft';
		handleSave();
	}

	function handleSaveAndActivate() {
		if (isSubmitting) return;
		
		// Set status to active and submit
		formData.status = 'active';
		handleSave();
	}

	// Calculate form completion for mobile header
	let formCompletion = $derived(() => {
		const requiredFields = [formData.name, formData.description, formData.price, formData.duration, formData.capacity];
		const completedFields = requiredFields.filter(field => field && String(field).trim()).length;
		const percentage = Math.round((completedFields / requiredFields.length) * 100);
		return { completed: completedFields, total: requiredFields.length, percentage };
	});

	// Derived values for template
	let completionStats = $derived(formCompletion());
	let pageTitle = $derived(shouldActivate ? 'Create & Go Live' : 'Create Tour');
	let pageSubtitle = $derived(shouldActivate ? 'Create your tour and make it live immediately' : 'Create your tour as a draft first');
	let submitButtonText = $derived(shouldActivate ? 'Create & Go Live' : 'Save Draft');
</script>

<svelte:head>
	<title>Create New Tour - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Mobile-First Header -->
	<div class="mb-6 sm:mb-8">
		<!-- Mobile Compact Header -->
		<MobilePageHeader
			title="Create Tour"
			secondaryInfo="New Tour"
			quickActions={[
				{
					label: 'Save & Continue',
					icon: Save,
					onclick: handleSave,
					variant: 'primary',
					disabled: isSubmitting
				},
				{
					label: 'Cancel',
					icon: X,
					onclick: handleCancel,
					variant: 'secondary'
				}
			]}
			infoItems={[
				{
					icon: Eye,
					label: 'Progress',
					value: `${completionStats.completed}/${completionStats.total} fields`
				},
				{
					icon: FileText,
					label: 'Name',
					value: formData.name ? '✓ Set' : 'Required'
				},
				{
					icon: Clock,
					label: 'Duration',
					value: formData.duration ? `${formData.duration}min` : 'Required'
				},
				{
					icon: Eye,
					label: 'Price',
					value: formData.price ? `€${formData.price}` : 'Required'
				}
			]}
		/>

		<!-- Desktop Header -->
		<div class="hidden sm:block">
			<PageHeader 
				title="Create New Tour"
				subtitle="Set up your tour details and start accepting bookings"
				breadcrumbs={[
					{ label: 'Tours', href: '/tours' },
					{ label: 'Create Tour' }
				]}
			>
				<div class="hidden sm:flex gap-3">
					<button onclick={handleCancel} class="button-secondary button--gap">
						<X class="h-4 w-4" />
						Cancel
					</button>
					<button onclick={handleSave} class="button-primary button--gap" disabled={isSubmitting}>
						<Save class="h-4 w-4" />
						Save & Continue
					</button>
				</div>
			</PageHeader>
		</div>
	</div>

	{#if error}
		<div class="mb-6">
			<ErrorAlert variant="error" title="Error" message={error} />
		</div>
	{/if}

	<!-- Progress Steps - Desktop Only -->
	<div class="hidden sm:block mb-8">
		<div class="flex items-center gap-2 sm:gap-4 text-sm">
			<div class="flex items-center gap-2">
				<div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm">
					1
				</div>
				<span class="font-medium text-blue-600 hidden sm:inline">Tour Details</span>
				<span class="font-medium text-blue-600 sm:hidden">Details</span>
			</div>
			<div class="h-px flex-1 min-w-4" style="background: var(--border-primary);"></div>
			<div class="flex items-center gap-2">
				<div class="w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs sm:text-sm" style="background: var(--bg-secondary); color: var(--text-tertiary);">
					2
				</div>
				<span class="hidden sm:inline" style="color: var(--text-tertiary);">Set Schedule</span>
				<span class="sm:hidden" style="color: var(--text-tertiary);">Schedule</span>
			</div>
			<div class="h-px flex-1 min-w-4" style="background: var(--border-primary);"></div>
			<div class="flex items-center gap-2">
				<div class="w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs sm:text-sm" style="background: var(--bg-secondary); color: var(--text-tertiary);">
					3
				</div>
				<span class="hidden sm:inline" style="color: var(--text-tertiary);">Activate & Share</span>
				<span class="sm:hidden" style="color: var(--text-tertiary);">Activate</span>
			</div>
		</div>
	</div>

	<!-- Form Container -->
	<div class="rounded-xl overflow-hidden shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="p-6" style="border-bottom: 1px solid var(--border-primary); background: var(--bg-secondary);">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
					</svg>
				</div>
				<div>
					<h2 class="text-xl font-semibold" style="color: var(--text-primary);">Tour Information</h2>
					<p class="text-sm mt-1" style="color: var(--text-secondary);">Provide the basic details about your tour experience</p>
				</div>
			</div>
		</div>
		
		<div class="p-6 sm:p-8">
			<form method="POST" enctype="multipart/form-data" use:enhance={() => {
				// Trigger client-side validation before submitting
				triggerValidation = true;
				isSubmitting = true;
				return async ({ result }) => {
					isSubmitting = false;
					triggerValidation = false;
					if (result.type === 'redirect') {
						// Invalidate tours queries before redirecting to ensure fresh data
						await Promise.all([
							queryClient.invalidateQueries({ queryKey: queryKeys.toursStats }),
							queryClient.invalidateQueries({ queryKey: queryKeys.userTours })
						]);
						goto(result.location);
					}
				};
			}}>
				<TourForm
					bind:formData
					bind:uploadedImages
					{isSubmitting}
					submitButtonText="Save & Continue"
					isEdit={false}
					onCancel={handleCancel}
					onImageUpload={handleImageUpload}
					onImageRemove={removeImage}
					serverErrors={validationErrors}
					{triggerValidation}
					hideStatusField={true}
				/>
			</form>
		</div>
	</div>

	<!-- Next Steps Preview -->
	<div class="mt-8 rounded-xl p-6" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
		<h3 class="text-lg font-semibold mb-3" style="color: var(--text-primary);">What happens next?</h3>
		<div class="space-y-3">
			<div class="flex items-start gap-3">
				<div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
					<span class="text-xs font-medium text-green-600">✓</span>
				</div>
				<div>
					<p class="font-medium" style="color: var(--text-primary);">Tour will be saved as draft</p>
					<p class="text-sm" style="color: var(--text-secondary);">You can preview and test everything before going live</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
					<span class="text-xs font-medium text-blue-600">2</span>
				</div>
				<div>
					<p class="font-medium" style="color: var(--text-primary);">Set up your schedule</p>
					<p class="text-sm" style="color: var(--text-secondary);">Add available time slots when you can run the tour</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<div class="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
					<span class="text-xs font-medium text-purple-600">3</span>
				</div>
				<div>
					<p class="font-medium" style="color: var(--text-primary);">Activate when ready</p>
					<p class="text-sm" style="color: var(--text-secondary);">Make your tour live and share the QR code to get bookings</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Simplified Save Option -->
	<div class="mt-6 rounded-xl p-6" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
		<div class="flex items-center gap-3 mb-3">
			<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
				<Save class="h-4 w-4 text-blue-600" />
			</div>
			<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Smart Save Process</h3>
		</div>
		<p class="text-sm" style="color: var(--text-secondary);">
			We'll save your tour as a draft first, so you can:
		</p>
		<ul class="mt-2 space-y-1 text-sm" style="color: var(--text-secondary);">
			<li>• Preview how it looks to customers</li>
			<li>• Set up your schedule with available time slots</li>
			<li>• Test the booking flow</li>
			<li>• Activate it when you're 100% ready</li>
		</ul>
		<p class="mt-3 text-sm font-medium" style="color: var(--text-primary);">
			Don't worry - you can activate your tour anytime with just one click!
		</p>
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