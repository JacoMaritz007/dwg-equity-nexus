// Temporary one-off diagnostic — not part of the app, delete after use.
import { db, closeDb } from "./db/client.js";
import { userInvestments } from "./db/schema.js";
import { eq, and } from "drizzle-orm";

const userId = "48nMs8gIeRaFNFXO0kHL06greD23";
const offeringId = "c78e2fe2-4ea6-4023-a50c-09fcebd055ac";

const rows = await db
  .select()
  .from(userInvestments)
  .where(and(eq(userInvestments.userId, userId), eq(userInvestments.offeringId, offeringId)));

console.log(JSON.stringify(rows, null, 2));
await closeDb();
