# Multi-stage build for Wedding Planner App

# Stage 1: Build React frontend
FROM node:18-alpine AS client-builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json client/
COPY shared/package.json shared/package-lock.json shared/

# Install dependencies
RUN npm ci

# Copy source code
COPY client client/
COPY shared shared/

# Build client
WORKDIR /app/client
RUN npm run build

# Stage 2: Build and prepare server
FROM node:18-alpine AS server-builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json server/
COPY shared/package.json shared/package-lock.json shared/

# Install dependencies
RUN npm ci

# Copy source code
COPY server server/
COPY shared shared/

# Stage 3: Final production image
FROM node:18-alpine
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json server/

# Install production dependencies only
RUN cd server && npm ci --only=production

# Copy built client from builder stage
COPY --from=client-builder /app/client/dist client/dist

# Copy server code and compiled files from builder stage
COPY --from=server-builder /app/server/src server/src
COPY --from=server-builder /app/server/tsconfig.json server/tsconfig.json

# Copy Prisma schema and migrations
COPY server/prisma server/prisma

# Set environment
ENV NODE_ENV=production
ENV PORT=6001

# Expose port
EXPOSE 6001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:6001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]

# Start server
CMD ["sh", "-c", "cd server && npx prisma migrate deploy && npm start"]
