#!/bin/bash

# Wedding Planner App - Simple Build and Run Script
# Usage: ./build-and-run.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Wedding Planner - Build & Run${NC}"
echo -e "${BLUE}================================${NC}\n"

# Create data directory for database
echo -e "${BLUE}Creating data directory...${NC}"
mkdir -p data
echo -e "${GREEN}✓ Data directory ready${NC}\n"

# Build Docker images
echo -e "${BLUE}Building Docker images...${NC}"
docker-compose build --no-cache

echo -e "${GREEN}✓ Docker images built${NC}\n"

# Start containers
echo -e "${BLUE}Starting containers...${NC}"
docker-compose up -d

echo -e "${GREEN}✓ Containers started${NC}\n"

# Wait a moment for services to start
sleep 3

# Show status
echo -e "${BLUE}Container Status:${NC}"
docker-compose ps

echo -e "\n${GREEN}✓ Wedding Planner is running!${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "Nginx HTTP:  http://localhost:6001"
echo -e "Nginx ALT:   http://localhost:6002"
echo -e "App:         http://localhost:3000 (internal)"
echo -e "${BLUE}================================${NC}\n"

echo -e "${BLUE}Useful commands:${NC}"
echo -e "  View logs:     ${GREEN}docker-compose logs -f${NC}"
echo -e "  Stop:          ${GREEN}docker-compose stop${NC}"
echo -e "  Stop & remove: ${GREEN}docker-compose down${NC}"
echo -e "  Rebuild:       ${GREEN}docker-compose build --no-cache && docker-compose up -d${NC}"
