import { z } from "zod";

const imageUrlSchema = z.string().trim().refine(
  (value) => /^https?:\/\//i.test(value) || /^data:image\/(jpeg|png|webp|avif);base64,/i.test(value),
  "URL gambar harus HTTP(S) atau data URL gambar development.",
);

export const adminVillaImageSchema = z.object({
  url: imageUrlSchema,
  cloudinaryId: z.string().trim().max(255).nullable().optional(),
  alt: z.string().trim().max(180).nullable().optional(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isCover: z.boolean().optional(),
});

export const adminVillaSchema = z.object({
  name: z.string().trim().min(4).max(90),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.string().trim().min(2).max(80),
  location: z.string().trim().min(2).max(120),
  address: z.string().trim().min(12).max(500),
  city: z.string().trim().min(2).max(100).default("Bali"),
  province: z.string().trim().min(2).max(100).default("Bali"),
  country: z.string().trim().min(2).max(100).default("Indonesia"),
  shortDescription: z.string().trim().min(20).max(320),
  description: z.string().trim().min(40).max(5000),
  pricePerNight: z.number().int().min(100_000).max(100_000_000),
  weekendPricePerNight: z.number().int().min(100_000).max(100_000_000).nullable().optional(),
  capacity: z.number().int().min(1).max(100),
  bedrooms: z.number().int().min(1).max(50),
  bathrooms: z.number().int().min(1).max(50),
  sizeSqm: z.number().int().min(20).max(100_000).nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "MAINTENANCE"]),
  isFeatured: z.boolean().default(false),
  amenities: z.array(z.string().trim().min(2).max(100)).min(1).max(100),
  images: z.array(adminVillaImageSchema).max(20).default([]),
});

export const adminVillaPatchSchema = adminVillaSchema.partial();

export function normalizeAdminVillaPayload(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const input = raw as Record<string, unknown>;
  const imageUrl = typeof input.imageUrl === "string" ? input.imageUrl.trim() : "";
  const images = Array.isArray(input.images)
    ? input.images
    : imageUrl
      ? [{ url: imageUrl, alt: input.name ? `${String(input.name)} cover` : null, isCover: true }]
      : undefined;

  return {
    ...input,
    category: input.category ?? input.categoryId,
    pricePerNight: input.pricePerNight ?? input.price,
    weekendPricePerNight: input.weekendPricePerNight ?? input.weekendPrice,
    isFeatured: input.isFeatured ?? input.featured,
    images,
  };
}

export function slugifyMasterData(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
