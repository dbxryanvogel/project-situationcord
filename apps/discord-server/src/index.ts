import { Client, GatewayIntentBits, Message, ChannelType } from 'discord.js';
import dotenv from 'dotenv';
import http from 'http';
import type {
  WebhookPayload,
  MessageData,
  AuthorData,
  GuildData,
  EmbedData,
  AttachmentData,
  MentionData,
  ReactionData,
} from './types';

// Load environment variables
dotenv.config();

// Validate required environment variables
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!DISCORD_BOT_TOKEN) {
  throw new Error('DISCORD_BOT_TOKEN is required. Please set it in your .env file.');
}

if (!WEBHOOK_URL) {
  throw new Error('WEBHOOK_URL is required. Please set it in your .env file.');
}

// Initialize Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

/**
 * Collects comprehensive data from a Discord message
 */
function collectMessageData(message: Message): MessageData {
  const channel = message.channel;
  const guild = message.guild;
  const author = message.author;
  const member = message.member;

  // Determine thread information
  let threadId: string | null = null;
  let threadName: string | null = null;
  let threadType: number | null = null;
  let parentChannelId: string | null = null;
  let parentChannelName: string | null = null;

  if (channel.isThread()) {
    threadId = channel.id;
    threadName = channel.name;
    threadType = channel.type;
    parentChannelId = channel.parentId;
    parentChannelName = channel.parent?.name || null;
  }

  // Collect author information
  const authorData: AuthorData = {
    id: author.id,
    username: author.username,
    discriminator: author.discriminator,
    displayName: member?.displayName || author.globalName || null,
    avatarUrl: author.displayAvatarURL(),
    bot: author.bot,
    system: author.system || false,
  };

  // Collect guild information
  const guildData: GuildData | null = guild
    ? {
        id: guild.id,
        name: guild.name,
      }
    : null;

  // Collect embed data
  const embeds: EmbedData[] = message.embeds.map((embed) => ({
    title: embed.title || undefined,
    description: embed.description || undefined,
    url: embed.url || undefined,
    color: embed.color || undefined,
    timestamp: embed.timestamp || undefined,
    footer: embed.footer
      ? {
          text: embed.footer.text || undefined,
          iconUrl: embed.footer.iconURL || undefined,
        }
      : undefined,
    image: embed.image
      ? {
          url: embed.image.url || undefined,
        }
      : undefined,
    thumbnail: embed.thumbnail
      ? {
          url: embed.thumbnail.url || undefined,
        }
      : undefined,
    author: embed.author
      ? {
          name: embed.author.name || undefined,
          url: embed.author.url || undefined,
          iconUrl: embed.author.iconURL || undefined,
        }
      : undefined,
    fields: embed.fields.map((field) => ({
      name: field.name,
      value: field.value,
      inline: field.inline,
    })),
  }));

  // Collect attachment data
  const attachments: AttachmentData[] = message.attachments.map((attachment) => ({
    id: attachment.id,
    filename: attachment.name,
    contentType: attachment.contentType,
    size: attachment.size,
    url: attachment.url,
    proxyUrl: attachment.proxyURL,
    height: attachment.height,
    width: attachment.width,
    description: attachment.description,
  }));

  // Collect mention data
  const mentions: MentionData[] = message.mentions.users.map((user) => ({
    id: user.id,
    username: user.username,
    discriminator: user.discriminator,
  }));

  // Collect reaction data
  const reactions: ReactionData[] = message.reactions.cache.map((reaction) => ({
    emoji: {
      id: reaction.emoji.id,
      name: reaction.emoji.name || '',
      animated: reaction.emoji.animated || false,
    },
    count: reaction.count,
    me: reaction.me,
  }));

  // Build message data object
  const messageData: MessageData = {
    id: message.id,
    content: message.content,
    timestamp: message.createdAt.toISOString(),
    editedTimestamp: message.editedTimestamp
      ? typeof message.editedTimestamp === 'number'
        ? new Date(message.editedTimestamp).toISOString()
        : (message.editedTimestamp as Date).toISOString()
      : null,
    channelId: channel.id,
    channelName: channel.isTextBased() && 'name' in channel ? channel.name : null,
    channelType: channel.type,
    threadId,
    threadName,
    threadType,
    parentChannelId,
    parentChannelName,
    author: authorData,
    guild: guildData,
    embeds,
    attachments,
    mentions,
    reactions,
    pinned: message.pinned,
    type: message.type,
    referencedMessageId: message.reference?.messageId || null,
  };

  return messageData;
}

/**
 * Sends message data to webhook URL
 */
async function sendToWebhook(payload: WebhookPayload): Promise<void> {
  try {
    const response = await fetch(WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(
        `Webhook request failed: ${response.status} ${response.statusText}`,
        errorText
      );
      return;
    }

    console.log(`Successfully sent message ${payload.message.id} to webhook`);
  } catch (error) {
    console.error('Error sending webhook:', error);
    // Don't throw - we want the bot to continue running even if webhook fails
  }
}

// Event: Bot is ready
client.once('clientReady', () => {
  console.log(`✅ Bot logged in as ${client.user?.tag}`);
  console.log(`📡 Listening for messages...`);
});

// Event: New message created
client.on('messageCreate', async (message: Message) => {
  // Skip system messages
  if (message.system) {
    return;
  }

  try {
    // Collect comprehensive message data
    const messageData = collectMessageData(message);

    // Build webhook payload
    const payload: WebhookPayload = {
      eventType: 'messageCreate',
      timestamp: new Date().toISOString(),
      message: messageData,
    };

    // Send to webhook
    await sendToWebhook(payload);
  } catch (error) {
    console.error('Error processing message:', error);
  }
});

// Event: Error handling
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

client.on('warn', (warning) => {
  console.warn('Discord client warning:', warning);
});

// Login to Discord
client.login(DISCORD_BOT_TOKEN).catch((error) => {
  console.error('Failed to login:', error);
  process.exit(1);
});

// Health check server for container platforms (Koyeb, Railway, etc.)
const PORT = process.env.PORT || 8000;
const healthServer = http.createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health' || req.url === '/') {
    const status = client.isReady() ? 'healthy' : 'starting';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      bot: client.user ? {
        username: client.user.username,
        id: client.user.id,
      } : null,
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

healthServer.listen(PORT, () => {
  console.log(`🏥 Health check server listening on port ${PORT}`);
});

