# Discord Message Analysis Workflows

This directory contains Vercel Workflow DevKit workflows for processing Discord messages with AI-powered analysis.

## Overview

The main workflow (`discord-message.ts`) automatically analyzes incoming Discord messages using OpenAI's GPT-4o-mini to provide:

- **Sentiment Analysis**: Detects emotional tone (positive, neutral, negative, frustrated, urgent)
- **Question/Answer Detection**: Identifies messages that are questions or answers
- **Help Needed Flagging**: Automatically flags messages that indicate problems requiring assistance
- **Category Tagging**: Applies relevant tags based on content:
  - **Free Limits**: Storage, quota, CU-hours limits
  - **Billing**: Payment, plans, credits, invoicing
  - **Account**: Login issues, transfers, account management
  - **BaaS**: RLS, Auth, JWKS, backend services
  - **Console**: Dashboard bugs, UI errors
  - **Vercel**: Deployment platform mentions
- **Q&A Cross-Referencing**: Links answers to their corresponding questions in threads
- **AI Summaries**: Generates brief one-sentence summaries of each message

## Workflow Architecture

### Step 1: Thread Context Lookup
When a message belongs to a thread, the workflow fetches the 20 most recent messages to provide context for AI analysis.

### Step 2: AI Analysis (generateObject)
Uses OpenAI's structured output to analyze the message and return type-safe, validated results based on a Zod schema.

### Step 3: Q&A Cross-Reference (generateObject)
If the message is identified as an answer, a second AI call determines which previous message in the thread is being answered.

### Step 4: Database Storage
Stores all analysis results in the `message_analysis` table with proper indexing for efficient querying.

## Testing

### Manual Testing

Run the test suite with sample Discord messages:

```bash
cd apps/nextjs-web
bun run workflows/__tests__/discord-message.test.ts
```

### Test Scenarios

The test file includes four comprehensive scenarios:

1. **Billing Question**: Tests sentiment, question detection, and Billing tag
2. **Frustrated Account Issue**: Tests urgent sentiment and Account tag
3. **Free Limits Question**: Tests Free Limits tag detection
4. **Support Answer**: Tests Q&A cross-referencing in threads

### Prerequisites for Testing

Ensure these environment variables are set in `.env.local`:

```bash
DATABASE_URL='postgresql://...'
OPENAI_API_KEY='sk-...'
```

## Key Files

- `discord-message.ts` - Main workflow implementation
- `../lib/ai-schemas.ts` - Zod schemas for structured AI output
- `../lib/thread-context.ts` - Thread context lookup helpers
- `../db/schema.ts` - Database schema including `message_analysis` table
- `__tests__/discord-message.test.ts` - Test suite with sample messages

## Error Handling

The workflow includes comprehensive error handling:

- **AI Failures**: Returns neutral fallback analysis with confidence score of 0
- **Database Errors**: Logged and propagated for retry by Workflow DevKit
- **Missing Context**: Gracefully handles threads with no previous messages

## Monitoring

The workflow logs detailed information at each step:

```
[Thread Context] Fetching context for thread: thread-123
[Thread Context] Retrieved 15 messages
[AI Analysis] Analyzing message 1234567890 from user123
[AI Analysis] Complete. Sentiment: frustrated, Tags: Account, Billing
[Q&A Reference] Finding answered question in thread
[Q&A Reference] Found answer to 1234567889
[Database] Storing analysis for message 1234567890
[Database] Analysis stored with ID: abc123
[Workflow] Completed analysis for message 1234567890
```

## Performance Considerations

- **Thread Context**: Limited to 20 messages to manage token usage
- **AI Temperature**: Set to 0.3 for analysis (consistent) and 0.2 for Q&A matching (precise)
- **Model**: Uses `gpt-4o-mini` for cost-effective, fast analysis
- **Caching**: Workflow DevKit automatically caches step results for replays

## Future Enhancements

Potential improvements to consider:

- [ ] Confidence thresholds for auto-escalation
- [ ] Multi-language sentiment analysis
- [ ] Custom model fine-tuning on historical data
- [ ] Real-time dashboard updates via webhooks
- [ ] Automatic response suggestions for common questions
- [ ] Sentiment trend analysis over time

