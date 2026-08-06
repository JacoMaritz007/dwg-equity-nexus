CREATE TYPE "public"."capital_call_draw_status" AS ENUM('due', 'payment_submitted', 'confirmed', 'waived');--> statement-breakpoint
CREATE TYPE "public"."pledge_entity_type" AS ENUM('individual', 'trust', 'corporate');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "capital_call_draws" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"capital_call_id" uuid NOT NULL,
	"investment_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"amount_due" numeric(15, 2) NOT NULL,
	"amount_paid" numeric(15, 2) DEFAULT '0',
	"status" "capital_call_draw_status" DEFAULT 'due' NOT NULL,
	"payment_reference" text,
	"payment_submitted_at" timestamp with time zone,
	"confirmed_by" text,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "capital_call_draws_capital_call_id_investment_id_unique" UNIQUE("capital_call_id","investment_id")
);
--> statement-breakpoint
ALTER TABLE "user_investments" ALTER COLUMN "status" SET DEFAULT 'pending_signature';--> statement-breakpoint
ALTER TABLE "user_investments" ADD COLUMN "entity_type" "pledge_entity_type" DEFAULT 'individual' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_investments" ADD COLUMN "entity_legal_name" text;--> statement-breakpoint
ALTER TABLE "user_investments" ADD COLUMN "entity_registration_number" text;--> statement-breakpoint
ALTER TABLE "user_investments" ADD COLUMN "risk_acknowledged" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_investments" ADD COLUMN "concentration_limit_confirmed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_investments" ADD COLUMN "suitability_acknowledged_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_investments" ADD COLUMN "signer_legal_name" text;--> statement-breakpoint
ALTER TABLE "user_investments" ADD COLUMN "signed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_investments" ADD COLUMN "signer_ip_address" text;--> statement-breakpoint
ALTER TABLE "user_investments" ADD COLUMN "agreement_version" text;--> statement-breakpoint
ALTER TABLE "user_investments" ADD COLUMN "agreement_document_hash" text;--> statement-breakpoint
ALTER TABLE "user_investments" ADD COLUMN "platform_fee_amount" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "user_investments" ADD COLUMN "total_expected_call_amount" numeric(15, 2);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "capital_call_draws" ADD CONSTRAINT "capital_call_draws_capital_call_id_capital_calls_id_fk" FOREIGN KEY ("capital_call_id") REFERENCES "public"."capital_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "capital_call_draws" ADD CONSTRAINT "capital_call_draws_investment_id_user_investments_id_fk" FOREIGN KEY ("investment_id") REFERENCES "public"."user_investments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "capital_call_draws" ADD CONSTRAINT "capital_call_draws_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "capital_call_draws" ADD CONSTRAINT "capital_call_draws_confirmed_by_profiles_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
