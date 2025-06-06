# Deployment Guide

## Overview

This guide covers deploying the Zaur Tours application in production environments, with special attention to common issues like image upload permissions.

## Common Deployment Issues

### Image Upload Permission Errors

**Error**: `EACCES: permission denied, mkdir 'static/uploads/tours/[tourId]'`

**Cause**: The application cannot write to the file system for image uploads.

**Solutions**:

#### Option 1: Fix File System Permissions (Recommended for VPS)

```bash
# Create upload directory with proper permissions
mkdir -p static/uploads/tours
chmod 755 static/uploads
chmod 755 static/uploads/tours

# For containers, ensure the user has write access
chown -R node:node static/uploads
# OR
chown -R 1001:1001 static/uploads  # if using non-root user in container
```

#### Option 2: Use Custom Upload Directory

Set the `UPLOAD_DIR` environment variable to a writable directory:

```bash
# Environment variable
export UPLOAD_DIR="/var/app/uploads"

# Or in Docker
docker run -e UPLOAD_DIR="/var/app/uploads" -v /host/uploads:/var/app/uploads your-app
```

#### Option 3: Docker Volume Mounting

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    image: your-app
    volumes:
      - uploads:/app/static/uploads
    environment:
      - UPLOAD_DIR=/app/static/uploads

volumes:
  uploads:
    driver: local
```

#### Option 4: Cloud Storage (Production Recommended)

For high-scale production deployments, consider integrating cloud storage:
- AWS S3
- Google Cloud Storage
- Cloudflare R2
- DigitalOcean Spaces

## Deployment Platforms

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Create upload directory with proper permissions
RUN mkdir -p static/uploads/tours && \
    chown -R node:node static/uploads

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy app files
COPY . .

# Switch to non-root user
USER node

# Build app
RUN npm run build

EXPOSE 3000
CMD ["node", "build"]
```

### VPS/Server Deployment

```bash
# 1. Clone repository
git clone https://github.com/your-repo/zaur-tours.git
cd zaur-tours

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your production values

# 4. Create upload directories
mkdir -p static/uploads/tours
chmod -R 755 static/uploads

# 5. Build application
pnpm run build

# 6. Set up process manager (PM2)
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Vercel Deployment

**Note**: Vercel's serverless environment doesn't support file uploads to the local file system. You'll need cloud storage.

```bash
# Install Vercel CLI
npm i -g vercel

# Set up environment variables in Vercel dashboard
# Deploy
vercel --prod
```

### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

## Environment Variables

### Required

```bash
# Database
DATABASE_URL="postgresql://username:password@host:5432/database"

# Email (Resend)
RESEND_API_KEY="re_..."

# Authentication
LUCIA_SECRET="your-32-character-secret-key"

# App URLs
PUBLIC_APP_URL="https://zaur.app"
PUBLIC_BACKEND_URL="https://z.xeon.pl"
```

### Optional

```bash
# Custom upload directory
UPLOAD_DIR="/path/to/uploads"

# Node environment
NODE_ENV="production"

# Port (default: 3000)
PORT="3000"
```

## Performance Optimization

### Image Optimization

The app automatically generates multiple image sizes:
- Thumbnail: 300x300px
- Medium: 800x600px  
- Large: 1200x900px

### Caching

Images are served with 1-year cache headers:
```
Cache-Control: public, max-age=31536000, immutable
```

### CDN Integration

For production, consider putting a CDN in front of your uploads:
```bash
# Nginx proxy example
location /uploads/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
}
```

## Security Considerations

### File Upload Security

- File type validation (JPEG, PNG, WebP only)
- File size limits (5MB per image)
- Filename sanitization
- Directory traversal prevention

### HTTPS

Always use HTTPS in production:
```bash
# Let's Encrypt with Certbot
sudo certbot --nginx -d zaur.app
```

### Environment Security

- Never commit `.env` files
- Use strong database passwords
- Rotate API keys regularly
- Enable database connection SSL

## Monitoring and Maintenance

### Health Checks

```bash
# Simple health check endpoint
curl https://zaur.app/api/health
```

### Disk Usage Monitoring

```bash
# Monitor upload directory size
du -sh static/uploads/
df -h  # Check overall disk usage
```

### Log Monitoring

```bash
# PM2 logs
pm2 logs

# Docker logs
docker logs container-name

# Application logs
tail -f logs/app.log
```

### Backup Strategy

```bash
#!/bin/bash
# backup.sh

# Database backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Image backup
tar -czf images-backup-$(date +%Y%m%d).tar.gz static/uploads/

# Upload to cloud storage
aws s3 cp backup-$(date +%Y%m%d).sql s3://your-backup-bucket/
aws s3 cp images-backup-$(date +%Y%m%d).tar.gz s3://your-backup-bucket/
```

## Troubleshooting

### Image Upload Issues

1. **Check permissions**:
   ```bash
   ls -la static/uploads/
   ```

2. **Check disk space**:
   ```bash
   df -h
   ```

3. **Check logs**:
   ```bash
   # Look for image processing errors
   grep "Image processing failed" logs/app.log
   ```

4. **Test storage availability**:
   ```bash
   # Create test file
   touch static/uploads/test.txt
   rm static/uploads/test.txt
   ```

### Database Connection Issues

1. **Check environment variables**:
   ```bash
   echo $DATABASE_URL
   ```

2. **Test connection**:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Check SSL requirements**:
   ```bash
   # Add SSL to connection string if required
   DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
   ```

### Performance Issues

1. **Check resource usage**:
   ```bash
   htop
   free -h
   iostat
   ```

2. **Optimize images**:
   - Enable image compression
   - Use WebP format
   - Implement lazy loading

3. **Database optimization**:
   - Add indexes for common queries
   - Optimize query performance
   - Consider connection pooling

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Upload directories created with proper permissions
- [ ] HTTPS enabled
- [ ] CDN configured (if applicable)
- [ ] Backup strategy implemented
- [ ] Monitoring set up
- [ ] Health checks working
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error tracking configured (Sentry, etc.)

## Support

For deployment issues:
1. Check the logs for specific error messages
2. Verify environment variables are set correctly
3. Test file system permissions
4. Consider cloud storage for high-scale deployments

Common error patterns and solutions are documented in the troubleshooting section above. 