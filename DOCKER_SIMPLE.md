# Wedding Planner - Simple Docker Setup

## Quick Start

```bash
./build-and-run.sh
```

That's it! This script will:
1. Create the data directory
2. Build Docker images
3. Start the containers
4. Show you the URLs

## Access the Application

- **Nginx HTTP**: http://localhost:6001 (reverse proxy, port 6001)
- **Nginx Alternative**: http://localhost:6002 (reverse proxy, port 6002)
- **App Direct**: http://localhost:3000 (direct, internal only in docker)

## Useful Commands

### View logs
```bash
docker compose logs -f
```

### View specific service logs
```bash
docker compose logs -f app    # Application logs
docker compose logs -f nginx  # Nginx logs
```

### Stop containers
```bash
docker compose stop
```

### Stop and remove containers
```bash
docker compose down
```

### Restart containers
```bash
docker compose restart
```

### Rebuild and restart
```bash
./build-and-run.sh
# or manually:
docker compose build --no-cache && docker compose up -d
```

## What's Inside

### Dockerfile
- Simple single-stage build
- Builds shared library first
- Builds client React app
- Copies everything needed
- Runs startup script on container start

### docker-compose.yml
- App service: Node.js application
- Nginx service: Reverse proxy
- Shared network for inter-service communication
- Data volume for database persistence

### nginx/nginx.conf
- Listens on port 80
- Routes requests to app:6001 (Docker internal DNS)
- Static asset caching
- Security headers
- API endpoint optimization

### build-and-run.sh
- One-command deployment
- Creates necessary directories
- Builds images with --no-cache
- Starts containers
- Shows helpful information

## Database

The database is persisted in the `data/` directory which is mounted as a volume in the container at `/app/server/prisma`.

Migrations run automatically on container start.

## Troubleshooting

**Container won't start**
```bash
docker compose logs app
```

**Nginx can't connect to app**
- Make sure both services are running: `docker compose ps`
- Check app logs: `docker compose logs app`

**Port already in use**
```bash
# Find and kill process using port 80 or 6001
lsof -i :80
lsof -i :6001
```

**Need to rebuild**
```bash
docker-compose down
./build-and-run.sh
```

## Production Deployment

For production:
1. Update `docker-compose.yml` to use your domain
2. Add SSL/TLS configuration to nginx
3. Use environment variables for sensitive data
4. Consider using a container registry
5. Set up monitoring and logging

See `PRODUCTION.md` for detailed production setup.
