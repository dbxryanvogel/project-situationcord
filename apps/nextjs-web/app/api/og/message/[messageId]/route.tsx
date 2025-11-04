import { ImageResponse } from 'next/og';
import { db } from '@/lib/db';
import { discordMessages, discordAuthors, messageAnalysis } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';

const MAX_CONTENT_LENGTH = 200;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;

    // Fetch message with analysis
    const result = await db
      .select({
        message: {
          messageId: discordMessages.messageId,
          content: discordMessages.content,
          messageTimestamp: discordMessages.messageTimestamp,
          channelName: discordMessages.channelName,
          threadName: discordMessages.threadName,
        },
        author: {
          username: discordAuthors.username,
          displayName: discordAuthors.displayName,
          avatarUrl: discordAuthors.avatarUrl,
        },
        analysis: {
          sentiment: messageAnalysis.sentiment,
          isQuestion: messageAnalysis.isQuestion,
          isAnswer: messageAnalysis.isAnswer,
          needsHelp: messageAnalysis.needsHelp,
          categoryTags: messageAnalysis.categoryTags,
          aiSummary: messageAnalysis.aiSummary,
          severityScore: messageAnalysis.severityScore,
          severityLevel: messageAnalysis.severityLevel,
        },
      })
      .from(discordMessages)
      .innerJoin(discordAuthors, eq(discordMessages.authorId, discordAuthors.id))
      .leftJoin(messageAnalysis, eq(discordMessages.id, messageAnalysis.messageId))
      .where(eq(discordMessages.messageId, messageId))
      .limit(1);

    if (result.length === 0) {
      return new Response('Message not found', { status: 404 });
    }

    const data = result[0];

    // Truncate content if too long
    const truncatedContent =
      data.message.content.length > MAX_CONTENT_LENGTH
        ? data.message.content.substring(0, MAX_CONTENT_LENGTH) + '...'
        : data.message.content;

    // Get sentiment color and emoji
    const sentimentConfig = {
      positive: { color: '#22c55e', emoji: '😊', label: 'Positive' },
      neutral: { color: '#6b7280', emoji: '😐', label: 'Neutral' },
      negative: { color: '#f97316', emoji: '😟', label: 'Negative' },
      frustrated: { color: '#ef4444', emoji: '😤', label: 'Frustrated' },
      urgent: { color: '#dc2626', emoji: '⚡', label: 'Urgent' },
    };

    const sentiment = data.analysis?.sentiment || 'neutral';
    const sentimentInfo = sentimentConfig[sentiment as keyof typeof sentimentConfig] || sentimentConfig.neutral;

    // Get severity color
    const severityConfig = {
      low: { color: '#10b981', label: 'Low' },
      medium: { color: '#f59e0b', label: 'Medium' },
      high: { color: '#ef4444', label: 'High' },
      critical: { color: '#dc2626', label: 'Critical' },
    };

    const severityLevel = data.analysis?.severityLevel || 'low';
    const severityInfo = severityConfig[severityLevel as keyof typeof severityConfig] || severityConfig.low;

    // Category colors
    const categoryColors: Record<string, string> = {
      'Free Limits': '#a855f7',
      'Billing': '#3b82f6',
      'Account': '#eab308',
      'BaaS': '#10b981',
      'Console': '#ef4444',
      'Vercel': '#000000',
    };

    const categories = (data.analysis?.categoryTags as string[]) || [];

    // Convert Discord WebP avatars to PNG (OG images don't support WebP)
    const avatarUrl = data.author.avatarUrl?.replace(/\.webp$/, '.png') || null;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0a0a0a',
            padding: '60px',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  width={80}
                  height={80}
                  style={{ borderRadius: '50%' }}
                />
              ) : null}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffffff' }}>
                  {data.author.displayName || data.author.username}
                </div>
                <div style={{ fontSize: '24px', color: '#9ca3af' }}>
                  {(data.message.channelName ? `#${data.message.channelName}` : '') + (data.message.threadName ? ` → ${data.message.threadName}` : '')}
                </div>
              </div>
            </div>
            
            {/* Sentiment Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 28px',
                backgroundColor: sentimentInfo.color,
                borderRadius: '12px',
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#ffffff',
              }}
            >
              <span>{sentimentInfo.emoji}</span>
              <span>{sentimentInfo.label}</span>
            </div>
          </div>

          {/* Message Content */}
          <div
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              padding: '32px',
              marginBottom: '32px',
              borderLeft: `6px solid ${sentimentInfo.color}`,
              fontSize: '28px',
              color: '#e5e7eb',
              lineHeight: 1.6,
            }}
          >
            {truncatedContent}
          </div>

          {/* AI Summary */}
          {data.analysis?.aiSummary ? (
            <div
              style={{
                fontSize: '22px',
                color: '#9ca3af',
                fontStyle: 'italic',
                marginBottom: '32px',
              }}
            >
              {`"${data.analysis.aiSummary.substring(0, 150)}${data.analysis.aiSummary.length > 150 ? '...' : ''}"` }
            </div>
          ) : null}

          {/* Analysis Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 'auto',
            }}
          >
            {/* Left side - Category Tags and Indicators */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
              {data.analysis?.isQuestion ? (
                <div
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '8px',
                    fontSize: '20px',
                    color: '#ffffff',
                    fontWeight: 'bold',
                  }}
                >
                  ❓ Question
                </div>
              ) : null}
              {data.analysis?.isAnswer ? (
                <div
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#10b981',
                    borderRadius: '8px',
                    fontSize: '20px',
                    color: '#ffffff',
                    fontWeight: 'bold',
                  }}
                >
                  💬 Answer
                </div>
              ) : null}
              {data.analysis?.needsHelp ? (
                <div
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ef4444',
                    borderRadius: '8px',
                    fontSize: '20px',
                    color: '#ffffff',
                    fontWeight: 'bold',
                  }}
                >
                  🆘 Needs Help
                </div>
              ) : null}
              {categories.slice(0, 3).map((cat) => (
                <div
                  key={cat}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: categoryColors[cat] || '#6b7280',
                    borderRadius: '8px',
                    fontSize: '20px',
                    color: '#ffffff',
                    fontWeight: 'bold',
                  }}
                >
                  {cat}
                </div>
              ))}
            </div>

            {/* Right side - Severity Score */}
            {data.analysis?.severityScore ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '20px', color: '#9ca3af' }}>
                  Severity
                </div>
                <div
                  style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: severityInfo.color,
                  }}
                >
                  {data.analysis.severityScore}
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: severityInfo.color,
                    textTransform: 'uppercase',
                  }}
                >
                  {severityInfo.label}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Error generating image', { status: 500 });
  }
}

