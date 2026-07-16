import { createHash } from "node:crypto";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_FILE_SIZE = 8 * 1024 * 1024;

export type UploadedGalleryImage = {
  url: string;
  cloudinaryId: string | null;
  width: number | null;
  height: number | null;
  provider: "cloudinary" | "development-data-url";
};

export async function uploadVillaGalleryImage(
  file: File,
  villaSlug: string,
): Promise<UploadedGalleryImage> {
  validateImage(file);

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim();

  if (cloudName && uploadPreset) {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", uploadPreset);
    form.append("folder", `villaku/villas/${safeFolder(villaSlug)}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
      { method: "POST", body: form },
    );
    const payload = (await response.json().catch(() => ({}))) as {
      secure_url?: string;
      public_id?: string;
      width?: number;
      height?: number;
      error?: { message?: string };
    };

    if (!response.ok || !payload.secure_url || !payload.public_id) {
      throw new Error(payload.error?.message || "Cloudinary menolak unggahan galeri.");
    }

    return {
      url: payload.secure_url,
      cloudinaryId: payload.public_id,
      width: payload.width ?? null,
      height: payload.height ?? null,
      provider: "cloudinary",
    };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Cloudinary belum dikonfigurasi untuk environment production.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  return {
    url: `data:${file.type};base64,${bytes.toString("base64")}`,
    cloudinaryId: `development/${safeFolder(villaSlug)}/${digest}`,
    width: null,
    height: null,
    provider: "development-data-url",
  };
}

function validateImage(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Format foto harus JPG, PNG, WebP, atau AVIF.");
  }
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran foto harus lebih dari 0 dan maksimal 8 MB.");
  }
}

function safeFolder(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-|-$/g, "") || "uncategorized"
  );
}
