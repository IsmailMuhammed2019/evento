# Evento Deployment Guide

This guide covers deploying the evento application using Docker containers.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- A server with at least 2GB RAM and 2 CPU cores
- Domain name (for production deployment)
- SSL certificate (for production deployment)

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd evento
cp env.example .env
```

### 2. Configure Environment Variables

Edit the `.env` file with your actual values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_PORTAL_URL=https://portal.your-domain.com
```

### 3. Deploy

```bash
# For development
./scripts/deploy.sh deploy development

# For production
./scripts/deploy.sh deploy production
```

## Architecture

The application consists of:

- **evento**: Main attendance management app (port 3000)
- **portal**: Student portal for QR generation (port 3001)
- **nginx**: Reverse proxy and load balancer (port 80/443)

## Deployment Options

### Development Deployment

Uses `docker-compose.yml` with:
- Direct port exposure
- Development-optimized settings
- Hot reloading support

```bash
./scripts/deploy.sh deploy development
```

### Production Deployment

Uses `docker-compose.prod.yml` with:
- SSL termination
- Load balancing
- Resource limits
- Auto-updates with Watchtower
- Health checks

```bash
./scripts/deploy.sh deploy production
```

## SSL Configuration

### 1. Obtain SSL Certificates

For production, you need SSL certificates. You can use:

- **Let's Encrypt** (free)
- **Commercial certificates**
- **Self-signed** (development only)

### 2. Configure SSL

Place your certificates in the `nginx/ssl/` directory:

```bash
mkdir -p nginx/ssl
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem
```

### 3. Update Domain Names

Edit `nginx/conf.d/ssl.conf` and replace:
- `your-domain.com` with your actual domain
- `portal.your-domain.com` with your portal subdomain

## Management Commands

### View Logs

```bash
# All services
./scripts/deploy.sh logs

# Specific service
./scripts/deploy.sh logs evento
./scripts/deploy.sh logs portal
./scripts/deploy.sh logs nginx
```

### Check Status

```bash
./scripts/deploy.sh status
```

### Stop Services

```bash
./scripts/deploy.sh stop
```

### Restart Services

```bash
./scripts/deploy.sh restart production
```

### Clean Up

```bash
./scripts/deploy.sh cleanup
```

## Manual Docker Commands

If you prefer to use Docker commands directly:

### Development

```bash
# Build and start
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Production

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up --build -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.prod.yml down
```

## Monitoring and Maintenance

### Health Checks

The applications expose health check endpoints:

- Main app: `http://localhost:3000/health`
- Portal: `http://localhost:3001/health`
- Nginx: `http://localhost/health`

### Log Rotation

Nginx logs are stored in `nginx/logs/`. Consider setting up log rotation:

```bash
# Add to crontab
0 0 * * * docker exec nginx_container logrotate /etc/logrotate.d/nginx
```

### Updates

With Watchtower enabled in production, containers will automatically update when new images are pushed to your registry.

To disable auto-updates, remove the watchtower service from `docker-compose.prod.yml`.

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Check what's using the port
sudo netstat -tulpn | grep :80

# Kill the process or change ports in docker-compose.yml
```

#### 2. Permission Denied

```bash
# Make sure the deploy script is executable
chmod +x scripts/deploy.sh

# Check Docker permissions
sudo usermod -aG docker $USER
```

#### 3. Environment Variables Not Loading

```bash
# Check if .env file exists and has correct format
cat .env

# Restart services after changing .env
./scripts/deploy.sh restart
```

#### 4. SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Verify certificate matches domain
openssl x509 -in nginx/ssl/cert.pem -text -noout | grep -A 1 "Subject:"
```

### Debug Mode

To run in debug mode with more verbose logging:

```bash
# Set debug environment
export DEBUG=*
docker-compose up --build
```

### Database Connection Issues

If you're having issues with Supabase:

1. Verify your Supabase URL and keys
2. Check if your IP is whitelisted in Supabase
3. Ensure your database is accessible from your server

## Security Considerations

### Production Security

1. **Use strong passwords** for all services
2. **Enable firewall** and only open necessary ports
3. **Regular updates** of base images and dependencies
4. **Monitor logs** for suspicious activity
5. **Use HTTPS** in production
6. **Implement rate limiting** (already configured in nginx)

### Environment Variables

Never commit sensitive environment variables to version control. Use:

- `.env` files (not committed)
- Docker secrets (for sensitive data)
- External secret management systems

## Scaling

### Horizontal Scaling

To scale the main application:

```bash
# Scale evento service
docker-compose -f docker-compose.prod.yml up --scale evento=3 -d
```

### Load Balancing

Nginx is configured with load balancing. The configuration automatically distributes traffic across multiple instances.

### Resource Limits

Production configuration includes resource limits:

- **evento**: 512MB RAM, 0.5 CPU
- **portal**: 512MB RAM, 0.5 CPU
- **nginx**: 128MB RAM, 0.25 CPU

Adjust these in `docker-compose.prod.yml` based on your needs.

## Backup and Recovery

### Database Backup

Since you're using Supabase, ensure you have:

1. **Regular backups** configured in Supabase
2. **Point-in-time recovery** enabled
3. **Export scripts** for critical data

### Application Backup

```bash
# Backup configuration
tar -czf evento-backup-$(date +%Y%m%d).tar.gz \
  docker-compose*.yml \
  nginx/ \
  .env \
  scripts/
```

## Support

For issues and questions:

1. Check the logs: `./scripts/deploy.sh logs`
2. Verify configuration: `./scripts/deploy.sh status`
3. Review this documentation
4. Check Docker and Docker Compose versions
5. Ensure all prerequisites are met

## Performance Optimization

### Nginx Optimization

The nginx configuration includes:

- **Gzip compression**
- **Static file caching**
- **Rate limiting**
- **Security headers**

### Application Optimization

- **Next.js standalone output** for smaller images
- **Multi-stage builds** for optimized images
- **Resource limits** to prevent resource exhaustion

### Monitoring

Consider adding monitoring tools:

- **Prometheus** for metrics
- **Grafana** for dashboards
- **ELK Stack** for log aggregation

