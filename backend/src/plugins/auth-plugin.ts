import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { verifyIdToken, AuthError } from "../auth/verify-token.js";
import { db } from "../db/client.js";
import { userRoles } from "../db/schema.js";
import type { Actor } from "../authz/policies.js";

declare module "fastify" {
  interface FastifyRequest {
    actor: Actor;
  }
  interface FastifyContextConfig {
    public?: boolean;
  }
}

// Verifies the Identity Platform ID token on every request and attaches
// `request.actor = { uid, roles }`. Roles come from OUR user_roles table,
// never from the token's custom claims / metadata — this is the fix for the
// original app's role-spoofing gap, where the frontend trusted
// `user_metadata.role`, a field any authenticated user could rewrite on
// themselves via `supabase.auth.updateUser()`. Roles now only ever come from
// a table the actor has no write path to (only admins can insert/delete
// user_roles rows, enforced in routes/admin.ts via assertCanManageRoles).
const authPlugin: FastifyPluginAsync = async (fastify) => {
  // No decorateRequest call: `actor` is set per-request in the onRequest
  // hook below (before any route handler runs), and the module augmentation
  // above gives it a static type. Fastify allows this; decorateRequest is a
  // perf optimization for the primitive/prototype case, not a requirement.
  fastify.addHook("onRequest", async (request, reply) => {
    // Health checks and any explicitly public routes skip auth.
    if (request.routeOptions.config?.public) return;

    try {
      const decoded = await verifyIdToken(request.headers.authorization);
      const roleRows = await db
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(eq(userRoles.userId, decoded.uid));

      request.actor = {
        uid: decoded.uid,
        roles: roleRows.map((r) => r.role),
      };
    } catch (err) {
      const status = err instanceof AuthError ? err.statusCode : 401;
      reply.code(status).send({ error: err instanceof Error ? err.message : "Unauthorized" });
    }
  });
};

export default fp(authPlugin);
