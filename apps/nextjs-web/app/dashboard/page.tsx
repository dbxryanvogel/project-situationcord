import { neonAuth } from "@neondatabase/auth/next/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { MessageLog } from "@/components/message-log";
import { DashboardRadarCharts } from "@/components/dashboard-radar-charts";
import { 
  getRecentMessages, 
  getIgnoredUsersCount,
  getQuestionAnswerData,
  getTopicsData,
  getSentimentData,
} from "./actions";

export default async function DashboardPage() {
  const { user } = await neonAuth();
  
  if (!user) {
    redirect("/auth/sign-in");
  }

  const [messages, ignoredCount, questionAnswerData, topicsData, sentimentData] = await Promise.all([
    getRecentMessages(),
    getIgnoredUsersCount(),
    getQuestionAnswerData(),
    getTopicsData(),
    getSentimentData(),
  ]);

  return (
    <div className="min-h-screen bg-background font-sans">
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
