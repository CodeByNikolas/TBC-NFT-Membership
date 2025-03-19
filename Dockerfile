# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files first to leverage layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Accept build arguments for Next.js public environment variables
ARG NEXT_PUBLIC_PROJECT_ID
ENV NEXT_PUBLIC_PROJECT_ID=$NEXT_PUBLIC_PROJECT_ID
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the rest of the application code
COPY . .
RUN npm run build

# Stage 2: Test (uncomment if you have tests)
# FROM builder AS test
# RUN npm test

# Production stage
FROM node:18-alpine
WORKDIR /app

# Install Python and build tools needed for native modules in production
RUN apk add --no-cache python3 make g++

# Copy package files and install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Expose port 3000
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "start"] 