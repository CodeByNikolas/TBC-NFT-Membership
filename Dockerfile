FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Simple environment setup without experimental flags
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies only when needed
FROM base AS deps

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with standard flags
RUN npm install --production=false

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependency files from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install tailwindcss dependencies explicitly
RUN npm install tailwindcss postcss autoprefixer

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

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Use the non-root user 
USER nextjs

# Expose the port
EXPOSE 3000

# Run the application
CMD ["npm", "run", "start"] 