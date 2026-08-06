// Per-investor fulfillment of capital calls. capitalCalls (offering-extras.ts)
// only holds a call's display terms; this is the ledger of who owes what
// against a call and whether they've actually paid. Two-step confirm
// pattern — submit-payment records the investor's claim, confirm-payment is
// the only thing that makes it real — mirrors compliance.ts's
// initiate/confirm-upload split for the same reason: don't mark an
// obligation fulfilled before an admin has verified the payment arrived.

import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import {
  capitalCallDraws,
  capitalCalls,
  userInvestments,
  investmentOfferings,
} from "../db/schema.js";
import {
  canViewCapitalCallDraw,
  assertCanManageCapitalCalls,
  assertCanSubmitDrawPayment,
  assertCanConfirmDrawPayment,
} from "../authz/policies.js";

const capitalCallDrawsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/capital-call-draws", async (request, reply) => {
    const all = await db.query.capitalCallDraws.findMany();
    reply.send(all.filter((d) => canViewCapitalCallDraw(request.actor, d.userId)));
  });

  // Admin issues draws against a call: every pledged (or partially-called)
  // investment in the call's offering gets an obligation for
  // callPercentage% of what it committed. Unique(capitalCallId, investmentId)
  // makes this idempotent — re-running it only inserts for investments that
  // don't already have a draw for this call, so it's safe to call again to
  // pick up newly-pledged investors without double-charging existing ones.
  fastify.post<{ Params: { id: string } }>(
    "/capital-calls/:id/issue-draws",
    async (request, reply) => {
      assertCanManageCapitalCalls(request.actor);
      const body = z.object({ callPercentage: z.number().positive().max(100) }).parse(request.body);

      const call = await db.query.capitalCalls.findFirst({
        where: eq(capitalCalls.id, request.params.id),
      });
      if (!call) {
        reply.code(404).send({ error: "Not found" });
        return;
      }

      const [eligibleInvestments, existingDraws] = await Promise.all([
        db.query.userInvestments.findMany({
          where: eq(userInvestments.offeringId, call.offeringId),
        }),
        db.query.capitalCallDraws.findMany({
          where: eq(capitalCallDraws.capitalCallId, call.id),
        }),
      ]);
      const alreadyDrawn = new Set(existingDraws.map((d) => d.investmentId));
      const toDraw = eligibleInvestments.filter(
        (inv) =>
          !alreadyDrawn.has(inv.id) &&
          (inv.status === "pledged" || inv.status === "partially_called"),
      );

      if (toDraw.length === 0) {
        reply.send([]);
        return;
      }

      const inserted = await db
        .insert(capitalCallDraws)
        .values(
          toDraw.map((inv) => ({
            capitalCallId: call.id,
            investmentId: inv.id,
            userId: inv.userId,
            amountDue: ((Number(inv.investmentAmount) * body.callPercentage) / 100).toFixed(2),
          })),
        )
        .returning();
      reply.code(201).send(inserted);
    },
  );

  // Investor records that they've sent payment — doesn't move any money,
  // doesn't mark anything confirmed. Just a claim awaiting admin verification.
  fastify.post<{ Params: { id: string } }>(
    "/capital-call-draws/:id/submit-payment",
    async (request, reply) => {
      const draw = await db.query.capitalCallDraws.findFirst({
        where: eq(capitalCallDraws.id, request.params.id),
      });
      if (!draw) {
        reply.code(404).send({ error: "Not found" });
        return;
      }
      assertCanSubmitDrawPayment(request.actor, draw.userId);

      const body = z
        .object({ amountPaid: z.string(), paymentReference: z.string().optional() })
        .parse(request.body);

      const [updated] = await db
        .update(capitalCallDraws)
        .set({
          amountPaid: body.amountPaid,
          paymentReference: body.paymentReference,
          status: "payment_submitted",
          paymentSubmittedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(capitalCallDraws.id, request.params.id))
        .returning();
      reply.send(updated);
    },
  );

  // Admin verifies the payment actually arrived. Only this step: (a) marks
  // the draw confirmed, (b) recomputes the parent investment's status from
  // whether every draw it has across every call is now confirmed, and
  // (c) increments the offering's raisedAmount — the only place that field
  // is ever written, and deliberately only for confirmed/funded capital,
  // never uncalled pledges, so a public "amount raised" figure never
  // includes money that hasn't actually moved.
  fastify.post<{ Params: { id: string } }>(
    "/capital-call-draws/:id/confirm-payment",
    async (request, reply) => {
      assertCanConfirmDrawPayment(request.actor);

      const draw = await db.query.capitalCallDraws.findFirst({
        where: eq(capitalCallDraws.id, request.params.id),
      });
      if (!draw) {
        reply.code(404).send({ error: "Not found" });
        return;
      }

      const [updated] = await db
        .update(capitalCallDraws)
        .set({
          status: "confirmed",
          confirmedBy: request.actor.uid,
          confirmedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(capitalCallDraws.id, request.params.id))
        .returning();
      if (!updated) {
        reply.code(404).send({ error: "Not found" });
        return;
      }

      const investment = await db.query.userInvestments.findFirst({
        where: eq(userInvestments.id, draw.investmentId),
      });
      if (investment) {
        const allDrawsForInvestment = await db.query.capitalCallDraws.findMany({
          where: eq(capitalCallDraws.investmentId, investment.id),
        });
        const allConfirmed = allDrawsForInvestment.every(
          (d) => d.status === "confirmed" || d.status === "waived",
        );
        await db
          .update(userInvestments)
          .set({
            status: allConfirmed ? "fully_called" : "partially_called",
            updatedAt: new Date(),
          })
          .where(eq(userInvestments.id, investment.id));

        const offering = await db.query.investmentOfferings.findFirst({
          where: eq(investmentOfferings.id, investment.offeringId),
        });
        if (offering) {
          const newRaised = (Number(offering.raisedAmount ?? 0) + Number(updated.amountPaid ?? 0)).toFixed(
            2,
          );
          await db
            .update(investmentOfferings)
            .set({ raisedAmount: newRaised, updatedAt: new Date() })
            .where(eq(investmentOfferings.id, offering.id));
        }
      }

      reply.send(updated);
    },
  );
};

export default capitalCallDrawsRoutes;
