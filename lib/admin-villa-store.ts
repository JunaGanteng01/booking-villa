import { villas as seedVillas } from "@/lib/villa-data";

export type AdminVillaImage = {
  id: string;
  url: string;
  cloudinaryId: string | null;
  alt: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
  isCover: boolean;
};

export type AdminVillaRecord = {
  id: string;
  slug: string;
  name: string;
  category: string;
  location: string;
  address: string;
  city: string;
  province: string;
  country: string;
  shortDescription: string;
  description: string;
  pricePerNight: number;
  weekendPricePerNight: number | null;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  sizeSqm: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "MAINTENANCE";
  isFeatured: boolean;
  amenities: string[];
  images: AdminVillaImage[];
  createdAt: string;
  updatedAt: string;
};

export type AdminVillaMutation = Omit<AdminVillaRecord, "id" | "images" | "createdAt" | "updatedAt"> & {
  images?: Array<Omit<AdminVillaImage, "id">>;
};

const globalForVillaStore = globalThis as typeof globalThis & {
  villakuAdminVillaStore?: Map<string, AdminVillaRecord>;
};

const villaStore = globalForVillaStore.villakuAdminVillaStore ?? createSeedStore();

if (process.env.NODE_ENV !== "production") {
  globalForVillaStore.villakuAdminVillaStore = villaStore;
}

export function listAdminVillaRecords() {
  return Array.from(villaStore.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getAdminVillaRecord(idOrSlug: string) {
  const normalized = idOrSlug.toLowerCase();
  return (
    villaStore.get(idOrSlug) ??
    Array.from(villaStore.values()).find((villa) => villa.slug.toLowerCase() === normalized) ??
    null
  );
}

export function createAdminVillaRecord(input: AdminVillaMutation) {
  const id = `villa_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const record: AdminVillaRecord = {
    ...input,
    id,
    images: (input.images ?? []).map((image, index) => ({
      ...image,
      id: `image_${crypto.randomUUID()}`,
      sortOrder: image.sortOrder ?? index,
      isCover: image.isCover ?? index === 0,
    })),
    createdAt: now,
    updatedAt: now,
  };

  villaStore.set(id, ensureSingleCover(record));
  return villaStore.get(id)!;
}

export function updateAdminVillaRecord(idOrSlug: string, input: Partial<AdminVillaMutation>) {
  const current = getAdminVillaRecord(idOrSlug);
  if (!current) return null;

  const updated = ensureSingleCover({
    ...current,
    ...input,
    images: input.images
      ? input.images.map((image, index) => ({
          ...image,
          id: `image_${crypto.randomUUID()}`,
          sortOrder: image.sortOrder ?? index,
          isCover: image.isCover ?? index === 0,
        }))
      : current.images,
    updatedAt: new Date().toISOString(),
  });
  villaStore.set(current.id, updated);
  return updated;
}

export function deleteAdminVillaRecord(idOrSlug: string) {
  const current = getAdminVillaRecord(idOrSlug);
  if (!current) return false;
  return villaStore.delete(current.id);
}

export function addAdminVillaImage(
  idOrSlug: string,
  image: Omit<AdminVillaImage, "id" | "sortOrder" | "isCover"> & {
    alt?: string | null;
    isCover?: boolean;
  },
) {
  const current = getAdminVillaRecord(idOrSlug);
  if (!current) return null;
  const nextImage: AdminVillaImage = {
    ...image,
    id: `image_${crypto.randomUUID()}`,
    alt: image.alt ?? null,
    sortOrder: current.images.length,
    isCover: image.isCover ?? current.images.length === 0,
  };
  const updated = ensureSingleCover({
    ...current,
    images: nextImage.isCover
      ? [...current.images.map((item) => ({ ...item, isCover: false })), nextImage]
      : [...current.images, nextImage],
    updatedAt: new Date().toISOString(),
  });
  villaStore.set(current.id, updated);
  return nextImage;
}

export function replaceAdminVillaImages(idOrSlug: string, images: AdminVillaImage[]) {
  const current = getAdminVillaRecord(idOrSlug);
  if (!current) return null;
  const updated = ensureSingleCover({
    ...current,
    images: images.map((image, index) => ({ ...image, sortOrder: index })),
    updatedAt: new Date().toISOString(),
  });
  villaStore.set(current.id, updated);
  return updated.images;
}

function createSeedStore() {
  const now = new Date().toISOString();
  return new Map(
    seedVillas.map((villa) => {
      const record: AdminVillaRecord = {
        id: villa.id,
        slug: villa.id,
        name: villa.name,
        category: villa.category,
        location: villa.location,
        address: villa.address,
        city: "Bali",
        province: "Bali",
        country: "Indonesia",
        shortDescription: villa.highlight,
        description: villa.description,
        pricePerNight: villa.price,
        weekendPricePerNight: Math.round(villa.price * 1.12),
        capacity: villa.guests,
        bedrooms: villa.bedrooms,
        bathrooms: villa.bathrooms,
        sizeSqm: Number.parseInt(villa.size.replace(/\D/g, ""), 10) || null,
        status: villa.available ? "PUBLISHED" : "MAINTENANCE",
        isFeatured: villa.badges.length >= 3,
        amenities: villa.amenities,
        images: villa.gallery.map((url, index) => ({
          id: `${villa.id}-image-${index + 1}`,
          url,
          cloudinaryId: null,
          alt: `${villa.name} ${index === 0 ? "cover" : `gallery ${index + 1}`}`,
          width: null,
          height: null,
          sortOrder: index,
          isCover: index === 0,
        })),
        createdAt: now,
        updatedAt: now,
      };
      return [record.id, record] as const;
    }),
  );
}

function ensureSingleCover(record: AdminVillaRecord) {
  if (!record.images.length) return record;
  const requestedCover = record.images.find((image) => image.isCover)?.id ?? record.images[0].id;
  return {
    ...record,
    images: record.images
      .map((image, index) => ({
        ...image,
        isCover: image.id === requestedCover,
        sortOrder: index,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}
