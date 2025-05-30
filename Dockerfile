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

WORKDIR /app

# Install pnpm in production stage
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/static ./static

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S svelte -u 1001
USER svelte

# Expose port
EXPOSE 3018

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3018

# Start the application
CMD ["node", "build"] 