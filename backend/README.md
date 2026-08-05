# equity-nexus API

Fastify + TypeScript + Drizzle backend for the GCP-native rebuild. Replaces
Supabase (Postgres+RLS+Storage+Auth) with Cloud SQL, Cloud Storage, and
Identity Platform, fronted by this API — the client no longer talks to the
database directly, so there's no RLS layer; the equivalent rules live in
[`src/authz/policies.ts`](./src/authz/policies.ts), enforced on every route.

## What's here (Phase 2/3, extended during Phase 4)

- **Schema** (`src/db/schema.ts`) — full port of all 14 tables from the
  original 13 Supabase migrations (see git history predating
  `rebuild/gcp-native` for the source SQL — removed from the working tree
  once the port was verified complete), with
  two intentional fixes documented at the top of that file.
- **Auth** (`src/auth/verify-token.ts`) — verifies Identity Platform ID
  tokens via `firebase-admin`.
- **Authorization** (`src/authz/policies.ts`) — every original RLS policy,
  ported to a plain function, annotated with which policy it replaces.
- **Storage** (`src/storage/signed-urls.ts`) — signed read/upload URLs for
  all three Cloud Storage buckets, including `offering-media` (private here,
  unlike the old public Supabase bucket — the GCP org's Domain Restricted
  Sharing policy blocks public IAM bindings on buckets, so this uses the
  same signed-URL model uniformly across all three instead). The frontend
  PUTs directly to the signed URL (`lib/api-client.ts`'s `uploadFile`),
  bypassing this API entirely — that means the bucket itself, not this
  server, needs a CORS policy allowing the frontend's origin(s), or the
  browser blocks the preflight before the request ever reaches Cloud
  Storage. See `gcs-cors.json` in this directory; apply it with
  `gcloud storage buckets update gs://<bucket> --cors-file=gcs-cors.json`
  on all three buckets whenever a new frontend origin comes online.
- **Routes**: every table has a corresponding route, covering everything
  the frontend actually needs (built out incrementally while porting each
  frontend file — see git log for the specific gaps each addition closed).
  `/me`, `/profiles/*` (+ `/profiles` admin list, `/profiles/:id/kyc-status`),
  `/offerings/*` (list/get/create/update, investor-count, milestones incl.
  bulk PUT, media incl. upload-url + delete, capital-calls, updates),
  `/investments/*`, `/transactions/*`, `/documents/*` (generic +
  offering-scoped incl. upload-url, with the verified-investor gate),
  `/verification-documents/*` + `/verification-history` (the review flow
  also flips the matching `profiles.*_verified` flag — see the comment on
  that route for why that moved server-side), `/compliance-screening/*`
  (approval-ordering fix — see schema.ts comment on
  `complianceScreeningDocuments`), `/user-roles` (admin), `/storage/signed-url`
  (generic path-based signing for on-demand preview/download flows).
- Two functional bugs fixed during the port, both from the same root
  cause (the original `profiles` UPDATE RLS policy had no admin
  exception, ever): admin document-review approval and the KYC toggle in
  `UserManagement.tsx` both silently failed to update the target user's
  profile in production. Fixed by moving both into admin-authorized
  backend actions instead of a second client-side update call.

## What's NOT here yet

- Automated tests (unit tests for `authz/policies.ts` against each of the
  14 tables' original RLS policies would be the highest-value first pass).
- Rate limiting / abuse protection on write endpoints.
- The Google Sign-In Identity Platform provider (deferred — needs the real
  production domain for the OAuth redirect URI).

## Local development

```bash
npm install
cp .env.example .env
# fill in DB_PASSWORD:
gcloud secrets versions access latest --secret=db-app-user-password --project=equity-nexus
npm run db:generate   # regenerate SQL from schema.ts after any schema change
npm run db:migrate    # apply to the connected Cloud SQL instance
npm run dev            # tsx watch, http://localhost:8080
```

Requires `gcloud auth application-default login` to have been run locally
(for Cloud SQL Connector + Identity Platform token verification, both use
Application Default Credentials).

## Deploy

Env vars live in `.env.cloudrun.yaml` (not `--set-env-vars` — several values,
like `INSTANCE_CONNECTION_NAME`, contain colons, which collide with gcloud's
comma/colon delimiter syntax once `ALLOWED_ORIGINS` also needs commas).
Update that file's `ALLOWED_ORIGINS` list whenever a new frontend origin
comes online, then:

```bash
gcloud run deploy equity-nexus-api \
  --source . \
  --region=africa-south1 \
  --project=equity-nexus \
  --service-account=equity-nexus-api@equity-nexus.iam.gserviceaccount.com \
  --env-vars-file=.env.cloudrun.yaml \
  --set-secrets=DB_PASSWORD=db-app-user-password:latest \
  --allow-unauthenticated
```

(`--allow-unauthenticated` is correct here — this API does its own auth via
Identity Platform tokens per-request, it's not meant to sit behind Cloud
Run's IAM gate. The project's org-level Domain Restricted Sharing policy
blocks public IAM bindings by default; `equity-nexus` has a project-scoped
override for `iam.allowedPolicyMemberDomains` allowing it, same as the
Cloud Storage buckets.)
