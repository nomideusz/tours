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
				// After creating tour, go to schedule to set up availability
				goto(`/tours/${tour.id}/schedule`);
			} else {
				const tour = await toursApi.create(cleanedData);
				// After creating tour, go to schedule to set up availability
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