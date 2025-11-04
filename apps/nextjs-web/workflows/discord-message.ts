import type { WebhookPayload } from '@situationcord/shared-types';
import type { ThreadContextMessage, MessageAnalysisOutput, QAReference } from '@/lib/ai-schemas';

/**
 * Workflow to process a new Discord message with AI analysis
 * This workflow handles the async processing of Discord messages including:
 * - Thread context lookup
 * - AI sentiment and category analysis
 * - Q&A cross-referencing
 * - Database storage
 */
export async function processDiscordMessage(payload: WebhookPayload) {
  "use workflow";

  // Step 1: Get thread context if message is in a thread
  const threadContext = payload.message.threadId
    ? await fetchThreadContext(payload.message.threadId)
    : [];

  // Step 2: AI analysis with structured output
  const analysis = await analyzeMessageWithAI(
    payload.message.id,
    payload.message.content,
    payload.message.author.username,
    threadContext
  );

  // Step 3: Q&A cross-reference if this is an answer
  let answeredMessageId: string | null = null;
  if (analysis.isAnswer && threadContext.length > 0) {
    const qaReference = await findAnsweredQuestion(
      payload.message.content,
      threadContext
    );
    answeredMessageId = qaReference.answeredMessageId;
  }

  // Step 4: Store analysis results in database
  const dbResult = await storeAnalysisResults(
    payload.message.id,
    analysis,
    answeredMessageId
  );

  // Step 5: Check if user is ignored
  const isIgnored = await checkIgnoreList(payload.message.author.id);

  // Step 6: Route to Customer.io if high severity and not ignored
  let customerIoSent = false;
  const shouldRoute = analysis.severityScore >= 70 || analysis.severityLevel === 'high' || analysis.severityLevel === 'critical';
  
  if (shouldRoute && !isIgnored) {
    console.log(`[Workflow] High severity detected (${analysis.severityLevel}, ${analysis.severityScore}), routing to Customer.io`);
    await sendToCustomerIO(payload, analysis);
    customerIoSent = true;
  } else if (shouldRoute && isIgnored) {
    console.log(`[Workflow] High severity detected but user ${payload.message.author.username} is on ignore list, skipping Customer.io`);
  }

  console.log(`[Workflow] Completed analysis for message ${payload.message.id}`);

  return {
    messageId: payload.message.id,
    analysis,
    answeredMessageId,
    dbRecordId: dbResult.id,
    customerIoSent,
    processedAt: new Date().toISOString(),
  };
}

/**
 * Step 1: Fetch thread context
 * Retrieves recent messages from the thread for AI context
 */
async function fetchThreadContext(threadId: string): Promise<ThreadContextMessage[]> {
  "use step";

  const { getThreadContext } = await import('@/lib/thread-context');
  
  console.log(`[Thread Context] Fetching context for thread: ${threadId}`);
  const context = await getThreadContext(threadId, 20);
  console.log(`[Thread Context] Retrieved ${context.length} messages`);
  
  return context;
}

/**
 * Step 2: AI Analysis with generateObject
 * Uses OpenAI to analyze message sentiment, intent, and categories
 */
async function analyzeMessageWithAI(
  messageId: string,
  content: string,
  author: string,
  threadContext: ThreadContextMessage[]
): Promise<MessageAnalysisOutput> {
  "use step";

  const { generateObject } = await import('ai');
  const { openai } = await import('@ai-sdk/openai');
  const { messageAnalysisSchema } = await import('@/lib/ai-schemas');
  const { formatThreadContextForAI } = await import('@/lib/thread-context');

  console.log(`[AI Analysis] Analyzing message ${messageId} from ${author}`);

  const threadContextText = formatThreadContextForAI(threadContext);

  const systemPrompt = `You are an expert at analyzing Discord support messages. Analyze messages for:
1. Sentiment: Detect emotional tone (positive, neutral, negative, frustrated, urgent)
2. Intent: Identify if it's a question or answer
3. Issues: Determine if help is needed
4. Categories: Tag with relevant topics
5. Severity: Score the urgency and importance of the issue

Categories and their keywords:
- Free Limits: "free", "storage limit", "50 cu-hours", "exceeded", "quota", "usage limit"
- Billing: "bills", "billing", "change plan", "payment", "credit", "invoice", "subscription"
- Account: "locked out", "transfer", "delete account", "owner", "access", "login"
- BaaS: "RLS", "Auth", "JWKS", "authentication", "authorization", "database"
- Console: "bug", "unexpected error", "something went wrong", "dashboard", "UI issue"
- Vercel: mentions of "vercel" deployment platform

Severity Scoring Guidelines:
- Low (0-30): General questions, positive feedback, non-urgent inquiries
- Medium (31-60): Issues with workarounds, minor bugs, documentation requests
- High (61-85): Blocking issues, frustrated users, billing problems, no workaround
- Critical (86-100): Account locked, data loss, security issues, extremely urgent, business-critical

Consider: urgency, business impact, user frustration level, and whether there's a workaround.

Be thorough but concise. Consider the thread context when making decisions.`;
  
  const userPrompt = `Analyze this Discord message:

Message Author: ${author}
Message Content: ${content}

Thread Context (previous messages):
${threadContextText}

Provide a structured analysis including sentiment, whether it's a question/answer, if help is needed, relevant category tags, a brief summary, your confidence score, and severity scoring with reasoning.`;

  try {
    const result = await generateObject({
      model: openai('gpt-5-mini'),
      schema: messageAnalysisSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    console.log(`[AI Analysis] Complete. Sentiment: ${result.object.sentiment}, Severity: ${result.object.severityLevel} (${result.object.severityScore}), Tags: ${result.object.categoryTags.join(', ')}`);

    return result.object;
  } catch (error) {
    console.error('[AI Analysis] Error during analysis:', error);
    
    // Return a fallback neutral analysis
    return {
      sentiment: 'neutral',
      isQuestion: false,
      isAnswer: false,
      needsHelp: false,
      categoryTags: [],
      aiSummary: 'Error during AI analysis - defaulted to neutral',
      confidenceScore: 0,
      severityScore: 0,
      severityLevel: 'low',
      severityReason: 'Error during analysis',
    };
  }
}

/**
 * Step 3: Q&A Cross-Reference with generateText
 * Identifies which previous message is being answered
 */
async function findAnsweredQuestion(
  answerContent: string,
  threadContext: ThreadContextMessage[]
): Promise<QAReference> {
  "use step";

  const { generateObject } = await import('ai');
  const { openai } = await import('@ai-sdk/openai');
  const { qaReferenceSchema } = await import('@/lib/ai-schemas');
  const { formatThreadContextWithIds } = await import('@/lib/thread-context');

  console.log(`[Q&A Reference] Finding answered question in thread`);

  const threadContextText = formatThreadContextWithIds(threadContext);

  const systemPrompt = `You are an expert at identifying question-answer relationships in conversation threads.
Given an answer message and thread history, determine which specific message (if any) is being answered.

Look for:
- Direct replies or references
- Contextual continuity
- Topic matching
- Problem-solution pairs

Return the message ID of the answered question, or null if no clear answer relationship exists.`;

  const userPrompt = `This message appears to be an answer:
"${answerContent}"

Thread History with Message IDs:
${threadContextText}

Which message ID is being answered? Provide your confidence level and reasoning.`;

  try {
    const result = await generateObject({
      model: openai('gpt-5-mini'),
      schema: qaReferenceSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.2, // Very low temperature for precise matching
    });

    console.log(`[Q&A Reference] ${result.object.answeredMessageId ? `Found answer to ${result.object.answeredMessageId}` : 'No clear question answered'}`);

    return result.object;
  } catch (error) {
    console.error('[Q&A Reference] Error during Q&A analysis:', error);
    
    return {
      answeredMessageId: null,
      confidence: 0,
      reasoning: 'Error during Q&A analysis',
    };
  }
}

/**
 * Step 4: Store Analysis Results
 * Saves the AI analysis to the database
 */
async function storeAnalysisResults(
  messageId: string,
  analysis: MessageAnalysisOutput,
  answeredMessageId: string | null
): Promise<{ id: string }> {
  "use step";

  const { db, messageAnalysis, discordMessages } = await import('@/lib/db');
  const { nanoid } = await import('nanoid');
  const { eq } = await import('drizzle-orm');

  console.log(`[Database] Storing analysis for message ${messageId}`);

  try {
    // First, get the internal database ID for this message
    const messageRecord = await db
      .select({ id: discordMessages.id })
      .from(discordMessages)
      .where(eq(discordMessages.messageId, messageId))
      .limit(1);

    if (messageRecord.length === 0) {
      throw new Error(`Message ${messageId} not found in database`);
    }

    const dbMessageId = messageRecord[0].id;
    const analysisId = nanoid();

    await db.insert(messageAnalysis).values({
      id: analysisId,
      messageId: dbMessageId,
      sentiment: analysis.sentiment,
      isQuestion: analysis.isQuestion,
      isAnswer: analysis.isAnswer,
      answeredMessageId: answeredMessageId,
      needsHelp: analysis.needsHelp,
      categoryTags: analysis.categoryTags,
      aiSummary: analysis.aiSummary,
      confidenceScore: analysis.confidenceScore.toString(), // Convert to string for numeric type
      severityScore: analysis.severityScore.toString(),
      severityLevel: analysis.severityLevel,
      severityReason: analysis.severityReason,
      modelVersion: 'gpt-5-mini',
      processedAt: new Date(),
    });

    console.log(`[Database] Analysis stored with ID: ${analysisId}`);

    return { id: analysisId };
  } catch (error) {
    console.error('[Database] Error storing analysis:', error);
    throw error;
  }
}

/**
 * Step 5: Check Ignore List
 * Checks if a user is on the ignore list
 */
async function checkIgnoreList(userId: string): Promise<boolean> {
  "use step";

  const { db, ignoredUsers } = await import('@/lib/db');
  const { eq } = await import('drizzle-orm');

  console.log(`[Ignore List] Checking if user ${userId} is ignored`);

  try {
    const ignored = await db
      .select()
      .from(ignoredUsers)
      .where(eq(ignoredUsers.userId, userId))
      .limit(1);

    const isIgnored = ignored.length > 0;
    
    if (isIgnored) {
      console.log(`[Ignore List] User ${userId} is on ignore list`);
    }

    return isIgnored;
  } catch (error) {
    console.error('[Ignore List] Error checking ignore list:', error);
    // On error, don't ignore (fail open)
    return false;
  }
}

/**
 * Step 6: Send to Customer.io
 * Routes high-severity messages to Customer.io for immediate attention
 */
async function sendToCustomerIO(
  payload: WebhookPayload,
  analysis: MessageAnalysisOutput
): Promise<void> {
  "use step";

  const customerIOEndpoint = process.env.CUSTOMER_IO_WEBHOOK_URL;

  try {
    console.log(`[Customer.io] Sending high-severity message alert`);

    // Prepare event data for Customer.io
    // All properties must be at the top-level (no nested 'data')
    const eventData = {
      name: 'discord_high_severity_message',
      // Flatten all fields to the event root for Customer.io
      message_id: payload.message.id,
      message_content: payload.message.content,
      message_url: payload.message.threadId
        ? `https://discord.com/channels/${payload.message.guild?.id}/${payload.message.threadId}/${payload.message.id}`
        : `https://discord.com/channels/${payload.message.guild?.id}/${payload.message.channelId}/${payload.message.id}`,

      // Author details
      author_id: payload.message.author.id,
      author_username: payload.message.author.username,
      author_display_name: payload.message.author.displayName,

      // Channel/Thread details
      channel_id: payload.message.channelId,
      channel_name: payload.message.channelName,
      thread_id: payload.message.threadId,
      thread_name: payload.message.threadName,
      guild_id: payload.message.guild?.id,
      guild_name: payload.message.guild?.name,

      // Analysis results
      severity_score: analysis.severityScore,
      severity_level: analysis.severityLevel,
      severity_reason: analysis.severityReason,
      sentiment: analysis.sentiment,
      needs_help: analysis.needsHelp,
      is_question: analysis.isQuestion,
      category_tags: analysis.categoryTags,
      ai_summary: analysis.aiSummary,
      confidence_score: analysis.confidenceScore,

      // Timestamp
      timestamp: payload.timestamp,
    };

    const response = await fetch(customerIOEndpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Customer.io] Request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Customer.io API error: ${response.status}`);
    }

    console.log(`[Customer.io] Successfully sent high-severity alert for message ${payload.message.id}`);
  } catch (error) {
    console.error('[Customer.io] Error sending event:', error);
    throw error; // Let the step retry
  }
}

