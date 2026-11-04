CREATE TABLE "iap_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store" text NOT NULL,
	"transaction_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" text NOT NULL,
	"seconds" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "iap_purchases" ADD CONSTRAINT "iap_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "iap_purchases_store_tx_idx" ON "iap_purchases" USING btree ("store","transaction_id");