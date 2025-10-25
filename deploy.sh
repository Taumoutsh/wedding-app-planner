#!/bin/bash

# Wedding Planner App - Deployment Script
# Usage: ./deploy.sh <domain_name> [deployment_dir]
# Example: ./deploy.sh wedding-planner.com ./deployment
# Example: ./deploy.sh api.wedding-planner.com

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Validate inputs
if [ -z "$1" ]; then
    print_error "Domain name is required"
    echo "Usage: ./deploy.sh <domain_name> [deployment_dir]"
    echo "Example: ./deploy.sh wedding-planner.com ./deployment"
    exit 1
fi

DOMAIN=$1
DEPLOYMENT_DIR=${2:-.deployment}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_NAME="wedding-planner-app"
IMAGE_TAG=$(date +%s)
NGINX_CONFIG_DIR="./nginx"

print_info "Starting deployment for domain: $DOMAIN"
print_info "Deployment directory: $DEPLOYMENT_DIR"

# Step 1: Create deployment directory
print_info "Step 1: Creating deployment directory..."
mkdir -p "$DEPLOYMENT_DIR"
print_success "Deployment directory created: $DEPLOYMENT_DIR"

# Step 2: Copy sources to deployment directory
print_info "Step 2: Copying source files..."
mkdir -p "$DEPLOYMENT_DIR/sources"

# Copy everything except node_modules and build artifacts
rsync -av \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='.turbo' \
    --exclude='*.db' \
    --exclude='*.log' \
    --exclude='.env.local' \
    --exclude='deployment' \
    "$SCRIPT_DIR/" "$DEPLOYMENT_DIR/sources/"

print_success "Source files copied to $DEPLOYMENT_DIR/sources"

# Step 3: Copy Dockerfile to deployment directory
print_info "Step 3: Copying Dockerfile..."
cp "$SCRIPT_DIR/Dockerfile" "$DEPLOYMENT_DIR/"
print_success "Dockerfile copied"

# Step 4: Build Docker image
print_info "Step 4: Building Docker image..."
cd "$DEPLOYMENT_DIR"

if docker build -t "$IMAGE_NAME:latest" -t "$IMAGE_NAME:$IMAGE_TAG" -f Dockerfile . ; then
    print_success "Docker image built successfully"
    print_info "Image tags: $IMAGE_NAME:latest, $IMAGE_NAME:$IMAGE_TAG"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Step 5: Generate nginx configuration
print_info "Step 5: Generating nginx configuration..."
mkdir -p "$DEPLOYMENT_DIR/nginx"

# Read template and replace domain
if [ -f "$SCRIPT_DIR/nginx/nginx.conf.template" ]; then
    sed "s|{{DOMAIN}}|$DOMAIN|g" "$SCRIPT_DIR/nginx/nginx.conf.template" > "$DEPLOYMENT_DIR/nginx/wedding-planner.conf"
    print_success "Nginx configuration generated: $DEPLOYMENT_DIR/nginx/wedding-planner.conf"
else
    print_error "Nginx template not found at $SCRIPT_DIR/nginx/nginx.conf.template"
    exit 1
fi

# Step 6: Create docker-compose file
print_info "Step 6: Creating docker-compose configuration..."
cat > "$DEPLOYMENT_DIR/docker-compose.yml" <<EOF
version: '3.8'

services:
  wedding-planner:
    image: $IMAGE_NAME:$IMAGE_TAG
    container_name: wedding-planner-app
    ports:
      - "6001:6001"
    environment:
      - NODE_ENV=production
      - PORT=6001
      - DATABASE_URL=file:./prisma/prod.db
    volumes:
      - ./data:/app/server/prisma
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:6001/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
EOF
print_success "docker-compose.yml created"

# Step 7: Create environment file template
print_info "Step 7: Creating .env template..."
cat > "$DEPLOYMENT_DIR/.env.example" <<EOF
# Wedding Planner App - Production Environment
NODE_ENV=production
PORT=6001
DATABASE_URL=file:./prisma/prod.db

# Update these with your actual values
JWT_SECRET=your-secret-key-here
EOF
print_success ".env.example created - copy to .env and update values"

# Step 8: Create deployment instructions
print_info "Step 8: Creating deployment instructions..."
cat > "$DEPLOYMENT_DIR/DEPLOYMENT.md" <<EOF
# Wedding Planner App - Deployment Guide

## Quick Start

1. **Navigate to deployment directory:**
   \`\`\`bash
   cd $DEPLOYMENT_DIR
   \`\`\`

2. **Copy and configure environment variables:**
   \`\`\`bash
   cp .env.example .env
   # Edit .env and update JWT_SECRET and other values
   \`\`\`

3. **Create data directory for database:**
   \`\`\`bash
   mkdir -p data
   \`\`\`

4. **Start the application with docker-compose:**
   \`\`\`bash
   docker-compose up -d
   \`\`\`

5. **Configure nginx to reverse proxy:**
   - Copy the generated nginx config to your nginx sites-available:
     \`\`\`bash
     sudo cp nginx/wedding-planner.conf /etc/nginx/sites-available/
     sudo ln -s /etc/nginx/sites-available/wedding-planner.conf /etc/nginx/sites-enabled/
     sudo nginx -t
     sudo systemctl reload nginx
     \`\`\`

## Nginx Configuration

The application is configured to run on port 6001 internally. The nginx reverse proxy (on the host) forwards requests to this port.

- **Domain:** $DOMAIN
- **Internal Port:** 6001
- **External Port:** 80 (configurable)
- **Config Location:** \`nginx/wedding-planner.conf\`

## Docker Image Details

- **Image Name:** $IMAGE_NAME
- **Latest Tag:** $IMAGE_NAME:latest
- **Build Tag:** $IMAGE_NAME:$IMAGE_TAG
- **Container Port:** 6001

## Managing the Application

**View logs:**
\`\`\`bash
docker-compose logs -f
\`\`\`

**Stop the application:**
\`\`\`bash
docker-compose down
\`\`\`

**Restart the application:**
\`\`\`bash
docker-compose restart
\`\`\`

**Rebuild and restart:**
\`\`\`bash
docker-compose down
docker build -t $IMAGE_NAME:latest .
docker-compose up -d
\`\`\`

## Database

The database is persisted in the \`data/\` directory. Ensure this directory is backed up regularly.

## Troubleshooting

**Container fails to start:**
- Check logs: \`docker-compose logs\`
- Verify .env file is configured correctly
- Ensure port 6001 is not in use

**Nginx can't connect to container:**
- Verify container is running: \`docker-compose ps\`
- Check container IP: \`docker inspect wedding-planner-app\`
- Test connection: \`curl http://localhost:6001\`

**Database errors:**
- Check permissions on data/ directory
- Verify DATABASE_URL is correct in .env
EOF
print_success "Deployment guide created: $DEPLOYMENT_DIR/DEPLOYMENT.md"

# Final summary
echo ""
print_success "Deployment package created successfully!"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Deployment Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "Domain:              $DOMAIN"
echo -e "Deployment Dir:      $DEPLOYMENT_DIR"
echo -e "Docker Image:        $IMAGE_NAME:$IMAGE_TAG"
echo -e "Container Port:      6001"
echo -e "Nginx Config:        $DEPLOYMENT_DIR/nginx/wedding-planner.conf"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review the generated files in: $DEPLOYMENT_DIR"
echo "2. Configure .env file: $DEPLOYMENT_DIR/.env"
echo "3. Copy nginx config to your nginx server"
echo "4. Run: cd $DEPLOYMENT_DIR && docker-compose up -d"
echo "5. Verify: curl http://localhost:6001"
echo ""
echo -e "For detailed instructions, see: ${BLUE}$DEPLOYMENT_DIR/DEPLOYMENT.md${NC}"
echo ""
