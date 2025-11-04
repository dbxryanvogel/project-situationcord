/**
 * Shared type definitions for Discord message webhook payload
 * Used by both the Discord bot and Next.js webhook API
 */

export interface WebhookPayload {
  eventType: string;
  timestamp: string;
  message: MessageData;
}

export interface MessageData {
  id: string;
  content: string;
  timestamp: string;
  editedTimestamp: string | null;
  channelId: string;
  channelName: string | null;
  channelType: number;
  threadId: string | null;
  threadName: string | null;
  threadType: number | null;
  parentChannelId: string | null;
  parentChannelName: string | null;
  author: AuthorData;
  guild: GuildData | null;
  embeds: EmbedData[];
  attachments: AttachmentData[];
  mentions: MentionData[];
  reactions: ReactionData[];
  pinned: boolean;
  type: number;
  referencedMessageId: string | null;
}

export interface AuthorData {
  id: string;
  username: string;
  discriminator: string;
  displayName: string | null;
  avatarUrl: string | null;
  bot: boolean;
  system: boolean;
}

export interface GuildData {
  id: string;
  name: string | null;
}

export interface EmbedData {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  footer?: {
    text?: string;
    iconUrl?: string;
  };
  image?: {
    url?: string;
  };
  thumbnail?: {
    url?: string;
  };
  author?: {
    name?: string;
    url?: string;
    iconUrl?: string;
  };
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
}

export interface AttachmentData {
  id: string;
  filename: string;
  contentType: string | null;
  size: number;
  url: string;
  proxyUrl: string;
  height: number | null;
  width: number | null;
  description: string | null;
}

export interface MentionData {
  id: string;
  username: string;
  discriminator: string;
}

export interface ReactionData {
  emoji: {
    id: string | null;
    name: string;
    animated: boolean;
  };
  count: number;
  me: boolean;
}

