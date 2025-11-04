'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  Smile,
  Meh,
  Frown,
  AlertTriangle,
  Zap,
  HelpCircle,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';
import { getRecentMessages } from '@/app/dashboard/actions';
import type { MentionData } from '@situationcord/shared-types';
import Link from 'next/link';

type Message = Awaited<ReturnType<typeof getRecentMessages>>[number];

interface MessageLogProps {
  initialMessages: Message[];
}

const MAX_MESSAGE_LENGTH = 300;

interface ParsedContentPart {
    type: 'text' | 'mention';
    content: string;
    username?: string;
}

function getDiscordMessageUrl(message: Message): string | null {
    // Discord message URL format: https://discord.com/channels/{guild_id}/{channel_id}/{message_id}
    // For threads, use thread_id instead of channel_id
    if (!message.guildId || !message.messageId) {
        return null;
    }

    const channelOrThreadId = message.threadId || message.channelId;
    return `https://discord.com/channels/${message.guildId}/${channelOrThreadId}/${message.messageId}`;
}

function parseMessageContent(
    content: string,
    mentions: unknown
): ParsedContentPart[] {
    // Type guard for mentions
    const mentionArray = Array.isArray(mentions) ? mentions : [];
    const mentionMap = new Map<string, MentionData>();

    mentionArray.forEach((mention: any) => {
        if (mention && typeof mention === 'object' && 'id' in mention) {
            mentionMap.set(mention.id, mention as MentionData);
        }
    });

    const parts: ParsedContentPart[] = [];
    const mentionRegex = /<@!?(\d+)>/g;
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
        // Add text before the mention
        if (match.index > lastIndex) {
            parts.push({
                type: 'text',
                content: content.slice(lastIndex, match.index),
            });
        }

        // Add the mention
        const userId = match[1];
        const mention = mentionMap.get(userId);
        parts.push({
            type: 'mention',
            content: match[0],
            username: mention?.username || 'Unknown User',
        });

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
        parts.push({
            type: 'text',
            content: content.slice(lastIndex),
        });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }];
}

function getSentimentIcon(sentiment: string | null) {
    if (!sentiment) return null;
    
    switch (sentiment) {
        case 'positive':
            return <Smile className="h-4 w-4 text-green-600 dark:text-green-400" />;
        case 'neutral':
            return <Meh className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
        case 'negative':
            return <Frown className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
        case 'frustrated':
            return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />;
        case 'urgent':
            return <Zap className="h-4 w-4 text-red-600 dark:text-red-400" />;
        default:
            return null;
    }
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

export function MessageLog({ initialMessages }: MessageLogProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isPending, startTransition] = useTransition();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  // Helper to find the answered question in the current message list
  const findAnsweredQuestion = (answeredMessageId: string): Message | undefined => {
    return messages.find(m => m.messageId === answeredMessageId);
  };

  // Helper to find answers to a specific question
  const findAnswersToQuestion = (questionMessageId: string): Message[] => {
    return messages.filter(m => 
      m.analysis?.isAnswer && 
      m.analysis?.answeredMessageId === questionMessageId
    );
  };

    const refresh = () => {
        startTransition(async () => {
            const newMessages = await getRecentMessages();
            setMessages(newMessages);
            setLastRefresh(new Date());
        });
    };

    // Auto-refresh every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refresh();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const formatTimestamp = (timestamp: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        }).format(new Date(timestamp));
    };

    const formatLocation = (message: Message) => {
        const parts = [];
        if (message.channelName) parts.push(`#${message.channelName}`);
        if (message.threadName) parts.push(`→ ${message.threadName}`);
        return parts.join(' ');
    };

    const renderLocation = (message: Message) => {
        const location = formatLocation(message);
        const url = getDiscordMessageUrl(message);

        if (!url) {
            return <span className="text-xs text-muted-foreground truncate">{location}</span>;
        }

        return (
            <Link
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 truncate transition-colors underline decoration-dotted"
            >
                {location}
            </Link>
        );
    };

    const toggleExpanded = (messageId: string) => {
        setExpandedMessages((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(messageId)) {
                newSet.delete(messageId);
            } else {
                newSet.add(messageId);
            }
            return newSet;
        });
    };

    const isMessageLong = (content: string) => {
        return content.length > MAX_MESSAGE_LENGTH;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Message Log</CardTitle>
                        <CardDescription>
                            Recent Discord messages · Last updated{' '}
                            {formatTimestamp(lastRefresh)}
                        </CardDescription>
                    </div>
                    <Button
                        onClick={refresh}
                        disabled={isPending}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No messages yet
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((message) => {
                            const discordUrl = getDiscordMessageUrl(message);

                            return (
                                <div
                                    key={message.id}
                                    className="border-b border-border pb-4 last:border-0 last:pb-0"
                                >
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            {message.author.avatarUrl && (
                                                <Link
                                                    href={`/dashboard/users/${message.author.id}`}
                                                >
                                                    <img
                                                        src={message.author.avatarUrl}
                                                        alt={message.author.displayName || message.author.username}
                                                        className="w-8 h-8 rounded-full flex-shrink-0"
                                                    />
                                                </Link>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <Link
                                                    href={`/dashboard/users/${message.author.id}`}
                                                 
                                                >
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold truncate">
                                                            {message.author.displayName || message.author.username}
                                                        </span>
                                                        {message.author.bot && (
                                                            <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
                                                                BOT
                                                            </span>
                                                        )}
                                                    </div>
                                                </Link>
                                                <div className="truncate">
                                                    {renderLocation(message)}
                                                </div>
                                            </div>

                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <time className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatTimestamp(message.messageTimestamp)}
                                            </time>
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0"
                                                title="View Message Details"
                                            >
                                                <Link href={`/message/${message.messageId}`}>
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            {discordUrl && (
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 w-6 p-0"
                                                >
                                                    <a
                                                        href={discordUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Open in Discord"
                                                    >
                                                        <ExternalLink className="h-4 w-4 text-blue-500" />
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                  </div>
                  <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {message.content ? (
                      <>
                        <div className={isMessageLong(message.content) && !expandedMessages.has(message.id) ? 'line-clamp-3' : 'whitespace-pre-wrap'}>
                          {parseMessageContent(message.content, message.mentions).map((part, idx) => {
                            if (part.type === 'mention') {
                              return (
                                <span
                                  key={idx}
                                  className="bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded font-medium"
                                >
                                  @{part.username}
                                </span>
                              );
                            }
                            return <span key={idx}>{part.content}</span>;
                          })}
                        </div>
                        {isMessageLong(message.content) && (
                          <button
                            onClick={() => toggleExpanded(message.id)}
                            className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            {expandedMessages.has(message.id) ? (
                              <>
                                <ChevronUp className="h-3 w-3" />
                                Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" />
                                Show more
                              </>
                            )}
                          </button>
                        )}
                      </>
                    ) : (
                      <em className="text-muted-foreground">No content</em>
                    )}
                  </div>

                  {/* AI Analysis Section */}
                  {message.analysis && message.analysis.sentiment && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Sentiment Icon */}
                        <div className="flex items-center gap-1.5 text-xs">
                          {getSentimentIcon(message.analysis.sentiment)}
                          <span className="text-muted-foreground capitalize">
                            {message.analysis.sentiment}
                          </span>
                        </div>

                        {/* Question/Answer Indicators */}
                        {message.analysis.isQuestion && (() => {
                          const answers = findAnswersToQuestion(message.messageId);
                          const hasAnswers = answers.length > 0;
                          return (
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                              hasAnswers 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            }`}>
                            <HelpCircle className="h-3 w-3" />
                            <span>Question</span>
                              {hasAnswers && (
                                <span className="ml-0.5 font-medium">
                                  ✓ {answers.length} {answers.length === 1 ? 'answer' : 'answers'}
                                </span>
                              )}
                          </div>
                          );
                        })()}
                        {message.analysis.isAnswer && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs">
                            <MessageCircle className="h-3 w-3" />
                            <span>Answer</span>
                          </div>
                        )}
                        
                        {/* Q&A Reference - Show if this answers another message */}
                        {message.analysis.isAnswer && message.analysis.answeredMessageId && (() => {
                          const answeredQuestion = findAnsweredQuestion(message.analysis.answeredMessageId);
                          return (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs">
                              <span className="text-amber-700 dark:text-amber-300">
                                → Answers
                              </span>
                              {answeredQuestion ? (
                                <span className="text-amber-900 dark:text-amber-100 font-medium">
                                  {answeredQuestion.author.username}'s question
                                </span>
                              ) : (
                                <span className="font-mono text-amber-600 dark:text-amber-400">
                                  {message.analysis.answeredMessageId.slice(0, 8)}...
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        {/* Needs Help Indicator */}
                        {message.analysis.needsHelp && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium">
                            <AlertCircle className="h-3 w-3" />
                            <span>Needs Help</span>
                          </div>
                        )}

                        {/* Category Tags */}
                        {message.analysis.categoryTags && Array.isArray(message.analysis.categoryTags) && message.analysis.categoryTags.length > 0 && (
                          <>
                            <div className="w-px h-4 bg-border" />
                            {message.analysis.categoryTags.map((tag) => (
                              <span
                                key={tag}
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(tag)}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </>
                        )}
                      </div>

                      {/* AI Summary */}
                      {message.analysis.aiSummary && (
                        <div className="mt-2 text-xs text-muted-foreground italic">
                          {message.analysis.aiSummary}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

