// One-off CLI to check or grant the admin role, for bootstrapping the very
// first admin — /user-roles (the only endpoint that can grant it) is itself
// admin-gated, so there's no way to become the first admin through the app.
// Also repairs orphaned accounts: a Firebase Auth user with no matching
// `profiles` row, e.g. because /profiles/bootstrap never completed after
// signup (network blip, CORS misconfig at the time, etc.) — /me tolerates
// this (returns profile: null) so it doesn't crash, but nothing in the app
// ever calls bootstrap again, leaving the account permanently stuck.
// Usage:
//   npx tsx --env-file=.env scripts/manage-admin.ts <email>
//   npx tsx --env-file=.env scripts/manage-admin.ts <email> --grant-admin
//   npx tsx --env-file=.env scripts/manage-admin.ts <email> --grant-admin \
//     --repair-uid=<firebase-uid> --first-name=Jaco --last-name=Maritz

import { eq } from "drizzle-orm";
import { db, closeDb } from "../src/db/client.js";
import { profiles, userRoles } from "../src/db/schema.js";

function flag(name: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg?.slice(name.length + 3);
}

const rawEmail = process.argv[2];
const grant = process.argv.includes("--grant-admin");
const repairUid = flag("repair-uid");

if (!rawEmail) {
  console.error("Usage: npx tsx --env-file=.env scripts/manage-admin.ts <email> [--grant-admin]");
  process.exit(1);
}
// Match the backend's normalization (profiles.ts's bootstrap schema) —
// stored emails are lowercase going forward, so search with the same case.
const email = rawEmail.toLowerCase();

let profile = await db.query.profiles.findFirst({ where: eq(profiles.email, email) });

// Email match can miss a row that's actually there (case/whitespace
// differences from whatever was typed at signup time) — the uid is the
// real identity, so check it directly before assuming nothing exists.
if (!profile && repairUid) {
  const byUid = await db.query.profiles.findFirst({ where: eq(profiles.id, repairUid) });
  if (byUid) {
    profile = byUid;
    console.log(`Found existing profile by uid (email on file: ${byUid.email}) — not creating a duplicate.`);
  } else {
    const firstName = flag("first-name");
    const lastName = flag("last-name");
    if (!firstName || !lastName) {
      console.error("--repair-uid requires --first-name and --last-name too.");
      await closeDb();
      process.exit(1);
    }
    [profile] = await db
      .insert(profiles)
      .values({ id: repairUid, firstName, lastName, email })
      .returning();
    await db.insert(userRoles).values({ userId: repairUid, role: "investor" });
    console.log(`Created missing profile for ${email} (uid=${repairUid}).`);
  }
}

if (!profile) {
  console.log(`No profile found for ${email} — that account hasn't registered on the platform yet.`);
  await closeDb();
  process.exit(0);
}

const roles = await db.query.userRoles.findMany({ where: eq(userRoles.userId, profile.id) });
console.log(`Found profile: id=${profile.id} email=${profile.email}`);
console.log(`Current roles: ${roles.map((r) => r.role).join(", ") || "(none)"}`);

if (grant) {
  if (roles.some((r) => r.role === "admin")) {
    console.log("Already has the admin role — nothing to do.");
  } else {
    await db.insert(userRoles).values({ userId: profile.id, role: "admin" });
    console.log(`Granted admin role to ${email}.`);
  }
}

await closeDb();
