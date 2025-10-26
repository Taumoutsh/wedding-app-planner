# Simple production build - no multi-stage complexity
FROM node:22-alpine

WORKDIR /app

# Install required dependencies
RUN apk add --no-cache openssl

# Copy everything
COPY package.json package-lock.json ./
COPY client client/
COPY server server/
COPY shared shared/

# Install dependencies
RUN npm ci

# Build shared library
RUN cd shared && npm run build && cd ..

# Build server
RUN cd server && npm run build && cd ..

# Build client
RUN cd client && npm run build && cd ..

# Create startup script that handles migrations and server start
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'cd /app/server' >> /start.sh && \
    echo 'npx prisma migrate deploy --schema ./prisma/schema.prisma 2>/dev/null || true' >> /start.sh && \
    echo 'npm start' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 6001

CMD ["/start.sh"]
