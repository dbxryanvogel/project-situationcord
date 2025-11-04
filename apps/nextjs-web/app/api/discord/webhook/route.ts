import { NextRequest, NextResponse } from 'next/server';
import type { WebhookPayload } from '@situationcord/shared-types';
import { db, discordMessages, discordAuthors } from '@/lib/db';
import { nanoid } from 'nanoid';
import { start } from 'workflow/api';
import { processDiscordMessage } from '@/workflows/discord-message';

/**
 * POST /api/discord/webhook
 * Receives Discord message webhook payloads from the Discord bot
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body: WebhookPayload = await request.json();

    // TypeScript will provide type checking and autocomplete for body.message, etc.
    console.log('Received webhook payload:', {
      eventType: body.eventType,
      timestamp: body.timestamp,
      messageId: body.message.id,
      channelId: body.message.channelId,
      threadId: body.message.threadId,
      author: body.message.author.username,
      content: body.message.content.substring(0, 100), // First 100 chars
    });

    // Upsert author (create if doesn't exist, update if exists)
    await db
      .insert(discordAuthors)
      .values({
        id: body.message.author.id,
        username: body.message.author.username,
        discriminator: body.message.author.discriminator,
        displayName: body.message.author.displayName,
        avatarUrl: body.message.author.avatarUrl,
        bot: body.message.author.bot,
        system: body.message.author.system,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: discordAuthors.id,
        set: {
          username: body.message.author.username,
          discriminator: body.message.author.discriminator,
          displayName: body.message.author.displayName,
          avatarUrl: body.message.author.avatarUrl,
          bot: body.message.author.bot,
          system: body.message.author.system,
          updatedAt: new Date(),
        },
      });

    // Store the webhook payload in the database with 1:1 schema mapping
    const dbId = nanoid(); // Generate a unique ID for the database record
    await db.insert(discordMessages).values({
      id: dbId,
      // WebhookPayload top-level fields
      eventType: body.eventType,
      timestamp: new Date(body.timestamp),
      
      // MessageData fields
      messageId: body.message.id,
      content: body.message.content,
      messageTimestamp: new Date(body.message.timestamp),
      editedTimestamp: body.message.editedTimestamp ? new Date(body.message.editedTimestamp) : null,
      channelId: body.message.channelId,
      channelName: body.message.channelName,
      channelType: body.message.channelType,
      threadId: body.message.threadId,
      threadName: body.message.threadName,
      threadType: body.message.threadType,
      parentChannelId: body.message.parentChannelId,
      parentChannelName: body.message.parentChannelName,
      pinned: body.message.pinned,
      messageType: body.message.type,
      referencedMessageId: body.message.referencedMessageId,
      
      // Foreign key to author
      authorId: body.message.author.id,
      
      // GuildData fields
      guildId: body.message.guild?.id ?? null,
      guildName: body.message.guild?.name ?? null,
      
      // Arrays stored as JSONB
      embeds: body.message.embeds,
      attachments: body.message.attachments,
      mentions: body.message.mentions,
      reactions: body.message.reactions,
    });

    console.log('Message saved to database:', dbId);

    // Example: Log thread information if present
    if (body.message.threadId) {
      console.log('Message is in thread:', {
        threadId: body.message.threadId,
        threadName: body.message.threadName,
        parentChannelId: body.message.parentChannelId,
        parentChannelName: body.message.parentChannelName,
      });
    }

    // Start workflow async - this executes asynchronously and doesn't block the app
    // Pass the payload directly - Workflow DevKit handles serialization
    try {
      await start(processDiscordMessage, [body]);
      console.log('Workflow started successfully for message:', body.message.id);
    } catch (error) {
      console.error('Error starting Discord message workflow:', error);
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        messageId: body.message.id,
        dbId: dbId,
        receivedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}

