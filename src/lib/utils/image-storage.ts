import { writeFile, mkdir, unlink, access } from 'fs/promises';
import { existsSync, constants } from 'fs';
import path from 'path';
import { createId } from '@paralleldrive/cuid2';
import sharp from 'sharp';
import { env } from '$env/dynamic/private';

// Configuration - allow override via environment variables
const UPLOAD_DIR = env.UPLOAD_DIR || 'static/uploads';
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
 * Check if directory has write permissions
 */
async function hasWritePermission(dir: string): Promise<boolean> {
  try {
    await access(dir, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize upload directories with permission checks
 */
export async function initializeUploadDirs(): Promise<void> {
  try {
    // Check if upload directory exists and is writable
    if (!existsSync(UPLOAD_DIR)) {
      try {
        await mkdir(UPLOAD_DIR, { recursive: true });
        console.log('✅ Upload directory created:', UPLOAD_DIR);
      } catch (error) {
        console.error('❌ Failed to create upload directory:', UPLOAD_DIR);
        console.error('Error:', error);
        throw new Error(`Cannot create upload directory: ${UPLOAD_DIR}. Please check permissions.`);
      }
    }

    // Check write permissions
    const hasWriteAccess = await hasWritePermission(UPLOAD_DIR);
    if (!hasWriteAccess) {
      console.error('❌ No write permission for upload directory:', UPLOAD_DIR);
      throw new Error(`No write permission for upload directory: ${UPLOAD_DIR}. Please check file system permissions.`);
    }

    // Create tours subdirectory
    if (!existsSync(TOURS_DIR)) {
      try {
        await mkdir(TOURS_DIR, { recursive: true });
        console.log('✅ Tours directory created:', TOURS_DIR);
      } catch (error) {
        console.error('❌ Failed to create tours directory:', TOURS_DIR);
        throw new Error(`Cannot create tours directory: ${TOURS_DIR}. Please check permissions.`);
      }
    }

    console.log('✅ Upload directories initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize upload directories:', error);
    
    // In production, provide helpful error message
    if (process.env.NODE_ENV === 'production') {
      console.error(`
🚨 PRODUCTION DEPLOYMENT ERROR:
The application cannot write to the file system for image uploads.

Solutions:
1. Set UPLOAD_DIR environment variable to a writable directory
2. Ensure the container/server has write permissions to the upload directory
3. Consider using cloud storage (AWS S3, Google Cloud Storage) for production
4. Mount a volume with write permissions for uploads

Current upload directory: ${UPLOAD_DIR}
Current working directory: ${process.cwd()}
`);
    }
    
    throw error;
  }
}

/**
 * Create tour-specific directory with permission checks
 */
async function ensureTourDirectory(tourId: string): Promise<string> {
  const tourDir = path.join(TOURS_DIR, tourId);
  
  if (!existsSync(tourDir)) {
    try {
      await mkdir(tourDir, { recursive: true });
      console.log('✅ Tour directory created:', tourDir);
    } catch (error) {
      console.error('❌ Failed to create tour directory:', tourDir);
      console.error('Error:', error);
      throw new Error(`Cannot create tour directory: ${tourDir}. Please check permissions.`);
    }
  }

  // Verify write permissions
  const hasWriteAccess = await hasWritePermission(tourDir);
  if (!hasWriteAccess) {
    throw new Error(`No write permission for tour directory: ${tourDir}. Please check file system permissions.`);
  }

  return tourDir;
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

  // Generate filename
  const filename = generateImageFilename(file.name);
  
  // Ensure tour directory exists and is writable
  let tourDir: string;
  try {
    tourDir = await ensureTourDirectory(tourId);
  } catch (error) {
    console.error('Image processing failed:', error);
    throw error;
  }

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Process image with Sharp
  const image = sharp(buffer);
  const metadata = await image.metadata();
  
  console.log(`📸 Processing image: ${file.name} (${metadata.width}x${metadata.height}, ${Math.round(file.size / 1024)}KB)`);
  
  // Generate different sizes
  const sizes = {
    original: filename,
    thumbnail: `thumb_${filename}`,
    medium: `med_${filename}`,
    large: `large_${filename}`
  };

  try {
    // Save original
    const originalPath = path.join(tourDir, sizes.original);
    await writeFile(originalPath, buffer);
    console.log(`✅ Saved original: ${sizes.original}`);

    // Generate and save thumbnail
    const thumbnailPath = path.join(tourDir, sizes.thumbnail);
    await image
      .resize(IMAGE_SIZES.thumbnail.width, IMAGE_SIZES.thumbnail.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    console.log(`✅ Saved thumbnail: ${sizes.thumbnail}`);

    // Generate and save medium size
    const mediumPath = path.join(tourDir, sizes.medium);
    await image
      .resize(IMAGE_SIZES.medium.width, IMAGE_SIZES.medium.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(mediumPath);
    console.log(`✅ Saved medium: ${sizes.medium}`);

    // Generate and save large size
    const largePath = path.join(tourDir, sizes.large);
    await image
      .resize(IMAGE_SIZES.large.width, IMAGE_SIZES.large.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 90 })
      .toFile(largePath);
    console.log(`✅ Saved large: ${sizes.large}`);

    console.log(`🎉 Successfully processed all sizes for: ${filename}`);

    return {
      filename,
      originalName: file.name,
      sizes
    };

  } catch (error) {
    console.error(`❌ Image processing failed for ${filename}:`, error);
    
    // Clean up any files that might have been created
    await cleanupImageFiles(tourId, Object.values(sizes));
    
    // Provide helpful error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
      throw new Error(`Permission denied: Cannot write image files. Please check file system permissions for: ${tourDir}`);
    }
    
    throw new Error(`Image processing failed: ${errorMessage}`);
  }
}

/**
 * Delete image files from storage
 */
export async function deleteImage(tourId: string, filename: string): Promise<void> {
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
        console.log(`🗑️ Deleted: ${filename}`);
      }
    } catch (error) {
      console.error(`Failed to delete file ${filename}:`, error);
    }
  }
}

/**
 * Generate image URL for serving
 * @deprecated Use MinIO image storage instead via /api/images/ endpoint
 */
export function getImageUrl(tourId: string, filename: string, size: 'original' | 'thumbnail' | 'medium' | 'large' = 'medium'): string {
  // Redirect to MinIO API endpoint instead of file system
  return `/api/images/${tourId}/${filename}?size=${size}`;
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

/**
 * Check if image storage is available
 */
export async function isImageStorageAvailable(): Promise<boolean> {
  try {
    await initializeUploadDirs();
    return true;
  } catch {
    return false;
  }
} 