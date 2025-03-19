FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Optimize npm and Node.js settings
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NPM_CONFIG_LOGLEVEL=error
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT=false

# Install dependencies only when needed
FROM base AS deps

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ libc6-compat

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with specific flags for better ARM64 compatibility
RUN npm ci

# Development dependencies for build stage
FROM base AS builder
WORKDIR /app

# Optimize Node.js memory usage for faster builds
ENV NEXT_SHARP_PATH=/tmp
ENV NEXT_WEBPACK_MEMORY_LIMIT=4096

# Copy dependency files from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./

# Copy all files 
COPY . .

# Inject build-time env variables
ARG NEXT_PUBLIC_PROJECT_ID
ENV NEXT_PUBLIC_PROJECT_ID=$NEXT_PUBLIC_PROJECT_ID

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Environment variables
ENV PORT=3000

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# For Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Use the non-root user 
USER nextjs

# Expose the port
EXPOSE 3000

# Run the application
CMD ["node", "server.js"] 