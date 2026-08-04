// Identity Platform issues Firebase-Auth-compatible ID tokens, so the
// standard firebase-admin SDK verifies them correctly against our project
// even though we're not using "Firebase" as a product elsewhere. In Cloud
// Run this picks up Application Default Credentials from the attached
// service account automatically; locally it uses your
// `gcloud auth application-default login` credentials.

import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

const PROJECT_ID = process.env.GCP_PROJECT_ID ?? "equity-nexus";

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
    projectId: PROJECT_ID,
  });
}

const auth = getAuth();

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: 401 | 403 = 401,
  ) {
    super(message);
  }
}

export async function verifyIdToken(authorizationHeader: string | undefined): Promise<DecodedIdToken> {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AuthError("Missing bearer token");
  }
  const token = authorizationHeader.slice("Bearer ".length);
  try {
    return await auth.verifyIdToken(token);
  } catch {
    throw new AuthError("Invalid or expired token");
  }
}
