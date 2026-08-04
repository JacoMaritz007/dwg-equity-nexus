// Postgres schema for equity-nexus, ported from the original 13 Supabase
// migrations (see /legacy-supabase/migrations for the source of truth this
// was translated from). Two deliberate deviations from the original SQL,
// both fixes rather than faithful ports:
//
// 1. The original migrations declare TWO different enums both named
//    `document_type` (one for `documents`, one for `verification_documents`,
//    with completely different value sets) — a real bug that would fail on
//    a clean apply. Renamed the second one to `verification_document_type`.
// 2. User-referencing columns (`user_id`, `created_by`, `uploaded_by`, etc.)
//    are `text`, not `uuid`. Identity Platform UIDs are opaque ~28-char
//    strings, not UUIDs, so `auth.users(id) uuid` doesn't have an equivalent
//    here — `profiles.id` (also text) is the FK target instead.
//
// Authorization that used to live in RLS policies now lives in
// src/authz/policies.ts as real code, enforced by the API layer — see that
// file for the mapping from each old policy to its new equivalent.

import {
  pgTable,
  pgEnum,
  text,
  uuid,
  numeric,
  boolean,
  timestamp,
  date,
  bigint,
  integer,
  unique,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const appRoleEnum = pgEnum("app_role", ["admin", "investor", "manager"]);
export const investmentStatusEnum = pgEnum("investment_status", [
  "draft",
  "active",
  "closed",
  "cancelled",
]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "contribution",
  "distribution",
  "fee",
  "expense",
]);
export const documentTypeEnum = pgEnum("document_type", [
  "offering_document",
  "legal_agreement",
  "financial_report",
  "tax_document",
  "update",
]);
export const capitalCallStatusEnum = pgEnum("capital_call_status", [
  "pending",
  "completed",
  "overdue",
]);
export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",
  "in_progress",
  "approved",
  "rejected",
  "expired",
]);
export const investorClassificationEnum = pgEnum("investor_classification", [
  "retail",
  "sophisticated",
  "high_net_worth",
  "institutional",
]);
export const riskRatingEnum = pgEnum("risk_rating", ["low", "medium", "high"]);
export const verificationDocumentTypeEnum = pgEnum("verification_document_type", [
  "passport",
  "national_id",
  "driving_license",
  "proof_of_address",
  "bank_statement",
  "income_verification",
  "source_of_wealth",
  "pep_declaration",
  "sophisticated_investor_cert",
  "professional_qualification",
]);
export const sourceOfWealthEnum = pgEnum("source_of_wealth", [
  "employment",
  "business_ownership",
  "inheritance",
  "property_sale",
  "investment_gains",
  "pension",
  "gift",
  "other",
]);

// ---------------------------------------------------------------------------
// Core tables
// ---------------------------------------------------------------------------

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(), // Identity Platform UID
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("US"),
  dateOfBirth: date("date_of_birth"),
  isAccredited: boolean("is_accredited").default(false),
  kycVerified: boolean("kyc_verified").default(false),

  verificationStatus: verificationStatusEnum("verification_status").default("pending"),
  investorClassification: investorClassificationEnum("investor_classification").default(
    "retail",
  ),
  riskRating: riskRatingEnum("risk_rating").default("low"),
  sourceOfWealth: sourceOfWealthEnum("source_of_wealth").array(),
  annualIncome: numeric("annual_income"),
  netWorth: numeric("net_worth"),
  isPep: boolean("is_pep").default(false),
  pepDetails: text("pep_details"),
  pepScreeningDate: date("pep_screening_date"),
  sanctionsScreeningDate: date("sanctions_screening_date"),
  sanctionsClear: boolean("sanctions_clear").default(true),
  verificationCompletedAt: timestamp("verification_completed_at", { withTimezone: true }),
  nextReviewDate: date("next_review_date"),
  complianceNotes: text("compliance_notes"),
  nationality: text("nationality"),
  placeOfBirth: text("place_of_birth"),
  occupation: text("occupation"),
  employer: text("employer"),

  identityVerified: boolean("identity_verified").default(false),
  addressVerified: boolean("address_verified").default(false),
  financialVerified: boolean("financial_verified").default(false),
  pepScreened: boolean("pep_screened").default(false),
  sanctionsScreened: boolean("sanctions_screened").default(false),
  verificationLevel: text("verification_level").default("basic"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: appRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.role)],
);

export const investmentOfferings = pgTable("investment_offerings", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  targetAmount: numeric("target_amount", { precision: 15, scale: 2 }).notNull(),
  raisedAmount: numeric("raised_amount", { precision: 15, scale: 2 }).default("0"),
  minimumInvestment: numeric("minimum_investment", { precision: 15, scale: 2 }).notNull(),
  maximumInvestment: numeric("maximum_investment", { precision: 15, scale: 2 }),
  investmentType: text("investment_type").notNull(),
  location: text("location"),
  expectedReturn: text("expected_return"),
  investmentTerm: text("investment_term"),
  status: investmentStatusEnum("status").default("draft"),
  closingDate: timestamp("closing_date", { withTimezone: true }),
  imageUrl: text("image_url"),
  createdBy: text("created_by")
    .notNull()
    .references(() => profiles.id),

  listerName: text("lister_name"),
  productName: text("product_name"),
  address: text("address"),
  targetedIrr: numeric("targeted_irr"),
  targetedAvgCoc: numeric("targeted_avg_coc"),
  distributionOverview: text("distribution_overview"),
  taxFeeAdjustedIrr: numeric("tax_fee_adjusted_irr"),
  taxFeeAdjustedCoc: numeric("tax_fee_adjusted_coc"),
  taxAdjustedEm: numeric("tax_adjusted_em"),
  taxAdjustedCg: numeric("tax_adjusted_cg"),
  cocYear1: numeric("coc_year_1"),
  cocYear2: numeric("coc_year_2"),
  cocYear3: numeric("coc_year_3"),
  cocYear4: numeric("coc_year_4"),
  cocYear5: numeric("coc_year_5"),
  cocYear6: numeric("coc_year_6"),
  cocYear7: numeric("coc_year_7"),
  baseFee: numeric("base_fee"),
  structureFee: numeric("structure_fee"),
  marketingSalesFee: numeric("marketing_sales_fee"),
  successFee: numeric("success_fee"),
  capitalGainSuccessFee: numeric("capital_gain_success_fee"),
  disregardUserLevels: boolean("disregard_user_levels").default(false),
  publishedWealthMigrate: boolean("published_wealth_migrate").default(false),
  publishedPrivateWealth: boolean("published_private_wealth").default(false),
  otherPublished: boolean("other_published").default(false),
  enableSourceWealthScreen: boolean("enable_source_wealth_screen").default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userInvestments = pgTable(
  "user_investments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => investmentOfferings.id, { onDelete: "cascade" }),
    investmentAmount: numeric("investment_amount", { precision: 15, scale: 2 }).notNull(),
    shares: numeric("shares", { precision: 15, scale: 2 }),
    investmentDate: timestamp("investment_date", { withTimezone: true }).notNull().defaultNow(),
    status: text("status").default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.offeringId)],
);

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  investmentId: uuid("investment_id").references(() => userInvestments.id, {
    onDelete: "cascade",
  }),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  transactionDate: timestamp("transaction_date", { withTimezone: true }).notNull().defaultNow(),
  referenceNumber: text("reference_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  filePath: text("file_path").notNull(),
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: text("mime_type"),
  documentType: documentTypeEnum("document_type").notNull(),
  offeringId: uuid("offering_id").references(() => investmentOfferings.id, {
    onDelete: "cascade",
  }),
  userId: text("user_id").references(() => profiles.id, { onDelete: "cascade" }),
  isPublic: boolean("is_public").default(false),
  uploadedBy: text("uploaded_by")
    .notNull()
    .references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const investmentUpdates = pgTable("investment_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  offeringId: uuid("offering_id")
    .notNull()
    .references(() => investmentOfferings.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  updateType: text("update_type").default("general"),
  isImportant: boolean("is_important").default(false),
  createdBy: text("created_by")
    .notNull()
    .references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const capitalCalls = pgTable("capital_calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  offeringId: uuid("offering_id")
    .notNull()
    .references(() => investmentOfferings.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  amountPerShare: numeric("amount_per_share", { precision: 15, scale: 2 }).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  status: capitalCallStatusEnum("status").default("pending"),
  createdBy: text("created_by")
    .notNull()
    .references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const offeringMilestones = pgTable("offering_milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  offeringId: uuid("offering_id")
    .notNull()
    .references(() => investmentOfferings.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  milestoneDate: date("milestone_date").notNull(),
  milestoneOrder: integer("milestone_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const offeringMedia = pgTable("offering_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  offeringId: uuid("offering_id")
    .notNull()
    .references(() => investmentOfferings.id, { onDelete: "cascade" }),
  // Original had a DB CHECK constraint restricting these values; enforced in
  // the API layer instead (see src/routes/offerings.ts) so it's easy to see
  // and change without a migration.
  mediaType: text("media_type").notNull(),
  filePath: text("file_path"),
  fileName: text("file_name"),
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: text("mime_type"),
  url: text("url"),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const offeringDocuments = pgTable("offering_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  offeringId: uuid("offering_id")
    .notNull()
    .references(() => investmentOfferings.id, { onDelete: "cascade" }),
  documentCategory: text("document_category").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  filePath: text("file_path").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: text("mime_type"),
  isRequired: boolean("is_required").default(false),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verificationDocuments = pgTable("verification_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  documentType: verificationDocumentTypeEnum("document_type").notNull(),
  title: text("title").notNull(),
  filePath: text("file_path").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: text("mime_type"),
  verificationStatus: verificationStatusEnum("verification_status").default("pending"),
  reviewerId: text("reviewer_id"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewerNotes: text("reviewer_notes"),
  expiryDate: date("expiry_date"),
  isExpired: boolean("is_expired").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verificationHistory = pgTable("verification_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  documentId: uuid("document_id"),
  previousStatus: verificationStatusEnum("previous_status"),
  newStatus: verificationStatusEnum("new_status").notNull(),
  changedBy: text("changed_by").notNull(),
  changeReason: text("change_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Compliance screening documents. Unlike the original Supabase edge
// function, the API route for this (src/routes/compliance.ts, Phase 2
// continuation) creates the row as 'pending' and only flips it (and the
// matching profiles.*_screened flag) to 'approved' after the storage upload
// is confirmed to exist — the original set status: 'approved' before the
// upload happened, which could mark a user as screened with no document
// behind it if the upload failed. Fixed here, not ported.
export const complianceScreeningDocuments = pgTable("compliance_screening_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  screeningType: text("screening_type").notNull(), // 'pep' | 'sanctions'
  status: verificationStatusEnum("status").notNull().default("pending"),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: text("mime_type"),
  uploadedBy: text("uploaded_by").notNull(),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  screeningDate: date("screening_date").notNull().defaultNow(),
  screeningProvider: text("screening_provider"),
  screeningReference: text("screening_reference"),
  expiryDate: date("expiry_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
