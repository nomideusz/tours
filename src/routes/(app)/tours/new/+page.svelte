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
	import { validateTourForm } from '$lib/validation.js';
	
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
	import AlertCircle from 'lucide-svelte/icons/alert-circle';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	// TanStack Query client for cache invalidation
	const queryClient = useQueryClient();
	
	let isSubmitting = $state(false);
	let error = $state<string | null>(form?.error || null);
	let validationErrors = $state<ValidationError[]>((form as any)?.validationErrors || []);
	let triggerValidation = $state(false);
	let showCancelModal = $state(false);

	// Check if we should auto-activate based on URL parameter
	let shouldActivate = browser && new URLSearchParams(window.location.search).get('activate') === 'true';

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
	let imageUploadErrors: string[] = $state([]);

	// Image validation constants (matching server-side)
	const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
	const MAX_IMAGES = 10;
	const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

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

		// Check total count limit
		if (uploadedImages.length + newFiles.length > MAX_IMAGES) {
			errors.push(`Too many images. Maximum ${MAX_IMAGES} images allowed. You have ${uploadedImages.length} and tried to add ${newFiles.length} more.`);
		}

		// Validate each file
		for (const file of newFiles) {
			const validation = validateImageFile(file);
			if (validation.isValid) {
				// Check for duplicates by name
				if (!uploadedImages.some(existing => existing.name === file.name)) {
					validFiles.push(file);
				} else {
					errors.push(`Duplicate file: ${file.name}`);
				}
			} else {
				errors.push(validation.error!);
			}
		}

		// Only add files if we won't exceed the limit
		const finalFiles = validFiles.slice(0, MAX_IMAGES - uploadedImages.length);
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
	let pageTitle = $derived(formData.status === 'active' ? 'Create & Go Live' : 'Create Tour');
	let pageSubtitle = $derived(formData.status === 'active' ? 'Create your tour and make it live immediately' : 'Create your tour as a draft first');
	let submitButtonText = $derived(formData.status === 'active' ? 'Create & Go Live' : 'Save as Draft');
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
					label: submitButtonText,
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
						{submitButtonText}
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
					submitButtonText={submitButtonText}
					isEdit={false}
					onCancel={handleCancel}
					onImageUpload={handleImageUpload}
					onImageRemove={removeImage}
					{imageUploadErrors}
					serverErrors={form?.validationErrors || []}
					{triggerValidation}
					hideStatusField={true}
				/>
			</form>
		</div>
	</div>

	<!-- Tour Status & Save Options -->
	<div class="mt-8 rounded-xl p-6" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
		<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Tour Status & Save Options</h3>
		
		<!-- Status Toggle -->
		<div class="mb-6 p-4 rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 rounded-full flex items-center justify-center {formData.status === 'active' ? 'bg-green-100' : 'bg-amber-100'}">
						<span class="text-sm font-medium {formData.status === 'active' ? 'text-green-600' : 'text-amber-600'}">
							{formData.status === 'active' ? '🟢' : '📝'}
						</span>
					</div>
					<div>
						<p class="font-semibold" style="color: var(--text-primary);">
							{formData.status === 'active' ? 'Create as Active Tour' : 'Create as Draft'}
						</p>
						<p class="text-sm" style="color: var(--text-secondary);">
							{formData.status === 'active' ? 'Your tour will be live and accepting bookings immediately' : 'Your tour will be saved but not visible to customers'}
						</p>
					</div>
				</div>
				
				<!-- iOS-style Toggle Switch with Labels -->
				<div class="flex items-center gap-3">
					<span class="text-sm font-medium transition-colors {formData.status === 'draft' ? 'text-amber-600' : 'text-gray-400'}" style="color: {formData.status === 'draft' ? 'var(--color-warning-600)' : 'var(--text-tertiary)'};">
						Draft
					</span>
					<label class="relative inline-flex items-center cursor-pointer group">
						<input
							type="checkbox"
							checked={formData.status === 'active'}
							onchange={(e) => {
								const target = e.target as HTMLInputElement;
								formData.status = target.checked ? 'active' : 'draft';
							}}
							class="sr-only peer"
						/>
						<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 group-hover:peer-checked:bg-green-600"></div>
						<!-- Tooltip on hover -->
						<div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
							{formData.status === 'active' ? 'Switch to Draft' : 'Activate Tour'}
						</div>
					</label>
					<span class="text-sm font-medium transition-colors {formData.status === 'active' ? 'text-green-600' : 'text-gray-400'}" style="color: {formData.status === 'active' ? 'var(--color-success-600)' : 'var(--text-tertiary)'};">
						Active
					</span>
				</div>
			</div>
		</div>

		<!-- Save Actions Explanation -->
		<div class="space-y-3 mb-6">
			<div class="flex items-start gap-3">
				<div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
					<span class="text-xs font-medium text-blue-600">💾</span>
				</div>
				<div>
					<p class="font-medium" style="color: var(--text-primary);">
						{formData.status === 'active' ? 'Create & Go Live' : 'Save as Draft'}
					</p>
					<p class="text-sm" style="color: var(--text-secondary);">
						{formData.status === 'active' 
							? 'Your tour will be created and immediately available for bookings' 
							: 'Save your tour safely and activate it later when you\'re ready'}
					</p>
				</div>
			</div>
			{#if formData.status === 'active'}
				<div class="flex items-start gap-3">
					<div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
						<span class="text-xs font-medium text-green-600">⚡</span>
					</div>
					<div>
						<p class="font-medium" style="color: var(--text-primary);">Ready to accept bookings</p>
						<p class="text-sm" style="color: var(--text-secondary);">
							Customers will be able to find and book your tour immediately after creation
						</p>
					</div>
				</div>
			{:else}
				<div class="flex items-start gap-3">
					<div class="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mt-0.5">
						<span class="text-xs font-medium text-amber-600">🔒</span>
					</div>
					<div>
						<p class="font-medium" style="color: var(--text-primary);">Private until activated</p>
						<p class="text-sm" style="color: var(--text-secondary);">
							You can add schedule, test everything, and activate when you're ready
						</p>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Next Steps & Process -->
	<div class="mt-8 rounded-xl p-6" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
		<div class="flex items-center gap-3 mb-4">
			<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
				<Save class="h-4 w-4 text-blue-600" />
			</div>
			<h3 class="text-lg font-semibold" style="color: var(--text-primary);">
				{formData.status === 'active' ? 'Going Live Process' : 'Your Tour Journey'}
			</h3>
		</div>
		
		<p class="text-sm mb-4" style="color: var(--text-secondary);">
			{formData.status === 'active' 
				? 'Your tour will be created and immediately available for bookings.'
				: 'We\'ll save your tour as a <strong>draft first</strong>, giving you complete control over when to go live.'}
		</p>
		
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div class="flex flex-col items-center text-center p-4 rounded-lg" style="background: var(--bg-primary);">
				<div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
					<span class="text-sm font-semibold text-green-600">1</span>
				</div>
				<h4 class="font-medium mb-2" style="color: var(--text-primary);">Save as Draft</h4>
				<p class="text-xs" style="color: var(--text-secondary);">Preview and test everything before customers see it</p>
			</div>
			
			<div class="flex flex-col items-center text-center p-4 rounded-lg" style="background: var(--bg-primary);">
				<div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
					<span class="text-sm font-semibold text-blue-600">2</span>
				</div>
				<h4 class="font-medium mb-2" style="color: var(--text-primary);">Add Schedule</h4>
				<p class="text-xs" style="color: var(--text-secondary);">Set up time slots when you're available to run tours</p>
			</div>
			
			<div class="flex flex-col items-center text-center p-4 rounded-lg" style="background: var(--bg-primary);">
				<div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-3">
					<span class="text-sm font-semibold text-purple-600">3</span>
				</div>
				<h4 class="font-medium mb-2" style="color: var(--text-primary);">Go Live</h4>
				<p class="text-xs" style="color: var(--text-secondary);">Activate your tour and start accepting bookings</p>
			</div>
		</div>
		
		<div class="mt-4 p-3 rounded-lg" style="background: var(--color-primary-50);">
			<p class="text-sm" style="color: var(--color-primary-700);">
				<strong>✨ Pro tip:</strong> You can activate your tour instantly with one click, or take your time to perfect everything first!
			</p>
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