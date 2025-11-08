/**
 * Composable for managing tour image uploads
 * Handles validation, upload, removal, and error states
 */

// Image validation constants (matching server-side)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 6; // Maximum 6 images per tour
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface ImageValidationResult {
	isValid: boolean;
	error?: string;
}

export function useTourImages() {
	let uploadedImages = $state<File[]>([]);
	let existingImages = $state<string[]>([]);
	let imagesToRemove = $state<string[]>([]);
	let imageUploadErrors = $state<string[]>([]);

	/**
	 * Validate a single image file
	 */
	function validateImageFile(file: File): ImageValidationResult {
		if (!file || !(file instanceof File)) {
			return { isValid: false, error: 'Invalid file' };
		}

		if (file.size > MAX_FILE_SIZE) {
			return { isValid: false, error: `File too large (max 5MB): ${file.name}` };
		}

		if (!ALLOWED_TYPES.includes(file.type)) {
			return { isValid: false, error: `Invalid file type: ${file.name}. Allowed: JPEG, PNG, WebP` };
		}

		return { isValid: true };
	}

	/**
	 * Handle image upload event
	 */
	function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		console.log('🔍 Image upload event triggered');

		if (!target.files || target.files.length === 0) {
			console.log('❌ No files selected');
			return;
		}

		// iOS Safari workaround - ensure files are properly converted
		let newFiles: File[] = [];
		try {
			// Use FileList.item() method for better mobile compatibility
			for (let i = 0; i < target.files.length; i++) {
				const file = target.files.item(i);
				if (file) {
					// Create a new File object to ensure proper handling on mobile
					const newFile = new File([file], file.name, {
						type: file.type,
						lastModified: file.lastModified
					});
					newFiles.push(newFile);
				}
			}
		} catch (e) {
			console.error('❌ Error processing files:', e);
			// Fallback to Array.from
			newFiles = Array.from(target.files);
		}

		console.log('📁 Files from input:', newFiles.map(f => ({
			name: f.name,
			size: f.size,
			type: f.type
		})));

		const validFiles: File[] = [];
		const errors: string[] = [];

		// Calculate current total (existing + new uploaded images)
		const currentTotal = existingImages.length + uploadedImages.length;

		// Check total count limit
		if (currentTotal + newFiles.length > MAX_IMAGES) {
			errors.push(`Too many images. Maximum ${MAX_IMAGES} images allowed. You have ${currentTotal} and tried to add ${newFiles.length} more.`);
		}

		// Check total size limit (warn at 8MB to leave buffer for form data)
		const currentUploadedSize = uploadedImages.reduce((sum, file) => sum + file.size, 0);
		const newFilesSize = newFiles.reduce((sum, file) => sum + file.size, 0);
		const totalSize = currentUploadedSize + newFilesSize;
		const maxTotalSize = 8 * 1024 * 1024; // 8MB warning threshold

		if (totalSize > maxTotalSize) {
			errors.push(`Total upload size too large (${Math.round(totalSize / 1024 / 1024)}MB). Please reduce image sizes or use fewer images. Maximum recommended: 8MB total.`);
		}

		// Validate each file
		for (const file of newFiles) {
			console.log(`🔍 Validating file: ${file.name}`);

			const validation = validateImageFile(file);

			if (validation.isValid) {
				// Check for duplicates by name (both in existing and uploaded)
				const isDuplicateInUploaded = uploadedImages.some(existing => existing.name === file.name);
				const isDuplicateInExisting = existingImages.some(existing => existing.includes(file.name.split('.')[0]));

				if (!isDuplicateInUploaded && !isDuplicateInExisting) {
					validFiles.push(file);
					console.log(`✅ Added ${file.name} to valid files`);
				} else {
					errors.push(`Duplicate file: ${file.name}`);
				}
			} else {
				errors.push(validation.error!);
			}
		}

		// Only add files if we won't exceed the limit
		const remainingSlots = MAX_IMAGES - currentTotal;
		const finalFiles = validFiles.slice(0, remainingSlots);
		if (finalFiles.length < validFiles.length) {
			errors.push(`Some files were skipped to stay within the ${MAX_IMAGES} image limit.`);
		}

		console.log(`📊 Final: ${finalFiles.length} valid files, ${errors.length} errors`);

		// Update state
		uploadedImages = [...uploadedImages, ...finalFiles];
		imageUploadErrors = errors;

		// Clear the input so the same files can be selected again if needed
		target.value = '';

		// Auto-clear errors after 5 seconds
		if (errors.length > 0) {
			setTimeout(() => {
				imageUploadErrors = [];
			}, 5000);
		}
	}

	/**
	 * Remove a newly uploaded image (not yet saved)
	 */
	function removeImage(index: number) {
		console.log('🗑️ Removing new image at index:', index);
		uploadedImages = uploadedImages.filter((_, i) => i !== index);
	}

	/**
	 * Remove an existing image (mark for deletion)
	 */
	function removeExistingImage(imageName: string) {
		console.log('🗑️ Removing existing image:', imageName);
		imagesToRemove = [...imagesToRemove, imageName];
		existingImages = existingImages.filter(img => img !== imageName);
	}

	/**
	 * Initialize existing images for edit mode
	 */
	function initializeExistingImages(images: string[]) {
		// Only reset if we don't have images marked for removal
		if (imagesToRemove.length === 0) {
			existingImages = images || [];
		} else {
			console.log('🖼️ Keeping current image state due to pending removals:', imagesToRemove);
		}
	}

	/**
	 * Clear all image state
	 */
	function clearImages() {
		uploadedImages = [];
		imagesToRemove = [];
		imageUploadErrors = [];
	}

	/**
	 * Get total image count
	 */
	function getTotalImageCount(): number {
		return existingImages.length + uploadedImages.length;
	}

	return {
		// State
		get uploadedImages() { return uploadedImages },
		set uploadedImages(value: File[]) { uploadedImages = value },
		get existingImages() { return existingImages },
		set existingImages(value: string[]) { existingImages = value },
		get imagesToRemove() { return imagesToRemove },
		get imageUploadErrors() { return imageUploadErrors },

		// Methods
		handleImageUpload,
		removeImage,
		removeExistingImage,
		initializeExistingImages,
		clearImages,
		getTotalImageCount,

		// Constants
		MAX_IMAGES,
		MAX_FILE_SIZE,
		ALLOWED_TYPES
	};
}
