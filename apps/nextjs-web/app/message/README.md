# Dynamic OG Image Feature

## Overview
Each Discord message that's processed and stored in the database gets its own shareable page with a dynamically generated Open Graph image showing the AI analysis results.

## Features

### 1. Individual Message Pages
- **URL Format**: `/message/[messageId]`
- **Example**: `/message/1435354779856408747`

Each message page displays:
- Author information (avatar, username, display name)
- Message content with timestamps
- Channel/thread location
- Full AI analysis breakdown
- Link to open the message in Discord

### 2. Dynamic OG Images
- **API Endpoint**: `/api/og/message/[messageId]`
- **Format**: PNG, 1200x630px (standard OG image size)
- **Runtime**: Edge runtime for fast generation

The OG image dynamically displays:
- Author avatar and name
- Message content (truncated to 200 chars)
- Sentiment indicator with emoji and color
- AI summary
- Category tags
- Question/Answer/Needs Help badges
- Severity score and level

### 3. Social Media Preview
When you share a message URL on:
- **Twitter/X**: Shows large image card
- **Discord**: Shows embedded rich preview
- **Slack**: Shows preview with image
- **LinkedIn**: Shows article preview with image

## Usage

### From Dashboard
1. Click the external link icon (📤) next to any message
2. This takes you to the message detail page: `/message/{messageId}`
3. Copy the URL to share on social media or send to team members

### Programmatic Access
```typescript
// Get the OG image URL
const messageId = '1435354779856408747';
const ogImageUrl = `${baseUrl}/api/og/message/${messageId}`;

// Use in meta tags
<meta property="og:image" content={ogImageUrl} />
<meta property="twitter:image" content={ogImageUrl} />
```

### Sharing Links
Share message links to automatically show rich previews:
```
https://yourdomain.com/message/1435354779856408747
```

## Customization

### Color Schemes

**Sentiment Colors**:
- Positive: Green (#22c55e) 😊
- Neutral: Gray (#6b7280) 😐
- Negative: Orange (#f97316) 😟
- Frustrated: Red (#ef4444) 😤
- Urgent: Red (#dc2626) ⚡

**Severity Colors**:
- Low: Green (#10b981)
- Medium: Yellow (#f59e0b)
- High: Red (#ef4444)
- Critical: Red (#dc2626)

**Category Colors**:
- Free Limits: Purple (#a855f7)
- Billing: Blue (#3b82f6)
- Account: Yellow (#eab308)
- BaaS: Green (#10b981)
- Console: Red (#ef4444)
- Vercel: Black (#000000)

### Environment Variables

For production deployment, set:
```bash
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

For Vercel, it automatically uses `VERCEL_URL` when available.

## Technical Details

### Edge Runtime
The OG image generation runs on the Edge runtime for:
- ✅ Fast response times
- ✅ Low latency worldwide
- ✅ Automatic caching
- ⚠️ Limited Node.js APIs (uses edge-compatible DB client)

### Caching
Next.js automatically caches the generated images. To bust cache:
- Deploy new code (updates the build ID)
- Or add query params: `/api/og/message/[id]?v=2`

### Database Queries
Both the message page and OG image endpoint:
- Query the same data from PostgreSQL
- Use Drizzle ORM
- Join `discord_messages`, `discord_authors`, and `message_analysis` tables
- Return 404 if message not found

## Examples

### High Severity Bug Report
Shows red severity badge, frustrated sentiment, Console category tag, and "Needs Help" indicator.

### Answered Question
Shows green "Answer" badge with reference to the original question.

### Billing Inquiry
Shows Billing category, appropriate sentiment, and severity score.

## Future Enhancements

Potential additions:
- [ ] Custom OG image templates per category
- [ ] Dark/light mode toggle for images
- [ ] Multi-language support
- [ ] Thread context preview (show parent question on answer images)
- [ ] Analytics tracking for shared links
- [ ] Custom branding/logo overlay

