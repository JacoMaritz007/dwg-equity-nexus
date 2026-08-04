import type { FastifyPluginAsync } from "fastify";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { userRoles, profiles } from "../db/schema.js";
import { assertAdmin } from "../authz/policies.js";

// Admin-only user-management actions that don't fit cleanly under
// /profiles or /offerings. Two of these exist specifically because the
// original app's equivalent actions were silently broken: the RLS
// policies for `profiles` UPDATE and (implicitly) bulk `user_roles`
// listing only ever authorized the row's own owner, with no admin
// exception — see the comment on the KYC route below and on
// verification.ts's /review route for the same pattern found there.
const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // "Admins can manage all roles" (FOR ALL, so this covers list/insert/delete)
  fastify.get("/user-roles", async (request, reply) => {
    assertAdmin(request.actor);
    const all = await db.query.userRoles.findMany();
    reply.send(all);
  });

  fastify.post("/user-roles", async (request, reply) => {
    assertAdmin(request.actor);
    const body = z.object({ userId: z.string(), role: z.enum(["admin", "investor", "manager"]) }).parse(
      request.body,
    );
    const [role] = await db.insert(userRoles).values(body).returning();
    reply.code(201).send(role);
  });

  fastify.delete("/user-roles", async (request, reply) => {
    assertAdmin(request.actor);
    const body = z.object({ userId: z.string(), role: z.enum(["admin", "investor", "manager"]) }).parse(
      request.body,
    );
    await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, body.userId), eq(userRoles.role, body.role)));
    reply.code(204).send();
  });

  // KYC verification toggle. The original app's UserManagement.tsx did
  // this via `supabase.from('profiles').update({ kyc_verified }).eq('id', userId)`
  // directly — but the profiles UPDATE RLS policy was `auth.uid() = id`
  // only, no admin exception, ever. That call would 403 in production for
  // any admin acting on someone else's profile; the original code didn't
  // even check the error. A dedicated, narrowly-scoped admin endpoint here
  // (not a general "admin can edit any profile field") fixes it for real.
  fastify.post<{ Params: { id: string } }>("/profiles/:id/kyc-status", async (request, reply) => {
    assertAdmin(request.actor);
    const body = z.object({ kycVerified: z.boolean() }).parse(request.body);

    const [updated] = await db
      .update(profiles)
      .set({ kycVerified: body.kycVerified, updatedAt: new Date() })
      .where(eq(profiles.id, request.params.id))
      .returning();

    if (!updated) {
      reply.code(404).send({ error: "Not found" });
      return;
    }
    reply.send(updated);
  });
};

export default adminRoutes;
