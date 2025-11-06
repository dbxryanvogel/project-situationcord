"use client"

import { TrendingUp, MessageCircle, Tag, BarChart3 } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface MessageRadarChartsProps {
  analysis: {
    sentiment: string | null;
    isQuestion: boolean | null;
    isAnswer: boolean | null;
    needsHelp: boolean | null;
    categoryTags: string[] | null;
    severityScore: string | null;
    confidenceScore: string | null;
  } | null;
}

export function MessageRadarCharts({ analysis }: MessageRadarChartsProps) {
  if (!analysis) return null;

  // Message Type Analysis Chart
  const messageTypeData = [
    { 
      dimension: "Question", 
      score: analysis.isQuestion ? 100 : 0,
    },
    { 
      dimension: "Answer", 
      score: analysis.isAnswer ? 100 : 0,
    },
    { 
      dimension: "Help Needed", 
      score: analysis.needsHelp ? 100 : 0,
    },
    { 
      dimension: "Confidence", 
      score: analysis.confidenceScore ? Number(analysis.confidenceScore) * 100 : 0,
    },
    { 
      dimension: "Severity", 
      score: analysis.severityScore ? (Number(analysis.severityScore) / 10) * 100 : 0,
    },
  ];

  // Sentiment Analysis Chart
  const sentimentData = [
    { 
      dimension: "Positive", 
      score: analysis.sentiment === 'positive' ? 100 : 0,
    },
    { 
      dimension: "Neutral", 
      score: analysis.sentiment === 'neutral' ? 100 : 0,
    },
    { 
      dimension: "Negative", 
      score: analysis.sentiment === 'negative' ? 100 : 0,
    },
    { 
      dimension: "Frustrated", 
      score: analysis.sentiment === 'frustrated' ? 100 : 0,
    },
    { 
      dimension: "Urgent", 
      score: analysis.sentiment === 'urgent' ? 100 : 0,
    },
  ];

  // Category Distribution (simplified for visualization)
  const categories = ['Free Limits', 'Billing', 'Account', 'BaaS', 'Console', 'Vercel'];
  const categoryData = categories.map(cat => ({
    dimension: cat,
    score: analysis.categoryTags?.includes(cat) ? 100 : 0,
  }));

  const messageTypeConfig = {
    score: {
      label: "Score",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const sentimentConfig = {
    score: {
      label: "Sentiment",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  const categoryConfig = {
    score: {
      label: "Category",
      color: "hsl(var(--chart-3))",
    },
  } satisfies ChartConfig;

  const hasMessageTypeData = messageTypeData.some(d => d.score > 0);
  const hasSentimentData = sentimentData.some(d => d.score > 0);
  const hasCategoryData = categoryData.some(d => d.score > 0);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Message Type Chart */}
      {hasMessageTypeData && (
        <Card>
          <CardHeader className="items-center pb-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <CardTitle>Message Analysis</CardTitle>
            </div>
            <CardDescription>
              Type, confidence, and severity metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer
              config={messageTypeConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <RadarChart data={messageTypeData}>
                <ChartTooltip 
                  cursor={false} 
                  content={<ChartTooltipContent hideLabel />} 
                />
                <PolarAngleAxis dataKey="dimension" />
                <PolarGrid />
                <Radar
                  dataKey="score"
                  fill="var(--color-score)"
                  fillOpacity={0.6}
                  dot={{
                    r: 4,
                    fillOpacity: 1,
                  }}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Sentiment Chart */}
      {hasSentimentData && (
        <Card>
          <CardHeader className="items-center pb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <CardTitle>Sentiment Analysis</CardTitle>
            </div>
            <CardDescription>
              Emotional tone of the message
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer
              config={sentimentConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <RadarChart data={sentimentData}>
                <ChartTooltip 
                  cursor={false} 
                  content={<ChartTooltipContent hideLabel />} 
                />
                <PolarAngleAxis dataKey="dimension" />
                <PolarGrid />
                <Radar
                  dataKey="score"
                  fill="var(--color-score)"
                  fillOpacity={0.6}
                  dot={{
                    r: 4,
                    fillOpacity: 1,
                  }}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Category Chart */}
      {hasCategoryData && (
        <Card>
          <CardHeader className="items-center pb-4">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-purple-600" />
              <CardTitle>Topic Categories</CardTitle>
            </div>
            <CardDescription>
              Distribution across topic areas
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer
              config={categoryConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <RadarChart data={categoryData}>
                <ChartTooltip 
                  cursor={false} 
                  content={<ChartTooltipContent hideLabel />} 
                />
                <PolarAngleAxis dataKey="dimension" />
                <PolarGrid />
                <Radar
                  dataKey="score"
                  fill="var(--color-score)"
                  fillOpacity={0.6}
                  dot={{
                    r: 4,
                    fillOpacity: 1,
                  }}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

