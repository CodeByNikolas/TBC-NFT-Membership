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

# Install architecture-specific native dependencies for Alpine Linux (musl)
RUN if [ "$(uname -m)" = "x86_64" ]; then \
      npm install @tailwindcss/oxide-linux-x64-musl lightningcss-linux-x64-musl; \
    elif [ "$(uname -m)" = "aarch64" ]; then \
      npm install @tailwindcss/oxide-linux-arm64-musl lightningcss-linux-arm64-musl; \
    fi

# Rebuild any native modules that need compilation
RUN npm rebuild

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependency files from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy all project files (including src, hardhat, etc.)
COPY . .

# Define ARGs for environment variables
ARG NEXT_PUBLIC_PROJECT_ID
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_KEY
ARG ETHERSCAN_API_KEY
ARG POLYGONSCAN_API_KEY

# Set environment variables from ARGs
ENV NEXT_PUBLIC_PROJECT_ID=$NEXT_PUBLIC_PROJECT_ID
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY
ENV ETHERSCAN_API_KEY=$ETHERSCAN_API_KEY
ENV POLYGONSCAN_API_KEY=$POLYGONSCAN_API_KEY

# Set additional build environment
ENV NODE_ENV=production
ENV NEXT_TYPESCRIPT_CHECK=true
ENV NEXT_ESLINT_CHECK=true


# Export contract artifacts to src/contracts for the frontend, continue even if it fails
RUN cd hardhat && node scripts/exportArtifacts.js

# Build the Next.js application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Pass through ARGs that need to be available at runtime
ARG NEXT_PUBLIC_PROJECT_ID
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_KEY
ARG ETHERSCAN_API_KEY
ARG POLYGONSCAN_API_KEY

# Set environment variables from ARGs for runtime
ENV NEXT_PUBLIC_PROJECT_ID=$NEXT_PUBLIC_PROJECT_ID
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY
ENV ETHERSCAN_API_KEY=$ETHERSCAN_API_KEY
ENV POLYGONSCAN_API_KEY=$POLYGONSCAN_API_KEY

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# For Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Hardhat artifacts for contract verification
COPY --from=builder --chown=nextjs:nodejs /app/hardhat/artifacts ./hardhat/artifacts
COPY --from=builder --chown=nextjs:nodejs /app/hardhat/contracts ./hardhat/contracts
COPY --from=builder --chown=nextjs:nodejs /app/hardhat/hardhat.config.js ./hardhat/hardhat.config.js

# Use the non-root user 
USER nextjs

# Expose the port
EXPOSE 3000

# Run the application
CMD ["node", "server.js"]