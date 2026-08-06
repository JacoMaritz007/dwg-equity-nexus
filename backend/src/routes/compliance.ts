import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { complianceScreeningDocuments, profiles } from "../db/schema.js";
import { canViewScreeningDocument, assertCanCreateScreening } from "../authz/policies.js";
import { getSignedUploadUrl, userScopedPath } from "../storage/signed-urls.js";

const complianceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/compliance-screening", async (request, reply) => {
    const all = await db.query.complianceScreeningDocuments.findMany();
    reply.send(all.filter((d) => canViewScreeningDocument(request.actor, d.userId)));
  });

  // Original Supabase Edge Function created this row with status: 'approved'
  // and immediately flipped profiles.pep_screened/sanctions_screened to true
  // BEFORE the actual file upload happened — if the upload then failed or
  // was abandoned, the profile stayed marked as screened with no document
  // behind it. Fixed here: row starts 'pending', profile flags only flip
  // in the /confirm-upload step below, once the file is confirmed present.
  fastify.post("/compliance-screening/initiate", async (request, reply) => {
    assertCanCreateScreening(request.actor);
    const body = z
      .object({
        userId: z.string(),
        screeningType: z.enum(["pep", "sanctions"]),
        screeningProvider: z.string(),
        screeningReference: z.string().optional(),
        expiryDate: z.string().optional(),
        fileName: z.string(),
        fileSize: z.number(),
        // Matches what the admin UI's file picker actually accepts
        // (accept=".pdf,image/*", validated client-side as startsWith('image/')
        // || === 'application/pdf') — the previous hardcoded 4-value enum
        // rejected anything outside exactly jpeg/png/jpg/pdf (e.g. image/heic,
        // image/webp), 400ing before the signed-URL upload ever started.
        mimeType: z
          .string()
          .refine((v) => v === "application/pdf" || v.startsWith("image/"), {
            message: "File must be a PDF or an image",
          }),
        notes: z.string().optional(),
      })
      .parse(request.body);

    if (body.fileSize > 10 * 1024 * 1024) {
      reply.code(400).send({ error: "File too large. Maximum size is 10MB." });
      return;
    }
    if (body.expiryDate && new Date(body.expiryDate) < new Date(new Date().toDateString())) {
      reply.code(400).send({ error: "Expiry date cannot be in the past" });
      return;
    }

    const filePath = userScopedPath(body.userId, body.fileName);

    const [screeningDoc] = await db
      .insert(complianceScreeningDocuments)
      .values({
        userId: body.userId,
        screeningType: body.screeningType,
        screeningProvider: body.screeningProvider,
        screeningReference: body.screeningReference,
        status: "pending",
        filePath,
        fileName: body.fileName,
        fileSize: body.fileSize,
        mimeType: body.mimeType,
        expiryDate: body.expiryDate,
        notes: body.notes,
        uploadedBy: request.actor.uid,
      })
      .returning();

    const uploadUrl = await getSignedUploadUrl("verificationDocuments", filePath, body.mimeType);

    reply.send({ uploadUrl, data: screeningDoc });
  });

  // Called by the admin UI once the signed-URL upload has actually
  // completed. This is the step that used to happen unconditionally before
  // any upload occurred — now it only happens once the caller confirms the
  // upload succeeded.
  fastify.post<{ Params: { id: string } }>(
    "/compliance-screening/:id/confirm-upload",
    async (request, reply) => {
      assertCanCreateScreening(request.actor);
      const doc = await db.query.complianceScreeningDocuments.findFirst({
        where: eq(complianceScreeningDocuments.id, request.params.id),
      });
      if (!doc) {
        reply.code(404).send({ error: "Not found" });
        return;
      }

      const [updated] = await db
        .update(complianceScreeningDocuments)
        .set({
          status: "approved",
          reviewedBy: request.actor.uid,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(complianceScreeningDocuments.id, request.params.id))
        .returning();

      const updateField = doc.screeningType === "pep" ? "pepScreened" : "sanctionsScreened";
      const dateField = doc.screeningType === "pep" ? "pepScreeningDate" : "sanctionsScreeningDate";
      await db
        .update(profiles)
        .set({
          [updateField]: true,
          [dateField]: new Date().toISOString().split("T")[0],
        })
        .where(eq(profiles.id, doc.userId));

      reply.send(updated);
    },
  );
};

export default complianceRoutes;
