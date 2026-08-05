// One-off CLI to check or grant the admin role, for bootstrapping the very
// first admin — /user-roles (the only endpoint that can grant it) is itself
// admin-gated, so there's no way to become the first admin through the app.
// Usage:
//   npx tsx --env-file=.env scripts/manage-admin.ts <email>
//   npx tsx --env-file=.env scripts/manage-admin.ts <email> --grant-admin

import { eq } from "drizzle-orm";
import { db, closeDb } from "../src/db/client.js";
import { profiles, userRoles } from "../src/db/schema.js";

const email = process.argv[2];
const grant = process.argv.includes("--grant-admin");

if (!email) {
  console.error("Usage: npx tsx --env-file=.env scripts/manage-admin.ts <email> [--grant-admin]");
  process.exit(1);
}

const profile = await db.query.profiles.findFirst({ where: eq(profiles.email, email) });

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
