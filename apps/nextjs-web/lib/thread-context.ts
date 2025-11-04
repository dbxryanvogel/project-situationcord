import { db, discordMessages, discordAuthors, messageAnalysis } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';
import type { ThreadContextMessage } from './ai-schemas';

/**
 * Fetches thread context for a given thread ID
 * Returns recent messages in chronological order (oldest first) for AI analysis
 * 
 * @param threadId - The Discord thread ID
 * @param limit - Maximum number of messages to retrieve (default: 20)
 * @returns Array of thread messages with context
 */
export async function getThreadContext(
  threadId: string,
  limit: number = 20
): Promise<ThreadContextMessage[]> {
  try {
    // Query messages in the thread, ordered by timestamp (newest first for LIMIT, then reverse)
    const messages = await db
      .select({
        messageId: discordMessages.messageId,
        content: discordMessages.content,
        timestamp: discordMessages.messageTimestamp,
        authorId: discordMessages.authorId,
        authorUsername: discordAuthors.username,
        authorDisplayName: discordAuthors.displayName,
        authorBot: discordAuthors.bot,
      })
      .from(discordMessages)
      .innerJoin(discordAuthors, eq(discordMessages.authorId, discordAuthors.id))
      .where(eq(discordMessages.threadId, threadId))
      .orderBy(desc(discordMessages.messageTimestamp))
      .limit(limit);

    // Reverse to get chronological order (oldest to newest)
    const chronologicalMessages = messages.reverse();

    // Transform to ThreadContextMessage format
    return chronologicalMessages.map((msg) => ({
      messageId: msg.messageId,
      content: msg.content,
      author: msg.authorDisplayName || msg.authorUsername,
      timestamp: msg.timestamp.toISOString(),
      isBot: msg.authorBot,
    }));
  } catch (error) {
    console.error('Error fetching thread context:', error);
    return [];
  }
}

/**
 * Formats thread context for AI prompt
 * Creates a readable string representation of the thread history
 * 
 * @param messages - Array of thread context messages
 * @returns Formatted string for AI consumption
 */
export function formatThreadContextForAI(messages: ThreadContextMessage[]): string {
  if (messages.length === 0) {
    return 'No previous messages in this thread.';
  }

  return messages
    .map((msg, index) => {
      const botLabel = msg.isBot ? ' [BOT]' : '';
      return `[${index + 1}] ${msg.author}${botLabel} (${msg.timestamp}): ${msg.content}`;
    })
    .join('\n\n');
}

/**
 * Formats thread context with message IDs for Q&A cross-referencing
 * Includes message IDs explicitly for the AI to reference
 * 
 * @param messages - Array of thread context messages
 * @returns Formatted string with message IDs
 */
export function formatThreadContextWithIds(messages: ThreadContextMessage[]): string {
  if (messages.length === 0) {
    return 'No previous messages in this thread.';
  }

  return messages
    .map((msg) => {
      const botLabel = msg.isBot ? ' [BOT]' : '';
      return `Message ID: ${msg.messageId}\nAuthor: ${msg.author}${botLabel}\nContent: ${msg.content}\n---`;
    })
    .join('\n\n');
}

