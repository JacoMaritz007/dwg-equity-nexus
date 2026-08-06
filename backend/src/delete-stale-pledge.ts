// Temporary one-off cleanup — not part of the app, delete after use.
// Removes the legacy status='pending' user_investments row (from before the
// pledge-wizard rewrite) that's blocking a fresh pledge attempt on the same
// (user, offering) pair.
import { db, closeDb } from "./db/client.js";
import { userInvestments } from "./db/schema.js";
import { eq } from "drizzle-orm";

const id = "90f50e65-e629-4376-abe4-88553547e391";

const deleted = await db.delete(userInvestments).where(eq(userInvestments.id, id)).returning();
console.log(JSON.stringify(deleted, null, 2));
await closeDb();
