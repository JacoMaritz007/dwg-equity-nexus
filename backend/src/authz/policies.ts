// Authorization rules, ported 1:1 from the original app's Supabase RLS
// policies (see git history predating the rebuild for the source SQL).
// Each function below is documented with the exact policy it replaces.
//
// This is the ONE place where these rules should live. Routes call these
// functions rather than re-deriving access logic inline — that's what makes
// this a real replacement for RLS rather than the "client-side authorization
// pattern" the original app's security review flagged: there is no direct
// client-to-database path anymore for these rules to be bypassed around.

export class AuthzError extends Error {
  statusCode = 403 as const;
  constructor(message = "Forbidden") {
    super(message);
  }
}

export interface Actor {
  uid: string;
  roles: string[];
}

export function isAdmin(actor: Actor): boolean {
  return actor.roles.includes("admin");
}

export function assertAdmin(actor: Actor): void {
  if (!isAdmin(actor)) throw new AuthzError("Admin access required");
}

function assert(condition: boolean, message = "Forbidden"): void {
  if (!condition) throw new AuthzError(message);
}

// --- profiles -----------------------------------------------------------
// "Users can view their own profile" / "Admins can view all profiles"
export function canViewProfile(actor: Actor, targetUserId: string): boolean {
  return actor.uid === targetUserId || isAdmin(actor);
}
// "Users can update their own profile" (no admin-write policy existed
// originally for profiles — deliberately not added here either; admins
// manage verification state via verification_documents / screening docs,
// not by editing profiles directly)
export function assertCanUpdateProfile(actor: Actor, targetUserId: string): void {
  assert(actor.uid === targetUserId, "Can only update your own profile");
}

// --- user_roles -----------------------------------------------------------
// "Users can view their own roles" / admin sees all via a separate query
export function canViewRoles(actor: Actor, targetUserId: string): boolean {
  return actor.uid === targetUserId || isAdmin(actor);
}
// "Admins can manage all roles"
export function assertCanManageRoles(actor: Actor): void {
  assertAdmin(actor);
}

// --- investment_offerings --------------------------------------------------
// "Authenticated users can view active offerings" (any authenticated actor
// implicitly satisfies this — the route itself requires auth) / admin sees all
export function canViewOffering(actor: Actor, offeringStatus: string): boolean {
  return offeringStatus === "active" || isAdmin(actor);
}
// "Admins can manage offerings"
export function assertCanManageOfferings(actor: Actor): void {
  assertAdmin(actor);
}

// --- user_investments -------------------------------------------------------
export function canViewInvestment(actor: Actor, investmentUserId: string): boolean {
  return actor.uid === investmentUserId || isAdmin(actor);
}
// Mirrors the client's useVerificationStatus `can_invest` calculation, but actually
// enforced server-side — previously nothing stopped a direct POST /investments call
// from an unverified user, since the frontend only ever hid the Invest button. Takes
// pre-fetched flags rather than querying itself, same pattern as
// canViewOfferingDocument's investorProfile param — this module stays pure/sync, the
// route does the one DB read. Reads profiles.*_verified/*_screened, which
// verification.ts's /review route and compliance.ts's /confirm-upload route already
// maintain as the authoritative state.
export interface InvestmentEligibility {
  identityVerified: boolean;
  addressVerified: boolean;
  financialVerified: boolean;
  pepScreened: boolean;
  sanctionsScreened: boolean;
}
export function canInvest(eligibility: InvestmentEligibility): boolean {
  return (
    eligibility.identityVerified &&
    eligibility.addressVerified &&
    eligibility.financialVerified &&
    eligibility.pepScreened &&
    eligibility.sanctionsScreened
  );
}
export function assertCanCreateInvestment(
  actor: Actor,
  forUserId: string,
  eligibility: InvestmentEligibility,
): void {
  assert(actor.uid === forUserId, "Can only create investments for yourself");
  assert(
    canInvest(eligibility),
    "Complete identity, address, and financial verification, plus PEP and sanctions screening, before investing",
  );
}
export function canUpdateInvestment(actor: Actor, investmentUserId: string): boolean {
  return actor.uid === investmentUserId || isAdmin(actor);
}

// --- transactions ------------------------------------------------------------
export function canViewTransaction(actor: Actor, transactionUserId: string): boolean {
  return actor.uid === transactionUserId || isAdmin(actor);
}
export function assertCanManageTransactions(actor: Actor): void {
  assertAdmin(actor);
}

// --- documents (generic, non-offering-specific) -------------------------------
export function canViewDocument(
  actor: Actor,
  doc: { isPublic: boolean | null; userId: string | null },
): boolean {
  return Boolean(doc.isPublic) || actor.uid === doc.userId || isAdmin(actor);
}
export function assertCanUploadDocument(actor: Actor, uploadedBy: string): void {
  assert(actor.uid === uploadedBy, "uploaded_by must be the requesting user");
}
export function assertCanManageDocuments(actor: Actor): void {
  assertAdmin(actor);
}

// --- investment_updates / offering_milestones / offering_media ----------------
// All three share the same original policy shape: viewable if the parent
// offering is active, or admin; writable by admin only.
export function canViewOfferingSubresource(actor: Actor, offeringStatus: string): boolean {
  return offeringStatus === "active" || isAdmin(actor);
}
export function assertCanManageOfferingSubresource(actor: Actor): void {
  assertAdmin(actor);
}

// --- capital_calls -------------------------------------------------------------
// "Investors can view capital calls for their investments" — caller must
// supply whether the actor has an investment in the relevant offering
// (route looks this up via a join; see routes/capital-calls.ts).
export function canViewCapitalCall(actor: Actor, hasInvestmentInOffering: boolean): boolean {
  return hasInvestmentInOffering || isAdmin(actor);
}
export function assertCanManageCapitalCalls(actor: Actor): void {
  assertAdmin(actor);
}

// --- offering_documents ----------------------------------------------------------
// Migration bc9fbcd5: admin, OR (offering active AND investor is fully
// KYC'd: kyc_verified && identity_verified && verification_status='approved')
export function canViewOfferingDocument(
  actor: Actor,
  offeringStatus: string,
  investorProfile: {
    kycVerified: boolean | null;
    identityVerified: boolean | null;
    verificationStatus: string | null;
  },
): boolean {
  if (isAdmin(actor)) return true;
  return (
    offeringStatus === "active" &&
    Boolean(investorProfile.kycVerified) &&
    Boolean(investorProfile.identityVerified) &&
    investorProfile.verificationStatus === "approved"
  );
}
export function assertCanManageOfferingDocuments(actor: Actor): void {
  assertAdmin(actor);
}

// --- verification_documents / verification_history -------------------------------
export function canViewVerificationDocument(actor: Actor, docUserId: string): boolean {
  return actor.uid === docUserId || isAdmin(actor);
}
export function assertCanUploadVerificationDocument(actor: Actor, forUserId: string): void {
  assert(actor.uid === forUserId, "Can only upload verification documents for yourself");
}
export function canUpdateVerificationDocument(actor: Actor, docUserId: string): boolean {
  return actor.uid === docUserId || isAdmin(actor);
}
export function assertCanManageVerification(actor: Actor): void {
  assertAdmin(actor);
}

// --- compliance_screening_documents ------------------------------------------------
// Screening record creation was admin-only in the original Edge Function
// (verified server-side there too) — kept admin-only here. Users can only
// ever read their own screening records.
export function canViewScreeningDocument(actor: Actor, docUserId: string): boolean {
  return actor.uid === docUserId || isAdmin(actor);
}
export function assertCanCreateScreening(actor: Actor): void {
  assertAdmin(actor);
}
