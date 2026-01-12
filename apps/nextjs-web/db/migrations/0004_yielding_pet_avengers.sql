ALTER TABLE "bug_reports" ADD COLUMN "is_llm_generated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bugs" ADD COLUMN "is_llm_generated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "feature_request_reports" ADD COLUMN "is_llm_generated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "feature_requests" ADD COLUMN "is_llm_generated" boolean DEFAULT false NOT NULL;