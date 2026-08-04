CREATE TYPE "public"."app_role" AS ENUM('admin', 'investor', 'manager');--> statement-breakpoint
CREATE TYPE "public"."capital_call_status" AS ENUM('pending', 'completed', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('offering_document', 'legal_agreement', 'financial_report', 'tax_document', 'update');--> statement-breakpoint
CREATE TYPE "public"."investment_status" AS ENUM('draft', 'active', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."investor_classification" AS ENUM('retail', 'sophisticated', 'high_net_worth', 'institutional');--> statement-breakpoint
CREATE TYPE "public"."risk_rating" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."source_of_wealth" AS ENUM('employment', 'business_ownership', 'inheritance', 'property_sale', 'investment_gains', 'pension', 'gift', 'other');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('contribution', 'distribution', 'fee', 'expense');--> statement-breakpoint
CREATE TYPE "public"."verification_document_type" AS ENUM('passport', 'national_id', 'driving_license', 'proof_of_address', 'bank_statement', 'income_verification', 'source_of_wealth', 'pep_declaration', 'sophisticated_investor_cert', 'professional_qualification');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'in_progress', 'approved', 'rejected', 'expired');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "capital_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offering_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"amount_per_share" numeric(15, 2) NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"status" "capital_call_status" DEFAULT 'pending',
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compliance_screening_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"screening_type" text NOT NULL,
	"status" "verification_status" DEFAULT 'pending' NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" bigint,
	"mime_type" text,
	"uploaded_by" text NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"screening_date" date DEFAULT now() NOT NULL,
	"screening_provider" text,
	"screening_reference" text,
	"expiry_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_path" text NOT NULL,
	"file_size" bigint,
	"mime_type" text,
	"document_type" "document_type" NOT NULL,
	"offering_id" uuid,
	"user_id" text,
	"is_public" boolean DEFAULT false,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "investment_offerings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"target_amount" numeric(15, 2) NOT NULL,
	"raised_amount" numeric(15, 2) DEFAULT '0',
	"minimum_investment" numeric(15, 2) NOT NULL,
	"maximum_investment" numeric(15, 2),
	"investment_type" text NOT NULL,
	"location" text,
	"expected_return" text,
	"investment_term" text,
	"status" "investment_status" DEFAULT 'draft',
	"closing_date" timestamp with time zone,
	"image_url" text,
	"created_by" text NOT NULL,
	"lister_name" text,
	"product_name" text,
	"address" text,
	"targeted_irr" numeric,
	"targeted_avg_coc" numeric,
	"distribution_overview" text,
	"tax_fee_adjusted_irr" numeric,
	"tax_fee_adjusted_coc" numeric,
	"tax_adjusted_em" numeric,
	"tax_adjusted_cg" numeric,
	"coc_year_1" numeric,
	"coc_year_2" numeric,
	"coc_year_3" numeric,
	"coc_year_4" numeric,
	"coc_year_5" numeric,
	"coc_year_6" numeric,
	"coc_year_7" numeric,
	"base_fee" numeric,
	"structure_fee" numeric,
	"marketing_sales_fee" numeric,
	"success_fee" numeric,
	"capital_gain_success_fee" numeric,
	"disregard_user_levels" boolean DEFAULT false,
	"published_wealth_migrate" boolean DEFAULT false,
	"published_private_wealth" boolean DEFAULT false,
	"other_published" boolean DEFAULT false,
	"enable_source_wealth_screen" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "investment_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offering_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"update_type" text DEFAULT 'general',
	"is_important" boolean DEFAULT false,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "offering_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offering_id" uuid NOT NULL,
	"document_category" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_path" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" bigint,
	"mime_type" text,
	"is_required" boolean DEFAULT false,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "offering_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offering_id" uuid NOT NULL,
	"media_type" text NOT NULL,
	"file_path" text,
	"file_name" text,
	"file_size" bigint,
	"mime_type" text,
	"url" text,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "offering_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offering_id" uuid NOT NULL,
	"description" text NOT NULL,
	"milestone_date" date NOT NULL,
	"milestone_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text,
	"phone" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"country" text DEFAULT 'US',
	"date_of_birth" date,
	"is_accredited" boolean DEFAULT false,
	"kyc_verified" boolean DEFAULT false,
	"verification_status" "verification_status" DEFAULT 'pending',
	"investor_classification" "investor_classification" DEFAULT 'retail',
	"risk_rating" "risk_rating" DEFAULT 'low',
	"source_of_wealth" "source_of_wealth"[],
	"annual_income" numeric,
	"net_worth" numeric,
	"is_pep" boolean DEFAULT false,
	"pep_details" text,
	"pep_screening_date" date,
	"sanctions_screening_date" date,
	"sanctions_clear" boolean DEFAULT true,
	"verification_completed_at" timestamp with time zone,
	"next_review_date" date,
	"compliance_notes" text,
	"nationality" text,
	"place_of_birth" text,
	"occupation" text,
	"employer" text,
	"identity_verified" boolean DEFAULT false,
	"address_verified" boolean DEFAULT false,
	"financial_verified" boolean DEFAULT false,
	"pep_screened" boolean DEFAULT false,
	"sanctions_screened" boolean DEFAULT false,
	"verification_level" text DEFAULT 'basic',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"investment_id" uuid,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"description" text,
	"transaction_date" timestamp with time zone DEFAULT now() NOT NULL,
	"reference_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_investments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"offering_id" uuid NOT NULL,
	"investment_amount" numeric(15, 2) NOT NULL,
	"shares" numeric(15, 2),
	"investment_date" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_investments_user_id_offering_id_unique" UNIQUE("user_id","offering_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"role" "app_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_role_unique" UNIQUE("user_id","role")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"document_type" "verification_document_type" NOT NULL,
	"title" text NOT NULL,
	"file_path" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" bigint,
	"mime_type" text,
	"verification_status" "verification_status" DEFAULT 'pending',
	"reviewer_id" text,
	"reviewed_at" timestamp with time zone,
	"reviewer_notes" text,
	"expiry_date" date,
	"is_expired" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"document_id" uuid,
	"previous_status" "verification_status",
	"new_status" "verification_status" NOT NULL,
	"changed_by" text NOT NULL,
	"change_reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "capital_calls" ADD CONSTRAINT "capital_calls_offering_id_investment_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."investment_offerings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "capital_calls" ADD CONSTRAINT "capital_calls_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_offering_id_investment_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."investment_offerings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_profiles_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "investment_offerings" ADD CONSTRAINT "investment_offerings_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "investment_updates" ADD CONSTRAINT "investment_updates_offering_id_investment_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."investment_offerings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "investment_updates" ADD CONSTRAINT "investment_updates_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "offering_documents" ADD CONSTRAINT "offering_documents_offering_id_investment_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."investment_offerings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "offering_media" ADD CONSTRAINT "offering_media_offering_id_investment_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."investment_offerings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "offering_milestones" ADD CONSTRAINT "offering_milestones_offering_id_investment_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."investment_offerings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_investment_id_user_investments_id_fk" FOREIGN KEY ("investment_id") REFERENCES "public"."user_investments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_investments" ADD CONSTRAINT "user_investments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_investments" ADD CONSTRAINT "user_investments_offering_id_investment_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."investment_offerings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
