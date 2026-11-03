CREATE TYPE "public"."video_job_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "video_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"decart_job_id" text NOT NULL,
	"prompt" text NOT NULL,
	"video_seconds" integer NOT NULL,
	"plan_seconds" integer NOT NULL,
	"status" "video_job_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "video_jobs" ADD CONSTRAINT "video_jobs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_jobs_store_idx" ON "video_jobs" USING btree ("store_id","created_at");