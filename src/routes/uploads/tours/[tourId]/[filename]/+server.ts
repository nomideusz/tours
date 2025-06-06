import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createReadStream, existsSync, statSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';

const TOURS_DIR = path.join('static', 'uploads', 'tours');

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
};

export const GET: RequestHandler = async ({ params, request }) => {
  const { tourId, filename } = params;
  
  // Validate parameters
  if (!tourId || !filename) {
    throw error(400, 'Tour ID and filename are required');
  }

  // Validate filename to prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw error(400, 'Invalid filename');
  }

  // Construct file path
  const filePath = path.join(TOURS_DIR, tourId, filename);
  
  // Check if file exists
  if (!existsSync(filePath)) {
    throw error(404, 'Image not found');
  }

  try {
    // Get file stats
    const stats = statSync(filePath);
    if (!stats.isFile()) {
      throw error(404, 'Image not found');
    }

    // Determine MIME type
    const ext = path.extname(filename).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    // Check if client has cached version
    const ifModifiedSince = request.headers.get('if-modified-since');
    const lastModified = stats.mtime.toUTCString();
    
    if (ifModifiedSince === lastModified) {
      return new Response(null, { status: 304 });
    }

    // Create readable stream
    const stream = createReadStream(filePath);
    const readable = Readable.fromWeb(stream as any);

    // Return image with proper headers
    return new Response(readable as any, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': stats.size.toString(),
        'Last-Modified': lastModified,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'ETag': `"${stats.mtime.getTime()}-${stats.size}"`,
      }
    });

  } catch (err) {
    console.error('Error serving image:', err);
    throw error(500, 'Failed to serve image');
  }
}; 