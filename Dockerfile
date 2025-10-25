# Multi-stage build for Wedding Planner App

# Stage 1: Build React frontend
FROM node:22-alpine AS client-builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json client/
COPY shared/package.json shared/package-lock.json shared/

# Install dependencies with optimizations
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY client client/
COPY shared shared/

# Build client with memory optimization
WORKDIR /app/client
RUN NODE_OPTIONS="--max-old-space-size=512" npm run build

# Stage 2: Install production dependencies
FROM node:22-alpine AS deps-installer
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json server/
COPY shared/package.json shared/package-lock.json shared/

# Install production dependencies only
RUN npm ci --omit=dev --prefer-offline --no-audit

# Stage 3: Final production image
FROM node:22-alpine
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=6001

# Copy package files
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json server/

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

# Expose port
EXPOSE 6001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:6001/', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)}).on('error', (e) => {throw e})"

# Start server - no need for dumb-init with node:18-alpine as PID 1
CMD ["sh", "-c", "cd server && npx prisma migrate deploy && npm start"]
