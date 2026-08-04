import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { profiles, userRoles } from "../db/schema.js";
import { canViewProfile, assertCanUpdateProfile, AuthzError } from "../authz/policies.js";

const bootstrapSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

const updateProfileSchema = bootstrapSchema.partial().extend({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

const profilesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((err, _req, reply) => {
    if (err instanceof AuthzError) {
      reply.code(err.statusCode).send({ error: err.message });
      return;
    }
    reply.send(err);
  });

  // Replaces the old handle_new_user() Postgres trigger on auth.users:
  // called once by the frontend right after Identity Platform signup
  // succeeds, to create the profile row + default 'investor' role.
  // Idempotent — safe to call again if the frontend retries.
  fastify.post("/profiles/bootstrap", async (request, reply) => {
    const body = bootstrapSchema.parse(request.body);
    const uid = request.actor.uid;

    const existing = await db.query.profiles.findFirst({ where: eq(profiles.id, uid) });
    if (existing) {
      reply.send(existing);
      return;
    }

    const [profile] = await db
      .insert(profiles)
      .values({
        id: uid,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
      })
      .returning();

    await db.insert(userRoles).values({ userId: uid, role: "investor" });

    reply.code(201).send(profile);
  });

  fastify.get<{ Params: { id: string } }>("/profiles/:id", async (request, reply) => {
    const { id } = request.params;
    if (!canViewProfile(request.actor, id)) {
      reply.code(403).send({ error: "Forbidden" });
      return;
    }
    const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, id) });
    if (!profile) {
      reply.code(404).send({ error: "Not found" });
      return;
    }
    reply.send(profile);
  });

  fastify.patch<{ Params: { id: string } }>("/profiles/:id", async (request, reply) => {
    const { id } = request.params;
    assertCanUpdateProfile(request.actor, id);
    const body = updateProfileSchema.parse(request.body);

    const [updated] = await db
      .update(profiles)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();

    reply.send(updated);
  });

  fastify.get("/me", async (request, reply) => {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, request.actor.uid),
    });
    reply.send({ uid: request.actor.uid, roles: request.actor.roles, profile: profile ?? null });
  });
};

export default profilesRoutes;
