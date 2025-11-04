import { withAuth } from '@workos-inc/authkit-nextjs';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { DashboardHeader } from '@/components/dashboard-header';
import { MessageLog } from '@/components/message-log';
import { getRecentMessages, getMessageChartData, getIgnoredUsersCount } from './actions';

export default async function DashboardPage() {
  const { user } = await withAuth({ ensureSignedIn: true });
  const [messages, chartData, ignoredCount] = await Promise.all([
    getRecentMessages(),
    getMessageChartData(7),
    getIgnoredUsersCount(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <DashboardHeader user={user} ignoredCount={ignoredCount} />

        <div className="mb-8">
          <ChartAreaInteractive initialData={chartData} />
        </div>

        <div className="mb-8">
          <MessageLog initialMessages={messages} />
        </div>
      </main>
    </div>
  );
}