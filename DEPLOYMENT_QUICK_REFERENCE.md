# Deployment Quick Reference

## One-Line Deployment

```bash
./deploy.sh your-domain.com ./deployment && cd deployment && cp .env.example .env && docker-compose up -d
```

## Standard Deployment Steps

```bash
# 1. Run deployment script
./deploy.sh wedding-planner.com ./deployment

# 2. Configure environment
cd deployment
cp .env.example .env
nano .env  # Edit JWT_SECRET and other values

# 3. Create database directory
mkdir -p data

# 4. Start application
docker-compose up -d

# 5. Verify it's running
curl http://localhost:6001

# 6. Configure nginx (on host machine)
sudo cp nginx/wedding-planner.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/wedding-planner.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Common Commands

```bash
# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Restart
docker-compose restart

# Stop
docker-compose stop

# Start
docker-compose start

# Rebuild and restart
docker-compose down
docker build -t wedding-planner-app:latest .
docker-compose up -d
```

## Key Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build (frontend + backend) |
| `deploy.sh` | Orchestration script |
| `nginx/nginx.conf.template` | Reverse proxy configuration |
| `docker-compose.yml` | Generated in deployment directory |
| `.env` | Environment variables (in deployment dir) |
| `data/` | Database persistence (in deployment dir) |

## Architecture

```
┌─────────────────────┐
│   User Browser      │
└──────────┬──────────┘
           │ HTTP
           ▼
┌─────────────────────┐
│  Nginx Reverse      │
│  Proxy (Port 80)    │
└──────────┬──────────┘
           │ localhost:6001
           ▼
┌─────────────────────┐
│ Docker Container    │
│ ┌─────────────────┐ │
│ │  React App      │ │
│ │  Express Server │ │
│ └────────┬────────┘ │
│          │          │
│          ▼          │
│  SQLite Database    │
└─────────────────────┘
```

## Docker Image Details

- **Image Name**: `wedding-planner-app`
- **Exposed Port**: `6001`
- **Final Size**: ~250MB
- **Multi-stage Build**: 3 stages (optimized)
- **Base Image**: `node:18-alpine`

## Environment Variables

```bash
NODE_ENV=production
PORT=6001
DATABASE_URL=file:./prisma/prod.db
JWT_SECRET=your-secret-here  # REQUIRED: Change this!
```

## Generate Strong JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Nginx Configuration

The deployment script generates a config that:
- ✅ Reverse proxies to localhost:6001
- ✅ Caches static assets (30 days)
- ✅ Adds security headers
- ✅ Disables buffering for APIs
- ✅ Supports WebSocket (future)

Domain placeholder: `{{DOMAIN}}` → replaced with your domain

## Troubleshooting

### Can't connect to container
```bash
# Check if running
docker-compose ps

# View logs
docker-compose logs

# Test connection
curl http://localhost:6001
```

### Port already in use
```bash
# Find what's using port 6001
lsof -i :6001

# Kill process
kill -9 <PID>
```

### Database issues
```bash
# Check if exists
ls -la data/prod.db

# Check permissions
chmod 644 data/prod.db

# View migration logs
docker-compose logs | grep prisma
```

### Nginx can't connect
```bash
# Test nginx config
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log

# Check if container is running
docker-compose ps
```

## Deployment Directory Structure

```
deployment/
├── sources/              # Source files (generated)
├── data/                 # Database (created on first run)
├── nginx/
│   └── wedding-planner.conf  # Generated nginx config
├── Dockerfile            # Copied from root
├── docker-compose.yml    # Generated
├── .env                  # Your environment vars
├── .env.example          # Template
└── DEPLOYMENT.md         # Deployment guide
```

## Security Checklist

- [ ] Change JWT_SECRET in .env
- [ ] Use HTTPS/SSL for production
- [ ] Only expose nginx on ports 80/443
- [ ] Backup database regularly
- [ ] Use strong database backups
- [ ] Keep docker images updated
- [ ] Monitor logs regularly
- [ ] Use firewall to restrict access

## Updating Application

```bash
# Pull latest changes
git pull origin website_production

# Redeploy
cd deployment
docker-compose down
docker build -t wedding-planner-app:latest .
docker-compose up -d
```

## Backup Database

```bash
cd deployment
cp data/prod.db data/prod.db.backup
tar czf backup-$(date +%Y%m%d-%H%M%S).tar.gz data/
```

## Restore Database

```bash
cd deployment
docker-compose stop
rm data/prod.db
tar xzf backup-YYYYMMDD-HHMMSS.tar.gz
docker-compose start
```

## Logs Location

- **Docker logs**: `docker-compose logs`
- **Nginx logs**: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- **Application logs**: Inside container at `/app/logs` (if mounted)

## Support & Issues

For detailed information, see:
- `PRODUCTION.md` - Complete production guide
- `DEPLOYMENT.md` - Generated in deployment directory
- Docker logs - `docker-compose logs -f`
- Nginx error logs - `sudo tail -f /var/log/nginx/error.log`
