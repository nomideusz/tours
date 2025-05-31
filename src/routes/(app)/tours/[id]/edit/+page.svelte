<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toursApi, pb } from '$lib/pocketbase.js';
	import TourForm from '$lib/components/TourForm.svelte';
	import type { Tour } from '$lib/types.js';

	let tour = $state<Tour | null>(null);
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
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

	onMount(async () => {
		if (tourId) {
			await loadTour();
		}
	});

	async function loadTour() {
		try {
			isLoading = true;
			error = null;
			tour = await toursApi.getById(tourId);
			
			if (tour) {
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
					cancellationPolicy: tour.cancellationPolicy || ''
				};
				
				// Store existing images
				existingImages = tour.images || [];
			}
		} catch (err) {
			error = 'Failed to load tour details. Please try again.';
			console.error('Error loading tour:', err);
		} finally {
			isLoading = false;
		}
	}

	function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (files) {
			const newImages = Array.from(files);
			uploadedImages = [...uploadedImages, ...newImages];
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
		if (!tour || !pb) return '';
		return pb.files.getURL(tour, imageName);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		error = null;

		try {
			// Filter out empty strings from arrays
			const cleanedData = {
				...formData,
				includedItems: formData.includedItems.filter(item => item.trim() !== ''),
				requirements: formData.requirements.filter(req => req.trim() !== '')
			};

			// If there are new images or images to delete, use FormData
			if (uploadedImages.length > 0 || imagesToDelete.length > 0) {
				const formDataWithImages = new FormData();
				
				// Add all form fields
				Object.entries(cleanedData).forEach(([key, value]) => {
					if (Array.isArray(value)) {
						// JSON fields (includedItems, requirements) need JSON strings
						if (key === 'includedItems' || key === 'requirements') {
							formDataWithImages.append(key, JSON.stringify(value));
						} else {
							// Other arrays append each item separately
							value.forEach(item => {
								formDataWithImages.append(key, String(item));
							});
						}
					} else {
						formDataWithImages.append(key, String(value));
					}
				});

				// Add existing images we want to keep (PocketBase needs explicit preservation)
				existingImages.forEach((imageName) => {
					// Don't include images that are marked for deletion
					if (!imagesToDelete.includes(imageName)) {
						formDataWithImages.append('images', imageName);
					}
				});

				// Add new images
				uploadedImages.forEach((image) => {
					formDataWithImages.append('images', image);
				});

				// Mark images for deletion (add '-' prefix)
				imagesToDelete.forEach((imageName) => {
					formDataWithImages.append('images-', imageName);
				});

				await toursApi.updateWithImages(tourId, formDataWithImages);
			} else {
				await toursApi.update(tourId, cleanedData);
			}

			goto(`/tours/${tourId}`);
		} catch (err) {
			error = 'Failed to update tour. Please try again.';
			console.error('Error updating tour:', err);
		} finally {
			isSubmitting = false;
		}
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
		<div class="flex items-center justify-center py-12">
			<div class="flex items-center gap-2 text-gray-600">
				<div class="form-spinner"></div>
				Loading tour details...
			</div>
		</div>
	{:else}
		<!-- Header -->
		<div class="flex items-center gap-4 mb-8">
			<button 
				onclick={() => goto(`/tours/${tourId}`)}
				class="button--secondary button--small"
				aria-label="Back to tour details"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Edit Tour</h1>
				<p class="text-gray-600 mt-1">Update your tour details and settings</p>
			</div>
		</div>

		{#if error}
			<div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
				<div class="flex">
					<div class="text-red-600">
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="ml-3">
						<p class="text-red-800 font-medium">Error</p>
						<p class="text-red-700 text-sm">{error}</p>
					</div>
				</div>
			</div>
		{/if}

		<TourForm
			bind:formData
			bind:uploadedImages
			{isSubmitting}
			isEdit={true}
			onSubmit={handleSubmit}
			onCancel={handleCancel}
			onImageUpload={handleImageUpload}
			onImageRemove={removeNewImage}
			{existingImages}
			onExistingImageRemove={removeExistingImage}
			{getExistingImageUrl}
		/>
	{/if}
</div> 