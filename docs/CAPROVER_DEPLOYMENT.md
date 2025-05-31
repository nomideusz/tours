# CapRover Deployment Guide

This guide will help you deploy your SvelteKit application to CapRover.

## Prerequisites

1. A CapRover server set up and running
2. CapRover CLI installed (`npm install -g caprover`)
3. Git repository with your code

## Deployment Steps

### 1. Login to CapRover
```bash
caprover login
```
Follow the prompts to connect to your CapRover instance.

### 2. Create a New App
```bash
caprover deploy
```
Or create the app through the CapRover web interface.

### 3. Deploy Your App
From your project root directory:
```bash
caprover deploy
```

## Configuration Files

This project includes the following CapRover-specific files:

- **`captain-definition`** - Main CapRover configuration file
- **`Dockerfile`** - Multi-stage Docker build optimized for SvelteKit
- **`.dockerignore`** - Excludes unnecessary files from Docker build

## Environment Variables

Set any required environment variables in the CapRover web interface under your app's settings:

- `NODE_ENV=production` (automatically set)
- `PORT=3000` (automatically set)
- Add any other environment variables your app needs (database URLs, API keys, etc.)

## Build Process

The deployment uses a multi-stage Docker build:

1. **Builder stage**: Installs dependencies and builds the SvelteKit app
2. **Runner stage**: Creates a minimal production image with only necessary files

## Port Configuration

The application runs on port 3000 by default. CapRover will automatically handle the port mapping.

## Troubleshooting

### Build Fails
- Check CapRover logs for specific error messages
- Ensure all dependencies are listed in `package.json`
- Verify the build script works locally with `pnpm run build`

### Runtime Issues
- Check application logs in CapRover dashboard
- Verify environment variables are set correctly
- Ensure your app can handle the `PORT` environment variable

### Performance
- The Dockerfile uses Alpine Linux for smaller image size
- Multi-stage build reduces final image size
- Production dependencies only in final stage

## Additional Notes

- The app uses pnpm as the package manager
- SvelteKit adapter-node is configured for Node.js deployment
- Security: Non-root user is created in the Docker container
- The static files are properly copied for SvelteKit's static asset serving

## Support

If you encounter issues, check:
1. CapRover documentation
2. SvelteKit deployment guides
3. Your application logs in the CapRover dashboard 