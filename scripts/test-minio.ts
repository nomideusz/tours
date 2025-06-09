import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST before importing other modules
const envPath = resolve(process.cwd(), '.env');
const result = config({ path: envPath });

if (result.error) {
  console.log('⚠️  No .env file found, using default values');
} else {
  console.log('✅ Environment variables loaded from .env file');
}

// Import MinIO client AFTER loading environment variables
import { initializeMinIOBucket, isMinIOAvailable } from './minio-client-standalone.js';

async function testMinIOConnection() {
  console.log('🧪 Testing MinIO connection...');
  console.log('');
  console.log('Current MinIO Configuration:');
  console.log(`   Endpoint: ${process.env.MINIO_ENDPOINT || 'srv-captain--minio'} (default: srv-captain--minio)`);
  console.log(`   Port: ${process.env.MINIO_PORT || '9000'} (default: 9000)`);
  console.log(`   Use SSL: ${process.env.MINIO_USE_SSL || 'false'} (default: false)`);
  console.log(`   Access Key: ${process.env.MINIO_ACCESS_KEY ? '***set***' : 'minioadmin (default)'}`);
  console.log(`   Secret Key: ${process.env.MINIO_SECRET_KEY ? '***set***' : 'minioadmin (default)'}`);
  console.log(`   Bucket: ${process.env.MINIO_BUCKET_NAME || 'tour-images'} (default: tour-images)`);
  console.log('');
  
  try {
    // Test if MinIO is available
    console.log('📡 Checking MinIO availability...');
    const isAvailable = await isMinIOAvailable();
    
    if (!isAvailable) {
      console.error('❌ MinIO is not available. Please check:');
      console.error('   - MinIO service is running');
      console.error('   - MINIO_ENDPOINT is correct');
      console.error('   - MINIO_ACCESS_KEY and MINIO_SECRET_KEY are valid');
      process.exit(1);
    }
    
    console.log('✅ MinIO is available');
    
    // Test bucket initialization
    console.log('🪣 Initializing MinIO bucket...');
    await initializeMinIOBucket();
    console.log('✅ MinIO bucket initialized successfully');
    
    console.log('🎉 MinIO setup test completed successfully!');
    console.log('');
    console.log('MinIO Configuration:');
    console.log(`   Endpoint: ${process.env.MINIO_ENDPOINT || 'srv-captain--minio'}`);
    console.log(`   Port: ${process.env.MINIO_PORT || '9000'}`);
    console.log(`   Use SSL: ${process.env.MINIO_USE_SSL || 'false'}`);
    console.log(`   Bucket: ${process.env.MINIO_BUCKET_NAME || 'tour-images'}`);
    
  } catch (error: any) {
    console.error('❌ MinIO test failed:', error.message);
    console.error('');
    console.error('Troubleshooting steps:');
    console.error('1. Ensure MinIO is running and accessible');
    console.error('2. Check environment variables:');
    console.error('   - MINIO_ENDPOINT');
    console.error('   - MINIO_ACCESS_KEY');
    console.error('   - MINIO_SECRET_KEY');
    console.error('3. Verify network connectivity to MinIO service');
    process.exit(1);
  }
}

testMinIOConnection(); 