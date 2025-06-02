<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toursApi, pb } from '$lib/pocketbase.js';
	import TourForm from '$lib/components/TourForm.svelte';
	import type { Tour } from '$lib/types.js';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';

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
		<div class="mb-8">
			<div class="flex items-center gap-4">
				<button 
					onclick={() => goto(`/tours/${tourId}`)}
					class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
					aria-label="Back to tour details"
				>
					<ArrowLeft class="h-5 w-5 text-gray-600" />
				</button>
				<div>
					<nav class="flex items-center gap-2 text-sm text-gray-600 mb-2">
						<a href="/tours" class="hover:text-primary-600">Tours</a>
						<ChevronRight class="h-3 w-3" />
						<a href={`/tours/${tourId}`} class="hover:text-primary-600">{tour?.name || 'Tour'}</a>
						<ChevronRight class="h-3 w-3" />
						<span>Edit Tour</span>
					</nav>
					<h1 class="text-3xl font-bold text-gray-900">Edit Tour</h1>
					<p class="mt-1 text-gray-600">Update your tour details and settings</p>
				</div>
			</div>
		</div>

		{#if error}
			<div class="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
				<div class="flex gap-3">
					<AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
					<div>
						<p class="font-medium text-red-800">Error</p>
						<p class="text-sm text-red-700 mt-1">{error}</p>
					</div>
				</div>
			</div>
		{/if}

		<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
			<div class="p-6 sm:p-8">
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
			</div>
		</div>
	{/if}
</div> 