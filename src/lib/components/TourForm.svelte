<script lang="ts">
	import NumberInput from './NumberInput.svelte';
	import { validateTourForm, getFieldError, hasFieldError, type ValidationError } from '$lib/validation.js';

	interface Props {
		formData: {
			name: string;
			description: string;
			price: number;
			duration: number;
			capacity: number;
			status: 'active' | 'draft';
			category: string;
			location: string;
			includedItems: string[];
			requirements: string[];
			cancellationPolicy: string;
		};
		uploadedImages?: File[];
		isSubmitting?: boolean;
		isEdit?: boolean;
		submitButtonText?: string;

		onCancel: () => void;
		onImageUpload?: (event: Event) => void;
		onImageRemove?: (index: number) => void;
		existingImages?: string[];
		onExistingImageRemove?: (imageName: string) => void;
		getExistingImageUrl?: (imageName: string) => string;
		// Server-side validation errors
		serverErrors?: ValidationError[];
		// Validation trigger
		triggerValidation?: boolean;
		// Booking constraints for capacity validation
		bookingConstraints?: {
			maxBookedSpots: number;
			minimumCapacity: number;
			canReduceCapacity: boolean;
		};
	}

	let {
		formData = $bindable(),
		uploadedImages = $bindable([]),
		isSubmitting = false,
		isEdit = false,
		submitButtonText = '',

		onCancel,
		onImageUpload,
		onImageRemove,
		existingImages = [],
		onExistingImageRemove,
		getExistingImageUrl,
		serverErrors = [],
		triggerValidation = false,
		bookingConstraints
	}: Props = $props();

	// Client-side validation state
	let validationErrors = $state<ValidationError[]>([]);
	let touchedFields = $state<Set<string>>(new Set());

	// Reactive validation - only validate touched fields after interaction
	$effect(() => {
		if (touchedFields.size > 0) {
			const validation = validateTourForm(formData);
			// Only show errors for fields that have been touched
			validationErrors = validation.errors.filter(error => touchedFields.has(error.field));
		}
	});

	// Trigger validation when parent requests it
	$effect(() => {
		if (triggerValidation) {
			// Mark all required fields as touched when form is submitted
			touchedFields.add('name');
			touchedFields.add('description');
			touchedFields.add('price');
			touchedFields.add('duration');
			touchedFields.add('capacity');
			
			const validation = validateTourForm(formData);
			validationErrors = validation.errors;
		}
	});

	// Combine client and server errors
	let allErrors = $derived([...validationErrors, ...serverErrors]);

	// Trigger validation when form is submitted
	function handleSubmit() {
		// Mark all required fields as touched
		touchedFields.add('name');
		touchedFields.add('description');
		touchedFields.add('price');
		touchedFields.add('duration');
		touchedFields.add('capacity');
		
		const validation = validateTourForm(formData);
		validationErrors = validation.errors;
	}

	// Trigger validation for specific field on blur
	function validateField(fieldName: string) {
		// Mark this field as touched
		touchedFields.add(fieldName);
		
		// Validation will automatically run due to the reactive effect above
		// No need to manually validate here
	}

	// Export validation state for parent component
	export function isValid() {
		const validation = validateTourForm(formData);
		return validation.isValid;
	}

	export function validate() {
		// Mark all required fields as touched
		touchedFields.add('name');
		touchedFields.add('description');
		touchedFields.add('price');
		touchedFields.add('duration');
		touchedFields.add('capacity');
		
		const validation = validateTourForm(formData);
		validationErrors = validation.errors;
		return validation.isValid;
	}

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

	// Mobile-specific file input handling for better compatibility
	function triggerFileInput() {
		const fileInput = document.getElementById('images-upload') as HTMLInputElement;
		if (fileInput) {
			fileInput.click();
		}
	}


</script>

<style>
	/* Mobile touch optimization */
	.touch-manipulation {
		touch-action: manipulation;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
	}

	/* Ensure proper aspect ratio for mobile image previews */
	.aspect-square {
		aspect-ratio: 1 / 1;
	}

	/* Fallback for browsers that don't support aspect-ratio */
	@supports not (aspect-ratio: 1 / 1) {
		.aspect-square::before {
			content: '';
			display: block;
			padding-top: 100%;
		}
		
		.aspect-square > * {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
		}
	}

	/* Mobile file input enhancement */
	@media (max-width: 640px) {
		#images-upload {
			/* Ensure file input is accessible on mobile */
			opacity: 0;
			position: absolute;
			z-index: -1;
		}
		
		label[for="images-upload"] {
			/* Make label more touch-friendly on mobile */
			min-height: 44px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
		}
	}
</style>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
	<!-- Main form content -->
	<div class="lg:col-span-2 space-y-8">
		<!-- Basic Information -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<h2 class="font-semibold" style="color: var(--text-primary);">Basic Information</h2>
			</div>
			<div class="p-4">
				<!-- Hidden status field for form submission -->
				<input type="hidden" name="status" bind:value={formData.status} />
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="md:col-span-2">
						<label for="name" class="form-label">
							Tour Name *
						</label>
						<input
							type="text"
							id="name"
							name="name"
							bind:value={formData.name}
							placeholder="e.g., Historic Walking Tour of Prague"
							class="form-input {hasFieldError(allErrors, 'name') ? 'error' : ''}"
							onblur={() => validateField('name')}
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
							name="category"
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
							name="location"
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
							name="description"
							bind:value={formData.description}
							rows="4"
							placeholder="Describe your tour, what makes it special, what guests will see and experience..."
							class="form-textarea {hasFieldError(allErrors, 'description') ? 'error' : ''}"
							onblur={() => validateField('description')}
						></textarea>
						{#if getFieldError(allErrors, 'description')}
							<p class="form-error">{getFieldError(allErrors, 'description')}</p>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Pricing & Logistics -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<h2 class="font-semibold" style="color: var(--text-primary);">Pricing & Logistics</h2>
			</div>
			<div class="p-4">
			
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<NumberInput
					id="price"
					name="price"
					label="Price per Person (€)"
					bind:value={formData.price}
					min={0.5}
					max={99999}
					step={0.5}
					placeholder="0.50"
					incrementLabel="Increase price"
					decrementLabel="Decrease price"
					error={getFieldError(allErrors, 'price')}
					hasError={hasFieldError(allErrors, 'price')}
					decimalPlaces={2}
					onblur={() => validateField('price')}
				/>

				<NumberInput
					id="duration"
					name="duration"
					label="Duration (minutes)"
					bind:value={formData.duration}
					min={1}
					max={1440}
					step={1}
					placeholder="60"
					incrementLabel="Increase duration"
					decrementLabel="Decrease duration"
					error={getFieldError(allErrors, 'duration')}
					hasError={hasFieldError(allErrors, 'duration')}
					integerOnly={true}
					onblur={() => validateField('duration')}
				/>

				<NumberInput
					id="capacity"
					name="capacity"
					label="Max Capacity"
					bind:value={formData.capacity}
					min={bookingConstraints?.minimumCapacity || 1}
					max={500}
					step={1}
					placeholder="10"
					incrementLabel="Increase capacity"
					decrementLabel="Decrease capacity"
					error={getFieldError(allErrors, 'capacity')}
					hasError={hasFieldError(allErrors, 'capacity')}
					integerOnly={true}
					onblur={() => validateField('capacity')}
				/>
				{#if bookingConstraints && bookingConstraints.maxBookedSpots > 0}
					<div class="md:col-span-3 mt-2">
						<p class="text-xs" style="color: var(--text-secondary);">
							⚠️ Minimum capacity: <strong>{bookingConstraints.minimumCapacity}</strong> 
							(you have {bookingConstraints.maxBookedSpots} people booked in your busiest time slot)
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>

		<!-- What's Included -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<h2 class="font-semibold" style="color: var(--text-primary);">What's Included</h2>
			</div>
			<div class="p-4">
			
			<div class="space-y-3">
				{#each formData.includedItems as item, index (index)}
					<div class="flex gap-2">
						<input
							type="text"
							name="includedItems"
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
	</div>

		<!-- Requirements -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<h2 class="font-semibold" style="color: var(--text-primary);">Requirements</h2>
			</div>
			<div class="p-4">
			
			<div class="space-y-3">
				{#each formData.requirements as requirement, index (index)}
					<div class="flex gap-2">
						<input
							type="text"
							name="requirements"
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
	</div>

		<!-- Cancellation Policy -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<h2 class="font-semibold" style="color: var(--text-primary);">Cancellation Policy</h2>
			</div>
			<div class="p-4">
				<textarea
					bind:value={formData.cancellationPolicy}
					rows="3"
					placeholder="e.g., Free cancellation up to 24 hours before the tour. 50% refund for cancellations between 24-12 hours. No refund for cancellations within 12 hours."
					class="form-textarea"
				></textarea>
			</div>
		</div>
	</div>

	<!-- Sidebar -->
	<div class="space-y-6">
		<!-- Tour Images -->
		{#if onImageUpload && onImageRemove}
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h3 class="font-semibold" style="color: var(--text-primary);">Tour Images</h3>
				</div>
				<div class="p-4">
				
				<!-- Existing Images (for edit mode) -->
				{#if isEdit && existingImages && existingImages.length > 0 && onExistingImageRemove && getExistingImageUrl}
					<div class="mb-6">
						<h4 class="text-sm font-medium text-gray-700 mb-3">Current Images</h4>
						<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
							{#each existingImages as imageName, index (imageName)}
								<div class="relative group aspect-square">
									<img 
										src={getExistingImageUrl(imageName)} 
										alt="Tour image {index + 1}"
										class="w-full h-full object-cover rounded-lg border border-gray-200"
										loading="lazy"
									/>
									<button
										type="button"
										onclick={() => onExistingImageRemove && onExistingImageRemove(imageName)}
										class="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center touch-manipulation"
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
				<div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
					<svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
					</svg>
					<p class="text-sm text-gray-600 mb-2">{isEdit ? 'Add more images' : 'Upload tour images'}</p>
					<p class="text-xs text-gray-500 mb-4">JPEG, PNG, WebP up to 5MB each (max 10 images)</p>
					
					<!-- Mobile-optimized file input -->
					<input
						type="file"
						multiple
						accept="image/jpeg,image/jpg,image/png,image/webp"
						class="hidden"
						id="images-upload"
						name="images"
						onchange={onImageUpload}
					/>
					
					<!-- Unified upload button - works on all devices -->
					<label
						for="images-upload"
						class="button-secondary cursor-pointer inline-flex items-center gap-2 touch-manipulation"
					>
						<svg class="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						<svg class="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
						</svg>
						<span class="sm:hidden">Add Photos</span>
						<span class="hidden sm:inline">Choose Files</span>
					</label>

					<!-- Mobile instruction -->
					<div class="sm:hidden mt-3">
						<p class="text-xs text-gray-500">Tap to take photos or select from gallery</p>
					</div>
				</div>

				<!-- Image Previews -->
				{#if uploadedImages && uploadedImages.length > 0}
					<div class="mt-6">
						<h4 class="text-sm font-medium text-gray-700 mb-3">{isEdit ? 'New Images' : 'Selected Images'} ({uploadedImages.length})</h4>
						<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
							{#each uploadedImages as image, index (index)}
								<div class="relative group aspect-square">
									<img 
										src={getImagePreview(image)} 
										alt="Tour preview {index + 1}"
										class="w-full h-full object-cover rounded-lg border border-gray-200"
										loading="lazy"
									/>
									<button
										type="button"
										onclick={() => onImageRemove && onImageRemove(index)}
										class="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center touch-manipulation"
										aria-label="Remove image"
									>
										×
									</button>
									<div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
										{image.name.length > 15 ? image.name.substring(0, 15) + '...' : image.name}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
				</div>
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4">
			<div class="space-y-3">
				<button
					type="submit"
					disabled={isSubmitting}
					class="button-primary button--full-width button--gap"
				>
					{#if isSubmitting}
						<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						Saving...
					{:else}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
						</svg>
						{submitButtonText || (isEdit ? 'Save Changes' : 'Save Tour')}
					{/if}
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
</div>
</div> 