// capital_calls and investment_updates — grouped together since both are
// small, offering-scoped resources with the same two policy shapes as
// offerings.ts's milestones/media endpoints.

import type { FastifyPluginAsync } from "fastify";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { capitalCalls, investmentUpdates, userInvestments, investmentOfferings } from "../db/schema.js";
import {
  canViewCapitalCall,
  assertCanManageCapitalCalls,
  canViewOfferingSubresource,
  assertCanManageOfferingSubresource,
} from "../authz/policies.js";

const offeringExtrasRoutes: FastifyPluginAsync = async (fastify) => {
  // "Investors can view capital calls for their investments" — the actor
  // must have a user_investments row for this offering, or be admin.
  fastify.get<{ Params: { id: string } }>(
    "/offerings/:id/capital-calls",
    async (request, reply) => {
      const ownInvestment = await db.query.userInvestments.findFirst({
        where: and(
          eq(userInvestments.offeringId, request.params.id),
          eq(userInvestments.userId, request.actor.uid),
        ),
      });
      if (!canViewCapitalCall(request.actor, Boolean(ownInvestment))) {
        reply.code(403).send({ error: "Forbidden" });
        return;
      }
      const calls = await db.query.capitalCalls.findMany({
        where: eq(capitalCalls.offeringId, request.params.id),
      });
      reply.send(calls);
    },
  );

  fastify.post<{ Params: { id: string } }>(
    "/offerings/:id/capital-calls",
    async (request, reply) => {
      assertCanManageCapitalCalls(request.actor);
      const body = z
        .object({
          title: z.string(),
          description: z.string().optional(),
          amountPerShare: z.string(),
          dueDate: z.string(),
        })
        .parse(request.body);

      const [call] = await db
        .insert(capitalCalls)
        .values({
          ...body,
          dueDate: new Date(body.dueDate),
          offeringId: request.params.id,
          createdBy: request.actor.uid,
        })
        .returning();
      reply.code(201).send(call);
    },
  );

  fastify.get<{ Params: { id: string } }>(
    "/offerings/:id/updates",
    async (request, reply) => {
      const offering = await db.query.investmentOfferings.findFirst({
        where: eq(investmentOfferings.id, request.params.id),
      });
      if (!offering) {
        reply.code(404).send({ error: "Not found" });
        return;
      }
      if (!canViewOfferingSubresource(request.actor, offering.status ?? "draft")) {
        reply.code(403).send({ error: "Forbidden" });
        return;
      }
      const updates = await db.query.investmentUpdates.findMany({
        where: eq(investmentUpdates.offeringId, request.params.id),
      });
      reply.send(updates);
    },
  );

  fastify.post<{ Params: { id: string } }>("/offerings/:id/updates", async (request, reply) => {
    assertCanManageOfferingSubresource(request.actor);
    const body = z
      .object({
        title: z.string(),
        content: z.string(),
        updateType: z.string().optional(),
        isImportant: z.boolean().optional(),
      })
      .parse(request.body);

    const [update] = await db
      .insert(investmentUpdates)
      .values({ ...body, offeringId: request.params.id, createdBy: request.actor.uid })
      .returning();
    reply.code(201).send(update);
  });
};

export default offeringExtrasRoutes;
