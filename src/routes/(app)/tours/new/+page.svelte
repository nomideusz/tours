<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
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
	import { createTourMutation } from '$lib/queries/mutations.js';
	
	// Onboarding utilities
	import { canActivateTours } from '$lib/utils/onboarding.js';
	
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
	
	// Get profile from layout data
	let profile = $derived(data.user);
	
	// TanStack Query client for cache invalidation
	const queryClient = useQueryClient();
	
	// Initialize create tour mutation
	const tourMutation = createTourMutation();
	
	let isSubmitting = $state(false);
	let error = $state<string | null>(form?.error || null);
	let validationErrors = $state<ValidationError[]>((form as any)?.validationErrors || []);
	let triggerValidation = $state(false);
	let showCancelModal = $state(false);
	
	// Error element reference for scrolling
	let errorElement = $state<HTMLElement>();
	
	// Scroll to error message when error appears
	$effect(() => {
		if (error && errorElement && browser) {
			// Small delay to ensure the error element is rendered
			setTimeout(() => {
				errorElement?.scrollIntoView({ 
					behavior: 'smooth', 
					block: 'center' 
				});
			}, 100);
		}
	});
	
	// Handle initial error on page load (server-side validation errors)
	$effect(() => {
		if (browser && form?.error && errorElement) {
			// Delay to ensure page is fully loaded
			setTimeout(() => {
				errorElement?.scrollIntoView({ 
					behavior: 'smooth', 
					block: 'center' 
				});
			}, 300);
		}
	});

	// Check if we should auto-activate based on URL parameter
	let shouldActivate = browser && new URLSearchParams(window.location.search).get('activate') === 'true';

	// Form data
	let formData = $state({
		name: (form as any)?.formData?.name || '',
		description: (form as any)?.formData?.description || '',
		price: (form as any)?.formData?.price || 25, // reasonable default price
		duration: (form as any)?.formData?.duration || 120, // in minutes - 2 hours is common for tours
		capacity: (form as any)?.formData?.capacity || 10, // reasonable default group size
		status: ((form as any)?.formData?.status as 'active' | 'draft') || (shouldActivate ? 'active' : 'draft'),
		categories: (form as any)?.formData?.categories || [],
		location: (form as any)?.formData?.location || '',
		includedItems: (form as any)?.formData?.includedItems || [''],
		requirements: (form as any)?.formData?.requirements || [''],
		cancellationPolicy: (form as any)?.formData?.cancellationPolicy || '',
		enablePricingTiers: (form as any)?.formData?.enablePricingTiers || false,
		pricingTiers: (form as any)?.formData?.pricingTiers || {
			adult: (form as any)?.formData?.price || 25, // default to same as price
			child: 0 // will be set automatically when child pricing is enabled
		}
	});

	// Note: Location is not auto-populated - users can choose to use profile location via "Use my location" button

	// Image upload state
	let uploadedImages: File[] = $state([]);
	let imageUploadErrors: string[] = $state([]);
	
	// Onboarding status (simplified for tour creation - payment setup not checked)
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

	// Image validation constants (matching server-side)
	const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
	const MAX_IMAGES = 6; // Maximum 6 images per tour
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
	let formCompletion = $derived.by(() => {
		const fields = [
			formData.name,
			formData.description,
			formData.location,
			formData.duration,
			formData.capacity,
			formData.price
		];
		
		const completed = fields.filter(field => field && field.toString().trim() !== '').length;
		const total = fields.length;
		const percentage = Math.round((completed / total) * 100);
		
		return {
			completed,
			total,
			percentage,
			isComplete: percentage === 100
		};
	});

	// Derived values for template
	let completionStats = $derived(formCompletion);
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
			title="New Tour"
		/>

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

	{#if error}
		<div bind:this={errorElement} class="mb-6">
			{#if (form as any)?.showUpgradeButton}
				<div class="alert-warning rounded-xl p-4">
					<div class="flex gap-3">
						<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" />
						<div class="flex-1">
							<p class="font-medium">Tour Limit Reached</p>
							<p class="text-sm mt-1">{error}</p>
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
				<ErrorAlert variant="error" title="Error" message={error} />
			{/if}
		</div>
	{/if}

			<!-- Image Upload Errors -->
			{#if imageUploadErrors.length > 0}
				<div class="alert-error mb-6 rounded-xl p-4">
					<div class="flex gap-3">
						<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" />
						<div class="flex-1">
							<p class="font-medium">Image Upload Issues</p>
							<ul class="text-sm mt-2 space-y-1">
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
				
				return async ({ result, update }) => {
					isSubmitting = false;
					triggerValidation = false;
					if (result.type === 'redirect') {
						// Give server a moment to fully complete the transaction
						await new Promise(resolve => setTimeout(resolve, 100));
						
						// Mark recent tour activity for cache invalidation on tours page
						if (browser) {
							sessionStorage.setItem('recentTourActivity', Date.now().toString());
						}
						
						// Invalidate queries to refetch with new data
						console.log('🔄 Tour created successfully, invalidating caches...');
						
						queryClient.invalidateQueries({ queryKey: queryKeys.userTours });
						queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });
						
						console.log('✅ Caches invalidated, redirecting...');
						
						// Use goto for client-side navigation with cache already invalidated
						goto(result.location);
					} else if (result.type === 'failure') {
						// Handle server errors (like file size limits)
						console.error('Form submission failed:', result);
						if (result.status === 413) {
							error = 'Upload too large. Please reduce image sizes or use fewer images. Maximum total upload size is 10MB.';
						} else {
							error = (result.data as any)?.error || 'An error occurred while creating your tour. Please try again.';
						}
						// The $effect will automatically scroll to the error
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
					serverErrors={(form as any)?.validationErrors || []}
					{triggerValidation}
					hideStatusField={false}
					{profile}
					{hasConfirmedLocation}
					{paymentStatus}
				/>
			</form>
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