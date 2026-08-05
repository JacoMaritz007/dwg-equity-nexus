import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { profiles, userRoles, sourceOfWealthEnum } from "../db/schema.js";
import { canViewProfile, assertCanUpdateProfile, assertAdmin, AuthzError } from "../authz/policies.js";

const bootstrapSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  // Lowercased so every lookup-by-email downstream (admin tooling, future
  // search/reset flows) can rely on exact match — Postgres text equality
  // is case-sensitive, and Identity Platform preserves whatever casing was
  // typed at signup, so without this two accounts for the "same" email can
  // silently fail to match each other.
  email: z.string().email().transform((v) => v.toLowerCase()),
  phone: z.string().optional(),
});

const updateProfileSchema = bootstrapSchema.partial().extend({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

// FICA (South Africa's Financial Intelligence Centre Act) CDD self-declaration.
// A separate endpoint from the general profile PATCH above, deliberately: this is a
// compliance record, not contact-info editing, and it needs its own PEP-declaration
// validation and side effects (risk-rating escalation) that don't belong on a plain
// "update my address" call.
const amlQuestionnaireSchema = z
  .object({
    occupation: z.string().min(1),
    employer: z.string().optional(),
    nationality: z.string().min(1),
    placeOfBirth: z.string().optional(),
    sourceOfWealth: z.array(z.enum(sourceOfWealthEnum.enumValues)).min(1),
    annualIncome: z.string().optional(),
    netWorth: z.string().optional(),
    isPep: z.boolean(),
    pepDetails: z.string().optional(),
    declarationAccepted: z.literal(true),
  })
  .superRefine((data, ctx) => {
    if (data.isPep && !data.pepDetails?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["pepDetails"],
        message: "Details are required when the PEP declaration is Yes",
      });
    }
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

  // "Admins can view all profiles" (migration 20251015140915, added to fix
  // the original MISSING_RLS finding — see SECURITY_REVIEW_FINDINGS.md in
  // the legacy repo). Used by the admin User Management and Document
  // Review pages to join user names/emails onto their own data.
  fastify.get("/profiles", async (request, reply) => {
    assertAdmin(request.actor);
    const all = await db.query.profiles.findMany();
    reply.send(all);
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

  // Client self-declaration, resubmittable by design — FICA expects periodic
  // re-review (see the unused `nextReviewDate` column), and a user should be able
  // to correct an answer before an admin has screened them against it.
  fastify.post<{ Params: { id: string } }>("/profiles/:id/aml-questionnaire", async (request, reply) => {
    const { id } = request.params;
    assertCanUpdateProfile(request.actor, id);
    const body = amlQuestionnaireSchema.parse(request.body);

    // FICA s21G requires Enhanced Due Diligence for domestic AND foreign PEPs
    // (and, per Schedules 3A/3B, their family members/close associates — the
    // frontend's single PEP question covers all four, isPep=true means any of
    // them applies). Auto-escalate risk here rather than leaving it at the
    // default until an admin happens to notice. Only ever escalates, never
    // downgrades automatically on a false resubmission — an admin may have set
    // 'high' for an unrelated reason that this shouldn't silently clear.
    const riskUpdate = body.isPep ? { riskRating: "high" as const } : {};

    const [updated] = await db
      .update(profiles)
      .set({
        occupation: body.occupation,
        employer: body.employer,
        nationality: body.nationality,
        placeOfBirth: body.placeOfBirth,
        sourceOfWealth: body.sourceOfWealth,
        annualIncome: body.annualIncome,
        netWorth: body.netWorth,
        isPep: body.isPep,
        pepDetails: body.isPep ? body.pepDetails : null,
        ...riskUpdate,
        amlQuestionnaireCompletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, id))
      .returning();

    if (!updated) {
      reply.code(404).send({ error: "Not found" });
      return;
    }
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
