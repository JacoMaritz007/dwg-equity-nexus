import type { FastifyPluginAsync } from "fastify";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import {
  investmentOfferings,
  offeringMilestones,
  offeringMedia,
  userInvestments,
} from "../db/schema.js";
import { getSignedReadUrl, getSignedUploadUrl } from "../storage/signed-urls.js";
import {
  canViewOffering,
  canViewOfferingSubresource,
  assertCanManageOfferings,
  assertCanManageOfferingSubresource,
} from "../authz/policies.js";

// Covers both the original base fields and the "enhanced deal creation"
// fields added in migration 6d979310 (lister_name, targeted_irr, coc_year_1..7,
// platform fees/flags, etc.) — see CreateOfferingForm.tsx on the frontend,
// which sends all of these.
const createOfferingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  targetAmount: z.string(),
  minimumInvestment: z.string(),
  maximumInvestment: z.string().optional(),
  investmentType: z.string().min(1),
  location: z.string().optional(),
  expectedReturn: z.string().optional(),
  investmentTerm: z.string().optional(),
  closingDate: z.string().optional(),

  listerName: z.string().optional(),
  productName: z.string().optional(),
  address: z.string().optional(),
  targetedIrr: z.string().optional(),
  targetedAvgCoc: z.string().optional(),
  distributionOverview: z.string().optional(),
  taxFeeAdjustedIrr: z.string().optional(),
  taxFeeAdjustedCoc: z.string().optional(),
  taxAdjustedEm: z.string().optional(),
  taxAdjustedCg: z.string().optional(),
  cocYear1: z.string().optional(),
  cocYear2: z.string().optional(),
  cocYear3: z.string().optional(),
  cocYear4: z.string().optional(),
  cocYear5: z.string().optional(),
  cocYear6: z.string().optional(),
  cocYear7: z.string().optional(),
  baseFee: z.string().optional(),
  structureFee: z.string().optional(),
  marketingSalesFee: z.string().optional(),
  successFee: z.string().optional(),
  capitalGainSuccessFee: z.string().optional(),
  disregardUserLevels: z.boolean().optional(),
  publishedWealthMigrate: z.boolean().optional(),
  publishedPrivateWealth: z.boolean().optional(),
  otherPublished: z.boolean().optional(),
  enableSourceWealthScreen: z.boolean().optional(),

  status: z.enum(["draft", "active", "closed", "cancelled"]).optional(),
});

const MEDIA_TYPES = [
  "lister_logo",
  "sponsor_logo",
  "dd_provider_logo",
  "featured_image",
  "gallery_image",
  "video_link",
] as const;

function closingDateAsDate(closingDate: string | undefined): Date | undefined {
  return closingDate ? new Date(closingDate) : undefined;
}

// The 'offering-media' bucket is private (see backend/README.md — the org's
// Domain Restricted Sharing policy blocks public buckets), so unlike the
// original Supabase setup there's no synchronous public URL to hand the
// client. Instead, media rows get their `url` field filled with a signed
// read URL server-side before going out — video_link media keeps its raw
// URL as-is (no filePath to sign). Reuses the existing `url` column rather
// than adding a new field, so the frontend's existing `media.url` /
// `media.file_path` read pattern (see offeringHelpers.ts) needs no changes
// beyond dropping its own now-broken supabase.storage.getPublicUrl call.
async function withSignedMediaUrls<T extends { mediaType: string; filePath: string | null; url: string | null }>(
  media: T[],
): Promise<T[]> {
  return Promise.all(
    media.map(async (m) => {
      if (m.mediaType === "video_link" || !m.filePath) return m;
      const url = await getSignedReadUrl("offeringMedia", m.filePath).catch(() => m.url);
      return { ...m, url };
    }),
  );
}

const offeringsRoutes: FastifyPluginAsync = async (fastify) => {
  // "Authenticated users can view active offerings" / admin sees all,
  // including drafts. Auth itself is already enforced by the global
  // onRequest hook, so any request that got this far is authenticated.
  //
  // Embeds media (with signed URLs) on every offering, matching the
  // original Supabase app's single joined query — offering cards need the
  // featured image without a second round-trip per card.
  fastify.get("/offerings", async (request, reply) => {
    const all = await db.query.investmentOfferings.findMany();
    const visible = all.filter((o) => canViewOffering(request.actor, o.status ?? "draft"));

    const withMedia = await Promise.all(
      visible.map(async (o) => {
        const media = await db.query.offeringMedia.findMany({
          where: eq(offeringMedia.offeringId, o.id),
        });
        return { ...o, offeringMedia: await withSignedMediaUrls(media) };
      }),
    );

    reply.send(withMedia);
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

  // Count of investors in an offering. In the original Supabase app this
  // was computed client-side via a `count`-only query against
  // user_investments — but RLS on that table restricts SELECT to the
  // caller's own rows (or admin), so for any non-admin user that query
  // actually returned 0 or 1, not the true total. It only ever worked
  // correctly for admins. This is a real (small) aggregate endpoint instead,
  // visible to anyone who can view the offering itself — it leaks a count,
  // not individual investor identity, which matches the feature's actual
  // intent (social-proof on the offering card).
  fastify.get<{ Params: { id: string } }>(
    "/offerings/:id/investor-count",
    async (request, reply) => {
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
      const investments = await db.query.userInvestments.findMany({
        where: eq(userInvestments.offeringId, request.params.id),
        columns: { userId: true },
      });
      const count = new Set(investments.map((i) => i.userId)).size;
      reply.send({ count });
    },
  );

  fastify.post("/offerings", async (request, reply) => {
    assertCanManageOfferings(request.actor);
    const body = createOfferingSchema.parse(request.body);

    const [offering] = await db
      .insert(investmentOfferings)
      .values({ ...body, closingDate: closingDateAsDate(body.closingDate), createdBy: request.actor.uid })
      .returning();

    reply.code(201).send(offering);
  });

  fastify.patch<{ Params: { id: string } }>("/offerings/:id", async (request, reply) => {
    assertCanManageOfferings(request.actor);
    const body = createOfferingSchema.partial().parse(request.body);

    const [updated] = await db
      .update(investmentOfferings)
      .set({ ...body, closingDate: closingDateAsDate(body.closingDate), updatedAt: new Date() })
      .where(eq(investmentOfferings.id, request.params.id))
      .returning();

    if (!updated) {
      reply.code(404).send({ error: "Not found" });
      return;
    }
    reply.send(updated);
  });

  // --- milestones -------------------------------------------------------
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

  // Bulk-replace, matching the frontend's edit flow (delete all existing
  // milestones for this offering, then re-insert the current set).
  fastify.put<{ Params: { id: string } }>(
    "/offerings/:id/milestones",
    async (request, reply) => {
      assertCanManageOfferingSubresource(request.actor);
      const body = z
        .array(
          z.object({ description: z.string(), milestoneDate: z.string(), milestoneOrder: z.number() }),
        )
        .parse(request.body);

      await db.delete(offeringMilestones).where(eq(offeringMilestones.offeringId, request.params.id));

      const inserted = body.length
        ? await db
            .insert(offeringMilestones)
            .values(body.map((m) => ({ ...m, offeringId: request.params.id })))
            .returning()
        : [];

      reply.send(inserted);
    },
  );

  // --- media --------------------------------------------------------------
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
    reply.send(await withSignedMediaUrls(media));
  });

  fastify.post<{ Params: { id: string } }>(
    "/offerings/:id/media/upload-url",
    async (request, reply) => {
      assertCanManageOfferingSubresource(request.actor);
      const body = z.object({ fileName: z.string(), contentType: z.string() }).parse(request.body);
      const filePath = `${request.params.id}/${Date.now()}_${body.fileName}`;
      const url = await getSignedUploadUrl("offeringMedia", filePath, body.contentType);
      reply.send({ url, filePath });
    },
  );

  fastify.post<{ Params: { id: string } }>("/offerings/:id/media", async (request, reply) => {
    assertCanManageOfferingSubresource(request.actor);
    const body = z
      .object({
        mediaType: z.enum(MEDIA_TYPES),
        filePath: z.string().optional(),
        fileName: z.string().optional(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
        url: z.string().optional(), // for video_link
        displayOrder: z.number().optional(),
        // When set, replaces any existing media of the same mediaType for
        // this offering first — matches the original "replace logo on
        // re-upload" behavior in CreateOfferingForm's edit mode.
        replaceExisting: z.boolean().optional(),
      })
      .parse(request.body);

    if (body.replaceExisting) {
      await db
        .delete(offeringMedia)
        .where(
          and(
            eq(offeringMedia.offeringId, request.params.id),
            eq(offeringMedia.mediaType, body.mediaType),
          ),
        );
    }

    const { replaceExisting, ...values } = body;
    const [media] = await db
      .insert(offeringMedia)
      .values({ ...values, offeringId: request.params.id })
      .returning();

    reply.code(201).send(media);
  });

  fastify.delete<{ Params: { id: string; mediaId: string } }>(
    "/offerings/:id/media/:mediaId",
    async (request, reply) => {
      assertCanManageOfferingSubresource(request.actor);
      await db
        .delete(offeringMedia)
        .where(
          and(eq(offeringMedia.id, request.params.mediaId), eq(offeringMedia.offeringId, request.params.id)),
        );
      reply.code(204).send();
    },
  );
};

export default offeringsRoutes;
