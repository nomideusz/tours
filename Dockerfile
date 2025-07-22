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

# Install pnpm in production stage
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/static ./static
# Copy scripts directory for production setup
COPY --from=builder /app/scripts ./scripts
# Copy source files needed by scripts
COPY --from=builder /app/src/lib/db ./src/lib/db

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S svelte -u 1001
USER svelte

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