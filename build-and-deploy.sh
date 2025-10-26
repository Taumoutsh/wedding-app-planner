#!/bin/bash

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Wedding Planner - Build & Deploy${NC}"
echo -e "${BLUE}================================${NC}\n"

# Create data directory for database persistence
echo -e "${BLUE}Creating data directory...${NC}"
mkdir -p data
echo -e "${GREEN}✓ Data directory ready${NC}\n"

# Build Docker image
echo -e "${BLUE}Building Docker image...${NC}"
docker compose build --no-cache

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker image built${NC}\n"

# Start containers
echo -e "${BLUE}Starting containers...${NC}"
docker compose up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to start containers${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Containers started${NC}\n"

# Wait for services to start
sleep 3

# Show status
echo -e "${BLUE}Container Status:${NC}"
docker compose ps

echo -e "\n${GREEN}✓ Wedding Planner is deployed!${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "HTTP:  http://localhost:6001"
echo -e "HTTPS: http://localhost:6002"
echo -e "${BLUE}================================${NC}\n"

echo -e "${BLUE}Useful commands:${NC}"
echo -e "  View logs:     ${GREEN}docker compose logs -f${NC}"
echo -e "  Stop:          ${GREEN}docker compose stop${NC}"
echo -e "  Stop & remove: ${GREEN}docker compose down${NC}"
echo -e "  Rebuild:       ${GREEN}docker compose build --no-cache && docker compose up -d${NC}"
