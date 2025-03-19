FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Simple environment setup
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies only when needed
FROM base AS deps

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies including dev dependencies
RUN npm install

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependency files from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure critters is installed for optimizeCss
RUN npm install critters --save-dev

# Inject build-time env variables
ARG NEXT_PUBLIC_PROJECT_ID
ENV NEXT_PUBLIC_PROJECT_ID=$NEXT_PUBLIC_PROJECT_ID

# Set NODE_ENV for build
ENV NODE_ENV=production

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