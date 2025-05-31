<script lang="ts">
	import NumberInput from './NumberInput.svelte';
	import type { Tour } from '$lib/types.js';
	import { validateTourForm, getFieldError, hasFieldError, type ValidationError } from '$lib/validation.js';

	interface Props {
		formData: {
			name: string;
			description: string;
			price: number;
			duration: number;
			capacity: number;
			status: Tour['status'];
			category: string;
			location: string;
			includedItems: string[];
			requirements: string[];
			cancellationPolicy: string;
		};
		uploadedImages?: File[];
		isSubmitting?: boolean;
		isEdit?: boolean;
		onSubmit: (e: Event) => void;
		onCancel: () => void;
		onImageUpload?: (event: Event) => void;
		onImageRemove?: (index: number) => void;
		existingImages?: string[];
		onExistingImageRemove?: (imageName: string) => void;
		getExistingImageUrl?: (imageName: string) => string;
		// Server-side validation errors
		serverErrors?: ValidationError[];
	}

	let {
		formData = $bindable(),
		uploadedImages = $bindable([]),
		isSubmitting = false,
		isEdit = false,
		onSubmit,
		onCancel,
		onImageUpload,
		onImageRemove,
		existingImages = [],
		onExistingImageRemove,
		getExistingImageUrl,
		serverErrors = []
	}: Props = $props();

	// Client-side validation state
	let validationErrors = $state<ValidationError[]>([]);
	let hasValidated = $state(false);

	// Reactive validation - validate on form data changes after first validation attempt
	$effect(() => {
		if (hasValidated) {
			const validation = validateTourForm(formData);
			validationErrors = validation.errors;
		}
	});

	// Combine client and server errors
	let allErrors = $derived([...validationErrors, ...serverErrors]);

	function addIncludedItem() {
		formData.includedItems = [...formData.includedItems, ''];
	}

	function removeIncludedItem(index: number) {
		formData.includedItems = formData.includedItems.filter((_, i) => i !== index);
	}

	function addRequirement() {
		formData.requirements = [...formData.requirements, ''];
	}

	function removeRequirement(index: number) {
		formData.requirements = formData.requirements.filter((_, i) => i !== index);
	}

	function getImagePreview(file: File): string {
		return URL.createObjectURL(file);
	}

	function handleFormSubmit(e: Event) {
		e.preventDefault();
		hasValidated = true;
		
		// Run client-side validation
		const validation = validateTourForm(formData);
		validationErrors = validation.errors;
		
		// If validation passes, proceed with submission
		if (validation.isValid) {
			onSubmit(e);
		} else {
			// Scroll to first error
			const firstErrorField = validation.errors[0]?.field;
			if (firstErrorField) {
				const element = document.getElementById(firstErrorField);
				element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
				element?.focus();
			}
		}
	}
</script>

<form onsubmit={handleFormSubmit} novalidate class="grid grid-cols-1 lg:grid-cols-3 gap-8">
	<!-- Main form content -->
	<div class="lg:col-span-2 space-y-8">
		<!-- Basic Information -->
		<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div class="md:col-span-2">
					<label for="name" class="form-label">
						Tour Name *
					</label>
					<input
						type="text"
						id="name"
						bind:value={formData.name}
						placeholder="e.g., Historic Walking Tour of Prague"
						class="form-input {hasFieldError(allErrors, 'name') ? 'error' : ''}"
					/>
					{#if getFieldError(allErrors, 'name')}
						<p class="form-error">{getFieldError(allErrors, 'name')}</p>
					{/if}
				</div>

				<div>
					<label for="category" class="form-label">
						Category
					</label>
					<select
						id="category"
						bind:value={formData.category}
						class="form-select"
					>
						<option value="">Select category</option>
						<option value="walking">Walking Tour</option>
						<option value="food">Food Tour</option>
						<option value="cultural">Cultural Tour</option>
						<option value="historical">Historical Tour</option>
						<option value="art">Art Tour</option>
						<option value="adventure">Adventure Tour</option>
						<option value="other">Other</option>
					</select>
				</div>

				<div>
					<label for="location" class="form-label">
						Location
					</label>
					<input
						type="text"
						id="location"
						bind:value={formData.location}
						placeholder="e.g., Prague Castle Area"
						class="form-input"
					/>
				</div>

				<div class="md:col-span-2">
					<label for="description" class="form-label">
						Description *
					</label>
					<textarea
						id="description"
						bind:value={formData.description}
						rows="4"
						placeholder="Describe your tour, what makes it special, what guests will see and experience..."
						class="form-textarea {hasFieldError(allErrors, 'description') ? 'error' : ''}"
					></textarea>
					{#if getFieldError(allErrors, 'description')}
						<p class="form-error">{getFieldError(allErrors, 'description')}</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Pricing & Logistics -->
		<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-6">Pricing & Logistics</h2>
			
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<NumberInput
					id="price"
					label="Price per Person (€)"
					bind:value={formData.price}
					min={0.5}
					step={0.5}
					placeholder="0.50"
					incrementLabel="Increase price"
					decrementLabel="Decrease price"
					error={getFieldError(allErrors, 'price')}
					hasError={hasFieldError(allErrors, 'price')}
				/>

				<NumberInput
					id="duration"
					label="Duration (minutes)"
					bind:value={formData.duration}
					min={1}
					step={15}
					placeholder="60"
					incrementLabel="Increase duration"
					decrementLabel="Decrease duration"
					error={getFieldError(allErrors, 'duration')}
					hasError={hasFieldError(allErrors, 'duration')}
				/>

				<NumberInput
					id="capacity"
					label="Max Capacity"
					bind:value={formData.capacity}
					min={1}
					step={1}
					placeholder="10"
					incrementLabel="Increase capacity"
					decrementLabel="Decrease capacity"
					error={getFieldError(allErrors, 'capacity')}
					hasError={hasFieldError(allErrors, 'capacity')}
				/>
			</div>
		</div>

		<!-- What's Included -->
		<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-6">What's Included</h2>
			
			<div class="space-y-3">
				{#each formData.includedItems as item, index (index)}
					<div class="flex gap-2">
						<input
							type="text"
							bind:value={formData.includedItems[index]}
							placeholder="e.g., Professional guide, Historical insights, Photo stops"
							class="form-input flex-1"
						/>
						{#if formData.includedItems.length > 1}
							<button
								type="button"
								onclick={() => removeIncludedItem(index)}
								class="p-2 text-red-600 hover:text-red-800 transition-colors"
								aria-label="Remove included item"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						{/if}
					</div>
				{/each}
				
				<button
					type="button"
					onclick={addIncludedItem}
					class="text-sm font-medium transition-colors"
					style="color: var(--color-primary-600);"
				>
					+ Add another item
				</button>
			</div>
		</div>

		<!-- Requirements -->
		<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-6">Requirements</h2>
			
			<div class="space-y-3">
				{#each formData.requirements as requirement, index (index)}
					<div class="flex gap-2">
						<input
							type="text"
							bind:value={formData.requirements[index]}
							placeholder="e.g., Comfortable walking shoes, Basic fitness level"
							class="form-input flex-1"
						/>
						{#if formData.requirements.length > 1}
							<button
								type="button"
								onclick={() => removeRequirement(index)}
								class="p-2 text-red-600 hover:text-red-800 transition-colors"
								aria-label="Remove requirement"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						{/if}
					</div>
				{/each}
				
				<button
					type="button"
					onclick={addRequirement}
					class="text-sm font-medium transition-colors"
					style="color: var(--color-primary-600);"
				>
					+ Add another requirement
				</button>
			</div>
		</div>

		<!-- Cancellation Policy -->
		<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-6">Cancellation Policy</h2>
			
			<textarea
				bind:value={formData.cancellationPolicy}
				rows="3"
				placeholder="e.g., Free cancellation up to 24 hours before the tour. 50% refund for cancellations between 24-12 hours. No refund for cancellations within 12 hours."
				class="form-textarea"
			></textarea>
		</div>
	</div>

	<!-- Sidebar -->
	<div class="space-y-6">
		<!-- Status -->
		<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Status</h3>
			
			<div class="space-y-3">
				<label class="flex items-center cursor-pointer">
					<input
						type="radio"
						bind:group={formData.status}
						value="draft"
						class="form-radio"
					/>
					<span class="ml-3">
						<span class="text-sm font-medium text-gray-900">Draft</span>
						<p class="text-xs text-gray-500">Not visible to customers</p>
					</span>
				</label>
				
				<label class="flex items-center cursor-pointer">
					<input
						type="radio"
						bind:group={formData.status}
						value="active"
						class="form-radio"
					/>
					<span class="ml-3">
						<span class="text-sm font-medium text-gray-900">Active</span>
						<p class="text-xs text-gray-500">Available for booking</p>
					</span>
				</label>
				
				<label class="flex items-center cursor-pointer">
					<input
						type="radio"
						bind:group={formData.status}
						value="inactive"
						class="form-radio"
					/>
					<span class="ml-3">
						<span class="text-sm font-medium text-gray-900">Inactive</span>
						<p class="text-xs text-gray-500">Temporarily unavailable</p>
					</span>
				</label>
			</div>
		</div>

		<!-- Tour Images -->
		{#if onImageUpload && onImageRemove}
			<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Tour Images</h3>
				
				<!-- Existing Images (for edit mode) -->
				{#if isEdit && existingImages && existingImages.length > 0 && onExistingImageRemove && getExistingImageUrl}
					<div class="mb-6">
						<h4 class="text-sm font-medium text-gray-700 mb-3">Current Images</h4>
						<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
							{#each existingImages as imageName, index (imageName)}
								<div class="relative group">
									<img 
										src={getExistingImageUrl(imageName)} 
										alt="Tour image {index + 1}"
										class="w-full h-24 object-cover rounded-lg border border-gray-200"
									/>
									<button
										type="button"
										onclick={() => onExistingImageRemove && onExistingImageRemove(imageName)}
										class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
										aria-label="Remove image"
									>
										×
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
				
				<!-- Image Upload Area -->
				<div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
					<svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
					</svg>
					<p class="text-sm text-gray-600 mb-2">{isEdit ? 'Add more images' : 'Upload tour images'}</p>
					<p class="text-xs text-gray-500 mb-4">PNG, JPG, WebP up to 5MB each (max 10 images)</p>
					<input
						type="file"
						multiple
						accept="image/*"
						class="hidden"
						id="images"
						onchange={onImageUpload}
					/>
					<label
						for="images"
						class="button-secondary cursor-pointer"
					>
						Choose Files
					</label>
				</div>

				<!-- Image Previews -->
				{#if uploadedImages && uploadedImages.length > 0}
					<div class="mt-6">
						<h4 class="text-sm font-medium text-gray-700 mb-3">{isEdit ? 'New Images' : 'Selected Images'} ({uploadedImages.length})</h4>
						<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
							{#each uploadedImages as image, index (index)}
								<div class="relative group">
									<img 
										src={getImagePreview(image)} 
										alt="Tour preview {index + 1}"
										class="w-full h-24 object-cover rounded-lg border border-gray-200"
									/>
									<button
										type="button"
										onclick={() => onImageRemove && onImageRemove(index)}
										class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
										aria-label="Remove image"
									>
										×
									</button>
									<div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
										{image.name.length > 20 ? image.name.substring(0, 20) + '...' : image.name}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
			<div class="space-y-3">
				<button
					type="submit"
					disabled={isSubmitting}
					class="button-primary button--full-width button--gap"
				>
					{#if isSubmitting}
						<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
					{:else}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
						</svg>
					{/if}
					{isSubmitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Tour')}
				</button>
				
				<button
					type="button"
					onclick={onCancel}
					disabled={isSubmitting}
					class="button-secondary button--full-width"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
</form> 