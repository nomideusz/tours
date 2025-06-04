<script lang="ts">
	import { goto } from '$app/navigation';
	import { toursApi, qrCodesApi } from '$lib/pocketbase.js';
	import TourForm from '$lib/components/TourForm.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import type { Tour, QRCode } from '$lib/types.js';
	import type { ValidationError } from '$lib/validation.js';

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

			let tour: Tour;

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

				tour = await toursApi.createWithImages(formDataWithImages);
			} else {
				// Test without images first
				console.log('Creating tour without images:', cleanedData);
				tour = await toursApi.create(cleanedData);
			}

			// Automatically create a default QR code for the tour
			try {
				const generateUniqueCode = () => {
					const tourPrefix = tour.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'TUR';
					const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
					return `${tourPrefix}-${randomSuffix}`;
				};

				const qrData: Partial<QRCode> = {
					tour: tour.id,
					name: `${tour.name} - Main QR Code`,
					category: 'digital', // Default to digital/social category
					code: generateUniqueCode(),
					scans: 0,
					conversions: 0,
					isActive: true,
					customization: {
						color: '#000000',
						backgroundColor: '#FFFFFF',
						style: 'square'
					}
				};
				
				await qrCodesApi.create(qrData);
				console.log('Default QR code created successfully for tour:', tour.id);
			} catch (qrError) {
				// Log error but don't fail the tour creation
				console.error('Failed to create default QR code:', qrError);
				// Continue to redirect - the user can create QR codes manually later
			}

			// Show success and redirect to schedule setup
			goto(`/tours/${tour.id}/schedule?new=true`);
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
			<div class="h-px bg-gray-300 flex-1 min-w-4"></div>
			<div class="flex items-center gap-2">
				<div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-medium text-xs sm:text-sm">
					2
				</div>
				<span class="text-gray-500 hidden sm:inline">Schedule Setup</span>
				<span class="text-gray-500 sm:hidden">Schedule</span>
			</div>
			<div class="h-px bg-gray-300 flex-1 min-w-4"></div>
			<div class="flex items-center gap-2">
				<div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-medium text-xs sm:text-sm">
					3
				</div>
				<span class="text-gray-500 hidden sm:inline">Go Live</span>
				<span class="text-gray-500 sm:hidden">Live</span>
			</div>
		</div>
	</div>

	<!-- Form Container -->
	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
		<div class="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
					</svg>
				</div>
				<div>
					<h2 class="text-xl font-semibold text-gray-900">Tour Information</h2>
					<p class="text-sm text-gray-600 mt-1">Provide the basic details about your tour experience</p>
				</div>
			</div>
		</div>
		
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

	<!-- Next Steps Preview -->
	<div class="mt-8 bg-gray-50 rounded-xl border border-gray-200 p-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-3">What happens next?</h3>
		<div class="space-y-3">
			<div class="flex items-start gap-3">
				<div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
					<span class="text-xs font-medium text-blue-600">2</span>
				</div>
				<div>
					<p class="font-medium text-gray-900">Set up your schedule</p>
					<p class="text-sm text-gray-600">Define available time slots and tour dates</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<div class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mt-0.5">
					<span class="text-xs font-medium text-gray-500">3</span>
				</div>
				<div>
					<p class="font-medium text-gray-700">Generate QR codes & go live</p>
					<p class="text-sm text-gray-600">Create marketing QR codes and activate your tour</p>
				</div>
			</div>
		</div>
	</div>
</div> 