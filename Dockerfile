# Build stage
FROM node:18-alpine as builder

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Optimize Node.js for containerized environments
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=error
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT=false
ENV NEXT_SHARP_PATH=/tmp

# Performance optimizations
ENV NEXT_WEBPACK_MEMORY_LIMIT=4096

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Install dependencies first (for better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Accept build arguments for Next.js public environment variables
ARG NEXT_PUBLIC_PROJECT_ID
ENV NEXT_PUBLIC_PROJECT_ID=$NEXT_PUBLIC_PROJECT_ID

# Build the Next.js application
RUN npm run build

# Production image, copy built app and run
FROM node:18-alpine

# Disable telemetry in production as well
ENV NEXT_TELEMETRY_DISABLED=1 
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node_modules/.bin/next", "start"] 