"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface RadarChartData {
  category: string;
  value: number;
}

interface DashboardRadarChartsProps {
  questionAnswerData: RadarChartData[];
  topicsData: RadarChartData[];
  sentimentData: RadarChartData[];
}

const questionAnswerConfig = {
  value: {
    label: "Count",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const topicsConfig = {
  value: {
    label: "Messages",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const sentimentConfig = {
  value: {
    label: "Count",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function DashboardRadarCharts({
  questionAnswerData,
  topicsData,
  sentimentData,
}: DashboardRadarChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Questions & Answers Chart */}
      <Card>
        <CardHeader className="items-center pb-4">
          <CardTitle className="text-lg">Questions & Answers</CardTitle>
          <CardDescription className="text-center">
            Message type distribution
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <ChartContainer
            config={questionAnswerConfig}
            className="mx-auto aspect-square max-h-[300px]"
          >
            <RadarChart data={questionAnswerData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <PolarAngleAxis 
                dataKey="category"
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              />
              <PolarGrid gridType="circle" />
              <Radar
                dataKey="value"
                fill="var(--color-value)"
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

      {/* Topics Chart */}
      <Card>
        <CardHeader className="items-center pb-4">
          <CardTitle className="text-lg">Topics</CardTitle>
          <CardDescription className="text-center">
            Category distribution
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <ChartContainer
            config={topicsConfig}
            className="mx-auto aspect-square max-h-[300px]"
          >
            <RadarChart data={topicsData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <PolarAngleAxis 
                dataKey="category"
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              />
              <PolarGrid gridType="circle" />
              <Radar
                dataKey="value"
                fill="var(--color-value)"
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

      {/* Sentiment Chart */}
      <Card>
        <CardHeader className="items-center pb-4">
          <CardTitle className="text-lg">Sentiment Analysis</CardTitle>
          <CardDescription className="text-center">
            Message sentiment distribution
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <ChartContainer
            config={sentimentConfig}
            className="mx-auto aspect-square max-h-[300px]"
          >
            <RadarChart data={sentimentData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <PolarAngleAxis 
                dataKey="category"
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              />
              <PolarGrid gridType="circle" />
              <Radar
                dataKey="value"
                fill="var(--color-value)"
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
    </div>
  );
}

