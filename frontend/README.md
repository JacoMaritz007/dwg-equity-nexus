# equity-nexus frontend

React 18 + Vite + shadcn/ui. Part of the GCP-native rebuild (see
`../backend/README.md` for the API this talks to).

## Migration off Supabase: complete

Every `supabase.from(...)` / `supabase.storage` / `supabase.auth` call in
the frontend has been replaced. `@supabase/supabase-js` is no longer a
dependency, and `src/integrations/supabase/` is gone.

- **Auth** (`src/contexts/AuthContext.tsx`) — Firebase/Identity Platform
  (`src/lib/firebase.ts`) instead of Supabase Auth. The security-relevant
  part: `roles` comes exclusively from the backend's `/me` endpoint (a real
  server-side query), never from Firebase token claims or any
  client-writable field. The original app additionally trusted
  `session.user.user_metadata.role`, which any authenticated user could set
  on themselves via `supabase.auth.updateUser(...)` — that trust path
  doesn't exist anymore.
- **API client** (`src/lib/api-client.ts`) — fetch wrapper that attaches
  the Firebase ID token and talks to the backend. `uploadFile()` handles
  the two-step signed-URL upload pattern used throughout.
- All hooks (`useUserProfile`, `useInvestmentOfferings`, `useDocuments`,
  `useTransactions`, `useVerificationStatus`) and all components that used
  to call Supabase directly (`DocumentUploader`, `InvestmentProcessModal`,
  `AdminScreeningModal`, `CreateOfferingForm`, `AdminDocuments`,
  `UserManagement`, `DashboardPage`, `OfferingDetailsPage`,
  `offeringHelpers`) now go through the API client.
- Dead code removed: `src/services/authService.ts` (unused REST/JWT
  client, never actually wired into `AuthContext`).
- `.env` hygiene: `frontend/.env` was previously committed with a real
  Supabase URL and anon key; untracked going forward (history not
  rewritten). `.env.example` documents the Firebase config vars.

### Design decisions worth knowing about

- **`types/investment.ts` stays snake_case**, even though the backend's
  native JSON is camelCase (idiomatic Drizzle output). Each hook maps at
  its own boundary — see the comment at the top of that file. This was a
  deliberate correction mid-migration: renaming the shared type to
  camelCase directly rippled into every consumer file at once, including
  ones not being touched in that pass. Mapping at the hook boundary kept
  each file's migration independently reviewable and typecheckable.
- **`file_path` stays a raw storage path** everywhere except offering
  media. Every document-related component (`DocumentCard`,
  `VerificationDocumentCard`, `DocumentReviewModal`) already had an
  established on-demand signing pattern — calling `getSignedUrl(path,
  bucket)` at preview/download time, not eagerly for a whole list — so
  that pattern was preserved rather than replaced with eager signing.
  Offering media is the deliberate exception: it had no prior async
  pattern (was a public bucket, rendered synchronously), so the backend
  pre-signs it server-side in the list/detail response instead — see
  `withSignedMediaUrls` in `backend/src/routes/offerings.ts`.
- **Two functional bugs found and fixed while porting**, not just carried
  forward: admin document-review approval and the KYC toggle in
  `UserManagement.tsx` both called `supabase.from('profiles').update(...)`
  on someone else's row, which the original RLS policy (`auth.uid() =
  id`, no admin exception, ever) silently rejected in production. No user
  could actually complete verification through the admin flow. Fixed by
  moving both into admin-authorized backend actions — see
  `backend/src/routes/verification.ts` and `admin.ts`.

## Local development

```bash
npm install
cp .env.example .env   # fill in VITE_FIREBASE_API_KEY (see .env.example for how to fetch it)
npm run dev
```

Requires the backend running locally too (see `../backend/README.md`) —
`VITE_API_BASE_URL` defaults to `http://localhost:8080`.

Verified: `npm install`, `tsc -b` (full project, both this package and the
Vite Node config), and `vite build` all pass clean with zero remaining
`supabase` imports anywhere under `src/`.

## What's genuinely NOT done (rebuild as a whole, not just this package)

- Google Sign-In as an Identity Platform provider (needs the real
  production domain for the OAuth redirect URI).
- Automated tests.
- Rate limiting on the backend.
- Deployed anywhere — this has all been built and verified locally
  (`tsc`, `vite build`); Cloud Run deployment hasn't happened yet.
- Production data migration (moot for this project — confirm with
  whoever owns the live Supabase project whether there's real investor
  data to migrate before cutover).
