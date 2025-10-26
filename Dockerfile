FROM node:22-alpine

WORKDIR /app

# Install required packages
RUN apk add --no-cache openssl

# Copy package files
COPY package.json package-lock.json ./
COPY client ./client
COPY server ./server
COPY shared ./shared

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate --schema=./server/prisma/schema.prisma

# Build shared package
RUN cd shared && npm run build && cd ..

# Build server
RUN cd server && npm run build && cd ..

# Build client
RUN cd client && npm run build && cd ..

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'set -e' >> /start.sh && \
    echo 'cd /app/server' >> /start.sh && \
    echo 'echo "Running Prisma migrations..."' >> /start.sh && \
    echo 'npx prisma migrate deploy --schema ./prisma/schema.prisma || echo "Migrations failed or already applied"' >> /start.sh && \
    echo 'echo "Starting server..."' >> /start.sh && \
    echo 'npm start' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 3000

CMD ["/start.sh"]
