import { supabase, VERIFICATION_BUCKET } from "./supabase";

const MAX_BYTES = 10 * 1024 * 1024;

export interface UploadResult {
  /** Public URL stored in `donations_verification.proof_document_url`. */
  publicUrl: string;
}

/**
 * Upload a donor verification image directly to the public Supabase Storage
 * bucket `verification-docs`. Enforces image-only and 10 MB cap on the client.
 *
 * @param file     image file selected by the donor
 * @param donorId  donor id (used as a path prefix for traceability)
 */
export async function uploadVerificationImage(
  file: File,
  donorId: number,
): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("File exceeds the 10 MB limit.");
  }
  if (!donorId || donorId <= 0) {
    throw new Error("You must be a registered donor to upload proof.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "jpg";
  const objectPath = `${donorId}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

  const { error } = await supabase.storage
    .from(VERIFICATION_BUCKET)
    .upload(objectPath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || "Upload to storage failed.");
  }

  const { data } = supabase.storage.from(VERIFICATION_BUCKET).getPublicUrl(objectPath);
  return { publicUrl: data.publicUrl };
}

/**
 * Resolve a stored proof_document_url to a renderable src.
 * Supabase URLs are full https URLs and are returned as-is.
 * Legacy object paths (`/objects/...`) keep working through the API server.
 */
export function resolveProofUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("/objects/")) return `/api/storage${value}`;
  return value;
}
