<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import TourForm from '$lib/components/TourForm.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import type { PageData, ActionData } from './$types.js';
	import type { ValidationError } from '$lib/validation.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	let isSubmitting = $state(false);
	let error = $state<string | null>(form?.error || null);
	let validationErrors = $state<ValidationError[]>((form as any)?.validationErrors || []);
	let triggerValidation = $state(false);

	// Form data
	let formData = $state({
		name: (form as any)?.formData?.name || '',
		description: (form as any)?.formData?.description || '',
		price: (form as any)?.formData?.price || 10, // reasonable default price
		duration: (form as any)?.formData?.duration || 60, // in minutes
		capacity: (form as any)?.formData?.capacity || 10,
		status: ((form as any)?.formData?.status as 'active' | 'draft') || 'draft',
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
		if (confirm('Are you sure you want to cancel? Your changes will be lost.')) {
			goto('/tours');
		}
	}
</script>

<svelte:head>
	<title>Create New Tour - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<PageHeader 
		title="Create New Tour"
		subtitle="Set up your tour details and start receiving bookings"
		backUrl="/tours"
		breadcrumbs={[
			{ label: 'Tours', href: '/tours' },
			{ label: 'Create New Tour' }
		]}
	/>

	{#if error}
		<div class="mb-6">
			<ErrorAlert variant="error" title="Error" message={error} />
		</div>
	{/if}

	<!-- Progress Steps -->
	<div class="mb-8">
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
				<span class="hidden sm:inline" style="color: var(--text-tertiary);">Schedule Setup</span>
				<span class="sm:hidden" style="color: var(--text-tertiary);">Schedule</span>
			</div>
			<div class="h-px flex-1 min-w-4" style="background: var(--border-primary);"></div>
			<div class="flex items-center gap-2">
				<div class="w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs sm:text-sm" style="background: var(--bg-secondary); color: var(--text-tertiary);">
					3
				</div>
				<span class="hidden sm:inline" style="color: var(--text-tertiary);">Go Live</span>
				<span class="sm:hidden" style="color: var(--text-tertiary);">Live</span>
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
						goto(result.location);
					}
				};
			}}>
				<TourForm
					bind:formData
					bind:uploadedImages
					{isSubmitting}
					isEdit={false}
					onCancel={handleCancel}
					onImageUpload={handleImageUpload}
					onImageRemove={removeImage}
					serverErrors={validationErrors}
					{triggerValidation}
				/>
			</form>
		</div>
	</div>

	<!-- Next Steps Preview -->
	<div class="mt-8 rounded-xl p-6" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
		<h3 class="text-lg font-semibold mb-3" style="color: var(--text-primary);">What happens next?</h3>
		<div class="space-y-3">
			<div class="flex items-start gap-3">
				<div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
					<span class="text-xs font-medium text-blue-600">2</span>
				</div>
				<div>
					<p class="font-medium" style="color: var(--text-primary);">Set up your schedule</p>
					<p class="text-sm" style="color: var(--text-secondary);">Define available time slots and tour dates</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<div class="w-6 h-6 rounded-full flex items-center justify-center mt-0.5" style="background: var(--bg-tertiary);">
					<span class="text-xs font-medium" style="color: var(--text-tertiary);">3</span>
				</div>
				<div>
					<p class="font-medium" style="color: var(--text-primary);">Generate QR codes & go live</p>
					<p class="text-sm" style="color: var(--text-secondary);">Create marketing QR codes and activate your tour</p>
				</div>
			</div>
		</div>
	</div>
</div> 