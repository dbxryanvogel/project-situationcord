'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { getUserMessages } from '@/app/dashboard/actions';
import type { MentionData } from '@situationcord/shared-types';

type Message = Awaited<ReturnType<typeof getUserMessages>>[number];

interface UserMessageListProps {
  initialMessages: Message[];
  userId: string;
}

const MAX_MESSAGE_LENGTH = 300;

interface ParsedContentPart {
  type: 'text' | 'mention';
  content: string;
  username?: string;
}

function parseMessageContent(
  content: string,
  mentions: unknown
): ParsedContentPart[] {
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
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
      });
    }

    const userId = match[1];
    const mention = mentionMap.get(userId);
    parts.push({
      type: 'mention',
      content: match[0],
      username: mention?.username || 'Unknown User',
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex),
    });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content }];
}

function getDiscordMessageUrl(message: Message): string | null {
  if (!message.guildId || !message.messageId) {
    return null;
  }

  const channelOrThreadId = message.threadId || message.channelId;
  return `https://discord.com/channels/${message.guildId}/${channelOrThreadId}/${message.messageId}`;
}

export function UserMessageList({ initialMessages }: UserMessageListProps) {
  const [messages] = useState<Message[]>(initialMessages);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

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
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 truncate transition-colors underline decoration-dotted"
      >
        {location}
      </a>
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
        <CardTitle>Message History</CardTitle>
        <CardDescription>
          All messages from this user · {messages.length} message{messages.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No messages found
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
                    <div className="truncate flex-1">
                      {renderLocation(message)}
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

