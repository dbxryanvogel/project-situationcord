'use server';

import { db } from '@/lib/db';
import { discordMessages, discordAuthors, messageAnalysis, ignoredUsers } from '@/lib/db';
import { desc, eq, gte, sql, notInArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@workos-inc/authkit-nextjs';

export async function getRecentMessages(limit: number = 50) {
  // First get list of ignored user IDs
  const ignoredUserIds = await db
    .select({ userId: ignoredUsers.userId })
    .from(ignoredUsers);

  const ignoredIds = ignoredUserIds.map(u => u.userId);

  // Build the query
  const query = db
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
      analysis: {
        sentiment: messageAnalysis.sentiment,
        isQuestion: messageAnalysis.isQuestion,
        isAnswer: messageAnalysis.isAnswer,
        answeredMessageId: messageAnalysis.answeredMessageId,
        needsHelp: messageAnalysis.needsHelp,
        categoryTags: messageAnalysis.categoryTags,
        aiSummary: messageAnalysis.aiSummary,
        confidenceScore: messageAnalysis.confidenceScore,
      },
    })
    .from(discordMessages)
    .innerJoin(discordAuthors, eq(discordMessages.authorId, discordAuthors.id))
    .leftJoin(messageAnalysis, eq(discordMessages.id, messageAnalysis.messageId))
    .$dynamic();

  // Filter out ignored users if there are any
  const messages = await (ignoredIds.length > 0
    ? query.where(notInArray(discordMessages.authorId, ignoredIds))
    : query)
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

// Ignore List Management Actions

export async function addUserToIgnoreList(userId: string, reason?: string) {
  const { user } = await withAuth();
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    const id = nanoid();
    await db.insert(ignoredUsers).values({
      id,
      userId,
      reason: reason || null,
      ignoredBy: user.email,
      createdAt: new Date(),
    });

    return { success: true, id };
  } catch (error) {
    console.error('Error adding user to ignore list:', error);
    throw new Error('Failed to add user to ignore list');
  }
}

export async function removeUserFromIgnoreList(userId: string) {
  const { user } = await withAuth();
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    await db
      .delete(ignoredUsers)
      .where(eq(ignoredUsers.userId, userId));

    return { success: true };
  } catch (error) {
    console.error('Error removing user from ignore list:', error);
    throw new Error('Failed to remove user from ignore list');
  }
}

export async function checkIfUserIsIgnored(userId: string) {
  try {
    const ignored = await db
      .select()
      .from(ignoredUsers)
      .where(eq(ignoredUsers.userId, userId))
      .limit(1);

    return ignored.length > 0;
  } catch (error) {
    console.error('Error checking ignore list:', error);
    return false;
  }
}

export async function getIgnoredUsers() {
  try {
    const ignored = await db
      .select({
        id: ignoredUsers.id,
        userId: ignoredUsers.userId,
        reason: ignoredUsers.reason,
        ignoredBy: ignoredUsers.ignoredBy,
        createdAt: ignoredUsers.createdAt,
        user: {
          username: discordAuthors.username,
          displayName: discordAuthors.displayName,
          avatarUrl: discordAuthors.avatarUrl,
          bot: discordAuthors.bot,
        },
      })
      .from(ignoredUsers)
      .innerJoin(discordAuthors, eq(ignoredUsers.userId, discordAuthors.id))
      .orderBy(desc(ignoredUsers.createdAt));

    return ignored;
  } catch (error) {
    console.error('Error getting ignored users:', error);
    return [];
  }
}

export async function getIgnoredUsersCount() {
  try {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)::int`.as('count'),
      })
      .from(ignoredUsers);

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error getting ignored users count:', error);
    return 0;
  }
}

// Radar Chart Data Actions

export async function getQuestionAnswerData() {
  try {
    const results = await db
      .select({
        isQuestion: messageAnalysis.isQuestion,
        isAnswer: messageAnalysis.isAnswer,
        needsHelp: messageAnalysis.needsHelp,
      })
      .from(messageAnalysis);

    const questions = results.filter(r => r.isQuestion).length;
    const answers = results.filter(r => r.isAnswer).length;
    const needsHelp = results.filter(r => r.needsHelp).length;
    const general = results.filter(r => !r.isQuestion && !r.isAnswer && !r.needsHelp).length;

    return [
      { category: 'Questions', value: questions },
      { category: 'Answers', value: answers },
      { category: 'Needs Help', value: needsHelp },
      { category: 'General', value: general },
    ];
  } catch (error) {
    console.error('Error getting question/answer data:', error);
    return [
      { category: 'Questions', value: 0 },
      { category: 'Answers', value: 0 },
      { category: 'Needs Help', value: 0 },
      { category: 'General', value: 0 },
    ];
  }
}

export async function getTopicsData() {
  try {
    const results = await db
      .select({
        categoryTags: messageAnalysis.categoryTags,
      })
      .from(messageAnalysis);

    // Count occurrences of each category tag
    const categoryCount = new Map<string, number>();
    
    results.forEach(row => {
      const tags = row.categoryTags as string[] | null;
      if (tags && Array.isArray(tags)) {
        tags.forEach(tag => {
          categoryCount.set(tag, (categoryCount.get(tag) || 0) + 1);
        });
      }
    });

    // Convert to array and sort by count
    const sortedCategories = Array.from(categoryCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8) // Top 8 categories for better radar chart visualization
      .map(([category, value]) => ({ category, value }));

    // Ensure we have at least some data for the chart
    if (sortedCategories.length === 0) {
      return [
        { category: 'Free Limits', value: 0 },
        { category: 'Billing', value: 0 },
        { category: 'Account', value: 0 },
        { category: 'BaaS', value: 0 },
        { category: 'Console', value: 0 },
      ];
    }

    return sortedCategories;
  } catch (error) {
    console.error('Error getting topics data:', error);
    return [
      { category: 'Free Limits', value: 0 },
      { category: 'Billing', value: 0 },
      { category: 'Account', value: 0 },
      { category: 'BaaS', value: 0 },
      { category: 'Console', value: 0 },
    ];
  }
}

export async function getSentimentData() {
  try {
    const results = await db
      .select({
        sentiment: messageAnalysis.sentiment,
      })
      .from(messageAnalysis);

    // Count occurrences of each sentiment
    const sentimentCount = new Map<string, number>();
    
    results.forEach(row => {
      if (row.sentiment) {
        sentimentCount.set(row.sentiment, (sentimentCount.get(row.sentiment) || 0) + 1);
      }
    });

    // Convert to array with proper capitalization
    const sentiments = ['positive', 'neutral', 'negative', 'frustrated', 'urgent'];
    const data = sentiments.map(sentiment => ({
      category: sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
      value: sentimentCount.get(sentiment) || 0,
    }));

    return data;
  } catch (error) {
    console.error('Error getting sentiment data:', error);
    return [
      { category: 'Positive', value: 0 },
      { category: 'Neutral', value: 0 },
      { category: 'Negative', value: 0 },
      { category: 'Frustrated', value: 0 },
      { category: 'Urgent', value: 0 },
    ];
  }
}

