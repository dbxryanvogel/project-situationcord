CREATE TABLE "bug_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"bug_id" text NOT NULL,
	"discord_link" text NOT NULL,
	"reported_at" timestamp NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bugs" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"first_reported_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_request_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"feature_id" text NOT NULL,
	"discord_link" text NOT NULL,
	"requested_at" timestamp NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"first_requested_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_bug_id_bugs_id_fk" FOREIGN KEY ("bug_id") REFERENCES "public"."bugs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_request_reports" ADD CONSTRAINT "feature_request_reports_feature_id_feature_requests_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."feature_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bug_reports_bug_id_idx" ON "bug_reports" USING btree ("bug_id");--> statement-breakpoint
CREATE INDEX "bug_reports_reported_at_idx" ON "bug_reports" USING btree ("reported_at");--> statement-breakpoint
CREATE INDEX "bugs_title_idx" ON "bugs" USING btree ("title");--> statement-breakpoint
CREATE INDEX "bugs_first_reported_at_idx" ON "bugs" USING btree ("first_reported_at");--> statement-breakpoint
CREATE INDEX "feature_request_reports_feature_id_idx" ON "feature_request_reports" USING btree ("feature_id");--> statement-breakpoint
CREATE INDEX "feature_request_reports_requested_at_idx" ON "feature_request_reports" USING btree ("requested_at");--> statement-breakpoint
CREATE INDEX "feature_requests_title_idx" ON "feature_requests" USING btree ("title");--> statement-breakpoint
CREATE INDEX "feature_requests_first_requested_at_idx" ON "feature_requests" USING btree ("first_requested_at");