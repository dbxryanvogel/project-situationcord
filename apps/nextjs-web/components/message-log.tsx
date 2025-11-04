'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
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

export function MessageLog({ initialMessages }: MessageLogProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isPending, startTransition] = useTransition();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

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
                                                        <ExternalLink className="h-4 w-4" />
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
                </div>
              );
            })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

