# Wedding Planner App - Production Deployment Guide

This document explains how to deploy the Wedding Planner application to production using Docker and nginx reverse proxy.

## Overview

The production setup consists of:

1. **Docker Container**: Runs the entire application (frontend + backend)
   - Exposes port 6001 internally
   - Uses SQLite database with persistent volume
   - Includes health checks and signal handling

2. **Nginx Reverse Proxy**: On the host machine
   - Listens on port 80 (HTTP)
   - Forwards requests to the Docker container on port 6001
   - Handles SSL/TLS termination (optional)
   - Caches static assets
   - Adds security headers

3. **Deployment Script**: Orchestrates the entire deployment
   - Copies source files
   - Builds Docker image
   - Generates nginx configuration
   - Creates docker-compose setup

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- nginx installed on the host
- Git access to the repository
- A domain name pointing to your server

### Step 1: Clone and Checkout Production Branch

```bash
git clone <repository-url>
cd wedding-planner-app
git checkout website_production
```

### Step 2: Run Deployment Script

```bash
./deploy.sh wedding-planner.com ./deployment
```

**Parameters:**
- `wedding-planner.com`: Your domain name
- `./deployment`: Target deployment directory (optional, defaults to `.deployment`)

**Example with different domain:**
```bash
./deploy.sh api.example.com /var/www/wedding-planner
```

### Step 3: Configure Environment Variables

```bash
cd deployment
cp .env.example .env
# Edit .env and update JWT_SECRET
nano .env
```

### Step 4: Start the Application

```bash
mkdir -p data  # Create database directory
docker-compose up -d
```

### Step 5: Configure Nginx

```bash
# Copy nginx configuration to your nginx sites directory
sudo cp nginx/wedding-planner.conf /etc/nginx/sites-available/wedding-planner.conf

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/wedding-planner.conf /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Architecture Details

### Docker Image Layers

The Dockerfile uses a 3-stage build process for optimization:

**Stage 1: Client Builder**
- Builds React frontend with Vite
- Outputs to `client/dist`
- ~500MB temporary layer (discarded)

**Stage 2: Server Builder**
- Installs Node.js dependencies
- Copies TypeScript source files
- ~400MB temporary layer (discarded)

**Stage 3: Production Runtime**
- ~250MB final image size
- Contains:
  - Node.js runtime
  - Built React frontend
  - Server dependencies (production only)
  - Prisma migration tools
  - dumb-init for signal handling

### Port Configuration

```
Host Machine
    ↓
Nginx (Port 80)
    ↓
Docker Container (Port 6001)
    ↓
Express Server (Internal Port)
```

The application listens on port 6001 inside the container. Nginx reverse proxy on the host forwards HTTP traffic to this port.

### Database

- **Location**: `data/` directory (persistent volume)
- **Type**: SQLite
- **Migrations**: Automatically run on container startup
- **Backup**: Backup the `data/prod.db` file

## Managing the Application

### View Logs

```bash
cd deployment
docker-compose logs -f wedding-planner
```

### Check Container Status

```bash
docker-compose ps
```

### Restart Application

```bash
docker-compose restart
```

### Stop Application

```bash
docker-compose stop
```

### Remove Application (careful!)

```bash
docker-compose down
```

### Update and Redeploy

```bash
cd deployment
# Update source if needed
./deploy.sh wedding-planner.com

# Rebuild and restart
docker-compose down
docker build -t wedding-planner-app:latest .
docker-compose up -d
```

## SSL/TLS Configuration

To enable HTTPS:

1. **Obtain SSL certificate** (using Let's Encrypt):
   ```bash
   sudo certbot certonly --standalone -d wedding-planner.com
   ```

2. **Update nginx configuration**:
   Edit `/etc/nginx/sites-available/wedding-planner.conf`:
   ```nginx
   server {
       listen 443 ssl http2;
       server_name wedding-planner.com;

       ssl_certificate /etc/letsencrypt/live/wedding-planner.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/wedding-planner.com/privkey.pem;

       # ... rest of config
   }

   # Redirect HTTP to HTTPS
   server {
       listen 80;
       server_name wedding-planner.com;
       return 301 https://$server_name$request_uri;
   }
   ```

3. **Reload nginx**:
   ```bash
   sudo systemctl reload nginx
   ```

## Environment Variables

Key environment variables in `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | production | Environment mode |
| `PORT` | 6001 | Container port |
| `DATABASE_URL` | file:./prisma/prod.db | Database connection |
| `JWT_SECRET` | (required) | Secret for JWT tokens |

## Monitoring and Health Checks

The Docker container includes health checks:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' wedding-planner-app
```

Health check endpoint:
```bash
curl http://localhost:6001/
```

## Troubleshooting

### Container Won't Start

```bash
# View detailed logs
docker-compose logs wedding-planner

# Check if port is in use
lsof -i :6001

# Try manual startup for debugging
docker run -it wedding-planner-app:latest sh
```

### Nginx Can't Connect

```bash
# Test connection from host
curl http://localhost:6001

# Check container IP
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' wedding-planner-app

# View nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Database Issues

```bash
# Check database file exists
ls -la data/prod.db

# Check permissions
chmod 755 data
chmod 644 data/prod.db

# View migration logs
docker-compose logs | grep prisma
```

### Performance Issues

```bash
# Check resource usage
docker stats wedding-planner-app

# Increase resource limits in docker-compose.yml
# Under 'wedding-planner' service:
# deploy:
#   resources:
#     limits:
#       cpus: '1'
#       memory: 512M
```

## Backup and Restore

### Backup Database

```bash
cd deployment
cp data/prod.db data/prod.db.backup
tar czf wedding-planner-backup-$(date +%Y%m%d).tar.gz data/
```

### Restore Database

```bash
cd deployment
docker-compose stop
rm data/prod.db
tar xzf wedding-planner-backup-YYYYMMDD.tar.gz
docker-compose start
```

## Security Considerations

1. **JWT Secret**: Generate a strong random secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Database**: Protect the `data/` directory:
   ```bash
   chmod 750 data
   chown appuser:appgroup data
   ```

3. **Nginx Headers**: Security headers are included by default

4. **HTTPS**: Strongly recommended for production

5. **Firewall**: Only expose ports 80/443 to the internet

## Updating the Application

To update to a new version:

1. Update source code (git pull or checkout new commit)
2. Rerun deployment script
3. Rebuild and restart:

```bash
cd deployment
docker-compose down
docker build -t wedding-planner-app:latest .
docker-compose up -d
```

## Support and Issues

For issues or questions:

1. Check logs: `docker-compose logs -f`
2. Review DEPLOYMENT.md in the deployment directory
3. Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
4. Verify configuration files are correct
5. Ensure all dependencies are installed

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Prisma Migration Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
