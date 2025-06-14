import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { Client } from 'minio';
import { env } from '$env/dynamic/private';
import { BUCKET_NAME } from '$lib/utils/minio-client.js';

// MinIO configuration - reuse the same config as minio-client
const MINIO_CONFIG = {
  endPoint: env.MINIO_ENDPOINT || 'srv-captain--minio',
  port: env.MINIO_PORT ? parseInt(env.MINIO_PORT) : undefined,
  useSSL: env.MINIO_USE_SSL === 'true' || false,
  accessKey: env.MINIO_ROOT_USER || 'minioadmin',
  secretKey: env.MINIO_ROOT_PASSWORD || 'minioadmin'
};

// Create MinIO client
let minioClient: Client | null = null;

function getMinioClient(): Client {
  if (!minioClient) {
    minioClient = new Client(MINIO_CONFIG);
  }
  return minioClient;
}

export const GET: RequestHandler = async ({ params, url }) => {
  const { userId, filename } = params;
  const size = url.searchParams.get('size') || 'medium';
  
  if (!userId || !filename) {
    throw error(400, 'Missing userId or filename');
  }

  try {
    const client = getMinioClient();
    
    // Construct object name based on size
    let objectName: string;
    if (size === 'original') {
      objectName = `avatars/${userId}/${filename}`;
    } else {
      const extension = filename.split('.').pop();
      const nameWithoutExt = filename.replace(`.${extension}`, '');
      // Map size names to match upload convention
      const sizePrefix = size === 'medium' ? 'med' : 
                        size === 'thumbnail' ? 'thumb' : 
                        size;
      objectName = `avatars/${userId}/${sizePrefix}_${nameWithoutExt}.${extension}`;
    }
    
    console.log(`📸 Serving avatar: ${objectName}`);
    
    // Get object from MinIO
    const stream = await client.getObject(BUCKET_NAME, objectName);
    
    // Convert stream to buffer
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        
        // Determine content type based on file extension
        const extension = filename.split('.').pop()?.toLowerCase();
        let contentType = 'image/jpeg'; // default
        
        switch (extension) {
          case 'png':
            contentType = 'image/png';
            break;
          case 'webp':
            contentType = 'image/webp';
            break;
          case 'jpg':
          case 'jpeg':
          default:
            contentType = 'image/jpeg';
            break;
        }
        
        resolve(new Response(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
            'Content-Length': buffer.length.toString()
          }
        }));
      });
      
      stream.on('error', (err: Error) => {
        console.error('❌ Error streaming avatar:', err);
        reject(error(500, 'Failed to serve avatar'));
      });
    });
    
  } catch (err: any) {
    console.error('❌ Failed to get avatar from MinIO:', err);
    
    // Check if it's a "NoSuchKey" error (file doesn't exist)
    if (err.code === 'NoSuchKey') {
      console.log(`🔍 Avatar not found: ${userId}/${filename}`);
      throw error(404, 'Avatar not found');
    }
    
    // For other errors, return 500
    throw error(500, 'Failed to serve avatar');
  }
}; 