import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { investmentOfferings, offeringMilestones, offeringMedia } from "../db/schema.js";
import {
  canViewOffering,
  canViewOfferingSubresource,
  assertCanManageOfferings,
  assertCanManageOfferingSubresource,
} from "../authz/policies.js";

const createOfferingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  targetAmount: z.string(), // numeric columns accept string input from drizzle
  minimumInvestment: z.string(),
  maximumInvestment: z.string().optional(),
  investmentType: z.string().min(1),
  location: z.string().optional(),
  expectedReturn: z.string().optional(),
  investmentTerm: z.string().optional(),
});

const offeringsRoutes: FastifyPluginAsync = async (fastify) => {
  // "Authenticated users can view active offerings" / admin sees all,
  // including drafts. Auth itself is already enforced by the global
  // onRequest hook, so any request that got this far is authenticated.
  fastify.get("/offerings", async (request, reply) => {
    const all = await db.query.investmentOfferings.findMany();
    const visible = all.filter((o) => canViewOffering(request.actor, o.status ?? "draft"));
    reply.send(visible);
  });

  fastify.get<{ Params: { id: string } }>("/offerings/:id", async (request, reply) => {
    const offering = await db.query.investmentOfferings.findFirst({
      where: eq(investmentOfferings.id, request.params.id),
    });
    if (!offering) {
      reply.code(404).send({ error: "Not found" });
      return;
    }
    if (!canViewOffering(request.actor, offering.status ?? "draft")) {
      reply.code(403).send({ error: "Forbidden" });
      return;
    }
    reply.send(offering);
  });

  fastify.post("/offerings", async (request, reply) => {
    assertCanManageOfferings(request.actor);
    const body = createOfferingSchema.parse(request.body);

    const [offering] = await db
      .insert(investmentOfferings)
      .values({ ...body, createdBy: request.actor.uid })
      .returning();

    reply.code(201).send(offering);
  });

  fastify.patch<{ Params: { id: string } }>("/offerings/:id", async (request, reply) => {
    assertCanManageOfferings(request.actor);
    const body = createOfferingSchema.partial().parse(request.body);

    const [updated] = await db
      .update(investmentOfferings)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(investmentOfferings.id, request.params.id))
      .returning();

    if (!updated) {
      reply.code(404).send({ error: "Not found" });
      return;
    }
    reply.send(updated);
  });

  fastify.get<{ Params: { id: string } }>(
    "/offerings/:id/milestones",
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
      const milestones = await db.query.offeringMilestones.findMany({
        where: eq(offeringMilestones.offeringId, request.params.id),
      });
      reply.send(milestones);
    },
  );

  fastify.get<{ Params: { id: string } }>("/offerings/:id/media", async (request, reply) => {
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
    const media = await db.query.offeringMedia.findMany({
      where: eq(offeringMedia.offeringId, request.params.id),
    });
    reply.send(media);
  });

  fastify.post<{ Params: { id: string } }>(
    "/offerings/:id/milestones",
    async (request, reply) => {
      assertCanManageOfferingSubresource(request.actor);
      const body = z
        .object({ description: z.string(), milestoneDate: z.string(), milestoneOrder: z.number() })
        .parse(request.body);

      const [milestone] = await db
        .insert(offeringMilestones)
        .values({ ...body, offeringId: request.params.id })
        .returning();

      reply.code(201).send(milestone);
    },
  );
};

export default offeringsRoutes;
