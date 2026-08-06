import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { verificationDocuments, verificationHistory, profiles } from "../db/schema.js";
import {
  canViewVerificationDocument,
  assertCanUploadVerificationDocument,
  canUpdateVerificationDocument,
  assertCanManageVerification,
} from "../authz/policies.js";
import { getSignedReadUrl, getSignedUploadUrl, userScopedPath } from "../storage/signed-urls.js";

const DOC_TYPES = [
  "passport",
  "national_id",
  "driving_license",
  "proof_of_address",
  "bank_statement",
  "income_verification",
  "source_of_wealth",
  "pep_declaration",
  "sophisticated_investor_cert",
  "professional_qualification",
] as const;

const verificationRoutes: FastifyPluginAsync = async (fastify) => {
  // Returns raw filePath, not a signed URL — every current frontend
  // consumer signs on demand at preview/download time (POST
  // /storage/signed-url, or the ID-based /download-url route below).
  fastify.get("/verification-documents", async (request, reply) => {
    const all = await db.query.verificationDocuments.findMany();
    reply.send(all.filter((d) => canViewVerificationDocument(request.actor, d.userId)));
  });

  fastify.post("/verification-documents/upload-url", async (request, reply) => {
    const body = z.object({ fileName: z.string(), contentType: z.string() }).parse(request.body);
    const path = userScopedPath(request.actor.uid, body.fileName);
    const url = await getSignedUploadUrl("verificationDocuments", path, body.contentType);
    reply.send({ url, filePath: path });
  });

  // "Users can upload their own verification documents" — WITH CHECK (auth.uid() = user_id)
  fastify.post("/verification-documents", async (request, reply) => {
    const body = z
      .object({
        documentType: z.enum(DOC_TYPES),
        title: z.string(),
        filePath: z.string(),
        fileName: z.string(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
        expiryDate: z.string().optional(),
      })
      .parse(request.body);

    assertCanUploadVerificationDocument(request.actor, request.actor.uid);
    const [doc] = await db
      .insert(verificationDocuments)
      .values({ ...body, userId: request.actor.uid })
      .returning();
    reply.code(201).send(doc);
  });

  fastify.get<{ Params: { id: string } }>(
    "/verification-documents/:id/download-url",
    async (request, reply) => {
      const doc = await db.query.verificationDocuments.findFirst({
        where: eq(verificationDocuments.id, request.params.id),
      });
      if (!doc) {
        reply.code(404).send({ error: "Not found" });
        return;
      }
      if (!canViewVerificationDocument(request.actor, doc.userId)) {
        reply.code(403).send({ error: "Forbidden" });
        return;
      }
      const url = await getSignedReadUrl("verificationDocuments", doc.filePath);
      reply.send({ url });
    },
  );

  // Admin review action. Replaces the old log_verification_change() Postgres
  // trigger: we write the verification_history row explicitly, in the same
  // request, instead of relying on a trigger firing on UPDATE.
  //
  // Also flips the matching profiles.*_verified flag when approved — the
  // original app tried to do this via a second client-side
  // supabase.from('profiles').update(...) call, but the profiles UPDATE RLS
  // policy only ever allowed `auth.uid() = id` (no admin exception), so
  // that call was silently rejected in production and the error just
  // logged, never surfaced. No user could ever actually complete
  // verification through the admin review flow. Doing it here, atomically,
  // as part of the review itself (which IS admin-authorized) fixes it for
  // real rather than reproducing the same broken permission gap.
  fastify.post<{ Params: { id: string } }>(
    "/verification-documents/:id/review",
    async (request, reply) => {
      assertCanManageVerification(request.actor);
      const body = z
        .object({ status: z.enum(["approved", "rejected"]), notes: z.string().optional() })
        .parse(request.body);

      const doc = await db.query.verificationDocuments.findFirst({
        where: eq(verificationDocuments.id, request.params.id),
      });
      if (!doc) {
        reply.code(404).send({ error: "Not found" });
        return;
      }

      const [updated] = await db
        .update(verificationDocuments)
        .set({
          verificationStatus: body.status,
          reviewerId: request.actor.uid,
          reviewedAt: new Date(),
          reviewerNotes: body.notes,
          updatedAt: new Date(),
        })
        .where(eq(verificationDocuments.id, request.params.id))
        .returning();

      await db.insert(verificationHistory).values({
        userId: doc.userId,
        documentId: doc.id,
        previousStatus: doc.verificationStatus,
        newStatus: body.status,
        changedBy: request.actor.uid,
        changeReason: body.notes ?? "Status updated",
      });

      if (body.status === "approved") {
        const identityTypes = ["passport", "national_id", "driving_license"];
        const financialTypes = ["bank_statement", "income_verification", "source_of_wealth"];
        // Sophisticated-investor / professional-qualification uploads were
        // acceptable document types for the "financial" upload category
        // (see DocumentUploadModal.tsx) and had display labels in the
        // uploader, but approving one never actually did anything —
        // profiles.isAccredited had no route setting it anywhere, so the
        // "Accredited Investor Status" badge was permanently stuck on
        // Pending for every user regardless of what they submitted.
        const accreditationTypes = ["sophisticated_investor_cert", "professional_qualification"];
        const flagUpdates: Partial<typeof profiles.$inferInsert> = {};
        if (identityTypes.includes(doc.documentType)) flagUpdates.identityVerified = true;
        else if (doc.documentType === "proof_of_address") flagUpdates.addressVerified = true;
        else if (financialTypes.includes(doc.documentType)) flagUpdates.financialVerified = true;
        else if (accreditationTypes.includes(doc.documentType)) flagUpdates.isAccredited = true;

        if (Object.keys(flagUpdates).length > 0) {
          await db
            .update(profiles)
            .set({ ...flagUpdates, updatedAt: new Date() })
            .where(eq(profiles.id, doc.userId));
        }
      }

      reply.send(updated);
    },
  );

  // "Users can update their own verification documents" (e.g. replacing a
  // rejected doc before resubmitting) — admins also allowed, matching the
  // original policy's `auth.uid() = user_id OR is_admin(...)`.
  fastify.patch<{ Params: { id: string } }>("/verification-documents/:id", async (request, reply) => {
    const doc = await db.query.verificationDocuments.findFirst({
      where: eq(verificationDocuments.id, request.params.id),
    });
    if (!doc) {
      reply.code(404).send({ error: "Not found" });
      return;
    }
    if (!canUpdateVerificationDocument(request.actor, doc.userId)) {
      reply.code(403).send({ error: "Forbidden" });
      return;
    }
    const body = z
      .object({ filePath: z.string(), fileName: z.string(), fileSize: z.number().optional() })
      .partial()
      .parse(request.body);

    const [updated] = await db
      .update(verificationDocuments)
      .set({ ...body, verificationStatus: "pending", updatedAt: new Date() })
      .where(eq(verificationDocuments.id, request.params.id))
      .returning();
    reply.send(updated);
  });

  fastify.get("/verification-history", async (request, reply) => {
    const all = await db.query.verificationHistory.findMany();
    reply.send(all.filter((h) => canViewVerificationDocument(request.actor, h.userId)));
  });
};

export default verificationRoutes;
