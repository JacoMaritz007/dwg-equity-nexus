import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { userInvestments, investmentOfferings, transactions, profiles } from "../db/schema.js";
import {
  canViewInvestment,
  canUpdateInvestment,
  assertCanCreateInvestment,
  canViewTransaction,
  assertCanManageTransactions,
} from "../authz/policies.js";

const createInvestmentSchema = z.object({
  userId: z.string(),
  offeringId: z.string().uuid(),
  investmentAmount: z.string(),
  shares: z.string().optional(),
  // Frontend sends 'pending' for a fresh application still going through
  // due-diligence/esign/funding (see InvestmentProcessModal.tsx); defaults
  // to the schema's 'active' otherwise.
  status: z.string().optional(),
});

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

    const [investment] = await db.insert(userInvestments).values(body).returning();
    reply.code(201).send(investment);
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
    const body = z.object({ status: z.string(), shares: z.string().optional() }).partial().parse(
      request.body,
    );
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
