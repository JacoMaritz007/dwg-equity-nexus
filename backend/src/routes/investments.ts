import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { userInvestments, investmentOfferings, transactions, profiles } from "../db/schema.js";
import {
  canViewInvestment,
  canUpdateInvestment,
  assertCanCreateInvestment,
  assertCanSignPledge,
  canViewTransaction,
  assertCanManageTransactions,
} from "../authz/policies.js";
import { renderSubscriptionAgreement, hashAgreementText, AGREEMENT_VERSION } from "../pledge/subscription-agreement.js";

const createInvestmentSchema = z.object({
  userId: z.string(),
  offeringId: z.string().uuid(),
  investmentAmount: z.string(),
  shares: z.string().optional(),
  // status is NOT accepted from the client — it used to be, which let a
  // caller set status: 'active' on a pledge that was never actually signed
  // or funded. Server always creates a pledge as 'pending_signature'; only
  // the /sign route (below) and the capital-call-draw confirmation flow
  // advance it from there.
});

const investmentStatusValues = [
  "pending_signature",
  "pledged",
  "partially_called",
  "fully_called",
  "cancelled",
] as const;

const investmentsRoutes: FastifyPluginAsync = async (fastify) => {
  // "Users can view their own investments" / admin sees all
  fastify.get("/investments", async (request, reply) => {
    const all = await db.query.userInvestments.findMany();
    reply.send(all.filter((inv) => canViewInvestment(request.actor, inv.userId)));
  });

  fastify.get<{ Params: { id: string } }>("/investments/:id", async (request, reply) => {
    const investment = await db.query.userInvestments.findFirst({
      where: eq(userInvestments.id, request.params.id),
    });
    if (!investment) {
      reply.code(404).send({ error: "Not found" });
      return;
    }
    if (!canViewInvestment(request.actor, investment.userId)) {
      reply.code(403).send({ error: "Forbidden" });
      return;
    }
    reply.send(investment);
  });

  // "Users can create their own investments" — WITH CHECK (auth.uid() = user_id)
  fastify.post("/investments", async (request, reply) => {
    const body = createInvestmentSchema.parse(request.body);

    const investorProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, body.userId),
    });
    assertCanCreateInvestment(request.actor, body.userId, {
      identityVerified: Boolean(investorProfile?.identityVerified),
      addressVerified: Boolean(investorProfile?.addressVerified),
      financialVerified: Boolean(investorProfile?.financialVerified),
      pepScreened: Boolean(investorProfile?.pepScreened),
      sanctionsScreened: Boolean(investorProfile?.sanctionsScreened),
    });

    const offering = await db.query.investmentOfferings.findFirst({
      where: eq(investmentOfferings.id, body.offeringId),
    });
    if (!offering || offering.status !== "active") {
      reply.code(400).send({ error: "Offering is not open for investment" });
      return;
    }

    // Fee snapshot at pledge-creation time, shown live to the investor on
    // the sizing step and re-shown verbatim on the agreement they sign.
    // Only upfront/structural fees count toward what's actually drawn down
    // via a capital call — successFee/capitalGainSuccessFee are
    // performance fees charged on realized profit, not committed capital,
    // so including them here would overstate what the investor is
    // actually committing to transfer.
    const feePct =
      (Number(offering.baseFee ?? 0) +
        Number(offering.structureFee ?? 0) +
        Number(offering.marketingSalesFee ?? 0)) /
      100;
    const platformFeeAmount = (Number(body.investmentAmount) * feePct).toFixed(2);
    const totalExpectedCallAmount = (Number(body.investmentAmount) + Number(platformFeeAmount)).toFixed(2);

    const [investment] = await db
      .insert(userInvestments)
      .values({
        ...body,
        status: "pending_signature",
        platformFeeAmount,
        totalExpectedCallAmount,
      })
      .returning();
    reply.code(201).send(investment);
  });

  // Renders the exact agreement text the /sign route will hash — the
  // investor reviews this before signing, embedded in the wizard (not a
  // downloadable PDF).
  fastify.get<{ Params: { id: string } }>(
    "/investments/:id/agreement-preview",
    async (request, reply) => {
      const investment = await db.query.userInvestments.findFirst({
        where: eq(userInvestments.id, request.params.id),
      });
      if (!investment) {
        reply.code(404).send({ error: "Not found" });
        return;
      }
      if (!canViewInvestment(request.actor, investment.userId)) {
        reply.code(403).send({ error: "Forbidden" });
        return;
      }
      const [offering, investorProfile] = await Promise.all([
        db.query.investmentOfferings.findFirst({
          where: eq(investmentOfferings.id, investment.offeringId),
        }),
        db.query.profiles.findFirst({ where: eq(profiles.id, investment.userId) }),
      ]);
      const text = renderSubscriptionAgreement({
        offeringTitle: offering?.title ?? "",
        investorName: [investorProfile?.firstName, investorProfile?.lastName].filter(Boolean).join(" "),
        entityType: investment.entityType,
        entityLegalName: investment.entityLegalName,
        entityRegistrationNumber: investment.entityRegistrationNumber,
        investmentAmount: investment.investmentAmount,
        platformFeeAmount: investment.platformFeeAmount ?? "0",
        totalExpectedCallAmount: investment.totalExpectedCallAmount ?? investment.investmentAmount,
      });
      reply.send({ text, version: AGREEMENT_VERSION });
    },
  );

  // The e-signature step. Re-checks KYC/AML eligibility at the moment it
  // actually matters (it could have lapsed since the pledge draft was
  // created) — reuses the same eligibility gate as pledge creation rather
  // than inventing a second one.
  fastify.post<{ Params: { id: string } }>("/investments/:id/sign", async (request, reply) => {
    const investment = await db.query.userInvestments.findFirst({
      where: eq(userInvestments.id, request.params.id),
    });
    if (!investment) {
      reply.code(404).send({ error: "Not found" });
      return;
    }
    assertCanSignPledge(request.actor, investment.userId);

    if (investment.status !== "pending_signature") {
      reply.code(400).send({ error: "This pledge has already been signed" });
      return;
    }

    const body = z
      .object({
        entityType: z.enum(["individual", "trust", "corporate"]),
        entityLegalName: z.string().optional(),
        entityRegistrationNumber: z.string().optional(),
        riskAcknowledged: z.literal(true),
        concentrationLimitConfirmed: z.literal(true),
        signerLegalName: z.string().min(1),
      })
      .parse(request.body);

    const investorProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, investment.userId),
    });
    assertCanCreateInvestment(request.actor, investment.userId, {
      identityVerified: Boolean(investorProfile?.identityVerified),
      addressVerified: Boolean(investorProfile?.addressVerified),
      financialVerified: Boolean(investorProfile?.financialVerified),
      pepScreened: Boolean(investorProfile?.pepScreened),
      sanctionsScreened: Boolean(investorProfile?.sanctionsScreened),
    });

    const offering = await db.query.investmentOfferings.findFirst({
      where: eq(investmentOfferings.id, investment.offeringId),
    });
    const agreementText = renderSubscriptionAgreement({
      offeringTitle: offering?.title ?? "",
      investorName: body.signerLegalName,
      entityType: body.entityType,
      entityLegalName: body.entityLegalName,
      entityRegistrationNumber: body.entityRegistrationNumber,
      investmentAmount: investment.investmentAmount,
      platformFeeAmount: investment.platformFeeAmount ?? "0",
      totalExpectedCallAmount: investment.totalExpectedCallAmount ?? investment.investmentAmount,
    });

    const [updated] = await db
      .update(userInvestments)
      .set({
        status: "pledged",
        entityType: body.entityType,
        entityLegalName: body.entityLegalName,
        entityRegistrationNumber: body.entityRegistrationNumber,
        riskAcknowledged: body.riskAcknowledged,
        concentrationLimitConfirmed: body.concentrationLimitConfirmed,
        suitabilityAcknowledgedAt: investment.suitabilityAcknowledgedAt ?? new Date(),
        signerLegalName: body.signerLegalName,
        signedAt: new Date(),
        signerIpAddress: request.ip,
        agreementVersion: AGREEMENT_VERSION,
        agreementDocumentHash: hashAgreementText(agreementText),
        updatedAt: new Date(),
      })
      .where(eq(userInvestments.id, request.params.id))
      .returning();

    reply.send(updated);
  });

  fastify.patch<{ Params: { id: string } }>("/investments/:id", async (request, reply) => {
    const investment = await db.query.userInvestments.findFirst({
      where: eq(userInvestments.id, request.params.id),
    });
    if (!investment) {
      reply.code(404).send({ error: "Not found" });
      return;
    }
    if (!canUpdateInvestment(request.actor, investment.userId)) {
      reply.code(403).send({ error: "Forbidden" });
      return;
    }
    const body = z
      .object({ status: z.enum(investmentStatusValues), shares: z.string().optional() })
      .partial()
      .parse(request.body);
    const [updated] = await db
      .update(userInvestments)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(userInvestments.id, request.params.id))
      .returning();
    reply.send(updated);
  });

  // --- transactions ---------------------------------------------------------
  fastify.get("/transactions", async (request, reply) => {
    const all = await db.query.transactions.findMany();
    reply.send(all.filter((t) => canViewTransaction(request.actor, t.userId)));
  });

  fastify.get<{ Params: { id: string } }>("/transactions/:id", async (request, reply) => {
    const tx = await db.query.transactions.findFirst({ where: eq(transactions.id, request.params.id) });
    if (!tx) {
      reply.code(404).send({ error: "Not found" });
      return;
    }
    if (!canViewTransaction(request.actor, tx.userId)) {
      reply.code(403).send({ error: "Forbidden" });
      return;
    }
    reply.send(tx);
  });

  // "Admins can manage transactions" — no user-write policy existed
  // originally; transactions are system/admin-generated only.
  fastify.post("/transactions", async (request, reply) => {
    assertCanManageTransactions(request.actor);
    const body = z
      .object({
        userId: z.string(),
        investmentId: z.string().uuid().optional(),
        type: z.enum(["contribution", "distribution", "fee", "expense"]),
        amount: z.string(),
        description: z.string().optional(),
        referenceNumber: z.string().optional(),
      })
      .parse(request.body);

    const [tx] = await db.insert(transactions).values(body).returning();
    reply.code(201).send(tx);
  });
};

export default investmentsRoutes;
