<script lang="ts">
	import { goto } from '$app/navigation';
	import { toursApi } from '$lib/pocketbase.js';
	import TourForm from '$lib/components/TourForm.svelte';
	import type { Tour } from '$lib/types.js';
	import type { ValidationError } from '$lib/validation.js';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

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
			// Convert FileList to Array and add to existing uploaded images
			const newImages = Array.from(files);
			uploadedImages = [...uploadedImages, ...newImages];
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

			// If there are uploaded images, include them in the form data
			if (uploadedImages.length > 0) {
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

				// Add images
				uploadedImages.forEach((image) => {
					formDataWithImages.append('images', image);
				});

				const tour = await toursApi.createWithImages(formDataWithImages);
				goto(`/tours/${tour.id}/schedule`);
			} else {
				const tour = await toursApi.create(cleanedData);
				goto(`/tours/${tour.id}/schedule`);
			}
		} catch (err) {
			error = 'Failed to create tour. Please try again.';
			console.error('Error creating tour:', err);
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
	<div class="flex items-center gap-4 mb-8">
						<button 
					onclick={() => goto('/tours')}
					class="button--secondary button--small"
					aria-label="Back to tours"
				>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Create New Tour</h1>
			<p class="text-gray-600 mt-1">Set up your tour details and start receiving bookings</p>
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
			isEdit={false}
			onSubmit={handleSubmit}
			onCancel={handleCancel}
			onImageUpload={handleImageUpload}
			onImageRemove={removeImage}
			serverErrors={validationErrors}
		/>
</div> 