import { MessageLog } from "@/components/message-log";
import { DashboardRadarCharts } from "@/components/dashboard-radar-charts";
import { 
  getRecentMessages, 
  getQuestionAnswerData,
  getTopicsData,
  getSentimentData,
} from "../actions";

export default async function MessageLogPage() {
  const [messages, questionAnswerData, topicsData, sentimentData] = await Promise.all([
    getRecentMessages(),
    getQuestionAnswerData(),
    getTopicsData(),
    getSentimentData(),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-foreground">Message Log</h1>
        <p className="text-muted-foreground mt-1">Monitor Discord messages and AI analysis</p>
      </div>

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
    </div>
  );
}
