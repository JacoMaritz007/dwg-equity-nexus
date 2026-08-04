// Run with `npm run db:migrate`. Applies whatever's in ./drizzle (generated
// by `npm run db:generate` from schema.ts) to the connected database.
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, closeDb } from "./client.js";

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrations applied.");
await closeDb();
