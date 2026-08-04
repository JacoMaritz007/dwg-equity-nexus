// Signed URL generation for all three Cloud Storage buckets. Every bucket
// is private (see PHASE 1 notes: the org's Domain Restricted Sharing policy
// blocks public IAM bindings, so even offering-media — public in the old
// Supabase setup — is served this way instead, uniformly).

import { Storage } from "@google-cloud/storage";

const storage = new Storage();

export const BUCKETS = {
  verificationDocuments: "equity-nexus-verification-documents",
  offeringDocuments: "equity-nexus-offering-documents",
  offeringMedia: "equity-nexus-offering-media",
} as const;

export type BucketKey = keyof typeof BUCKETS;

const READ_TTL_MS = 15 * 60 * 1000; // 15 minutes
const UPLOAD_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function getSignedReadUrl(bucket: BucketKey, filePath: string): Promise<string> {
  const [url] = await storage
    .bucket(BUCKETS[bucket])
    .file(filePath)
    .getSignedUrl({ action: "read", expires: Date.now() + READ_TTL_MS });
  return url;
}

export async function getSignedUploadUrl(
  bucket: BucketKey,
  filePath: string,
  contentType: string,
): Promise<string> {
  const [url] = await storage
    .bucket(BUCKETS[bucket])
    .file(filePath)
    .getSignedUrl({
      action: "write",
      expires: Date.now() + UPLOAD_TTL_MS,
      contentType,
    });
  return url;
}

// Mirrors the old storage RLS policy: `auth.uid()::text = (storage.foldername(name))[1]`
// i.e. the file path's first segment must equal the requesting user's uid.
export function userScopedPath(uid: string, fileName: string): string {
  return `${uid}/${Date.now()}_${fileName}`;
}
