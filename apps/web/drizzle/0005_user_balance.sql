CREATE TYPE "public"."pack_audience" AS ENUM('store', 'user');--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "store_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "packs" ADD COLUMN "audience" "pack_audience" DEFAULT 'store' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "seconds_balance" integer DEFAULT 0 NOT NULL;