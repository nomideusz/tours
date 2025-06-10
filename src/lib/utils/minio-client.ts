import { Client } from 'minio';
import { env } from '$env/dynamic/private';

// MinIO configuration
const MINIO_CONFIG = {
  endPoint: env.MINIO_ENDPOINT || 'srv-captain--minio',
  port: parseInt(env.MINIO_PORT || '9000'),
  useSSL: env.MINIO_USE_SSL === 'true' || false,
  accessKey: env.MINIO_ROOT_USER || 'minioadmin',
  secretKey: env.MINIO_ROOT_PASSWORD || 'minioadmin'
};

const BUCKET_NAME = env.MINIO_BUCKET_NAME || 'tour-images';

// Create MinIO client
let minioClient: Client | null = null;

function getMinioClient(): Client {
  if (!minioClient) {
    minioClient = new Client(MINIO_CONFIG);
  }
  return minioClient;
}

/**
 * Initialize MinIO bucket if it doesn't exist
 */
export async function initializeMinIOBucket(): Promise<void> {
  try {
    const client = getMinioClient();
    
    // Check if bucket exists
    const bucketExists = await client.bucketExists(BUCKET_NAME);
    
    if (!bucketExists) {
      // Create bucket
      await client.makeBucket(BUCKET_NAME);
      console.log(`✅ MinIO bucket "${BUCKET_NAME}" created successfully`);
    } else {
      console.log(`✅ MinIO bucket "${BUCKET_NAME}" already exists`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize MinIO bucket:', error);
    throw new Error(`MinIO bucket initialization failed: ${error}`);
  }
}

/**
 * Check if MinIO is available and accessible
 */
export async function isMinIOAvailable(): Promise<boolean> {
  try {
    const client = getMinioClient();
    await client.listBuckets();
    return true;
  } catch (error) {
    console.error('❌ MinIO not available:', error);
    return false;
  }
}

/**
 * Upload file to MinIO
 */
export async function uploadToMinIO(
  buffer: Buffer,
  objectName: string,
  contentType: string,
  size: number
): Promise<void> {
  try {
    const client = getMinioClient();
    await client.putObject(BUCKET_NAME, objectName, buffer, size, {
      'Content-Type': contentType
    });
    console.log(`✅ Uploaded to MinIO: ${objectName}`);
  } catch (error) {
    console.error(`❌ Failed to upload ${objectName} to MinIO:`, error);
    throw new Error(`MinIO upload failed: ${error}`);
  }
}

/**
 * Delete file from MinIO
 */
export async function deleteFromMinIO(objectName: string): Promise<void> {
  try {
    const client = getMinioClient();
    await client.removeObject(BUCKET_NAME, objectName);
    console.log(`✅ Deleted from MinIO: ${objectName}`);
  } catch (error) {
    console.error(`❌ Failed to delete ${objectName} from MinIO:`, error);
    throw new Error(`MinIO delete failed: ${error}`);
  }
}

/**
 * Get presigned URL for viewing an image
 */
export async function getPresignedUrl(objectName: string, expiry: number = 7 * 24 * 60 * 60): Promise<string> {
  try {
    const client = getMinioClient();
    const url = await client.presignedGetObject(BUCKET_NAME, objectName, expiry);
    return url;
  } catch (error) {
    console.error(`❌ Failed to get presigned URL for ${objectName}:`, error);
    throw new Error(`Failed to get presigned URL: ${error}`);
  }
}

/**
 * List objects in a directory
 */
export async function listObjects(prefix: string): Promise<string[]> {
  try {
    const client = getMinioClient();
    const objectsList: string[] = [];
    
    const stream = client.listObjects(BUCKET_NAME, prefix, true);
    
    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name) {
          objectsList.push(obj.name);
        }
      });
      
      stream.on('end', () => {
        resolve(objectsList);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error(`❌ Failed to list objects with prefix ${prefix}:`, error);
    throw new Error(`Failed to list objects: ${error}`);
  }
}

export { BUCKET_NAME }; 