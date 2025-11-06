import { withAuth } from '@workos-inc/authkit-nextjs';
import { DashboardHeader } from '@/components/dashboard-header';
import { MessageLog } from '@/components/message-log';
import { DashboardRadarCharts } from '@/components/dashboard-radar-charts';
import { 
  getRecentMessages, 
  getIgnoredUsersCount,
  getQuestionAnswerData,
  getTopicsData,
  getSentimentData,
} from './actions';

export default async function DashboardPage() {
  const { user } = await withAuth({ ensureSignedIn: true });
  const [messages, ignoredCount, questionAnswerData, topicsData, sentimentData] = await Promise.all([
    getRecentMessages(),
    getIgnoredUsersCount(),
    getQuestionAnswerData(),
    getTopicsData(),
    getSentimentData(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <DashboardHeader user={user} ignoredCount={ignoredCount} />

        <div className="mb-8">
          <DashboardRadarCharts 
            questionAnswerData={questionAnswerData}
            topicsData={topicsData}
            sentimentData={sentimentData}
          />
        </div>

        <div className="mb-8">
          <MessageLog initialMessages={messages} />
        </div>
      </main>
    </div>
  );
}