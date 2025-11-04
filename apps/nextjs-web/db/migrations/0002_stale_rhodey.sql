CREATE TABLE "ignored_users" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"reason" text,
	"ignored_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ignored_users_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "ignored_users" ADD CONSTRAINT "ignored_users_user_id_discord_authors_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."discord_authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ignored_users_user_id_idx" ON "ignored_users" USING btree ("user_id");