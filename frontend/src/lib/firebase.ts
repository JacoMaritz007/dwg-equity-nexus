// Identity Platform is accessed via the standard Firebase client SDK — it
// issues Firebase-Auth-compatible tokens, which the backend verifies with
// firebase-admin (see backend/src/auth/verify-token.ts). This replaces
// src/integrations/supabase/client.ts.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
