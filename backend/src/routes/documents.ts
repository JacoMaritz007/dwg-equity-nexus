import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { documents, offeringDocuments, investmentOfferings, profiles } from "../db/schema.js";
import {
  canViewDocument,
  assertCanUploadDocument,
  assertCanManageDocuments,
  canViewOfferingDocument,
  assertCanManageOfferingDocuments,
} from "../authz/policies.js";
import { getSignedReadUrl, getSignedUploadUrl, userScopedPath } from "../storage/signed-urls.js";

// Note: list routes below return the raw `filePath`, not a signed URL.
// Every current frontend consumer signs on demand at preview/download time
// via POST /storage/signed-url (generic, path-based) or the
// /download-url routes below (ID-based) — see useDocuments.ts. Eagerly
// signing every row in a list would be wasted work for rows never opened.
const documentsRoutes: FastifyPluginAsync = async (fastify) => {
  // --- generic documents (offering_document/legal_agreement/etc) -----------
  fastify.get("/documents", async (request, reply) => {
    const all = await db.query.documents.findMany();
    reply.send(all.filter((d) => canViewDocument(request.actor, d)));
  });

  fastify.get<{ Params: { id: string } }>("/documents/:id/download-url", async (request, reply) => {
    const doc = await db.query.documents.findFirst({ where: eq(documents.id, request.params.id) });
    if (!doc) {
      reply.code(404).send({ error: "Not found" });
      return;
    }
    if (!canViewDocument(request.actor, doc)) {
      reply.code(403).send({ error: "Forbidden" });
      return;
    }
    const url = await getSignedReadUrl("offeringDocuments", doc.filePath);
    reply.send({ url });
  });

  // Two-step upload: caller asks for a signed upload URL, PUTs the file to
  // GCS directly (never through this API), then confirms with the metadata
  // POST below to create the DB row. Mirrors how the frontend already
  // worked against Supabase Storage's signed-upload-url pattern.
  fastify.post("/documents/upload-url", async (request, reply) => {
    const body = z.object({ fileName: z.string(), contentType: z.string() }).parse(request.body);
    assertCanManageDocuments(request.actor); // admin-only, matches "Users can upload documents" being effectively admin-driven for offering docs in practice
    const path = userScopedPath(request.actor.uid, body.fileName);
    const url = await getSignedUploadUrl("offeringDocuments", path, body.contentType);
    reply.send({ url, filePath: path });
  });

  fastify.post("/documents", async (request, reply) => {
    const body = z
      .object({
        title: z.string(),
        description: z.string().optional(),
        filePath: z.string(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
        documentType: z.enum([
          "offering_document",
          "legal_agreement",
          "financial_report",
          "tax_document",
          "update",
        ]),
        offeringId: z.string().uuid().optional(),
        userId: z.string().optional(),
        isPublic: z.boolean().optional(),
      })
      .parse(request.body);

    assertCanUploadDocument(request.actor, request.actor.uid);
    const [doc] = await db
      .insert(documents)
      .values({ ...body, uploadedBy: request.actor.uid })
      .returning();
    reply.code(201).send(doc);
  });

  // --- offering_documents (investment memoranda etc, gated to verified investors) --
  fastify.post<{ Params: { id: string } }>(
    "/offerings/:id/documents/upload-url",
    async (request, reply) => {
      assertCanManageOfferingDocuments(request.actor);
      const body = z.object({ fileName: z.string(), contentType: z.string() }).parse(request.body);
      const filePath = `${request.params.id}/${Date.now()}_${body.fileName}`;
      const url = await getSignedUploadUrl("offeringDocuments", filePath, body.contentType);
      reply.send({ url, filePath });
    },
  );

  fastify.get<{ Params: { id: string } }>(
    "/offerings/:id/documents",
    async (request, reply) => {
      const offering = await db.query.investmentOfferings.findFirst({
        where: eq(investmentOfferings.id, request.params.id),
      });
      if (!offering) {
        reply.code(404).send({ error: "Not found" });
        return;
      }
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, request.actor.uid),
      });
      if (
        !canViewOfferingDocument(request.actor, offering.status ?? "draft", {
          kycVerified: profile?.kycVerified ?? false,
          identityVerified: profile?.identityVerified ?? false,
          verificationStatus: profile?.verificationStatus ?? null,
        })
      ) {
        reply.code(403).send({ error: "Forbidden — full verification required" });
        return;
      }
      const docs = await db.query.offeringDocuments.findMany({
        where: eq(offeringDocuments.offeringId, request.params.id),
      });
      reply.send(docs);
    },
  );

  fastify.post<{ Params: { id: string } }>(
    "/offerings/:id/documents",
    async (request, reply) => {
      assertCanManageOfferingDocuments(request.actor);
      const body = z
        .object({
          documentCategory: z.enum([
            "investment_memorandum",
            "legal_structure",
            "due_diligence",
            "financial_model",
            "other",
          ]),
          title: z.string(),
          description: z.string().optional(),
          filePath: z.string(),
          fileName: z.string(),
          fileSize: z.number().optional(),
          mimeType: z.string().optional(),
          isRequired: z.boolean().optional(),
        })
        .parse(request.body);

      const [doc] = await db
        .insert(offeringDocuments)
        .values({ ...body, offeringId: request.params.id, uploadedBy: request.actor.uid })
        .returning();
      reply.code(201).send(doc);
    },
  );
};

export default documentsRoutes;
