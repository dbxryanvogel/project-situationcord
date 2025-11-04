import { db } from '@/lib/db';
import { discordMessages, discordAuthors, messageAnalysis } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { DashboardHeader } from '@/components/dashboard-header';
import { getIgnoredUsersCount } from '@/app/dashboard/actions';

type Props = {
  params: { messageId: string };
};

async function getMessageData(messageId: string) {
  const result = await db
    .select({
      message: {
        id: discordMessages.id,
        messageId: discordMessages.messageId,
        content: discordMessages.content,
        messageTimestamp: discordMessages.messageTimestamp,
        channelName: discordMessages.channelName,
        channelId: discordMessages.channelId,
        threadName: discordMessages.threadName,
        threadId: discordMessages.threadId,
        guildId: discordMessages.guildId,
        guildName: discordMessages.guildName,
      },
      author: {
        id: discordAuthors.id,
        username: discordAuthors.username,
        displayName: discordAuthors.displayName,
        avatarUrl: discordAuthors.avatarUrl,
        bot: discordAuthors.bot,
      },
      analysis: {
        sentiment: messageAnalysis.sentiment,
        isQuestion: messageAnalysis.isQuestion,
        isAnswer: messageAnalysis.isAnswer,
        answeredMessageId: messageAnalysis.answeredMessageId,
        needsHelp: messageAnalysis.needsHelp,
        categoryTags: messageAnalysis.categoryTags,
        aiSummary: messageAnalysis.aiSummary,
        confidenceScore: messageAnalysis.confidenceScore,
        severityScore: messageAnalysis.severityScore,
        severityLevel: messageAnalysis.severityLevel,
        severityReason: messageAnalysis.severityReason,
      },
    })
    .from(discordMessages)
    .innerJoin(discordAuthors, eq(discordMessages.authorId, discordAuthors.id))
    .leftJoin(messageAnalysis, eq(discordMessages.id, messageAnalysis.messageId))
    .where(eq(discordMessages.messageId, messageId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0];
}

// Metadata generation is public (no auth required) so social media bots can fetch OG images
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { messageId } = await params;
  const data = await getMessageData(messageId);

  if (!data) {
    return {
      title: 'Message Not Found',
    };
  }

  // Get base URL - try multiple sources
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://situationcord.vercel.app";
  const ogImageUrl = `${baseUrl}/api/og/message/${messageId}`;

  const description = data.analysis?.aiSummary || data.message.content.substring(0, 200);

  return {
    title: `Message from ${data.author.displayName || data.author.username}`,
    description,
    openGraph: {
      title: `Message from ${data.author.displayName || data.author.username}`,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'Message Analysis',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Message from ${data.author.displayName || data.author.username}`,
      description,
      images: [ogImageUrl],
    },
  };
}

function getDiscordMessageUrl(data: any): string | null {
  if (!data.message.guildId || !data.message.messageId) {
    return null;
  }
  const channelOrThreadId = data.message.threadId || data.message.channelId;
  return `https://discord.com/channels/${data.message.guildId}/${channelOrThreadId}/${data.message.messageId}`;
}

function getSentimentColor(sentiment: string | null) {
  const colors: Record<string, string> = {
    positive: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    neutral: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30',
    negative: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
    frustrated: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    urgent: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
  };
  return colors[sentiment || 'neutral'] || colors.neutral;
}

function getSeverityColor(level: string | null) {
  const colors: Record<string, string> = {
    low: 'text-green-600 dark:text-green-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    high: 'text-orange-600 dark:text-orange-400',
    critical: 'text-red-600 dark:text-red-400',
  };
  return colors[level || 'low'] || colors.low;
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    'Free Limits': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'Billing': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'Account': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    'BaaS': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'Console': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    'Vercel': 'bg-black text-white dark:bg-white dark:text-black',
  };
  return colors[category] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}

export default async function MessagePage({ params }: Props) {
  const { messageId } = await params;
  const data = await getMessageData(messageId);

  if (!data) {
    notFound();
  }

  // Make auth optional - users can view messages without logging in
  const { user } = await withAuth();
  const ignoredCount = user ? await getIgnoredUsersCount() : 0;

  const discordUrl = getDiscordMessageUrl(data);

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(timestamp));
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="container mx-auto max-w-7xl px-4 py-8">
        {user && (
          <DashboardHeader 
            user={user} 
            title="Message Details"
            subtitle={`Viewing message from ${data.author.displayName || data.author.username}`}
            ignoredCount={ignoredCount}
          />
        )}

        <div className="max-w-4xl">
          {user && (
            <div className="mb-6">
              <Link href="/dashboard" className="text-blue-600 hover:underline">
                ← Back to Dashboard
              </Link>
            </div>
          )}

          <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {data.author.avatarUrl && (
                  <img
                    src={data.author.avatarUrl}
                    alt={data.author.displayName || data.author.username}
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold">
                    {data.author.displayName || data.author.username}
                    {data.author.bot && (
                      <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
                        BOT
                      </span>
                    )}
                  </h1>
                  <div className="text-muted-foreground">
                    {data.message.channelName && `#${data.message.channelName}`}
                    {data.message.threadName && ` → ${data.message.threadName}`}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {formatTimestamp(data.message.messageTimestamp)}
                  </div>
                </div>
              </div>
              {discordUrl && (
                <Button asChild variant="outline">
                  <a href={discordUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Discord
                  </a>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Message Content */}
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <p className="text-lg leading-relaxed whitespace-pre-wrap">
                {data.message.content}
              </p>
            </div>

            {/* AI Analysis */}
            {data.analysis && (
              <div className="space-y-4 pt-4 border-t">
                <h2 className="text-xl font-semibold">AI Analysis</h2>

                {/* Sentiment */}
                {data.analysis.sentiment && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Sentiment</div>
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(data.analysis.sentiment)}`}
                    >
                      {data.analysis.sentiment.charAt(0).toUpperCase() + data.analysis.sentiment.slice(1)}
                    </div>
                  </div>
                )}

                {/* Type Indicators */}
                <div className="flex flex-wrap gap-2">
                  {data.analysis.isQuestion && (
                    <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                      ❓ Question
                    </div>
                  )}
                  {data.analysis.isAnswer && (
                    <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                      💬 Answer
                    </div>
                  )}
                  {data.analysis.needsHelp && (
                    <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
                      🆘 Needs Help
                    </div>
                  )}
                </div>

                {/* Categories */}
                {data.analysis.categoryTags && Array.isArray(data.analysis.categoryTags) && data.analysis.categoryTags.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Categories</div>
                    <div className="flex flex-wrap gap-2">
                      {data.analysis.categoryTags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(tag)}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Severity */}
                {data.analysis.severityLevel && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Severity</div>
                    <div className="flex items-center gap-4">
                      <div className={`text-4xl font-bold ${getSeverityColor(data.analysis.severityLevel)}`}>
                        {data.analysis.severityScore}
                      </div>
                      <div>
                        <div className={`text-lg font-semibold ${getSeverityColor(data.analysis.severityLevel)}`}>
                          {data.analysis.severityLevel.toUpperCase()}
                        </div>
                        {data.analysis.severityReason && (
                          <div className="text-sm text-muted-foreground">
                            {data.analysis.severityReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Summary */}
                {data.analysis.aiSummary && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">AI Summary</div>
                    <p className="text-muted-foreground italic">
                      "{data.analysis.aiSummary}"
                    </p>
                  </div>
                )}

                {/* Confidence Score */}
                {data.analysis.confidenceScore && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Confidence Score</div>
                    <div className="text-lg font-semibold">
                      {(Number(data.analysis.confidenceScore) * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </main>
    </div>
  );
}

