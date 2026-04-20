const MAX_BYTES = 10 * 1024 * 1024;

export interface UploadResult {
  objectPath: string;
}

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

  const metaRes = await fetch("/api/storage/uploads/request-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Donor-Id": String(donorId),
    },
    body: JSON.stringify({
      name: file.name,
      size: file.size,
      contentType: file.type,
    }),
  });

  if (!metaRes.ok) {
    const data = await metaRes.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to start upload.");
  }

  const { uploadURL, objectPath } = (await metaRes.json()) as {
    uploadURL: string;
    objectPath: string;
  };

  const putRes = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!putRes.ok) {
    throw new Error("Upload to storage failed.");
  }

  return { objectPath };
}

/**
 * Resolve a stored proof_document_url to a renderable src.
 * - `/objects/...` → served via `/api/storage/objects/...`
 * - data:/http(s): URLs (legacy base64 or external) → returned as-is
 */
export function resolveProofUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("/objects/")) return `/api/storage${value}`;
  return value;
}
