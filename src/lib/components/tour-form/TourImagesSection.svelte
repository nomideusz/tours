<!--
================================================================================
TOUR IMAGES SECTION COMPONENT
================================================================================

Handles tour image upload and management:
- Displays existing images (edit mode)
- Upload new images
- Preview uploaded images
- Remove images
- Display upload errors

Extracted from TourForm.svelte to improve maintainability.
================================================================================
-->

<script lang="ts">
	import Camera from 'lucide-svelte/icons/camera';
	import Upload from 'lucide-svelte/icons/upload';
	import X from 'lucide-svelte/icons/x';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';

	interface Props {
		isEdit?: boolean;
		existingImages?: string[];
		onExistingImageRemove?: (imageName: string) => void;
		getExistingImageUrl?: (imageName: string) => string;
		uploadedImages?: File[];
		onImageUpload?: (event: Event) => void;
		onImageRemove?: (index: number) => void;
		imageUploadErrors?: string[];
	}

	let {
		isEdit = false,
		existingImages = [],
		onExistingImageRemove,
		getExistingImageUrl,
		uploadedImages = [],
		onImageUpload,
		onImageRemove,
		imageUploadErrors = []
	}: Props = $props();

	/**
	 * Generate preview URL for uploaded image file
	 */
	function getImagePreview(file: File): string {
		return URL.createObjectURL(file);
	}
</script>

{#if onImageUpload && onImageRemove}
	<div class="form-section-minimal">
		<div>

			<!-- Existing Images (for edit mode) -->
			{#if isEdit && existingImages && existingImages.length > 0 && onExistingImageRemove && getExistingImageUrl}
				<div class="mb-4 sm:mb-6">
					<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
						{#each existingImages as imageName, index (imageName)}
							<div class="relative group aspect-square">
								<img
									src={getExistingImageUrl(imageName)}
									alt="Tour image {index + 1}"
									class="w-full h-full object-cover rounded-lg"
									style="border: 1px solid var(--border-primary);"
									loading="lazy"
								/>
								<button
									type="button"
									onclick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										if (onExistingImageRemove) {
											onExistingImageRemove(imageName);
										}
									}}
									ontouchend={(e) => {
										e.preventDefault();
										e.stopPropagation();
										if (onExistingImageRemove) {
											onExistingImageRemove(imageName);
										}
									}}
									class="image-remove-btn absolute -top-2 -right-2 w-8 h-8 sm:w-6 sm:h-6 rounded-full text-sm sm:text-xs transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center z-10 shadow-sm"
									style="
										background: var(--color-error-500);
										color: white;
										touch-action: manipulation;
										-webkit-tap-highlight-color: transparent;
									"
									aria-label="Remove image"
								>
									<X class="w-3 h-3 flex-shrink-0" />
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Image Upload Area -->
			<div class="border-2 border-dashed rounded-lg p-3 sm:p-6 text-center transition-colors"
				style="border-color: var(--border-secondary); background: var(--bg-secondary);"
			>
				<p class="text-xs mb-3 hidden sm:block" style="color: var(--text-secondary);">JPEG, PNG, WebP • Max 6 images</p>

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
					class="button-secondary cursor-pointer inline-flex items-center gap-2"
					style="touch-action: manipulation; -webkit-tap-highlight-color: transparent;"
				>
					<Camera class="w-4 h-4 sm:hidden" />
					<Upload class="w-4 h-4 hidden sm:block" />
					Add Photos
				</label>
			</div>

			<!-- Image Upload Errors - Show on all screen sizes -->
			{#if imageUploadErrors && imageUploadErrors.length > 0}
				<div class="mt-4 p-3 rounded-lg" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
					<div class="flex items-start gap-2">
						<AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" style="color: var(--color-error-600);" />
						<div class="flex-1">
							<p class="text-sm font-medium" style="color: var(--color-error-900);">Upload Issues:</p>
							<ul class="text-xs mt-1 space-y-1" style="color: var(--color-error-700);">
								{#each imageUploadErrors as error}
									<li>• {error}</li>
								{/each}
							</ul>
						</div>
					</div>
				</div>
			{/if}

			<!-- Image Previews -->
			{#if uploadedImages && uploadedImages.length > 0}
				<div class="mt-4 sm:mt-6">
					<h4 class="text-sm font-medium mb-3 hidden sm:block" style="color: var(--text-primary);">{isEdit ? 'New Images' : 'Selected Images'} ({uploadedImages.length})</h4>
					<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
						{#each uploadedImages as image, index (index)}
							<div class="relative group aspect-square">
								<img
									src={getImagePreview(image)}
									alt="Tour preview {index + 1}"
									class="w-full h-full object-cover rounded-lg"
									style="border: 1px solid var(--border-primary);"
									loading="lazy"
								/>
								<button
									type="button"
									onclick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										if (onImageRemove) {
											onImageRemove(index);
										}
									}}
									ontouchend={(e) => {
										e.preventDefault();
										e.stopPropagation();
										if (onImageRemove) {
											onImageRemove(index);
										}
									}}
									class="image-remove-btn absolute -top-2 -right-2 w-8 h-8 sm:w-6 sm:h-6 rounded-full text-sm sm:text-xs transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center z-10 shadow-sm"
									style="
										background: var(--color-error-500);
										color: white;
										touch-action: manipulation;
										-webkit-tap-highlight-color: transparent;
									"
									aria-label="Remove image"
								>
									<X class="w-3 h-3 flex-shrink-0" />
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.image-remove-btn {
		transition: opacity 0.2s ease, transform 0.1s ease;
	}

	.image-remove-btn:active {
		transform: scale(0.95);
	}

	@media (hover: hover) {
		.image-remove-btn:hover {
			transform: scale(1.05);
		}
	}
</style>
