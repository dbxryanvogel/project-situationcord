# Discord Server

Discord bot that captures all user messages and forwards them as raw JSON to a webhook URL.

## Setup

1. Copy `.env.example` to `.env` and fill in your values:
   - `DISCORD_BOT_TOKEN` - Your Discord bot token from the [Discord Developer Portal](https://discord.com/developers/applications)
   - `WEBHOOK_URL` - The webhook URL where messages will be sent

2. Install dependencies:
   ```bash
   bun install
   ```

3. Run the bot:
   ```bash
   bun run dev
   ```

## Bot Permissions

Ensure your bot has the following permissions in your Discord server:
- View Channels
- Read Message History
- Send Messages (optional, for webhook responses)

## Features

- Captures all new user messages (excludes bot messages)
- Includes comprehensive message data including thread information
- Sends raw JSON payloads for easy parsing by external services
- Includes thread ID, thread name, and parent channel information when messages are in threads
- Built-in HTTP health check server on port 8000 (configurable via `PORT` env var)
- Dual webhook support (primary + secondary/backup)

## Health Check

The bot includes an HTTP server for health checks (required for container platforms like Koyeb, Railway, etc.):

- **Endpoint**: `http://localhost:8000/health` or `http://localhost:8000/`
- **Port**: Configurable via `PORT` environment variable (default: 8000)
- **Response**: JSON with bot status, uptime, and bot user info

Example response:
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2025-11-04T20:45:00.000Z",
  "bot": {
    "username": "Neon Slack",
    "id": "123456789"
  }
}
```

## Deployment

See [README.Docker.md](./README.Docker.md) for Docker deployment instructions.

For platforms like Koyeb/Railway/Render:
1. Point to this directory (`apps/discord-server`)
2. Set environment variables: `DISCORD_BOT_TOKEN`, `WEBHOOK_URL`, `SECONDARY_WEBHOOK_URL`
3. The buildpack will automatically detect Node.js and use npm
4. Health checks will automatically work on the default port (8000)

