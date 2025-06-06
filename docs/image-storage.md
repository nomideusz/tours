# Image Storage System

## Overview

The application now uses a local file storage system for tour images, replacing the previous PocketBase file handling. This solution is optimized for VPS deployment and provides automatic image optimization.

## Features

- **Local File Storage**: Images stored in `static/uploads/tours/[tourId]/`
- **Multiple Image Sizes**: Automatic generation of thumbnail, medium, and large versions
- **Image Optimization**: Uses Sharp for compression and format optimization
- **Secure Serving**: Custom endpoint with proper caching headers and security validation
- **File Validation**: Size limits (5MB), type checking (JPEG, PNG, WebP)

## Directory Structure

```
static/
└── uploads/
    └── tours/
        └── [tourId]/
            ├── original_image.jpg
            ├── thumb_original_image.jpg
            ├── med_original_image.jpg
            └── large_original_image.jpg
```

## Image Sizes

- **Thumbnail**: 300x300px (square, cropped)
- **Medium**: 800x600px (fit inside, no enlargement)
- **Large**: 1200x900px (fit inside, no enlargement)
- **Original**: Unchanged dimensions

## API Endpoints

### Image Upload
- Handled in tour creation/edit forms
- Automatic processing and storage
- Validation and error handling

### Image Serving
- `GET /uploads/tours/[tourId]/[filename]`
- Proper MIME types and caching headers
- Security validation against directory traversal

## Usage

### Frontend Components
```typescript
// Get image URL
import { getImageUrl } from '$lib/utils/image-storage.js';
const imageUrl = getImageUrl(tourId, filename, 'medium');

// In Svelte components
<img src="/uploads/tours/{tourId}/{filename}" alt="Tour image" />
```

### Server-side Processing
```typescript
import { processAndSaveImage, deleteImage } from '$lib/utils/image-storage.js';

// Process uploaded file
const processed = await processAndSaveImage(file, tourId);

// Delete image
await deleteImage(tourId, filename);
```

## Configuration

### File Limits
- Max file size: 5MB
- Max images per tour: 10
- Allowed types: JPEG, PNG, WebP

### Storage Location
- Development: `static/uploads/`
- Production: Same (served by Node.js)

## Deployment Considerations

### VPS Setup
1. Ensure sufficient disk space for image storage
2. Set up proper backup strategy for `static/uploads/`
3. Consider implementing image CDN for high traffic

### Performance
- Images are served with 1-year cache headers
- Automatic compression reduces file sizes
- Multiple sizes allow responsive image loading

### Backup Strategy
```bash
# Backup images
tar -czf images-backup-$(date +%Y%m%d).tar.gz static/uploads/

# Restore images
tar -xzf images-backup-YYYYMMDD.tar.gz
```

## Security

- Filename validation prevents directory traversal
- File type validation prevents malicious uploads
- Images served through controlled endpoint
- No direct file system access from frontend

## Monitoring

### Disk Usage
Monitor `static/uploads/` directory size:
```bash
du -sh static/uploads/
```

### Error Logging
Image processing errors are logged to console with details about failed operations.

## Migration from PocketBase

The system automatically handles the transition:
- Existing tours without images continue to work
- New uploads use the local storage system
- Database `images` field stores array of filenames

## Future Enhancements

Potential improvements for high-scale deployments:
- Integration with cloud storage (AWS S3, Google Cloud Storage)
- Image CDN integration
- Advanced compression algorithms
- Automatic image format conversion (WebP, AVIF)
- Image metadata extraction and storage 