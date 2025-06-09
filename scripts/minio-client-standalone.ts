import { Client } from 'minio';

// Create MinIO client
let minioClient: Client | null = null;

function getMinioConfig() {
  return {
    endPoint: process.env.MINIO_ENDPOINT || 'srv-captain--minio',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true' || false,
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
  };
}

function getBucketName() {
  return process.env.MINIO_BUCKET_NAME || 'tour-images';
}

function getMinioClient(): Client {
  if (!minioClient) {
    const config = getMinioConfig();
    minioClient = new Client(config);
  }
  return minioClient;
}

/**
 * Check if MinIO is available and accessible
 */
export async function isMinIOAvailable(): Promise<boolean> {
  try {
    const client = getMinioClient();
    const config = getMinioConfig();
    console.log(`🔌 Attempting to connect to: ${config.useSSL ? 'https' : 'http'}://${config.endPoint}:${config.port}`);
    
    const buckets = await client.listBuckets();
    console.log(`✅ Successfully connected! Found ${buckets.length} buckets.`);
    return true;
  } catch (error: any) {
    console.error('❌ MinIO connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'unknown'}`);
    
    if (error.code === 'ENOTFOUND') {
      console.error('   🔍 DNS resolution failed - check the endpoint URL');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   🔍 Connection refused - check if MinIO is running and port is correct');
    } else if (error.code === 'AccessDenied' || error.message?.includes('Invalid credentials')) {
      console.error('   🔍 Authentication failed - check access key and secret key');
    } else if (error.message?.includes('SSL')) {
      console.error('   🔍 SSL/TLS issue - check if MINIO_USE_SSL setting is correct');
    }
    
    return false;
  }
}

/**
 * Initialize MinIO bucket if it doesn't exist
 */
export async function initializeMinIOBucket(): Promise<void> {
  try {
    const client = getMinioClient();
    const bucketName = getBucketName();
    
    // Check if bucket exists
    const bucketExists = await client.bucketExists(bucketName);
    
    if (!bucketExists) {
      // Create bucket
      await client.makeBucket(bucketName);
      console.log(`✅ MinIO bucket "${bucketName}" created successfully`);
    } else {
      console.log(`✅ MinIO bucket "${bucketName}" already exists`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize MinIO bucket:', error);
    throw new Error(`MinIO bucket initialization failed: ${error}`);
  }
}

export { getBucketName }; 