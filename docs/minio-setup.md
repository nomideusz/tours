# MinIO Setup for Image Storage

This document describes how to set up MinIO for image storage in the Zaur tour management application.

## Environment Variables

Add the following environment variables to your application:

```bash
# MinIO Configuration (for image storage)
MINIO_ENDPOINT="srv-captain--minio"  # Internal Docker service name
MINIO_PORT="9000"                    # Default MinIO port
MINIO_USE_SSL="false"                # Set to "true" if using HTTPS
MINIO_ACCESS_KEY="minioadmin"        # MinIO access key
MINIO_SECRET_KEY="minioadmin"        # MinIO secret key
MINIO_BUCKET_NAME="tour-images"      # Bucket name for storing images
```

## Development Setup

1. **Install MinIO locally** (using Docker):
   ```bash
   docker run -p 9000:9000 -p 9001:9001 \
     --name minio \
     -e "MINIO_ROOT_USER=minioadmin" \
     -e "MINIO_ROOT_PASSWORD=minioadmin" \
     minio/minio server /data --console-address ":9001"
   ```

2. **Access MinIO Console**: Visit `http://localhost:9001` and login with `minioadmin/minioadmin`

3. **Create a bucket**: Create a bucket named `tour-images` through the web interface

## Production Setup (CapRover)

1. **Deploy MinIO via CapRover**:
   - Use the one-click app store to install MinIO
   - Set custom access keys for security
   - Ensure the service is accessible as `srv-captain--minio`

2. **Update environment variables** in your main application to point to the MinIO service

## Image Storage Structure

Images are stored in MinIO with the following structure:

```
tour-images/
  tours/
    {tourId}/
      {imageId}.jpg           # Original image
      thumb_{imageId}.jpg     # Thumbnail (300x300)
      med_{imageId}.jpg       # Medium (800x600)
      large_{imageId}.jpg     # Large (1200x900)
```

## API Endpoints

- **View Image**: `GET /api/images/{tourId}/{filename}?size={size}`
  - `size` can be: `original`, `thumbnail`, `medium`, `large`
  - Returns a redirect to a presigned MinIO URL

## Benefits of MinIO

1. **Scalable**: Can handle large amounts of image data
2. **S3 Compatible**: Easy to migrate to AWS S3 if needed
3. **No File System Permissions**: Eliminates permission issues with local storage
4. **CDN Ready**: Presigned URLs can be cached and distributed
5. **Backup Friendly**: Standard object storage with replication options

## Migration from File System

The application automatically uses MinIO when the new storage utility is imported. No manual migration of existing images is required - they will be uploaded to MinIO going forward.

## Troubleshooting

1. **Connection Issues**: Ensure MinIO is running and accessible at the configured endpoint
2. **Bucket Not Found**: The application will auto-create the bucket if it doesn't exist
3. **Permission Errors**: Check that the access key has read/write permissions
4. **URL Issues**: Verify that presigned URLs are being generated correctly

## Security Considerations

1. **Change Default Credentials**: Never use `minioadmin/minioadmin` in production
2. **Use HTTPS**: Set `MINIO_USE_SSL="true"` when using HTTPS
3. **Bucket Policies**: Configure appropriate bucket policies for public/private access
4. **Network Security**: Ensure MinIO is only accessible within your private network 