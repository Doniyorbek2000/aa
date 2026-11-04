ALTER TABLE "plans" RENAME COLUMN "monthly_minutes" TO "monthly_seconds";--> statement-breakpoint
UPDATE "plans" SET "monthly_seconds" = "monthly_seconds" * 60;--> statement-breakpoint
ALTER TABLE "packs" RENAME COLUMN "minutes" TO "seconds";--> statement-breakpoint
UPDATE "packs" SET "seconds" = "seconds" * 60;--> statement-breakpoint
ALTER TABLE "payments" RENAME COLUMN "minutes" TO "seconds";--> statement-breakpoint
UPDATE "payments" SET "seconds" = "seconds" * 60;
