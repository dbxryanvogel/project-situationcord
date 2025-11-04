import { signOut } from '@workos-inc/authkit-nextjs';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
  title?: string;
  subtitle?: string;
}

export function DashboardHeader({ 
  user, 
  title = 'Monitoring the Situation',
  subtitle 
}: DashboardHeaderProps) {
  const defaultSubtitle = `Welcome back${user.firstName ? `, ${user.firstName}` : ''}!`;
  
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
          {title}
        </h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          {subtitle || defaultSubtitle}
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
  );
}

