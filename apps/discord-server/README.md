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

