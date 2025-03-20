FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Simple environment setup
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies only when needed
FROM base AS deps

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat python3 make g++ py3-pip

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies including dev dependencies
# Use --ignore-scripts to avoid running build scripts that require native modules
# We'll rebuild them after all deps are installed
RUN npm install --ignore-scripts --legacy-peer-deps

# Rebuild any native modules that need compilation
RUN npm rebuild

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependency files from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy all project files (including src, hardhat, etc.)
COPY . .

# Inject build-time env variables
ARG NEXT_PUBLIC_PROJECT_ID
ENV NEXT_PUBLIC_PROJECT_ID=$NEXT_PUBLIC_PROJECT_ID

# Set NODE_ENV for build
ENV NODE_ENV=production
# Ensure type checking and linting are enabled
ENV NEXT_TYPESCRIPT_CHECK=true
ENV NEXT_ESLINT_CHECK=true

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Environment variables
ENV NODE_ENV=production
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