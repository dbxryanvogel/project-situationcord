# AGENTS.md - AI Coding Agent Guidelines

This document provides guidelines for AI coding agents working in this repository.

## Project Overview

Turborepo monorepo with a Discord bot + Next.js web application for monitoring Discord messages.

**Tech Stack:**

- TypeScript (strict mode), Node.js >=20, npm workspaces
- Next.js 16 (App Router) with React 19, Tailwind CSS v4
- Discord.js v14 for bot functionality
- Drizzle ORM with Neon PostgreSQL
- WorkOS AuthKit for authentication
- Vercel Workflow DevKit for durable workflows
- Zod v4 for validation, Vercel AI SDK for AI features

**Note:** The Discord bot on Railway is a lightweight forwarder that sends messages to the Next.js webhook for processing. AI analysis happens in Next.js via Workflow DevKit.

## Build/Lint/Test Commands

```bash
# Root commands (run from repository root)
npm run build          # Build all apps (turbo run build)
npm run dev            # Start all apps in dev mode
npm run lint           # Lint all apps
npm run format         # Format with Prettier

# Next.js app commands (run from apps/nextjs-web)
npm run dev            # Start Next.js dev server
npm run build          # Build for production
npm run lint           # ESLint check
npm run db:generate    # Generate Drizzle migrations
npm run db:migrate     # Run Drizzle migrations
npm run db:push        # Push schema to database
npm run db:studio      # Open Drizzle Studio GUI

# Discord bot commands (run from apps/discord-server)
npm run dev            # Start bot with tsx watch
npm run build          # Compile TypeScript
npm run start          # Run compiled bot
```

## Code Style Guidelines

### Import Organization

1. External packages first (React, Next.js, third-party)
2. Internal absolute imports using `@/*` alias
3. Relative imports for nearby files
4. Use `import type { ... }` for type-only imports

```typescript
import { NextRequest, NextResponse } from "next/server";
import type { WebhookPayload } from "@situationcord/shared-types";
import { db, discordMessages } from "@/lib/db";
```

### Naming Conventions

- **Files:** kebab-case (`discord-message.ts`, `dashboard-header.tsx`)
- **Components:** PascalCase (`DashboardHeader`, `MessageLog`)
- **Functions:** camelCase (`getRecentMessages`, `processDiscordMessage`)
- **Types/Interfaces:** PascalCase (`WebhookPayload`, `MessageAnalysisOutput`)
- **Database tables:** snake_case (`discord_messages`, `message_analysis`)
- **Database columns:** snake_case in DB, camelCase in TypeScript

### TypeScript

- Strict mode enabled; use explicit types for function parameters
- Infer return types when obvious
- Export types with `$inferSelect`/`$inferInsert` from Drizzle schemas

### Component Patterns

- Server Components by default (no 'use client' unless needed)
- Props interfaces defined inline or as separate interface
- shadcn/ui components in `components/ui/` directory

```typescript
export default async function DashboardPage() {
  const { user } = await withAuth({ ensureSignedIn: true });
  // ...
}
```

### Server Actions

- File-level `'use server'` directive; use `withAuth()` for authentication
- Return `{ success: true, ... }` or throw errors
- Located in `actions.ts` colocated with pages

```typescript
"use server";
import { withAuth } from "@workos-inc/authkit-nextjs";

export async function addUserToIgnoreList(userId: string, reason?: string) {
  const { user } = await withAuth();
  if (!user) throw new Error("Unauthorized");
  return { success: true, id };
}
```

### Error Handling

- Try/catch with `console.error` logging
- Return fallback values on non-critical errors; throw for critical paths
- Use `instanceof Error` for error messages

```typescript
try {
  // operation
} catch (error) {
  console.error("Context:", error);
  return {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error",
  };
}
```

### Database Patterns (Drizzle)

- Schema in `db/schema.ts` with explicit types
- Relations defined separately from tables
- Use `nanoid()` for generating IDs; indexes in table config function

### Zod Schema Patterns

- Use `.describe()` for AI context; infer types with `z.infer<typeof schema>`

## Framework-Specific Rules

### WorkOS AuthKit (from .cursor/rules/workos-authkit.mdc)

- Use `withAuth()` in Server Components and Actions
- Use `authkitMiddleware()` with proper route exclusions
- Always forward AuthKit headers in custom middleware
- Handle auth callback at `/auth/callback/route.ts`

### Workflow DevKit (from .cursor/rules/workflow-devkit.mdc)

- `"use workflow"` for orchestrator functions (must be deterministic)
- `"use step"` for isolated work units (can use Node.js APIs)
- Only pass serializable data between workflows/steps
- Use dynamic imports inside steps: `await import('@/lib/module')`
- Exclude `.well-known/workflow` from middleware matcher
- Use `FatalError` for non-recoverable errors, `RetryableError` for custom retry

```typescript
export async function processMessage(payload: WebhookPayload) {
  "use workflow";
  const result = await analyzeStep(payload);
  return result;
}

async function analyzeStep(data: any) {
  "use step";
  const { ai } = await import("@/lib/ai");
  // ...
}
```

## Project Structure

```
apps/
  nextjs-web/           # Main web app (deployed to Vercel)
    app/                # Next.js App Router pages (api/, dashboard/)
    components/ui/      # shadcn/ui components
    db/                 # Drizzle schema & migrations
    lib/                # Utilities
    workflows/          # Workflow DevKit workflows
  discord-server/       # Discord bot (deployed to Railway)
packages/
  shared-types/         # Shared TypeScript types
```

## Environment Variables

**nextjs-web (Vercel):**

- `NEXT_PUBLIC_BASE_URL` - Deployment URL
- `NEXT_PUBLIC_WORKOS_REDIRECT_URI` - Auth callback URL
- `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`, `WORKOS_COOKIE_PASSWORD`
- `DATABASE_URL` (Neon PostgreSQL)
- `OPENAI_API_KEY` (for AI features)
- `CUSTOMER_IO_WEBHOOK_URL` (high-severity alerts)

**discord-server (Railway):**

- `DISCORD_BOT_TOKEN` - Discord bot token
- `WEBHOOK_URL` - URL to Next.js webhook (e.g., `https://situationcord.vercel.app/api/discord/webhook`)
- `CHANNEL_IDS` - Channel filtering: `ALL` for all channels, or comma-separated IDs (e.g., `123,456,789`)

## Deployment Architecture

| Component     | Platform | Root Directory        |
| ------------- | -------- | --------------------- |
| Web Dashboard | Vercel   | `apps/nextjs-web`     |
| Discord Bot   | Railway  | `apps/discord-server` |

**Data Flow:**

1. Discord bot (Railway) receives messages from Discord
2. Bot forwards to Next.js webhook (`/api/discord/webhook`)
3. Webhook stores message and starts Workflow DevKit workflow
4. Workflow: fetch thread context -> AI analysis -> store results -> route to Customer.io (if high severity)
