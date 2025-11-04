This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## WorkOS AuthKit Setup

This project uses WorkOS AuthKit for authentication. To get started:

1. Create a `.env.local` file in the `apps/nextjs-web` directory with the following variables:

```bash
WORKOS_API_KEY='your_api_key_here'
WORKOS_CLIENT_ID='your_client_id_here'
WORKOS_COOKIE_PASSWORD='your_secure_password_here' # Must be at least 32 characters
NEXT_PUBLIC_WORKOS_REDIRECT_URI="http://localhost:3000/auth/callback"
```

2. Generate a secure password for `WORKOS_COOKIE_PASSWORD`:
```bash
openssl rand -base64 24
```

3. Configure your WorkOS Dashboard:
   - Set the Redirect URI to: `http://localhost:3000/auth/callback`
   - Configure your login endpoint (if needed)

4. Get your API key and Client ID from the [WorkOS Dashboard](https://dashboard.workos.com/api-keys)

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

- `/` - Public landing page
- `/signin` - Redirects to WorkOS sign-in
- `/auth/callback` - WorkOS callback handler (redirects to `/dashboard` after login)
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
