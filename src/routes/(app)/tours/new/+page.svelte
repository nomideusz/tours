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
	import Calendar from 'lucide-svelte/icons/calendar';
	import Plus from 'lucide-svelte/icons/plus';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	
	// Date and Time Components
	import DatePicker from '$lib/components/DatePicker.svelte';
	import TimePicker from '$lib/components/TimePicker.svelte';

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
		cancellationPolicy: (form as any)?.formData?.cancellationPolicy || '',
		enablePricingTiers: (form as any)?.formData?.enablePricingTiers || false,
		pricingTiers: (form as any)?.formData?.pricingTiers || {
			adult: 10, // default to same as price
			child: 0
		}
	});

	// Image upload state
	let uploadedImages: File[] = $state([]);
	let imageUploadErrors: string[] = $state([]);

	// Image validation constants (matching server-side)
	const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
	const MAX_IMAGES = 5; // Reduced from 10 to 5 for better performance
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
		console.log('🔍 Image upload event triggered');
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

		// Check total count limit
		if (uploadedImages.length + newFiles.length > MAX_IMAGES) {
			errors.push(`Too many images. Maximum ${MAX_IMAGES} images allowed. You have ${uploadedImages.length} and tried to add ${newFiles.length} more.`);
		}

		// Check total size limit (warn at 8MB to leave buffer for form data)
		const currentTotalSize = uploadedImages.reduce((sum, file) => sum + file.size, 0);
		const newFilesSize = newFiles.reduce((sum, file) => sum + file.size, 0);
		const totalSize = currentTotalSize + newFilesSize;
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
				// Check for duplicates by name
				if (!uploadedImages.some(existing => existing.name === file.name)) {
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
		const finalFiles = validFiles.slice(0, MAX_IMAGES - uploadedImages.length);
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

	// Helper functions for scheduling
	function handleSchedulingToggle() {
		enableScheduling = !enableScheduling;
		if (!enableScheduling) {
			selectedPattern = null;
		}
	}

	// Reactive effect to reset pattern when scheduling is disabled
	$effect(() => {
		if (!enableScheduling) {
			selectedPattern = null;
		}
	});

	function handlePatternSelect(pattern: 'daily' | 'weekend' | 'custom' | 'manual') {
		selectedPattern = pattern;
	}

	// Daily pattern functions
	function addDailyTime() {
		dailyPattern.times = [...dailyPattern.times, { startTime: '10:00', endTime: '11:00' }];
	}

	function removeDailyTime(index: number) {
		dailyPattern.times = dailyPattern.times.filter((_, i) => i !== index);
	}

	// Weekend pattern functions
	function addWeekendTime() {
		weekendPattern.times = [...weekendPattern.times, { startTime: '10:00', endTime: '11:00' }];
	}

	function removeWeekendTime(index: number) {
		weekendPattern.times = weekendPattern.times.filter((_, i) => i !== index);
	}

	// Custom pattern functions
	function addCustomTime() {
		customPattern.times = [...customPattern.times, { startTime: '10:00', endTime: '11:00' }];
	}

	function removeCustomTime(index: number) {
		customPattern.times = customPattern.times.filter((_, i) => i !== index);
	}

	function toggleCustomDay(day: string) {
		if (customPattern.selectedDays.includes(day)) {
			customPattern.selectedDays = customPattern.selectedDays.filter(d => d !== day);
		} else {
			customPattern.selectedDays = [...customPattern.selectedDays, day];
		}
	}

	function setCustomPreset(preset: string) {
		const presets = {
			weekdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
			weekends: ['saturday', 'sunday'],
			mwf: ['monday', 'wednesday', 'friday'],
			tth: ['tuesday', 'thursday']
		};
		
		customPattern.selectedDays = presets[preset as keyof typeof presets] || [];
	}

	// Manual slots functions
	function addManualSlot() {
		manualSlots = [...manualSlots, { date: '', startTime: '10:00', endTime: '11:00' }];
	}

	function removeManualSlot(index: number) {
		manualSlots = manualSlots.filter((_, i) => i !== index);
	}

	// Get preview text for selected pattern
	function getPatternPreview(): string {
		if (!selectedPattern) return '';
		
		switch (selectedPattern) {
			case 'daily':
				return `Daily tours with ${dailyPattern.times.length} time slot${dailyPattern.times.length === 1 ? '' : 's'} per day`;
			case 'weekend':
				return `Weekend tours (Sat & Sun) with ${weekendPattern.times.length} time slot${weekendPattern.times.length === 1 ? '' : 's'} per day`;
			case 'custom':
				const dayCount = customPattern.selectedDays.length;
				const timeCount = customPattern.times.length;
				return dayCount > 0 ? `${dayCount} day${dayCount === 1 ? '' : 's'} per week with ${timeCount} time slot${timeCount === 1 ? '' : 's'} each` : 'Select days and times';
			case 'manual':
				return `${manualSlots.length} individual time slot${manualSlots.length === 1 ? '' : 's'}`;
			default:
				return '';
		}
	}
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
				<span class="hidden sm:inline" style="color: var(--text-tertiary);">Quick Schedule (Optional)</span>
				<span class="sm:hidden" style="color: var(--text-tertiary);">Schedule</span>
			</div>
			<div class="h-px flex-1 min-w-4" style="background: var(--border-primary);"></div>
			<div class="flex items-center gap-2">
				<div class="w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs sm:text-sm" style="background: var(--bg-secondary); color: var(--text-tertiary);">
					3
				</div>
				<span class="hidden sm:inline" style="color: var(--text-tertiary);">Review & Publish</span>
				<span class="sm:hidden" style="color: var(--text-tertiary);">Publish</span>
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
			}} use:enhance={({ formData }) => {
				// Manually append uploaded images to form data
				console.log('📤 Enhancing form submission with', uploadedImages.length, 'images');
				uploadedImages.forEach((file, index) => {
					console.log(`📤 Adding image ${index + 1}:`, { name: file.name, size: file.size, type: file.type });
					formData.append('images', file);
				});

				// Add schedule data if enabled
				if (enableScheduling && selectedPattern) {
					const scheduleData = {
						selectedPattern,
						dailyPattern,
						weekendPattern,
						customPattern,
						manualSlots
					};
					formData.append('enableScheduling', 'true');
					formData.append('scheduleData', JSON.stringify(scheduleData));
					console.log('📅 Adding schedule data:', scheduleData);
				}
				
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
					} else if (result.type === 'failure') {
						// Handle server errors (like file size limits)
						console.error('Form submission failed:', result);
						if (result.status === 413) {
							error = 'Upload too large. Please reduce image sizes or use fewer images. Maximum total upload size is 10MB.';
						} else {
							error = (result.data as any)?.error || 'An error occurred while creating your tour. Please try again.';
						}
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

	<!-- Quick Schedule Setup (Optional) -->
	<div class="mt-8 rounded-xl" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
		<div class="p-4 border-b" style="border-color: var(--border-primary);">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
						<Clock class="h-4 w-4 text-blue-600" />
					</div>
					<div>
						<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Quick Schedule Setup</h3>
						<p class="text-sm" style="color: var(--text-secondary);">Optional: Add your first time slots now, or do it later</p>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<input type="checkbox" id="enableScheduling" bind:checked={enableScheduling} class="form-checkbox" />
					<label for="enableScheduling" class="text-sm font-medium" style="color: var(--text-primary);">Add schedule now</label>
				</div>
			</div>
		</div>
		
		{#if enableScheduling}
			<div class="p-4">
				<!-- Pattern Selection -->
				<div class="mb-6">
					<h4 class="font-medium mb-3" style="color: var(--text-primary);">Choose a Schedule Pattern</h4>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						<button 
							type="button" 
							onclick={() => handlePatternSelect('daily')} 
							class="p-4 text-left rounded-lg border transition-colors {selectedPattern === 'daily' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}"
							style="background: {selectedPattern === 'daily' ? 'var(--color-primary-50)' : 'var(--bg-primary)'}; border-color: {selectedPattern === 'daily' ? 'var(--color-primary-500)' : 'var(--border-primary)'};"
						>
							<div class="flex items-center gap-2 mb-2">
								<Calendar class="h-4 w-4 text-blue-600" />
								<span class="font-medium" style="color: var(--text-primary);">Daily Pattern</span>
							</div>
							<p class="text-xs" style="color: var(--text-secondary);">Every day of the week</p>
							<p class="text-xs mt-1" style="color: var(--text-tertiary);">You choose the times</p>
						</button>
						
						<button 
							type="button" 
							onclick={() => handlePatternSelect('weekend')} 
							class="p-4 text-left rounded-lg border transition-colors {selectedPattern === 'weekend' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}"
							style="background: {selectedPattern === 'weekend' ? 'var(--color-success-50)' : 'var(--bg-primary)'}; border-color: {selectedPattern === 'weekend' ? 'var(--color-success-500)' : 'var(--border-primary)'};"
						>
							<div class="flex items-center gap-2 mb-2">
								<Calendar class="h-4 w-4 text-green-600" />
								<span class="font-medium" style="color: var(--text-primary);">Weekend Pattern</span>
							</div>
							<p class="text-xs" style="color: var(--text-secondary);">Saturdays & Sundays</p>
							<p class="text-xs mt-1" style="color: var(--text-tertiary);">You choose the times</p>
						</button>
						
						<button 
							type="button" 
							onclick={() => handlePatternSelect('custom')} 
							class="p-4 text-left rounded-lg border transition-colors {selectedPattern === 'custom' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}"
							style="background: {selectedPattern === 'custom' ? 'var(--color-warning-50)' : 'var(--bg-primary)'}; border-color: {selectedPattern === 'custom' ? 'var(--color-warning-500)' : 'var(--border-primary)'};"
						>
							<div class="flex items-center gap-2 mb-2">
								<RefreshCw class="h-4 w-4 text-orange-600" />
								<span class="font-medium" style="color: var(--text-primary);">Custom Pattern</span>
							</div>
							<p class="text-xs" style="color: var(--text-secondary);">Choose specific days</p>
							<p class="text-xs mt-1" style="color: var(--text-tertiary);">e.g. Tue/Thu, Mon/Wed/Fri</p>
						</button>
					</div>
					
					<div class="mt-3 text-center">
						<button 
							type="button" 
							onclick={() => handlePatternSelect('manual')} 
							class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors {selectedPattern === 'manual' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}"
							style="background: {selectedPattern === 'manual' ? 'var(--color-purple-50)' : 'var(--bg-primary)'}; border-color: {selectedPattern === 'manual' ? 'var(--color-purple-500)' : 'var(--border-primary)'};"
						>
							<Plus class="h-4 w-4 text-purple-600" />
							<span class="font-medium" style="color: var(--text-primary);">Manual Individual Slots</span>
							<span class="text-xs ml-2" style="color: var(--text-tertiary);">(Pick specific dates & times)</span>
						</button>
					</div>
				</div>

				<!-- Pattern Configuration -->
				{#if selectedPattern === 'daily'}
					<div class="space-y-4">
						<h4 class="font-medium" style="color: var(--text-primary);">Configure Daily Schedule</h4>
						
						<!-- Times -->
						<div>
							<label class="form-label">Tour Times</label>
							<p class="text-xs mb-3" style="color: var(--text-secondary);">Add all the times you want to run tours each day</p>
							<div class="space-y-2">
								{#each dailyPattern.times as time, index}
									<div class="flex gap-3 items-center p-3 rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
										<div class="w-full">
											<TimePicker
												bind:value={time.startTime}
												placeholder="Start time"
												onchange={() => {}}
											/>
										</div>
										<span class="text-sm flex-shrink-0" style="color: var(--text-secondary);">to</span>
										<div class="w-full">
											<TimePicker
												bind:value={time.endTime}
												placeholder="End time"
												onchange={() => {}}
											/>
										</div>
										{#if dailyPattern.times.length > 1}
											<button type="button" onclick={() => removeDailyTime(index)} class="button-secondary button--small button--icon flex-shrink-0">
												<Trash2 class="h-3 w-3" />
											</button>
										{/if}
									</div>
								{/each}
							</div>
							<button type="button" onclick={addDailyTime} class="mt-2 button-secondary button--small button--gap">
								<Plus class="h-4 w-4" />
								Add Another Time
							</button>
						</div>

						<!-- Date Range -->
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div class="w-full">
								<DatePicker
									bind:value={dailyPattern.startDate}
									label="Start Date"
									placeholder="Select start date"
									minDate={new Date().toISOString().split('T')[0]}
									onchange={() => {}}
								/>
							</div>
							<div>
								<label class="form-label">Duration</label>
								<select bind:value={dailyPattern.duration} class="form-select text-sm w-full">
									<option value="1week">Next week</option>
									<option value="2weeks">Next 2 weeks</option>
									<option value="1month">Next month</option>
									<option value="3months">Next 3 months</option>
									<option value="6months">Next 6 months</option>
									<option value="custom">Custom end date</option>
								</select>
							</div>
						</div>

						{#if dailyPattern.duration === 'custom'}
							<div class="w-full">
								<DatePicker
									bind:value={dailyPattern.customEndDate}
									label="End Date"
									placeholder="Select end date"
									minDate={dailyPattern.startDate || new Date().toISOString().split('T')[0]}
									onchange={() => {}}
								/>
							</div>
						{/if}
					</div>
				{:else if selectedPattern === 'weekend'}
					<div class="space-y-4">
						<h4 class="font-medium" style="color: var(--text-primary);">Configure Weekend Schedule</h4>
						
						<!-- Times -->
						<div>
							<label class="form-label">Tour Times</label>
							<p class="text-xs mb-3" style="color: var(--text-secondary);">Add all the times you want to run tours on weekends</p>
							<div class="space-y-2">
								{#each weekendPattern.times as time, index}
									<div class="flex gap-3 items-center p-3 rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
										<div class="w-full">
											<TimePicker
												bind:value={time.startTime}
												placeholder="Start time"
												onchange={() => {}}
											/>
										</div>
										<span class="text-sm flex-shrink-0" style="color: var(--text-secondary);">to</span>
										<div class="w-full">
											<TimePicker
												bind:value={time.endTime}
												placeholder="End time"
												onchange={() => {}}
											/>
										</div>
										{#if weekendPattern.times.length > 1}
											<button type="button" onclick={() => removeWeekendTime(index)} class="button-secondary button--small button--icon flex-shrink-0">
												<Trash2 class="h-3 w-3" />
											</button>
										{/if}
									</div>
								{/each}
							</div>
							<button type="button" onclick={addWeekendTime} class="mt-2 button-secondary button--small button--gap">
								<Plus class="h-4 w-4" />
								Add Another Time
							</button>
						</div>

						<!-- Date Range -->
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div class="w-full">
								<DatePicker
									bind:value={weekendPattern.startDate}
									label="Start Date"
									placeholder="Select start date"
									minDate={new Date().toISOString().split('T')[0]}
									onchange={() => {}}
								/>
							</div>
							<div>
								<label class="form-label">Duration</label>
								<select bind:value={weekendPattern.duration} class="form-select text-sm w-full">
									<option value="1week">Next week</option>
									<option value="2weeks">Next 2 weeks</option>
									<option value="1month">Next month</option>
									<option value="3months">Next 3 months</option>
									<option value="6months">Next 6 months</option>
									<option value="custom">Custom end date</option>
								</select>
							</div>
						</div>

						{#if weekendPattern.duration === 'custom'}
							<div class="w-full">
								<DatePicker
									bind:value={weekendPattern.customEndDate}
									label="End Date"
									placeholder="Select end date"
									minDate={weekendPattern.startDate || new Date().toISOString().split('T')[0]}
									onchange={() => {}}
								/>
							</div>
						{/if}
					</div>
				{:else if selectedPattern === 'custom'}
					<div class="space-y-4">
						<h4 class="font-medium" style="color: var(--text-primary);">Configure Custom Pattern</h4>
						
						<!-- Quick Presets -->
						<div>
							<label class="form-label">Quick Presets</label>
							<div class="flex flex-wrap gap-2 mt-2">
								<button type="button" onclick={() => setCustomPreset('weekdays')} class="px-3 py-2 text-sm rounded-lg border hover:border-blue-500 transition-colors" style="border-color: var(--border-primary);">
									Weekdays (Mon-Fri)
								</button>
								<button type="button" onclick={() => setCustomPreset('weekends')} class="px-3 py-2 text-sm rounded-lg border hover:border-blue-500 transition-colors" style="border-color: var(--border-primary);">
									Weekends (Sat-Sun)
								</button>
								<button type="button" onclick={() => setCustomPreset('mwf')} class="px-3 py-2 text-sm rounded-lg border hover:border-blue-500 transition-colors" style="border-color: var(--border-primary);">
									MWF
								</button>
								<button type="button" onclick={() => setCustomPreset('tth')} class="px-3 py-2 text-sm rounded-lg border hover:border-blue-500 transition-colors" style="border-color: var(--border-primary);">
									Tue/Thu
								</button>
							</div>
						</div>

						<!-- Days Selection -->
						<div>
							<label class="form-label">Days of Week</label>
							<div class="flex flex-wrap gap-2 mt-2">
								{#each ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as day}
									<label class="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors {customPattern.selectedDays.includes(day) ? 'border-blue-500 bg-blue-50' : ''}" style="border-color: {customPattern.selectedDays.includes(day) ? 'var(--color-primary-500)' : 'var(--border-primary)'};">
										<input 
											type="checkbox" 
											checked={customPattern.selectedDays.includes(day)}
											onchange={() => toggleCustomDay(day)}
											class="form-checkbox" 
										/>
										<span class="text-sm capitalize">{day}</span>
									</label>
								{/each}
							</div>
						</div>

						<!-- Times -->
						<div>
							<label class="form-label">Tour Times</label>
							<p class="text-xs mb-3" style="color: var(--text-secondary);">Add all the times you want to run tours on your selected days</p>
							<div class="space-y-2">
								{#each customPattern.times as time, index}
									<div class="flex gap-3 items-center p-3 rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
										<div class="w-full">
											<TimePicker
												bind:value={time.startTime}
												placeholder="Start time"
												onchange={() => {}}
											/>
										</div>
										<span class="text-sm flex-shrink-0" style="color: var(--text-secondary);">to</span>
										<div class="w-full">
											<TimePicker
												bind:value={time.endTime}
												placeholder="End time"
												onchange={() => {}}
											/>
										</div>
										{#if customPattern.times.length > 1}
											<button type="button" onclick={() => removeCustomTime(index)} class="button-secondary button--small button--icon flex-shrink-0">
												<Trash2 class="h-3 w-3" />
											</button>
										{/if}
									</div>
								{/each}
							</div>
							<button type="button" onclick={addCustomTime} class="mt-2 button-secondary button--small button--gap">
								<Plus class="h-4 w-4" />
								Add Another Time
							</button>
						</div>

						<!-- Date Range -->
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div class="w-full">
								<DatePicker
									bind:value={customPattern.startDate}
									label="Start Date"
									placeholder="Select start date"
									minDate={new Date().toISOString().split('T')[0]}
									onchange={() => {}}
								/>
							</div>
							<div>
								<label class="form-label">Duration</label>
								<select bind:value={customPattern.duration} class="form-select text-sm w-full">
									<option value="1week">Next week</option>
									<option value="2weeks">Next 2 weeks</option>
									<option value="1month">Next month</option>
									<option value="3months">Next 3 months</option>
									<option value="6months">Next 6 months</option>
									<option value="custom">Custom end date</option>
								</select>
							</div>
						</div>

						{#if customPattern.duration === 'custom'}
							<div class="w-full">
								<DatePicker
									bind:value={customPattern.customEndDate}
									label="End Date"
									placeholder="Select end date"
									minDate={customPattern.startDate || new Date().toISOString().split('T')[0]}
									onchange={() => {}}
								/>
							</div>
						{/if}
					</div>
				{:else if selectedPattern === 'manual'}
					<div class="space-y-4">
						<h4 class="font-medium" style="color: var(--text-primary);">Add Individual Time Slots</h4>
						<p class="text-sm" style="color: var(--text-secondary);">Perfect for irregular schedules or specific dates</p>
						
						<div class="space-y-3">
							{#each manualSlots as slot, index}
								<div class="flex gap-3 items-center p-3 rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
									<div class="w-full">
										<DatePicker
											bind:value={slot.date}
											placeholder="Select date"
											minDate={new Date().toISOString().split('T')[0]}
											onchange={() => {}}
										/>
									</div>
									<div class="w-full">
										<TimePicker
											bind:value={slot.startTime}
											placeholder="Start time"
											onchange={() => {}}
										/>
									</div>
									<span class="text-sm flex-shrink-0" style="color: var(--text-secondary);">to</span>
									<div class="w-full">
										<TimePicker
											bind:value={slot.endTime}
											placeholder="End time"
											onchange={() => {}}
										/>
									</div>
									{#if manualSlots.length > 1}
										<button type="button" onclick={() => removeManualSlot(index)} class="button-secondary button--small button--icon flex-shrink-0">
											<Trash2 class="h-3 w-3" />
										</button>
									{/if}
								</div>
							{/each}
						</div>
						<button type="button" onclick={addManualSlot} class="button-secondary button--small button--gap">
							<Plus class="h-4 w-4" />
							Add Another Slot
						</button>
					</div>
				{/if}

				<!-- Preview -->
				{#if selectedPattern}
					<div class="mt-6 p-4 rounded-lg" style="background: var(--bg-tertiary); border: 1px solid var(--border-primary);">
						<h5 class="font-medium mb-2" style="color: var(--text-primary);">Preview</h5>
						<p class="text-sm" style="color: var(--text-secondary);">
							{getPatternPreview()}
						</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Tour Status & Save -->
	<div class="mt-8 rounded-xl p-6" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="w-8 h-8 rounded-full flex items-center justify-center {formData.status === 'active' ? 'bg-green-100' : 'bg-amber-100'}">
					<span class="text-sm {formData.status === 'active' ? 'text-green-600' : 'text-amber-600'}">
						{formData.status === 'active' ? '🟢' : '📝'}
					</span>
				</div>
				<div>
					<p class="font-semibold" style="color: var(--text-primary);">
						{formData.status === 'active' ? 'Go Live Immediately' : 'Save as Draft'}
					</p>
					<p class="text-sm" style="color: var(--text-secondary);">
						{formData.status === 'active' ? 'Accept bookings right away' : 'Activate later when ready'}
					</p>
				</div>
			</div>
			
			<!-- Toggle Switch -->
			<div class="flex items-center gap-3">
				<span class="text-sm font-medium" style="color: {formData.status === 'draft' ? 'var(--color-warning-600)' : 'var(--text-tertiary)'};">
					Draft
				</span>
				<label class="relative inline-flex items-center cursor-pointer">
					<input
						type="checkbox"
						checked={formData.status === 'active'}
						onchange={(e) => {
							const target = e.target as HTMLInputElement;
							formData.status = target.checked ? 'active' : 'draft';
						}}
						class="sr-only peer"
					/>
					<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
				</label>
				<span class="text-sm font-medium" style="color: {formData.status === 'active' ? 'var(--color-success-600)' : 'var(--text-tertiary)'};">
					Active
				</span>
			</div>
		</div>
	</div>
</div>

<!-- Floating Save Button -->
{#if formData.name.trim() !== '' || formData.description.trim() !== '' || uploadedImages.length > 0}
	<button
		onclick={handleSave}
		disabled={isSubmitting}
		class="floating-save-btn"
		style="position: fixed; bottom: 2rem; right: 2rem; z-index: 50;"
		title={isSubmitting ? 'Creating Tour...' : 'Save Tour'}
	>
		{#if isSubmitting}
			<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
		{:else}
			<Save class="w-5 h-5" />
		{/if}
	</button>
{/if}

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