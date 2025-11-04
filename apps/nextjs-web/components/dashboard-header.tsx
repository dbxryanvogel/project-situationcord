import { signOut } from '@workos-inc/authkit-nextjs';
import { Button } from '@/components/ui/button';
import { UserX } from 'lucide-react';
import Link from 'next/link';

interface DashboardHeaderProps {
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
  title?: string;
  subtitle?: string;
  ignoredCount?: number;
}

export function DashboardHeader({ 
  user, 
  title = 'Monitoring the Situation',
  subtitle,
  ignoredCount = 0
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
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm" className="gap-2 relative">
          <Link href="/dashboard/ignored">
            <UserX className="h-4 w-4" />
            Ignored Users
            {ignoredCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {ignoredCount}
              </span>
            )}
          </Link>
        </Button>
        <form
          action={async () => {
            'use server';
            await signOut();
          }}
        >
          <Button type="submit" variant="default" size="sm">
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  );
}

