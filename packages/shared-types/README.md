# @situationcord/shared-types

Shared TypeScript type definitions for Discord webhook payloads used across the SituationCord monorepo.

## Usage

Import types in your application:

```typescript
import type { WebhookPayload, MessageData } from '@situationcord/shared-types';
```

## Types

- `WebhookPayload` - The complete webhook payload structure
- `MessageData` - Message information including thread data
- `AuthorData` - User/author information
- `GuildData` - Server/guild information
- `EmbedData` - Message embed data
- `AttachmentData` - File attachment information
- `MentionData` - User mention data
- `ReactionData` - Message reaction data

## Example

```typescript
import type { WebhookPayload } from '@situationcord/shared-types';

async function handleWebhook(payload: WebhookPayload) {
  // TypeScript provides full type safety and autocomplete
  console.log(payload.message.content);
  console.log(payload.message.threadId); // null if not in thread
  console.log(payload.message.author.username);
}
```

