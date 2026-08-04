# DWG Capital Partners Investment Platform

An equity investment platform: investors browse offerings, complete KYC/
accreditation verification, and invest; admins manage offerings, review
verification documents, and run PEP/sanctions screening.

Rebuilt on Google Cloud — no Supabase dependency anywhere in the active
codebase. See `frontend/README.md` and `backend/README.md` for the details
of each half; this file is just the map.

## Structure

```
frontend/    React 18 + Vite + shadcn/ui SPA
backend/     Fastify + TypeScript + Drizzle API (Cloud Run)
```

The original Supabase migrations and Edge Function (this app's previous
backend) are no longer in the repo — see git history prior to the
`rebuild/gcp-native` branch if you need to reference them.

## Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind, shadcn/ui, TanStack Query
- **Auth**: Google Identity Platform (Firebase Auth SDK on the client,
  `firebase-admin` token verification on the backend)
- **Backend**: Fastify, Drizzle ORM, deployed on Cloud Run
- **Database**: Cloud SQL for PostgreSQL
- **File storage**: Cloud Storage (3 private buckets — verification
  documents, offering documents, offering media — all access via signed
  URLs, backend-issued)
- **Secrets**: Secret Manager

## Why the rebuild

The original app ran on Supabase (Postgres + RLS + Storage + Auth). The
RLS-based authorization design was solid, but a handful of specific
policies were incomplete in ways that silently broke real functionality
(the admin document-review and KYC-toggle actions couldn't actually write
to other users' profiles — see `backend/README.md` for the specifics) or
left a defense-in-depth gap (client-writable `user_metadata.role`). Rather
than patch those individually, the whole stack moved to GCP-native
services with an explicit backend API and authorization layer instead of
client-direct-to-database access.

## Getting started

See `backend/README.md` and `frontend/README.md` for setup — both need
`gcloud auth application-default login` run locally first.
