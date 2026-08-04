# equity-nexus frontend

React 18 + Vite + shadcn/ui. Part of the GCP-native rebuild (see
`../backend/README.md` for the API this talks to).

## What's migrated (Phase 4, this pass)

- **Auth** (`src/contexts/AuthContext.tsx`) — fully off Supabase Auth, onto
  Firebase/Identity Platform (`src/lib/firebase.ts`). This is the
  security-critical fix: `roles` now comes exclusively from the backend's
  `/me` endpoint (a real server-side query), never from Firebase token
  claims or any client-writable field. The original app additionally
  trusted `session.user.user_metadata.role`, which any authenticated user
  could set on themselves via `supabase.auth.updateUser(...)` — that trust
  path doesn't exist anymore.
- **API client** (`src/lib/api-client.ts`) — fetch wrapper that attaches
  the Firebase ID token and talks to the new backend.
- **`usePermissions.ts`, `AuthorizedRoute.tsx`, `PermissionGate.tsx`** —
  updated for the new `useAuth()` shape (dropped the unused
  `hasPermission`/permission-string path, which was also metadata-sourced).
- **`useUserProfile.ts`, `useInvestmentOfferings.ts`** — migrated to the
  new API. `useInvestmentOfferings.ts` maps the API's camelCase JSON to the
  snake_case shape `types/investment.ts` already defines, specifically so
  the many components still consuming that type don't need to change in
  this pass — see the comment at the top of that hook.
- Dead code removed: `src/services/authService.ts` (an unused REST/JWT
  client — never actually imported by `AuthContext`, which always talked
  to Supabase directly).
- `.env` hygiene: `frontend/.env` was previously committed with a real
  Supabase URL and anon key; untracked going forward (history not
  rewritten). `.env.example` documents the new Firebase config vars.

## What's NOT migrated yet

Everything else still calls `supabase.from(...)` / `supabase.storage`
directly: `useDocuments.ts`, `useTransactions.ts`,
`useVerificationStatus.ts`, `DocumentUploader.tsx`,
`InvestmentProcessModal.tsx`, `CreateOfferingForm.tsx`,
`AdminScreeningModal.tsx`, `AdminDocuments.tsx`, `OfferingsManagement.tsx`
(partially — offering fetching now goes through
`useInvestmentOfferings`, but admin actions like create/update/delete are
still direct Supabase calls), `UserManagement.tsx`, `AdminDashboard.tsx`.

**Important:** because Auth is now Firebase-only, none of these
Supabase-direct code paths can actually work anymore — there's no Supabase
session for their RLS policies to authorize against. This isn't a
"gracefully degrades" situation; a page that hits one of these hooks will
fail at runtime until it's migrated. The app is not end-to-end functional
until this list is done. Same pattern as `offerings.ts` on the backend and
the two migrated hooks here — read one of those as the template.

Two backend gaps to fill first, since the frontend work depends on them:
- No `POST`/`DELETE` route for `offering_media` yet (only `GET`) —
  `CreateOfferingForm.tsx`'s media upload flow needs it.
- No aggregate "investor count per offering" endpoint — the old
  `investor_count` field is dropped from `useInvestmentOfferings.ts` for
  now rather than faked.

## Local development

```bash
npm install
cp .env.example .env   # fill in VITE_FIREBASE_API_KEY (see .env.example for how to fetch it)
npm run dev
```

Requires the backend running locally too (see `../backend/README.md`) —
`VITE_API_BASE_URL` defaults to `http://localhost:8080`.

Verified: `npm install`, `tsc -b` (full project, both this package and the
Vite Node config), and `vite build` all pass clean as of this commit.
