import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { createId } from '@paralleldrive/cuid2';
import sharp from 'sharp';

// Configuration
const UPLOAD_DIR = 'static/uploads';
const TOURS_DIR = path.join(UPLOAD_DIR, 'tours');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Image sizes for optimization
const IMAGE_SIZES = {
  thumbnail: { width: 300, height: 300 },
  medium: { width: 800, height: 600 },
  large: { width: 1200, height: 900 }
};

export interface ProcessedImage {
  filename: string;
  originalName: string;
  sizes: {
    original: string;
    thumbnail: string;
    medium: string;
    large: string;
  };
}

/**
 * Initialize upload directories
 */
export async function initializeUploadDirs(): Promise<void> {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }
    if (!existsSync(TOURS_DIR)) {
      await mkdir(TOURS_DIR, { recursive: true });
    }
    console.log('Upload directories initialized');
  } catch (error) {
    console.error('Failed to initialize upload directories:', error);
    throw error;
  }
}

/**
 * Validate uploaded file
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  if (!file || !(file instanceof File)) {
    return { isValid: false, error: 'Invalid file' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File too large (max 5MB)' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP' };
  }

  return { isValid: true };
}

/**
 * Generate unique filename while preserving extension
 */
export function generateImageFilename(originalName: string): string {
  const extension = path.extname(originalName).toLowerCase();
  const id = createId();
  return `${id}${extension}`;
}

/**
 * Process and save image with multiple sizes
 */
export async function processAndSaveImage(
  file: File, 
  tourId: string
): Promise<ProcessedImage> {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Generate filename and paths
  const filename = generateImageFilename(file.name);
  const tourDir = path.join(TOURS_DIR, tourId);
  
  // Ensure tour directory exists
  if (!existsSync(tourDir)) {
    await mkdir(tourDir, { recursive: true });
  }

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Process image with Sharp
  const image = sharp(buffer);
  const metadata = await image.metadata();
  
  // Generate different sizes
  const sizes = {
    original: filename,
    thumbnail: `thumb_${filename}`,
    medium: `med_${filename}`,
    large: `large_${filename}`
  };

  try {
    // Save original
    await writeFile(path.join(tourDir, sizes.original), buffer);

    // Generate and save thumbnail
    await image
      .resize(IMAGE_SIZES.thumbnail.width, IMAGE_SIZES.thumbnail.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(path.join(tourDir, sizes.thumbnail));

    // Generate and save medium size
    await image
      .resize(IMAGE_SIZES.medium.width, IMAGE_SIZES.medium.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(path.join(tourDir, sizes.medium));

    // Generate and save large size
    await image
      .resize(IMAGE_SIZES.large.width, IMAGE_SIZES.large.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 90 })
      .toFile(path.join(tourDir, sizes.large));

    return {
      filename,
      originalName: file.name,
      sizes
    };

  } catch (error) {
    // Clean up any files that might have been created
    await cleanupImageFiles(tourId, Object.values(sizes));
    throw new Error(`Image processing failed: ${error}`);
  }
}

/**
 * Delete image files from storage
 */
export async function deleteImage(tourId: string, filename: string): Promise<void> {
  const tourDir = path.join(TOURS_DIR, tourId);
  const sizes = [
    filename,
    `thumb_${filename}`,
    `med_${filename}`,
    `large_${filename}`
  ];

  await cleanupImageFiles(tourId, sizes);
}

/**
 * Clean up image files (helper function)
 */
async function cleanupImageFiles(tourId: string, filenames: string[]): Promise<void> {
  const tourDir = path.join(TOURS_DIR, tourId);
  
  for (const filename of filenames) {
    try {
      const filePath = path.join(tourDir, filename);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete file ${filename}:`, error);
    }
  }
}

/**
 * Generate image URL for serving
 */
export function getImageUrl(tourId: string, filename: string, size: 'original' | 'thumbnail' | 'medium' | 'large' = 'medium'): string {
  let actualFilename: string;
  
  switch (size) {
    case 'thumbnail':
      actualFilename = `thumb_${filename}`;
      break;
    case 'medium':
      actualFilename = `med_${filename}`;
      break;
    case 'large':
      actualFilename = `large_${filename}`;
      break;
    default:
      actualFilename = filename;
  }
  
  return `/uploads/tours/${tourId}/${actualFilename}`;
}

/**
 * Get all image URLs for a filename
 */
export function getAllImageUrls(tourId: string, filename: string) {
  return {
    original: getImageUrl(tourId, filename, 'original'),
    thumbnail: getImageUrl(tourId, filename, 'thumbnail'),
    medium: getImageUrl(tourId, filename, 'medium'),
    large: getImageUrl(tourId, filename, 'large')
  };
} 