import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getImageUrl } from '$lib/utils/minio-image-storage.js';

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

    // Get presigned URL from MinIO
    const presignedUrl = await getImageUrl(tourId, filename, size);
    
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