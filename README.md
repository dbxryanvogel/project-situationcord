# Situationcord

A Discord message monitoring and AI analysis platform. Monitor Discord channels, analyze messages with AI for sentiment and support needs, and view insights through a web dashboard.

## Architecture

```
Discord Server          Railway (Discord Bot)              Vercel (Next.js)
     |                        |                                  |
     |  New Message           |                                  |
     |----------------------->|                                  |
     |                        |  POST /api/discord/webhook       |
     |                        |--------------------------------->|
     |                        |                                  |
     |                        |                           1. Store message in DB
     |                        |                           2. Start Workflow
     |                        |                                  |
     |                        |                           Workflow DevKit
     |                        |                                  |
     |                        |                           - Fetch thread context
     |                        |                           - AI analysis (OpenAI)
     |                        |                           - Store analysis
     |                        |                           - Route high-severity
     |                        |                             to Customer.io
```

## Tech Stack

- **Monorepo**: Turborepo with npm workspaces
- **Language**: TypeScript (strict mode), Node.js >= 20
- **Web App**: Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Discord Bot**: Discord.js v14
- **Database**: Drizzle ORM with Neon PostgreSQL
- **Auth**: WorkOS AuthKit
- **AI**: Vercel AI SDK with OpenAI
- **Workflows**: Vercel Workflow DevKit for durable async processing

## Project Structure

```
apps/
  nextjs-web/           # Web dashboard (Vercel)
    app/                # Next.js App Router
      api/discord/      # Webhook endpoint for Discord bot
      dashboard/        # Protected dashboard pages
    components/ui/      # shadcn/ui components
    db/                 # Drizzle schema & migrations
    workflows/          # Workflow DevKit workflows
  discord-server/       # Discord bot (Railway)
    src/index.ts        # Bot entry point
packages/
  shared-types/         # Shared TypeScript types (WebhookPayload, etc.)
```

## Getting Started

### Prerequisites

- Node.js >= 20
- npm
- A Discord bot token ([Discord Developer Portal](https://discord.com/developers/applications))
- Neon PostgreSQL database ([neon.tech](https://neon.tech))
- WorkOS account for auth ([workos.com](https://workos.com))
- OpenAI API key ([platform.openai.com](https://platform.openai.com))

### Installation

```bash
# Install dependencies
npm install

# Run all apps in development mode
npm run dev

# Or run individually:
cd apps/nextjs-web && npm run dev    # Web dashboard on :3000
cd apps/discord-server && npm run dev # Discord bot
```

### Environment Variables

#### Next.js Web (`apps/nextjs-web/.env.local`)

```bash
# App URLs
NEXT_PUBLIC_BASE_URL="http://localhost:3000"  # or production URL
NEXT_PUBLIC_WORKOS_REDIRECT_URI="http://localhost:3000/auth/callback"

# WorkOS Auth
WORKOS_CLIENT_ID="client_..."
WORKOS_API_KEY="sk_..."
WORKOS_COOKIE_PASSWORD="<32+ character secure string>"

# Database
DATABASE_URL="postgresql://..."

# AI
OPENAI_API_KEY="sk-..."

# Notifications (high-severity message routing)
CUSTOMER_IO_WEBHOOK_URL="https://..."
```

#### Discord Bot (`apps/discord-server/.env`)

```bash
# Required
DISCORD_BOT_TOKEN="your-bot-token"
WEBHOOK_URL="http://localhost:3000/api/discord/webhook"  # or production URL

# Optional - Channel filtering
# Set to "ALL" to monitor all channels, or comma-separated channel IDs
CHANNEL_IDS=ALL
```

### Database Setup

```bash
cd apps/nextjs-web

# Push schema to database (development)
npm run db:push

# Or use migrations (production)
npm run db:generate
npm run db:migrate

# View database in browser
npm run db:studio
```

## Deployment

### Vercel (Next.js Web Dashboard)

1. Connect your GitHub repo to Vercel
2. Set root directory to `apps/nextjs-web`
3. Add environment variables:
   - `NEXT_PUBLIC_BASE_URL` - Your Vercel deployment URL
   - `NEXT_PUBLIC_WORKOS_REDIRECT_URI` - `{BASE_URL}/auth/callback`
   - `WORKOS_CLIENT_ID` - From WorkOS dashboard
   - `WORKOS_API_KEY` - From WorkOS dashboard
   - `WORKOS_COOKIE_PASSWORD` - 32+ character secure string
   - `DATABASE_URL` - Neon PostgreSQL connection string
   - `OPENAI_API_KEY` - OpenAI API key
   - `CUSTOMER_IO_WEBHOOK_URL` - Customer.io webhook for high-severity alerts

### Railway (Discord Bot)

1. Create a new project in Railway
2. Connect your GitHub repo
3. Configure the service:
   - **Root Directory**: `/apps/discord-server`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
4. Add environment variables:
   - `DISCORD_BOT_TOKEN`
   - `WEBHOOK_URL` (your Vercel deployment URL + `/api/discord/webhook`)
   - `CHANNEL_IDS` (optional, defaults to `ALL`)

## How It Works

### Message Flow

1. **Discord Bot** (Railway) listens for messages in configured channels
2. Bot forwards message data to **Next.js webhook** (Vercel)
3. Webhook stores the message and starts a **Workflow DevKit** workflow
4. Workflow runs async steps:
   - Fetches thread context for conversation history
   - Analyzes message with OpenAI (sentiment, categories, severity)
   - Stores analysis results in database
   - Routes high-severity messages to Customer.io (if configured)

### Channel Filtering

The bot supports filtering which channels to monitor:

- `CHANNEL_IDS=ALL` - Monitor all channels (default)
- `CHANNEL_IDS=123,456,789` - Monitor specific channel IDs only
- Thread messages are included if their parent channel is monitored

### AI Analysis

Each message is analyzed for:

- **Sentiment**: positive, neutral, negative, frustrated, urgent
- **Intent**: is it a question? an answer?
- **Support needs**: does the user need help?
- **Categories**: Free Limits, Billing, Account, BaaS, Console, Vercel
- **Severity**: 0-100 score with level (low/medium/high/critical)

### High-Severity Routing

Messages with severity >= 70 or level = high/critical are routed to Customer.io for immediate attention (unless the user is on the ignore list or the message is in a thread).

## Development Commands

```bash
# Root commands
npm run build          # Build all apps
npm run dev            # Start all apps in dev mode
npm run lint           # Lint all apps
npm run format         # Format with Prettier

# Next.js app (from apps/nextjs-web)
npm run dev            # Start dev server
npm run build          # Production build
npm run db:studio      # Database GUI

# Discord bot (from apps/discord-server)
npm run dev            # Start with hot reload
npm run build          # Compile TypeScript
npm run start          # Run compiled bot
```

## License

Private
