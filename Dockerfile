# Multi-stage build for Wedding Planner App

# Stage 1: Build shared types library
FROM node:22-alpine AS shared-builder
WORKDIR /app

# Copy monorepo package files (npm workspaces - single lock file at root)
COPY package.json package-lock.json ./
COPY shared/package.json shared/

# Install dependencies
RUN npm ci --verbose

# Copy shared source code
COPY shared shared/

# Build shared library
WORKDIR /app/shared
RUN npm run build

# Stage 2: Build React frontend
FROM node:22-alpine AS client-builder
WORKDIR /app

# Copy monorepo package files
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
COPY shared/package.json shared/

# Install all dependencies (including dev deps for build)
RUN npm ci --verbose

# Copy source code
COPY client client/
COPY shared shared/

# Copy built shared from previous stage
COPY --from=shared-builder /app/shared/dist shared/dist
COPY --from=shared-builder /app/shared/package.json shared/

# Build client with explicit memory settings
WORKDIR /app/client
RUN NODE_OPTIONS="--max-old-space-size=768" npm run build

# Stage 3: Install production dependencies
FROM node:22-alpine AS deps-installer
WORKDIR /app

# Copy monorepo package files (npm workspaces - single lock file at root)
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY shared/package.json shared/

# Install production dependencies only
RUN npm ci --omit=dev --verbose

# Stage 4: Final production image
FROM node:22-alpine
WORKDIR /app

# Install OpenSSL required by Prisma
RUN apk add --no-cache openssl

# Set environment
ENV NODE_ENV=production
ENV PORT=6001

# Copy package files
COPY package.json ./
COPY server/package.json server/

# Copy production dependencies from installer stage
COPY --from=deps-installer /app/node_modules node_modules
COPY --from=deps-installer /app/server/node_modules server/node_modules

# Copy built client from builder stage
COPY --from=client-builder /app/client/dist client/dist

# Copy server source code
COPY server/src server/src
COPY server/tsconfig.json server/tsconfig.json

# Copy Prisma schema and migrations
COPY server/prisma server/prisma

# Create a startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'cd /app/server' >> /app/start.sh && \
    echo 'echo "Running database migrations..."' >> /app/start.sh && \
    echo 'npx prisma migrate deploy --schema=/app/server/prisma/schema.prisma' >> /app/start.sh && \
    echo 'echo "Migrations completed!"' >> /app/start.sh && \
    echo 'echo "Starting server on port 6001..."' >> /app/start.sh && \
    echo 'npm start' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose port
EXPOSE 6001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:6001/', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)}).on('error', (e) => {throw e})"

# Start server
CMD ["/app/start.sh"]
