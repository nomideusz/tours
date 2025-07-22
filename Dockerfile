# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:18-alpine AS runner

# Install dependencies for Puppeteer and Chrome
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev \
    xvfb \
    dbus \
    mesa-gl \
    mesa-egl \
    mesa-gbm \
    libxcomposite \
    libxdamage \
    libxrandr \
    libxss \
    libxtst \
    && rm -rf /var/cache/apk/*

# Create a non-root user for Chrome
RUN addgroup -g 1001 -S pptruser && adduser -u 1001 -S pptruser -G pptruser

# Tell Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/bin/chromium-browser

# Copy everything from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Change ownership to pptruser for Chrome compatibility
RUN chown -R pptruser:pptruser /app

# Create necessary directories with proper permissions
RUN mkdir -p /tmp/.cache/puppeteer && \
    chown -R pptruser:pptruser /tmp/.cache/puppeteer

# Switch to non-root user
USER pptruser

# Expose port (will be set dynamically by CapRover)
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production
# EMERGENCY: Disable auth refresh to prevent timeouts
ENV DISABLE_AUTH_REFRESH=true
# Set host to allow external connections
ENV HOST=0.0.0.0

# Start the application (PORT will be set by CapRover)
CMD ["sh", "-c", "echo 'Environment variables:' && env | grep -E '(PORT|HOST|DISABLE_AUTH_REFRESH)' && echo 'Starting with npm start...' && npm start"] 