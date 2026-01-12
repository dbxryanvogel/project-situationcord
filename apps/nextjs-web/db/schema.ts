import {
  pgTable,
  jsonb,
  text,
  timestamp,
  boolean,
  integer,
  index,
  numeric,
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

// Message Analysis table
export const messageAnalysis = pgTable(
  'message_analysis',
  {
    // Primary key
    id: text('id').primaryKey(),
    
    // Foreign key to discord_messages
    messageId: text('message_id')
      .notNull()
      .references(() => discordMessages.id, { onDelete: 'cascade' }),
    
    // Analysis fields
    sentiment: text('sentiment').notNull(), // positive, neutral, negative, frustrated, urgent
    isQuestion: boolean('is_question').notNull().default(false),
    isAnswer: boolean('is_answer').notNull().default(false),
    answeredMessageId: text('answered_message_id'), // References another message that was answered
    needsHelp: boolean('needs_help').notNull().default(false),
    categoryTags: jsonb('category_tags').$type<string[]>().notNull().default([]), // Free Limits, Billing, Account, BaaS, Console, Vercel
    aiSummary: text('ai_summary').notNull(),
    confidenceScore: numeric('confidence_score', { precision: 3, scale: 2 }), // 0.00 to 1.00
    severityScore: numeric('severity_score', { precision: 5, scale: 2 }), // 0.00 to 100.00
    severityLevel: text('severity_level'), // low, medium, high, critical
    severityReason: text('severity_reason'),
    modelVersion: text('model_version').notNull(),
    
    // Metadata
    processedAt: timestamp('processed_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      // Indexes for common queries
      messageIdIdx: index('analysis_message_id_idx').on(table.messageId),
      sentimentIdx: index('analysis_sentiment_idx').on(table.sentiment),
      needsHelpIdx: index('analysis_needs_help_idx').on(table.needsHelp),
      isQuestionIdx: index('analysis_is_question_idx').on(table.isQuestion),
      isAnswerIdx: index('analysis_is_answer_idx').on(table.isAnswer),
      severityLevelIdx: index('analysis_severity_level_idx').on(table.severityLevel),
    };
  }
);

// Relations
export const discordAuthorsRelations = relations(discordAuthors, ({ many }) => ({
  messages: many(discordMessages),
}));

export const discordMessagesRelations = relations(discordMessages, ({ one, many }) => ({
  author: one(discordAuthors, {
    fields: [discordMessages.authorId],
    references: [discordAuthors.id],
  }),
  analysis: one(messageAnalysis, {
    fields: [discordMessages.id],
    references: [messageAnalysis.messageId],
  }),
}));

export const messageAnalysisRelations = relations(messageAnalysis, ({ one }) => ({
  message: one(discordMessages, {
    fields: [messageAnalysis.messageId],
    references: [discordMessages.id],
  }),
}));

// Ignored Users table
export const ignoredUsers = pgTable(
  'ignored_users',
  {
    // Primary key
    id: text('id').primaryKey(),
    
    // Discord user ID to ignore
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => discordAuthors.id, { onDelete: 'cascade' }),
    
    // Optional reason for ignoring
    reason: text('reason'),
    
    // Who added them to ignore list (could be user email or system)
    ignoredBy: text('ignored_by'),
    
    // Metadata
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('ignored_users_user_id_idx').on(table.userId),
    };
  }
);

export const ignoredUsersRelations = relations(ignoredUsers, ({ one }) => ({
  user: one(discordAuthors, {
    fields: [ignoredUsers.userId],
    references: [discordAuthors.id],
  }),
}));

// Bugs table
export const bugs = pgTable(
  'bugs',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    firstReportedAt: timestamp('first_reported_at').notNull(),
    isLlmGenerated: boolean('is_llm_generated').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      titleIdx: index('bugs_title_idx').on(table.title),
      firstReportedAtIdx: index('bugs_first_reported_at_idx').on(table.firstReportedAt),
    };
  }
);

// Bug Reports table (individual reports referencing a bug)
export const bugReports = pgTable(
  'bug_reports',
  {
    id: text('id').primaryKey(),
    bugId: text('bug_id')
      .notNull()
      .references(() => bugs.id, { onDelete: 'cascade' }),
    discordLink: text('discord_link').notNull(),
    reportedAt: timestamp('reported_at').notNull(),
    createdBy: text('created_by'),
    isLlmGenerated: boolean('is_llm_generated').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      bugIdIdx: index('bug_reports_bug_id_idx').on(table.bugId),
      reportedAtIdx: index('bug_reports_reported_at_idx').on(table.reportedAt),
    };
  }
);

// Bug relations
export const bugsRelations = relations(bugs, ({ many }) => ({
  reports: many(bugReports),
}));

export const bugReportsRelations = relations(bugReports, ({ one }) => ({
  bug: one(bugs, {
    fields: [bugReports.bugId],
    references: [bugs.id],
  }),
}));

// Feature Requests table
export const featureRequests = pgTable(
  'feature_requests',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    firstRequestedAt: timestamp('first_requested_at').notNull(),
    isLlmGenerated: boolean('is_llm_generated').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      titleIdx: index('feature_requests_title_idx').on(table.title),
      firstRequestedAtIdx: index('feature_requests_first_requested_at_idx').on(table.firstRequestedAt),
    };
  }
);

// Feature Request Reports table (individual reports referencing a feature request)
export const featureRequestReports = pgTable(
  'feature_request_reports',
  {
    id: text('id').primaryKey(),
    featureId: text('feature_id')
      .notNull()
      .references(() => featureRequests.id, { onDelete: 'cascade' }),
    discordLink: text('discord_link').notNull(),
    requestedAt: timestamp('requested_at').notNull(),
    createdBy: text('created_by'),
    isLlmGenerated: boolean('is_llm_generated').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      featureIdIdx: index('feature_request_reports_feature_id_idx').on(table.featureId),
      requestedAtIdx: index('feature_request_reports_requested_at_idx').on(table.requestedAt),
    };
  }
);

// Feature Request relations
export const featureRequestsRelations = relations(featureRequests, ({ many }) => ({
  reports: many(featureRequestReports),
}));

export const featureRequestReportsRelations = relations(featureRequestReports, ({ one }) => ({
  featureRequest: one(featureRequests, {
    fields: [featureRequestReports.featureId],
    references: [featureRequests.id],
  }),
}));

export type DiscordAuthor = typeof discordAuthors.$inferSelect;
export type NewDiscordAuthor = typeof discordAuthors.$inferInsert;

export type DiscordMessage = typeof discordMessages.$inferSelect;
export type NewDiscordMessage = typeof discordMessages.$inferInsert;

export type MessageAnalysis = typeof messageAnalysis.$inferSelect;
export type NewMessageAnalysis = typeof messageAnalysis.$inferInsert;

export type IgnoredUser = typeof ignoredUsers.$inferSelect;
export type NewIgnoredUser = typeof ignoredUsers.$inferInsert;

export type Bug = typeof bugs.$inferSelect;
export type NewBug = typeof bugs.$inferInsert;

export type BugReport = typeof bugReports.$inferSelect;
export type NewBugReport = typeof bugReports.$inferInsert;

export type FeatureRequest = typeof featureRequests.$inferSelect;
export type NewFeatureRequest = typeof featureRequests.$inferInsert;

export type FeatureRequestReport = typeof featureRequestReports.$inferSelect;
export type NewFeatureRequestReport = typeof featureRequestReports.$inferInsert;
