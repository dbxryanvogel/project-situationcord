# Discord Server Docker Setup

This directory contains Docker configuration for the Discord bot server.

## Quick Start

### Using Docker Compose (Recommended)

1. **Create your environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

2. **Build and run:**
   ```bash
   docker-compose up -d
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f discord-bot
   ```

4. **Stop the bot:**
   ```bash
   docker-compose down
   ```

### Using Docker CLI

1. **Build the image from the monorepo root:**
   ```bash
   cd /path/to/project-situationcord
   docker build -f apps/discord-server/Dockerfile -t discord-server:latest .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name discord-bot \
     --restart unless-stopped \
     -e DISCORD_BOT_TOKEN="your_token_here" \
     -e WEBHOOK_URL="https://your-app.com/api/discord/webhook" \
     -e SECONDARY_WEBHOOK_URL="https://backup-webhook.com/webhook" \
     discord-server:latest
   ```

3. **View logs:**
   ```bash
   docker logs -f discord-bot
   ```

4. **Stop and remove:**
   ```bash
   docker stop discord-bot
   docker rm discord-bot
   ```

## Environment Variables

Required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_BOT_TOKEN` | Your Discord bot token from the Discord Developer Portal | `MTIzNDU2Nzg5MDEyMzQ1Njc4.GaBcDe.FgHiJkLmNoPqRsTuVwXyZ0123456789` |
| `WEBHOOK_URL` | Primary webhook endpoint for receiving Discord events | `https://your-app.vercel.app/api/discord/webhook` |
| `SECONDARY_WEBHOOK_URL` | Backup webhook endpoint | `https://backup.com/webhook` |

Optional:
- `NODE_ENV` - Set to `production` (default in Docker)

## Building from Scratch

The Dockerfile uses a multi-stage build:

1. **Builder Stage**: Compiles TypeScript and workspace dependencies
2. **Production Stage**: Creates minimal image with only production dependencies

To build with custom tags:

```bash
# From monorepo root
docker build \
  -f apps/discord-server/Dockerfile \
  -t discord-server:v1.0.0 \
  -t discord-server:latest \
  .
```

## Deployment

### Deploy to a Server

1. **Copy files to your server:**
   ```bash
   scp -r apps/discord-server user@your-server:/path/to/app
   ```

2. **SSH into server and run:**
   ```bash
   cd /path/to/app
   docker-compose up -d
   ```

### Deploy to Docker Registry

1. **Tag for your registry:**
   ```bash
   docker tag discord-server:latest your-registry.com/discord-server:latest
   ```

2. **Push:**
   ```bash
   docker push your-registry.com/discord-server:latest
   ```

3. **Pull and run on target server:**
   ```bash
   docker pull your-registry.com/discord-server:latest
   docker run -d --env-file .env your-registry.com/discord-server:latest
   ```

### Deploy to Container Platforms

#### Fly.io
```bash
flyctl launch --dockerfile apps/discord-server/Dockerfile
flyctl secrets set DISCORD_BOT_TOKEN="..." WEBHOOK_URL="..."
flyctl deploy
```

#### Railway
```bash
railway init
railway link
railway up --dockerfile apps/discord-server/Dockerfile
railway variables set DISCORD_BOT_TOKEN="..." WEBHOOK_URL="..."
```

#### Render
- Create a new Web Service
- Connect your repository
- Set Docker build path: `apps/discord-server/Dockerfile`
- Add environment variables
- Deploy

## Troubleshooting

### Bot not starting
```bash
# Check logs
docker logs discord-bot

# Verify environment variables
docker exec discord-bot env | grep DISCORD
```

### Permission issues
The container runs as non-root user `discord` (UID 1001). If you're mounting volumes, ensure proper permissions:
```bash
chown -R 1001:1001 ./logs
```

### Memory issues
Adjust memory limits in docker-compose.yml:
```yaml
deploy:
  resources:
    limits:
      memory: 1G  # Increase if needed
```

### Rebuild after code changes
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Development

For development, it's recommended to run the bot directly with npm:

```bash
cd apps/discord-server
npm install
npm run dev
```

Docker is primarily for production deployments.

## Security Notes

1. **Never commit** `.env` files with real credentials
2. **Use secrets management** in production (e.g., Docker secrets, vault, cloud provider secrets)
3. **Keep base images updated**: Rebuild regularly for security patches
4. **Monitor resource usage**: Set appropriate limits to prevent abuse

## Health Checks

The Dockerfile includes a basic health check. You can customize it based on your bot's behavior:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD node -e "require('discord.js'); process.exit(0)" || exit 1
```

## Image Size

The production image is optimized using:
- Alpine Linux base (minimal size)
- Multi-stage builds
- Production-only dependencies
- No development tools

Expected size: ~200-300MB (depends on dependencies)

## Support

For issues specific to Docker deployment, check:
1. Docker logs: `docker logs discord-bot`
2. Container status: `docker ps -a`
3. Resource usage: `docker stats discord-bot`

