import { withAuth, signOut } from '@workos-inc/authkit-nextjs';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
  const { user } = await withAuth({ ensureSignedIn: true });

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              Dashboard
            </h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
              Welcome back{user.firstName && `, ${user.firstName}`}!
            </p>
            {user.email && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {user.email}
              </p>
            )}
          </div>
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          >
            <Button type="submit" variant="default">
              Sign Out
            </Button>
          </form>
        </div>
        
        <div className="mb-8">
          <ChartAreaInteractive />
        </div>
      </main>
    </div>
  );
}

