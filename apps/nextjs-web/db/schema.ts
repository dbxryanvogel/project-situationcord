import {
  pgTable,
  jsonb,
  text,
  timestamp,
  boolean,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import type { WebhookPayload } from '@situationcord/shared-types';
import { relations } from 'drizzle-orm';

// Discord Authors table
export const discordAuthors = pgTable(
  'discord_authors',
  {
    id: text('id').primaryKey(), // Discord author ID
    username: text('username').notNull(),
    discriminator: text('discriminator').notNull(),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    bot: boolean('bot').notNull().default(false),
    system: boolean('system').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      usernameIdx: index('author_username_idx').on(table.username),
    };
  }
);

// Discord Messages table
export const discordMessages = pgTable(
  'discord_messages',
  {
    // Primary key
    id: text('id').primaryKey(),
    
    // WebhookPayload top-level fields
    eventType: text('event_type').notNull(),
    timestamp: timestamp('timestamp').notNull(),
    
    // MessageData fields
    messageId: text('message_id').notNull().unique(),
    content: text('content').notNull(),
    messageTimestamp: timestamp('message_timestamp').notNull(),
    editedTimestamp: timestamp('edited_timestamp'),
    channelId: text('channel_id').notNull(),
    channelName: text('channel_name'),
    channelType: integer('channel_type').notNull(),
    threadId: text('thread_id'),
    threadName: text('thread_name'),
    threadType: integer('thread_type'),
    parentChannelId: text('parent_channel_id'),
    parentChannelName: text('parent_channel_name'),
    pinned: boolean('pinned').notNull().default(false),
    messageType: integer('message_type').notNull(),
    referencedMessageId: text('referenced_message_id'),
    
    // Foreign key to discord_authors
    authorId: text('author_id')
      .notNull()
      .references(() => discordAuthors.id, { onDelete: 'restrict' }),
    
    // GuildData fields (flattened)
    guildId: text('guild_id'),
    guildName: text('guild_name'),
    
    // Arrays stored as JSONB for flexibility
    embeds: jsonb('embeds').$type<WebhookPayload['message']['embeds']>().notNull().default([]),
    attachments: jsonb('attachments').$type<WebhookPayload['message']['attachments']>().notNull().default([]),
    mentions: jsonb('mentions').$type<WebhookPayload['message']['mentions']>().notNull().default([]),
    reactions: jsonb('reactions').$type<WebhookPayload['message']['reactions']>().notNull().default([]),
    
    // Metadata
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      // Indexes for common queries
      messageIdIdx: index('message_id_idx').on(table.messageId),
      channelIdIdx: index('channel_id_idx').on(table.channelId),
      threadIdIdx: index('thread_id_idx').on(table.threadId),
      authorIdIdx: index('author_id_idx').on(table.authorId),
      guildIdIdx: index('guild_id_idx').on(table.guildId),
      timestampIdx: index('timestamp_idx').on(table.timestamp),
      messageTimestampIdx: index('message_timestamp_idx').on(table.messageTimestamp),
    };
  }
);

// Relations
export const discordAuthorsRelations = relations(discordAuthors, ({ many }) => ({
  messages: many(discordMessages),
}));

export const discordMessagesRelations = relations(discordMessages, ({ one }) => ({
  author: one(discordAuthors, {
    fields: [discordMessages.authorId],
    references: [discordAuthors.id],
  }),
}));

export type DiscordAuthor = typeof discordAuthors.$inferSelect;
export type NewDiscordAuthor = typeof discordAuthors.$inferInsert;

export type DiscordMessage = typeof discordMessages.$inferSelect;
export type NewDiscordMessage = typeof discordMessages.$inferInsert;
