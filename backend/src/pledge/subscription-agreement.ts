// Renders the exact subscription agreement text an investor reviews before
// signing a pledge, and provides the hashing used to prove — after the fact —
// that what they signed matches what they were shown. There is no real
// e-signature integration (DocuSign/HelloSign) wired into this platform; this
// is a defensible in-app audit trail (signer name, timestamp, IP address,
// hash of the exact rendered text), not a legal opinion that it satisfies
// FICA/ECT Act requirements in any given jurisdiction — that determination
// belongs to the platform's own legal/compliance function.

import { createHash } from "node:crypto";

// Bump this whenever the template text changes. Old signed pledges keep
// their original agreementVersion/hash regardless — this only affects new
// signatures going forward.
export const AGREEMENT_VERSION = "subscription-agreement-v1";

export interface SubscriptionAgreementParams {
  offeringTitle: string;
  investorName: string;
  entityType: "individual" | "trust" | "corporate";
  entityLegalName?: string | null;
  entityRegistrationNumber?: string | null;
  investmentAmount: string;
  platformFeeAmount: string;
  totalExpectedCallAmount: string;
}

function formatEntityLine(params: SubscriptionAgreementParams): string {
  if (params.entityType === "individual") {
    return `Investing Party: ${params.investorName} (Individual)`;
  }
  const label = params.entityType === "trust" ? "Trust" : "Corporate Entity";
  const legalName = params.entityLegalName || "[not provided]";
  const regNumber = params.entityRegistrationNumber
    ? `, registration number ${params.entityRegistrationNumber}`
    : "";
  return `Investing Party: ${legalName}${regNumber} (${label}), represented by ${params.investorName}`;
}

export function renderSubscriptionAgreement(params: SubscriptionAgreementParams): string {
  return `SUBSCRIPTION AGREEMENT

Offering: ${params.offeringTitle}
${formatEntityLine(params)}

1. CAPITAL COMMITMENT
By signing this agreement, the Investing Party makes a legally binding
commitment to invest an amount of ${params.investmentAmount} (the
"Committed Capital") in the above Offering, subject to its terms.

2. NO FUNDS TRANSFERRED TODAY
This is a commitment, not a payment. No funds are transferred at the time
of signing. Capital is drawn down only when the platform issues a formal
Capital Call against this commitment, in whole or in part, in accordance
with the Offering's terms.

3. FEES
A platform fee of ${params.platformFeeAmount} applies to this commitment,
in addition to the Committed Capital, bringing the total amount that may
be called under this commitment to ${params.totalExpectedCallAmount}.
Performance-based fees, if any, are charged separately against realized
returns and are not included in this figure.

4. RISK ACKNOWLEDGMENT
The Investing Party has acknowledged the risks associated with this asset
class, including illiquidity and potential loss of capital, and has
confirmed that this commitment does not exceed any applicable
concentration limits, as recorded separately at the time of signing.

5. BINDING EFFECT
This commitment is binding upon signature below and remains in effect
until fully called, cancelled by mutual agreement, or the Offering closes
without this commitment being called, whichever occurs first.`;
}

export function hashAgreementText(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}
