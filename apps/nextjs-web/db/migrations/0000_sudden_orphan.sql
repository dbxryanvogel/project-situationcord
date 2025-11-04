CREATE TABLE "discord_authors" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"discriminator" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"bot" boolean DEFAULT false NOT NULL,
	"system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"message_id" text NOT NULL,
	"content" text NOT NULL,
	"message_timestamp" timestamp NOT NULL,
	"edited_timestamp" timestamp,
	"channel_id" text NOT NULL,
	"channel_name" text,
	"channel_type" integer NOT NULL,
	"thread_id" text,
	"thread_name" text,
	"thread_type" integer,
	"parent_channel_id" text,
	"parent_channel_name" text,
	"pinned" boolean DEFAULT false NOT NULL,
	"message_type" integer NOT NULL,
	"referenced_message_id" text,
	"author_id" text NOT NULL,
	"guild_id" text,
	"guild_name" text,
	"embeds" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mentions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reactions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "discord_messages_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
ALTER TABLE "discord_messages" ADD CONSTRAINT "discord_messages_author_id_discord_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."discord_authors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "author_username_idx" ON "discord_authors" USING btree ("username");--> statement-breakpoint
CREATE INDEX "message_id_idx" ON "discord_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "channel_id_idx" ON "discord_messages" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "thread_id_idx" ON "discord_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "author_id_idx" ON "discord_messages" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "guild_id_idx" ON "discord_messages" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "timestamp_idx" ON "discord_messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "message_timestamp_idx" ON "discord_messages" USING btree ("message_timestamp");