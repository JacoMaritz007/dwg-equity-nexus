// Connects to Cloud SQL via the official connector library, which
// establishes mTLS-encrypted connections authorized by IAM — no manual SSL
// certs to manage, and works whether the instance has a public or private
// IP. Credentials come from Application Default Credentials: the Cloud
// Run service's attached service account in production, `gcloud auth
// application-default login` locally.

import { Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

const INSTANCE_CONNECTION_NAME = process.env.INSTANCE_CONNECTION_NAME;
if (!INSTANCE_CONNECTION_NAME) {
  throw new Error(
    "INSTANCE_CONNECTION_NAME env var is required, e.g. equity-nexus:africa-south1:equity-nexus-db",
  );
}

const DB_USER = process.env.DB_USER ?? "app_user";
const DB_NAME = process.env.DB_NAME ?? "equity_nexus";
const DB_PASSWORD = process.env.DB_PASSWORD;
if (!DB_PASSWORD) {
  throw new Error("DB_PASSWORD env var is required (read from Secret Manager at deploy time)");
}

const connector = new Connector();
const clientOpts = await connector.getOptions({
  instanceConnectionName: INSTANCE_CONNECTION_NAME,
  ipType: IpAddressTypes.PUBLIC,
});

export const pool = new pg.Pool({
  ...clientOpts,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  max: 5,
});

export const db = drizzle(pool, { schema });

export async function closeDb() {
  await pool.end();
  connector.close();
}
