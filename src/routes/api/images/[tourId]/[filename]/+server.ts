import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params, url, fetch }) => {
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
    
    // Fetch the image from MinIO and stream it to the client
    const imageResponse = await fetch(presignedUrl);
    
    if (!imageResponse.ok) {
      console.error(`❌ Failed to fetch image from MinIO: ${imageResponse.status} ${imageResponse.statusText}`);
      throw error(404, 'Image not found');
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Determine content type
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Return the image with proper headers
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // 1 year cache
        'Content-Length': imageBuffer.byteLength.toString(),
      }
    });
    
  } catch (err) {
    console.error(`❌ Failed to serve image ${filename} for tour ${tourId}:`, err);
    throw error(404, 'Image not found');
  }
}; 