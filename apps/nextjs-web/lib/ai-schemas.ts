import { z } from 'zod';

/**
 * Sentiment types for message analysis
 */
export const sentimentSchema = z.enum([
  'positive',
  'neutral',
  'negative',
  'frustrated',
  'urgent',
]);

/**
 * Severity levels for issue prioritization
 */
export const severityLevelSchema = z.enum([
  'low',
  'medium',
  'high',
  'critical',
]);

/**
 * Category tags for message classification
 */
export const categoryTagSchema = z.enum([
  'Free Limits',
  'Billing',
  'Account',
  'BaaS',
  'Console',
  'Vercel',
]);

/**
 * Main message analysis schema for structured AI output
 */
export const messageAnalysisSchema = z.object({
  sentiment: sentimentSchema.describe(
    'The emotional tone of the message: positive (helpful, satisfied), neutral (informational), negative (unhappy), frustrated (angry, blocked), or urgent (time-sensitive issue)'
  ),
  isQuestion: z.boolean().describe(
    'True if the message is asking a question that needs an answer'
  ),
  isAnswer: z.boolean().describe(
    'True if the message appears to be answering a previous question in the thread'
  ),
  needsHelp: z.boolean().describe(
    'True if the message indicates a problem or issue that requires assistance'
  ),
  categoryTags: z.array(categoryTagSchema).describe(
    'Array of relevant category tags. Multiple tags can apply. Categories: ' +
    'Free Limits (quota, storage, CU-hours, exceeded limits), ' +
    'Billing (payment, plans, credits, invoices), ' +
    'Account (locked out, transfer ownership, delete account), ' +
    'BaaS (RLS, Auth, JWKS, backend services), ' +
    'Console (dashboard bugs, UI errors), ' +
    'Vercel (deployment platform mentions)'
  ),
  aiSummary: z.string().describe(
    'A brief one-sentence summary of the message content and intent'
  ),
  confidenceScore: z.number().min(0).max(1).describe(
    'Confidence level in this analysis from 0.0 to 1.0'
  ),
  severityScore: z.number().min(0).max(100).describe(
    'Severity score from 0-100 indicating urgency and importance of the issue. ' +
    '0-30: Low (general questions, positive feedback), ' +
    '31-60: Medium (issues with workarounds, minor bugs), ' +
    '61-85: High (blocking issues, frustrated users, billing problems), ' +
    '86-100: Critical (account locked, data loss, security issues, very urgent)'
  ),
  severityLevel: severityLevelSchema.describe(
    'Categorical severity level: low, medium, high, or critical'
  ),
  severityReason: z.string().describe(
    'Brief explanation of why this severity level was assigned'
  ),
});

/**
 * TypeScript type inferred from the schema
 */
export type MessageAnalysisOutput = z.infer<typeof messageAnalysisSchema>;

/**
 * Schema for Q&A cross-reference output
 */
export const qaReferenceSchema = z.object({
  answeredMessageId: z.string().nullable().describe(
    'The Discord message ID of the question being answered, or null if no clear question is being answered'
  ),
  confidence: z.number().min(0).max(1).describe(
    'Confidence that this message answers the identified question'
  ),
  reasoning: z.string().describe(
    'Brief explanation of why this message-question pair was matched'
  ),
});

/**
 * TypeScript type for Q&A reference
 */
export type QAReference = z.infer<typeof qaReferenceSchema>;

/**
 * Thread context message structure for AI consumption
 */
export const threadContextMessageSchema = z.object({
  messageId: z.string(),
  content: z.string(),
  author: z.string(),
  timestamp: z.string(),
  isBot: z.boolean().optional(),
});

/**
 * TypeScript type for thread context
 */
export type ThreadContextMessage = z.infer<typeof threadContextMessageSchema>;

