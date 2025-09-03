import { createId } from '@paralleldrive/cuid2';
import sharp from 'sharp';
import {
  initializeMinIOBucket,
  isMinIOAvailable,
  uploadToMinIO,
  deleteFromMinIO,
  getPresignedUrl,
  listObjects
} from './minio-client.js';

// Configuration
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
 * Initialize MinIO storage
 */
export async function initializeImageStorage(): Promise<void> {
  try {
    await initializeMinIOBucket();
    console.log('✅ MinIO image storage initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize MinIO image storage:', error);
    throw error;
  }
}

/**
 * Check if MinIO storage is available
 */
export async function isImageStorageAvailable(): Promise<boolean> {
  return await isMinIOAvailable();
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
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const id = createId();
  return `${id}.${extension}`;
}

/**
 * Get object name for MinIO storage
 */
function getObjectName(tourId: string, filename: string, size?: string): string {
  if (size && size !== 'original') {
    const extension = filename.split('.').pop();
    const nameWithoutExt = filename.replace(`.${extension}`, '');
    return `tours/${tourId}/${size}_${nameWithoutExt}.${extension}`;
  }
  return `tours/${tourId}/${filename}`;
}

/**
 * Process and save image with multiple sizes to MinIO
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
  
  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Process image with Sharp - auto-rotate based on EXIF orientation
  const image = sharp(buffer)
    .rotate(); // This automatically rotates based on EXIF orientation
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
    // Upload original with EXIF rotation applied
    const originalBuffer = await sharp(buffer)
      .rotate() // Apply EXIF rotation
      .jpeg({ quality: 95 }) // Convert to JPEG with good quality
      .toBuffer();
    
    const originalObjectName = getObjectName(tourId, sizes.original);
    await uploadToMinIO(originalBuffer, originalObjectName, 'image/jpeg', originalBuffer.length);
    console.log(`✅ Uploaded original: ${sizes.original}`);

    // Generate and upload thumbnail
    const thumbnailBuffer = await sharp(buffer)
      .rotate() // Apply EXIF rotation
      .resize(IMAGE_SIZES.thumbnail.width, IMAGE_SIZES.thumbnail.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    const thumbnailObjectName = getObjectName(tourId, filename, 'thumb');
    await uploadToMinIO(thumbnailBuffer, thumbnailObjectName, 'image/jpeg', thumbnailBuffer.length);
    console.log(`✅ Uploaded thumbnail: ${sizes.thumbnail}`);

    // Generate and upload medium size
    const mediumBuffer = await sharp(buffer)
      .rotate() // Apply EXIF rotation
      .resize(IMAGE_SIZES.medium.width, IMAGE_SIZES.medium.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    const mediumObjectName = getObjectName(tourId, filename, 'med');
    await uploadToMinIO(mediumBuffer, mediumObjectName, 'image/jpeg', mediumBuffer.length);
    console.log(`✅ Uploaded medium: ${sizes.medium}`);

    // Generate and upload large size
    const largeBuffer = await sharp(buffer)
      .rotate() // Apply EXIF rotation
      .resize(IMAGE_SIZES.large.width, IMAGE_SIZES.large.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 90 })
      .toBuffer();
    
    const largeObjectName = getObjectName(tourId, filename, 'large');
    await uploadToMinIO(largeBuffer, largeObjectName, 'image/jpeg', largeBuffer.length);
    console.log(`✅ Uploaded large: ${sizes.large}`);

    console.log(`🎉 Successfully processed and uploaded all sizes for: ${filename}`);

    return {
      filename,
      originalName: file.name,
      sizes
    };

  } catch (error) {
    console.error(`❌ Image processing failed for ${filename}:`, error);
    
    // Clean up any partially uploaded files
    try {
      await deleteImage(tourId, filename);
    } catch (cleanupError) {
      console.error('❌ Failed to cleanup after processing error:', cleanupError);
    }
    
    throw new Error(`Image processing failed: ${error}`);
  }
}

/**
 * Delete image and all its sizes from MinIO
 */
export async function deleteImage(tourId: string, filename: string): Promise<void> {
  try {
    const extension = filename.split('.').pop();
    const nameWithoutExt = filename.replace(`.${extension}`, '');
    
    // Delete all sizes
    const sizes = ['original', 'thumb', 'med', 'large'];
    const deletePromises = sizes.map(size => {
      const objectName = size === 'original' 
        ? getObjectName(tourId, filename)
        : getObjectName(tourId, `${nameWithoutExt}.${extension}`, size);
      
      return deleteFromMinIO(objectName).catch(error => {
        console.warn(`⚠️ Failed to delete ${objectName}:`, error);
      });
    });

    await Promise.all(deletePromises);
    console.log(`✅ Deleted all sizes for image: ${filename}`);
  } catch (error) {
    console.error(`❌ Failed to delete image ${filename}:`, error);
    throw new Error(`Image deletion failed: ${error}`);
  }
}

/**
 * Delete multiple images
 */
export async function deleteImages(tourId: string, filenames: string[]): Promise<void> {
  const deletePromises = filenames.map(filename => 
    deleteImage(tourId, filename).catch(error => {
      console.error(`❌ Failed to delete ${filename}:`, error);
    })
  );
  
  await Promise.all(deletePromises);
}

/**
 * Get image URL - serves through SvelteKit API to avoid presigned URL issues
 */
export async function getImageUrl(
  tourId: string, 
  filename: string, 
  size: 'original' | 'thumbnail' | 'medium' | 'large' = 'medium'
): Promise<string> {
  try {
    // Return URL to SvelteKit API endpoint instead of direct MinIO presigned URL
    return `/api/images/${tourId}/${filename}?size=${size}`;
  } catch (error) {
    console.error(`❌ Failed to get image URL for ${filename}:`, error);
    throw new Error(`Failed to get image URL: ${error}`);
  }
}

/**
 * Get all size URLs for an image
 */
export async function getAllImageUrls(tourId: string, filename: string) {
  try {
    const [original, thumbnail, medium, large] = await Promise.all([
      getImageUrl(tourId, filename, 'original'),
      getImageUrl(tourId, filename, 'thumbnail'),
      getImageUrl(tourId, filename, 'medium'),
      getImageUrl(tourId, filename, 'large')
    ]);

    return {
      original,
      thumbnail,
      medium,
      large
    };
  } catch (error) {
    console.error(`❌ Failed to get all image URLs for ${filename}:`, error);
    throw new Error(`Failed to get image URLs: ${error}`);
  }
}

/**
 * List all images for a tour
 */
export async function listTourImages(tourId: string): Promise<string[]> {
  try {
    const prefix = `tours/${tourId}/`;
    const objects = await listObjects(prefix);
    
    // Filter to get only original images (not thumbnail, medium, large variants)
    const originalImages = objects
      .filter(name => name.startsWith(prefix))
      .map(name => name.replace(prefix, ''))
      .filter(name => !name.startsWith('thumb_') && !name.startsWith('med_') && !name.startsWith('large_'))
      .sort();
    
    return originalImages;
  } catch (error) {
    console.error(`❌ Failed to list images for tour ${tourId}:`, error);
    throw new Error(`Failed to list tour images: ${error}`);
  }
}

/**
 * Copy all images from one tour to another
 */
export async function copyTourImages(sourceTourId: string, targetTourId: string, imageFilenames: string[]): Promise<string[]> {
  try {
    if (!imageFilenames || imageFilenames.length === 0) {
      return [];
    }

    console.log(`📸 Copying ${imageFilenames.length} images from tour ${sourceTourId} to ${targetTourId}`);
    
    const copiedImages: string[] = [];
    const { copyObject } = await import('./minio-client.js');
    
    for (const filename of imageFilenames) {
      try {
        // Use the same filename for the copy (no need to generate new ones)
        // This preserves the original image names which is more intuitive
        
        // Copy all sizes (original, thumbnail, medium, large)
        const sizes = [
          { prefix: '' }, // original
          { prefix: 'thumb_' },
          { prefix: 'med_' },
          { prefix: 'large_' }
        ];
        
        for (const size of sizes) {
          const sourceObject = `tours/${sourceTourId}/${size.prefix}${filename}`;
          const targetObject = `tours/${targetTourId}/${size.prefix}${filename}`;
          
          try {
            await copyObject(sourceObject, targetObject);
            console.log(`✅ Copied ${sourceObject} to ${targetObject}`);
          } catch (err) {
            console.warn(`⚠️ Failed to copy size ${size.prefix} for ${filename}:`, err);
            // Continue with other sizes even if one fails
          }
        }
        
        copiedImages.push(filename);
      } catch (error) {
        console.error(`❌ Failed to copy image ${filename}:`, error);
        // Continue with other images even if one fails
      }
    }
    
    console.log(`✅ Successfully copied ${copiedImages.length} images`);
    return copiedImages;
  } catch (error) {
    console.error(`❌ Failed to copy tour images:`, error);
    // Return empty array instead of throwing to allow tour copy to continue
    return [];
  }
} 