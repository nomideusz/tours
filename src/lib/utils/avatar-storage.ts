import { createId } from '@paralleldrive/cuid2';
import sharp from 'sharp';
import {
  initializeMinIOBucket,
  isMinIOAvailable,
  uploadToMinIO,
  deleteFromMinIO
} from './minio-client.js';

// Configuration for avatars
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB for avatars
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Avatar sizes
const AVATAR_SIZES = {
  thumbnail: { width: 100, height: 100 },
  medium: { width: 200, height: 200 },
  large: { width: 400, height: 400 }
};

export interface ProcessedAvatar {
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
 * Validate uploaded avatar file
 */
export function validateAvatarFile(file: File): { isValid: boolean; error?: string } {
  if (!file || !(file instanceof File)) {
    return { isValid: false, error: 'Invalid file' };
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return { isValid: false, error: 'Avatar file too large (max 2MB)' };
  }

  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return { isValid: false, error: 'Invalid avatar file type. Allowed: JPEG, PNG, WebP' };
  }

  return { isValid: true };
}

/**
 * Generate unique avatar filename
 */
export function generateAvatarFilename(originalName: string): string {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const id = createId();
  return `avatar_${id}.${extension}`;
}

/**
 * Get object name for avatar storage in MinIO
 */
function getAvatarObjectName(userId: string, filename: string, size?: string): string {
  if (size && size !== 'original') {
    const extension = filename.split('.').pop();
    const nameWithoutExt = filename.replace(`.${extension}`, '');
    return `avatars/${userId}/${size}_${nameWithoutExt}.${extension}`;
  }
  return `avatars/${userId}/${filename}`;
}

/**
 * Process and save avatar with multiple sizes
 */
export async function processAndSaveAvatar(
  file: File, 
  userId: string
): Promise<ProcessedAvatar> {
  // Validate file
  const validation = validateAvatarFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Generate filename
  const filename = generateAvatarFilename(file.name);
  
  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Process image with Sharp - auto-rotate based on EXIF orientation
  const image = sharp(buffer)
    .rotate(); // This automatically rotates based on EXIF orientation
  const metadata = await image.metadata();
  
  console.log(`👤 Processing avatar: ${file.name} (${metadata.width}x${metadata.height}, ${Math.round(file.size / 1024)}KB)`);
  
  // Generate different sizes
  const sizes = {
    original: filename,
    thumbnail: `thumb_${filename}`,
    medium: `med_${filename}`,
    large: `large_${filename}`
  };

  try {
    // Upload original (cropped to square)
    const originalBuffer = await sharp(buffer)
      .rotate() // Apply EXIF rotation
      .resize(800, 800, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toBuffer();
    
    const originalObjectName = getAvatarObjectName(userId, sizes.original);
    await uploadToMinIO(originalBuffer, originalObjectName, 'image/jpeg', originalBuffer.length);
    console.log(`✅ Uploaded original avatar: ${sizes.original}`);

    // Generate and upload thumbnail (circular crop optimized)
    const thumbnailBuffer = await sharp(buffer)
      .rotate() // Apply EXIF rotation
      .resize(AVATAR_SIZES.thumbnail.width, AVATAR_SIZES.thumbnail.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    const thumbnailObjectName = getAvatarObjectName(userId, filename, 'thumb');
    await uploadToMinIO(thumbnailBuffer, thumbnailObjectName, 'image/jpeg', thumbnailBuffer.length);
    console.log(`✅ Uploaded avatar thumbnail: ${sizes.thumbnail}`);

    // Generate and upload medium size
    const mediumBuffer = await sharp(buffer)
      .rotate() // Apply EXIF rotation
      .resize(AVATAR_SIZES.medium.width, AVATAR_SIZES.medium.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    const mediumObjectName = getAvatarObjectName(userId, filename, 'med');
    await uploadToMinIO(mediumBuffer, mediumObjectName, 'image/jpeg', mediumBuffer.length);
    console.log(`✅ Uploaded avatar medium: ${sizes.medium}`);

    // Generate and upload large size
    const largeBuffer = await sharp(buffer)
      .rotate() // Apply EXIF rotation
      .resize(AVATAR_SIZES.large.width, AVATAR_SIZES.large.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toBuffer();
    
    const largeObjectName = getAvatarObjectName(userId, filename, 'large');
    await uploadToMinIO(largeBuffer, largeObjectName, 'image/jpeg', largeBuffer.length);
    console.log(`✅ Uploaded avatar large: ${sizes.large}`);

    console.log(`🎉 Successfully processed and uploaded all avatar sizes for: ${filename}`);

    return {
      filename,
      originalName: file.name,
      sizes
    };

  } catch (error) {
    console.error(`❌ Avatar processing failed for ${filename}:`, error);
    
    // Clean up any partially uploaded files
    try {
      await deleteAvatar(userId, filename);
    } catch (cleanupError) {
      console.error('❌ Failed to cleanup after avatar processing error:', cleanupError);
    }
    
    throw new Error(`Avatar processing failed: ${error}`);
  }
}

/**
 * Delete avatar and all its sizes from MinIO
 */
export async function deleteAvatar(userId: string, filename: string): Promise<void> {
  try {
    const extension = filename.split('.').pop();
    const nameWithoutExt = filename.replace(`.${extension}`, '');
    
    // Delete all sizes
    const sizes = ['original', 'thumb', 'med', 'large'];
    const deletePromises = sizes.map(size => {
      const objectName = size === 'original' 
        ? getAvatarObjectName(userId, filename)
        : getAvatarObjectName(userId, `${nameWithoutExt}.${extension}`, size);
      
      return deleteFromMinIO(objectName).catch(error => {
        console.warn(`⚠️ Failed to delete avatar ${objectName}:`, error);
      });
    });

    await Promise.all(deletePromises);
    console.log(`✅ Deleted all avatar sizes for: ${filename}`);
  } catch (error) {
    console.error(`❌ Failed to delete avatar ${filename}:`, error);
    throw new Error(`Avatar deletion failed: ${error}`);
  }
}

/**
 * Get avatar URL - serves through SvelteKit API
 */
export async function getAvatarUrl(
  userId: string, 
  filename: string, 
  size: 'original' | 'thumbnail' | 'medium' | 'large' = 'medium'
): Promise<string> {
  try {
    // Return URL to SvelteKit API endpoint for avatars
    return `/api/avatars/${userId}/${filename}?size=${size}`;
  } catch (error) {
    console.error(`❌ Failed to get avatar URL for ${filename}:`, error);
    throw new Error(`Failed to get avatar URL: ${error}`);
  }
}

/**
 * Initialize avatar storage
 */
export async function initializeAvatarStorage(): Promise<void> {
  try {
    await initializeMinIOBucket();
    console.log('✅ MinIO avatar storage initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize MinIO avatar storage:', error);
    throw error;
  }
}

/**
 * Check if avatar storage is available
 */
export async function isAvatarStorageAvailable(): Promise<boolean> {
  return await isMinIOAvailable();
} 