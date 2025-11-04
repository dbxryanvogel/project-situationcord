'use server';

import { db } from '@/lib/db';
import { discordMessages, discordAuthors } from '@/lib/db';
import { desc, eq, gte, sql } from 'drizzle-orm';

export async function getRecentMessages(limit: number = 50) {
  const messages = await db
    .select({
      id: discordMessages.id,
      messageId: discordMessages.messageId,
      content: discordMessages.content,
      messageTimestamp: discordMessages.messageTimestamp,
      channelId: discordMessages.channelId,
      channelName: discordMessages.channelName,
      threadId: discordMessages.threadId,
      threadName: discordMessages.threadName,
      guildId: discordMessages.guildId,
      guildName: discordMessages.guildName,
      mentions: discordMessages.mentions,
      author: {
        id: discordAuthors.id,
        username: discordAuthors.username,
        displayName: discordAuthors.displayName,
        avatarUrl: discordAuthors.avatarUrl,
        bot: discordAuthors.bot,
      },
    })
    .from(discordMessages)
    .innerJoin(discordAuthors, eq(discordMessages.authorId, discordAuthors.id))
    .orderBy(desc(discordMessages.messageTimestamp))
    .limit(limit);

  return messages;
}

export async function getMessageChartData(days: number = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Query messages grouped by date and whether they're in a thread
  const results = await db
    .select({
      date: sql<string>`DATE(${discordMessages.messageTimestamp})`.as('date'),
      isThread: sql<boolean>`${discordMessages.threadId} IS NOT NULL`.as('is_thread'),
      count: sql<number>`COUNT(*)::int`.as('count'),
    })
    .from(discordMessages)
    .where(gte(discordMessages.messageTimestamp, startDate))
    .groupBy(sql`DATE(${discordMessages.messageTimestamp})`, sql`${discordMessages.threadId} IS NOT NULL`)
    .orderBy(sql`DATE(${discordMessages.messageTimestamp})`);

  // Transform the results into the chart format
  const chartDataMap = new Map<string, { date: string; channel: number; thread: number }>();

  // Initialize all dates in the range with zero counts
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    chartDataMap.set(dateStr, { date: dateStr, channel: 0, thread: 0 });
  }

  // Fill in actual data
  results.forEach((row) => {
    const existing = chartDataMap.get(row.date) || { date: row.date, channel: 0, thread: 0 };
    if (row.isThread) {
      existing.thread = row.count;
    } else {
      existing.channel = row.count;
    }
    chartDataMap.set(row.date, existing);
  });

  return Array.from(chartDataMap.values());
}

export async function getUserMessages(userId: string, limit: number = 100) {
  const messages = await db
    .select({
      id: discordMessages.id,
      messageId: discordMessages.messageId,
      content: discordMessages.content,
      messageTimestamp: discordMessages.messageTimestamp,
      channelId: discordMessages.channelId,
      channelName: discordMessages.channelName,
      threadId: discordMessages.threadId,
      threadName: discordMessages.threadName,
      guildId: discordMessages.guildId,
      guildName: discordMessages.guildName,
      mentions: discordMessages.mentions,
    })
    .from(discordMessages)
    .where(eq(discordMessages.authorId, userId))
    .orderBy(desc(discordMessages.messageTimestamp))
    .limit(limit);

  return messages;
}

export async function getUserInfo(userId: string) {
  const user = await db
    .select({
      id: discordAuthors.id,
      username: discordAuthors.username,
      displayName: discordAuthors.displayName,
      avatarUrl: discordAuthors.avatarUrl,
      bot: discordAuthors.bot,
      createdAt: discordAuthors.createdAt,
    })
    .from(discordAuthors)
    .where(eq(discordAuthors.id, userId))
    .limit(1);

  return user[0] || null;
}

export async function getUserMessageStats(userId: string) {
  const stats = await db
    .select({
      totalMessages: sql<number>`COUNT(*)::int`.as('total_messages'),
      channelMessages: sql<number>`COUNT(*) FILTER (WHERE ${discordMessages.threadId} IS NULL)::int`.as('channel_messages'),
      threadMessages: sql<number>`COUNT(*) FILTER (WHERE ${discordMessages.threadId} IS NOT NULL)::int`.as('thread_messages'),
      firstMessage: sql<Date>`MIN(${discordMessages.messageTimestamp})`.as('first_message'),
      lastMessage: sql<Date>`MAX(${discordMessages.messageTimestamp})`.as('last_message'),
    })
    .from(discordMessages)
    .where(eq(discordMessages.authorId, userId));

  return stats[0] || null;
}

