CREATE TABLE "message_analysis" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"sentiment" text NOT NULL,
	"is_question" boolean DEFAULT false NOT NULL,
	"is_answer" boolean DEFAULT false NOT NULL,
	"answered_message_id" text,
	"needs_help" boolean DEFAULT false NOT NULL,
	"category_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ai_summary" text NOT NULL,
	"confidence_score" numeric(3, 2),
	"severity_score" numeric(5, 2),
	"severity_level" text,
	"severity_reason" text,
	"model_version" text NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message_analysis" ADD CONSTRAINT "message_analysis_message_id_discord_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."discord_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analysis_message_id_idx" ON "message_analysis" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "analysis_sentiment_idx" ON "message_analysis" USING btree ("sentiment");--> statement-breakpoint
CREATE INDEX "analysis_needs_help_idx" ON "message_analysis" USING btree ("needs_help");--> statement-breakpoint
CREATE INDEX "analysis_is_question_idx" ON "message_analysis" USING btree ("is_question");--> statement-breakpoint
CREATE INDEX "analysis_is_answer_idx" ON "message_analysis" USING btree ("is_answer");--> statement-breakpoint
CREATE INDEX "analysis_severity_level_idx" ON "message_analysis" USING btree ("severity_level");