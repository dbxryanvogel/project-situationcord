This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup

### Neon Auth Setup

This project uses Neon Auth for authentication. To get started:

1. Create a `.env.local` file in the `apps/nextjs-web` directory with the following variable:

```bash
NEON_AUTH_BASE_URL='https://your-neon-auth-url.neon.tech'
```

2. Configure your Neon Auth server:
   - Enable Email OTP authentication
   - Configure Google OAuth provider
   - Configure GitHub OAuth provider

For more information, see the [Neon Auth Documentation](https://neon.com/docs/guides/neon-auth).

### OpenAI API Setup

This project uses OpenAI's GPT-4o-mini for AI-powered message analysis including sentiment detection, categorization, and Q&A cross-referencing.

1. **Get your OpenAI API key:**
   - Sign up at [OpenAI Platform](https://platform.openai.com)
   - Navigate to API keys section
   - Create a new API key

2. **Add to `.env.local`:**
```bash
OPENAI_API_KEY='sk-your_openai_api_key_here'
```

**Note:** The AI analysis workflow automatically analyzes Discord messages for:
- Sentiment (positive, neutral, negative, frustrated, urgent)
- Question/Answer detection
- Help needed flagging
- Category tagging (Free Limits, Billing, Account, BaaS, Console, Vercel)
- Q&A cross-referencing in threads

## Database Setup (Drizzle + Neon Postgres)

This project uses Drizzle ORM with Neon Postgres to store Discord webhook messages.

1. **Set up Neon Database:**
   - Create a free account at [Neon](https://neon.tech)
   - Create a new project and database
   - Copy your connection string from the Neon dashboard

2. **Add Database URL to `.env.local`:**
```bash
DATABASE_URL='postgresql://username:password@hostname.neon.tech/dbname?sslmode=require'
```

3. **Generate and run migrations:**
```bash
# Generate migration files based on schema changes
bun run db:generate

# Push schema changes to database (for development)
bun run db:push

# Or run migrations (for production)
bun run db:migrate
```

4. **Open Drizzle Studio (optional):**
```bash
bun run db:studio
```
This opens a web UI at `http://localhost:4983` to view and manage your database.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Route Protection

- `/` - Public landing page (redirects to dashboard if logged in)
- `/auth/sign-in` - Sign in page
- `/auth/sign-up` - Sign up page
- `/auth/magic-link` - Magic link authentication
- `/auth/forgot-password` - Password reset request
- `/auth/callback` - OAuth callback handler
- `/dashboard` - Protected dashboard page (requires authentication)
- All other routes require authentication

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
