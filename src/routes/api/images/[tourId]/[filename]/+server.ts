import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params, url }) => {
  const { tourId, filename } = params;
  
  // Validate parameters
  if (!tourId || !filename) {
    throw error(400, 'Tour ID and filename are required');
  }

  // Validate filename to prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw error(400, 'Invalid filename');
  }

  try {
    // Get size parameter from URL search params
    const sizeParam = url.searchParams.get('size');
    const size = sizeParam && ['original', 'thumbnail', 'medium', 'large'].includes(sizeParam) 
      ? sizeParam as 'original' | 'thumbnail' | 'medium' | 'large'
      : 'medium';

    // Get the object name for MinIO
    const extension = filename.split('.').pop();
    const nameWithoutExt = filename.replace(`.${extension}`, '');
    
    const sizePrefix = size === 'thumbnail' ? 'thumb' : size === 'medium' ? 'med' : size;
    const objectName = size === 'original' 
      ? `tours/${tourId}/${filename}`
      : `tours/${tourId}/${sizePrefix}_${nameWithoutExt}.${extension}`;

    // Get presigned URL from MinIO using internal endpoint
    const { getPresignedUrl } = await import('$lib/utils/minio-client.js');
    const presignedUrl = await getPresignedUrl(objectName, 7 * 24 * 60 * 60);
    
    // Redirect to the presigned URL
    throw redirect(302, presignedUrl);
    
  } catch (err) {
    // SvelteKit redirects are thrown as exceptions, so we need to re-throw them
    if (err && typeof err === 'object' && 'status' in err && err.status === 302) {
      throw err; // Re-throw redirect
    }
    
    console.error(`❌ Failed to serve image ${filename} for tour ${tourId}:`, err);
    throw error(404, 'Image not found');
  }
}; 