<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import TourForm from '$lib/components/TourForm.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import type { Tour } from '$lib/types.js';
	import type { PageData, ActionData } from './$types.js';
	import type { ValidationError } from '$lib/validation.js';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let tour = $state<Tour | null>(null);
	let isLoading = $state(false); // Data is loaded server-side
	let isSubmitting = $state(false);
	let error = $state<string | null>(form?.error || null);
	let validationErrors = $state<ValidationError[]>((form as any)?.validationErrors || []);
	let uploadedImages = $state<File[]>([]);
	let existingImages = $state<string[]>([]);
	let imagesToDelete = $state<string[]>([]);

	let tourId = $derived($page.params.id);

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
		cancellationPolicy: ''
	});

	onMount(() => {
		if (data.tour) {
			initializeTour();
		}
	});

	function initializeTour() {
		if (data.tour) {
			tour = data.tour as any;
			
			// Populate form data with existing tour data
			formData = {
				name: data.tour.name || '',
				description: data.tour.description || '',
				price: data.tour.price || 0,
				duration: data.tour.duration || 60,
				capacity: data.tour.capacity || 10,
				status: data.tour.status || 'draft',
				category: data.tour.category || '',
				location: data.tour.location || '',
				includedItems: data.tour.includedItems && data.tour.includedItems.length > 0 ? data.tour.includedItems : [''],
				requirements: data.tour.requirements && data.tour.requirements.length > 0 ? data.tour.requirements : [''],
				cancellationPolicy: data.tour.cancellationPolicy || ''
			};
			
			// Store existing images
			existingImages = data.tour.images || [];
		}
	}

	function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (files) {
			// Define allowed file types (must match PocketBase schema)
			const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
			const maxFileSize = 5 * 1024 * 1024; // 5MB limit
			
			// Filter valid files and show errors for invalid ones
			const validFiles: File[] = [];
			const errors: string[] = [];
			
			Array.from(files).forEach(file => {
				if (!allowedTypes.includes(file.type.toLowerCase())) {
					errors.push(`${file.name}: Only JPEG, PNG, and WebP images are allowed`);
				} else if (file.size > maxFileSize) {
					errors.push(`${file.name}: File size must be less than 5MB`);
				} else {
					validFiles.push(file);
				}
			});
			
			// Show errors if any
			if (errors.length > 0) {
				alert('Some files were not added:\n\n' + errors.join('\n'));
			}
			
			// Add valid files
			if (validFiles.length > 0) {
				uploadedImages = [...uploadedImages, ...validFiles];
			}
			
			// Clear the input
			target.value = '';
		}
	}

	function removeNewImage(index: number) {
		uploadedImages = uploadedImages.filter((_, i) => i !== index);
	}

	function removeExistingImage(imageName: string) {
		existingImages = existingImages.filter(img => img !== imageName);
		if (!imagesToDelete.includes(imageName)) {
			imagesToDelete = [...imagesToDelete, imageName];
		}
	}

	function getExistingImageUrl(imageName: string): string {
		// For now, return empty string since images are not implemented yet
		return '';
	}

	function handleCancel() {
		if (confirm('Are you sure you want to cancel? Your changes will be lost.')) {
			goto(`/tours/${tourId}`);
		}
	}

	function getImagePreview(file: File): string {
		return URL.createObjectURL(file);
	}
</script>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	{#if isLoading}
		<PageHeader 
			title="Edit Tour"
			subtitle="Loading tour details..."
		/>
		
		<div class="rounded-xl p-8" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="flex flex-col items-center justify-center py-12">
				<div class="form-spinner mb-4"></div>
				<p class="text-center" style="color: var(--text-secondary);">Loading tour details...</p>
			</div>
		</div>
	{:else}
		<PageHeader 
			title="Edit Tour"
			subtitle="Update your tour details and settings"
			breadcrumbs={[
				{ label: 'Tours', href: '/tours' },
				{ label: tour?.name || 'Tour', href: `/tours/${tourId}` },
				{ label: 'Edit' }
			]}
			backUrl={`/tours/${tourId}`}
		/>

		{#if error}
			<div class="mb-6 rounded-xl p-4" style="background: rgb(254 226 226); border: 1px solid rgb(252 165 165);">
				<div class="flex gap-3">
					<AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
					<div>
						<p class="font-medium text-red-800">Error</p>
						<p class="text-sm text-red-700 mt-1">{error}</p>
					</div>
				</div>
			</div>
		{/if}

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
				<form method="POST" enctype="multipart/form-data" use:enhance={() => {
					isSubmitting = true;
					return async ({ result }) => {
						isSubmitting = false;
						if (result.type === 'redirect') {
							goto(result.location);
						}
					};
				}}>
					<TourForm
						bind:formData
						bind:uploadedImages
						{isSubmitting}
						isEdit={true}
						onCancel={handleCancel}
						onImageUpload={handleImageUpload}
						onImageRemove={removeNewImage}
						{existingImages}
						onExistingImageRemove={removeExistingImage}
						{getExistingImageUrl}
						serverErrors={validationErrors}
					/>
				</form>
			</div>
		</div>

		<!-- Tour Status Information -->
		<div class="mt-8 rounded-xl p-6" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<h3 class="text-lg font-semibold mb-3" style="color: var(--text-primary);">About Tour Status</h3>
			<div class="space-y-3">
				<div class="flex items-start gap-3">
					<div class="w-6 h-6 rounded-full flex items-center justify-center mt-0.5" style="background: var(--bg-tertiary);">
						<span class="text-xs font-medium" style="color: var(--text-secondary);">📝</span>
					</div>
					<div>
						<p class="font-medium" style="color: var(--text-primary);">Draft Status</p>
						<p class="text-sm" style="color: var(--text-secondary);">Your tour is not visible to customers and won't accept bookings</p>
					</div>
				</div>
				<div class="flex items-start gap-3">
					<div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
						<span class="text-xs font-medium text-green-600">🟢</span>
					</div>
					<div>
						<p class="font-medium" style="color: var(--text-primary);">Active Status</p>
						<p class="text-sm" style="color: var(--text-secondary);">Your tour is live and available for customer bookings</p>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div> 