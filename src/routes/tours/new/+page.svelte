<script lang="ts">
	import { goto } from '$app/navigation';
	import { toursApi } from '$lib/pocketbase.js';
	import TourForm from '$lib/components/TourForm.svelte';
	import type { Tour } from '$lib/types.js';
	import type { ValidationError } from '$lib/validation.js';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';

	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
	let uploadedImages = $state<File[]>([]);
	let validationErrors = $state<ValidationError[]>([]);

	// Form data
	let formData = $state({
		name: '',
		description: '',
		price: 10, // reasonable default price
		duration: 60, // in minutes
		capacity: 10,
		status: 'draft' as Tour['status'],
		category: '',
		location: '',
		includedItems: [''],
		requirements: [''],
		cancellationPolicy: ''
	});

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

	function removeImage(index: number) {
		uploadedImages = uploadedImages.filter((_, i) => i !== index);
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

			// Debug: Log the cleaned data
			console.log('Cleaned form data:', cleanedData);

			// If there are uploaded images, include them in the form data
			if (uploadedImages.length > 0) {
				const formDataWithImages = new FormData();
				
				// Add all form fields
				Object.entries(cleanedData).forEach(([key, value]) => {
					if (Array.isArray(value)) {
						// JSON fields (includedItems, requirements) need JSON strings
						if (key === 'includedItems' || key === 'requirements') {
							const jsonString = JSON.stringify(value);
							console.log(`${key} JSON string:`, jsonString);
							formDataWithImages.append(key, jsonString);
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

				// Add images
				uploadedImages.forEach((image, index) => {
					console.log(`Adding image ${index}:`, image.name, image.type, image.size);
					formDataWithImages.append('images', image);
				});

				// Debug: Log all FormData entries
				console.log('Final FormData entries:');
				for (const [key, value] of formDataWithImages.entries()) {
					if (value instanceof File) {
						console.log(`${key}:`, `File(${(value as File).name}, ${(value as File).type}, ${(value as File).size} bytes)`);
					} else {
						console.log(`${key}:`, value);
					}
				}

				const tour = await toursApi.createWithImages(formDataWithImages);
				// After creating tour, go to schedule to set up availability
				goto(`/tours/${tour.id}/schedule`);
			} else {
				// Test without images first
				console.log('Creating tour without images:', cleanedData);
				const tour = await toursApi.create(cleanedData);
				// After creating tour, go to schedule to set up availability
				goto(`/tours/${tour.id}/schedule`);
			}
		} catch (err) {
			error = 'Failed to create tour. Please try again.';
			console.error('Error creating tour:', err);
			// Log more details about the error
			if (err && typeof err === 'object' && 'response' in err) {
				console.error('Error response:', err.response);
			}
			if (err && typeof err === 'object' && 'data' in err) {
				console.error('Error data:', err.data);
			}
		} finally {
			isSubmitting = false;
		}
	}

	function handleCancel() {
		if (confirm('Are you sure you want to cancel? Your changes will be lost.')) {
			goto('/tours');
		}
	}
</script>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center gap-4">
			<button 
				onclick={() => goto('/tours')}
				class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
				aria-label="Back to tours"
			>
				<ArrowLeft class="h-5 w-5 text-gray-600" />
			</button>
			<div>
				<nav class="flex items-center gap-2 text-sm text-gray-600 mb-2">
					<a href="/tours" class="hover:text-primary-600">Tours</a>
					<ChevronRight class="h-3 w-3" />
					<span>Create New Tour</span>
				</nav>
				<h1 class="text-3xl font-bold text-gray-900">Create New Tour</h1>
				<p class="mt-1 text-gray-600">Set up your tour details and start receiving bookings</p>
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
				isEdit={false}
				onSubmit={handleSubmit}
				onCancel={handleCancel}
				onImageUpload={handleImageUpload}
				onImageRemove={removeImage}
				serverErrors={validationErrors}
			/>
		</div>
	</div>
</div> 