# equity-nexus API

Fastify + TypeScript + Drizzle backend for the GCP-native rebuild. Replaces
Supabase (Postgres+RLS+Storage+Auth) with Cloud SQL, Cloud Storage, and
Identity Platform, fronted by this API — the client no longer talks to the
database directly, so there's no RLS layer; the equivalent rules live in
[`src/authz/policies.ts`](./src/authz/policies.ts), enforced on every route.

## What's here (Phase 2/3 scaffold)

- **Schema** (`src/db/schema.ts`) — full port of all 14 tables from the
  original 13 Supabase migrations (in `/legacy-supabase/migrations`), with
  two intentional fixes documented at the top of that file.
- **Auth** (`src/auth/verify-token.ts`) — verifies Identity Platform ID
  tokens via `firebase-admin`.
- **Authorization** (`src/authz/policies.ts`) — every original RLS policy,
  ported to a plain function, annotated with which policy it replaces.
- **Routes implemented so far**: `/me`, `/profiles/*` (incl. the
  post-signup bootstrap that replaces the old `handle_new_user()` trigger),
  `/offerings/*` (list/get/create/update, milestones, media).

## What's NOT here yet (rest of Phase 2)

Routes for: `user_investments`, `transactions`, `documents`,
`investment_updates`, `capital_calls`, `offering_documents`,
`verification_documents` + `verification_history`,
`compliance_screening_documents` (including the fixed screening-approval
flow described in schema.ts), and signed-URL generation for the three
Cloud Storage buckets. Same pattern as `offerings.ts` — straightforward
to add following that template.

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

```bash
gcloud run deploy equity-nexus-api \
  --source . \
  --region=africa-south1 \
  --project=equity-nexus \
  --set-env-vars=GCP_PROJECT_ID=equity-nexus,INSTANCE_CONNECTION_NAME=equity-nexus:africa-south1:equity-nexus-db,DB_USER=app_user,DB_NAME=equity_nexus \
  --set-secrets=DB_PASSWORD=db-app-user-password:latest \
  --allow-unauthenticated
```

(`--allow-unauthenticated` is correct here — this API does its own auth via
Identity Platform tokens per-request, it's not meant to sit behind Cloud
Run's IAM gate.)
