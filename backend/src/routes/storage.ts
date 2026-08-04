import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { profiles } from "../db/schema.js";
import { isAdmin } from "../authz/policies.js";
import { getSignedReadUrl } from "../storage/signed-urls.js";

// Generic path-based signed-URL endpoint, for callers that only have a raw
// storage path (not a document row's ID) — e.g. an admin reviewing a
// verification document via a path already embedded in another payload.
// Authorization here mirrors the original app's STORAGE-level RLS policies
// specifically (distinct from the table-row policies in authz/policies.ts,
// and simpler — the storage layer never checked offering-active status,
// only bucket + path pattern):
//   - verification-documents: `auth.uid()::text = (storage.foldername(name))[1]`
//     i.e. the path's first segment must be the caller's own uid, or admin.
//   - offering-documents: admin, or a fully verified investor
//     (kyc_verified && identity_verified && verification_status='approved') —
//     see migration 20251015140915, "Verified investors can view offering documents".
const storageRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/storage/signed-url", async (request, reply) => {
    const body = z
      .object({
        bucket: z.enum(["verificationDocuments", "offeringDocuments"]),
        filePath: z.string(),
      })
      .parse(request.body);

    if (body.bucket === "verificationDocuments") {
      const ownsPath = body.filePath.startsWith(`${request.actor.uid}/`);
      if (!ownsPath && !isAdmin(request.actor)) {
        reply.code(403).send({ error: "Forbidden" });
        return;
      }
    } else {
      if (!isAdmin(request.actor)) {
        const profile = await db.query.profiles.findFirst({
          where: eq(profiles.id, request.actor.uid),
        });
        const fullyVerified =
          Boolean(profile?.kycVerified) &&
          Boolean(profile?.identityVerified) &&
          profile?.verificationStatus === "approved";
        if (!fullyVerified) {
          reply.code(403).send({ error: "Forbidden — full verification required" });
          return;
        }
      }
    }

    const url = await getSignedReadUrl(body.bucket, body.filePath);
    reply.send({ url });
  });
};

export default storageRoutes;
