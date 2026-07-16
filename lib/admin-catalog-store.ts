export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  villaCount: number;
};

export type CatalogAmenity = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  group: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  villaCount: number;
};

export type CatalogPromotion = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxDiscount: number | null;
  minNights: number | null;
  minSubtotal: number | null;
  usageLimit: number | null;
  usageCount: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  appliesToAll: boolean;
  villaCount: number;
};

type CatalogState = {
  categories: Map<string, CatalogCategory>;
  amenities: Map<string, CatalogAmenity>;
  promotions: Map<string, CatalogPromotion>;
};

const globalForCatalog = globalThis as typeof globalThis & {
  villakuAdminCatalogStore?: CatalogState;
};

const catalog = globalForCatalog.villakuAdminCatalogStore ?? createSeedCatalog();

if (process.env.NODE_ENV !== "production") {
  globalForCatalog.villakuAdminCatalogStore = catalog;
}

export function listCatalogCategories() {
  return Array.from(catalog.categories.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function listCatalogAmenities() {
  return Array.from(catalog.amenities.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function listCatalogPromotions() {
  return Array.from(catalog.promotions.values()).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}

export function createCatalogCategory(input: Omit<CatalogCategory, "id" | "villaCount">) {
  const record = { ...input, id: `category_${crypto.randomUUID()}`, villaCount: 0 };
  catalog.categories.set(record.id, record);
  return record;
}

export function updateCatalogCategory(id: string, input: Partial<CatalogCategory>) {
  const current = findByIdOrSlug(catalog.categories, id, "slug");
  if (!current) return null;
  const updated = { ...current, ...input, id: current.id };
  catalog.categories.set(current.id, updated);
  return updated;
}

export function deleteCatalogCategory(id: string) {
  const current = findByIdOrSlug(catalog.categories, id, "slug");
  if (!current) return null;
  if (current.villaCount > 0) return updateCatalogCategory(current.id, { isActive: false });
  catalog.categories.delete(current.id);
  return current;
}

export function createCatalogAmenity(input: Omit<CatalogAmenity, "id" | "villaCount">) {
  const record = { ...input, id: `amenity_${crypto.randomUUID()}`, villaCount: 0 };
  catalog.amenities.set(record.id, record);
  return record;
}

export function updateCatalogAmenity(id: string, input: Partial<CatalogAmenity>) {
  const current = findByIdOrSlug(catalog.amenities, id, "slug");
  if (!current) return null;
  const updated = { ...current, ...input, id: current.id };
  catalog.amenities.set(current.id, updated);
  return updated;
}

export function deleteCatalogAmenity(id: string) {
  const current = findByIdOrSlug(catalog.amenities, id, "slug");
  if (!current) return null;
  if (current.villaCount > 0) return updateCatalogAmenity(current.id, { isActive: false });
  catalog.amenities.delete(current.id);
  return current;
}

export function createCatalogPromotion(input: Omit<CatalogPromotion, "id" | "usageCount" | "villaCount">) {
  const record = {
    ...input,
    id: `promotion_${crypto.randomUUID()}`,
    usageCount: 0,
    villaCount: 0,
  };
  catalog.promotions.set(record.id, record);
  return record;
}

export function updateCatalogPromotion(id: string, input: Partial<CatalogPromotion>) {
  const current = findByIdOrSlug(catalog.promotions, id, "code");
  if (!current) return null;
  const updated = { ...current, ...input, id: current.id };
  catalog.promotions.set(current.id, updated);
  return updated;
}

export function deleteCatalogPromotion(id: string) {
  const current = findByIdOrSlug(catalog.promotions, id, "code");
  if (!current) return null;
  if (current.usageCount > 0) return updateCatalogPromotion(current.id, { isActive: false });
  catalog.promotions.delete(current.id);
  return current;
}

function findByIdOrSlug<T extends { id: string }>(
  map: Map<string, T>,
  id: string,
  key: keyof T,
) {
  const normalized = id.toLowerCase();
  return (
    map.get(id) ??
    Array.from(map.values()).find((item) => String(item[key]).toLowerCase() === normalized) ??
    null
  );
}

function createSeedCatalog(): CatalogState {
  const categories: CatalogCategory[] = [
    ["cliffside", "Cliffside", "Villa privat dengan panorama tebing dan laut.", 4, true],
    ["beachfront", "Beachfront", "Akses langsung ke garis pantai.", 6, true],
    ["jungle", "Jungle Retreat", "Retreat tenang di lanskap tropis.", 5, true],
    ["family", "Family Estate", "Properti luas untuk keluarga.", 7, true],
    ["honeymoon", "Honeymoon", "Villa romantis dan privat.", 3, true],
    ["heritage", "Heritage", "Arsitektur lokal dan budaya Bali.", 0, false],
  ].map(([slug, name, description, villaCount, isActive], index) => ({
    id: String(slug),
    slug: String(slug),
    name: String(name),
    description: String(description),
    imageUrl: null,
    sortOrder: index,
    isActive: Boolean(isActive),
    villaCount: Number(villaCount),
  }));
  const amenities: CatalogAmenity[] = [
    ["private-pool", "Private Pool", "Rekreasi", 22, true],
    ["wifi", "High-speed WiFi", "Konektivitas", 25, true],
    ["breakfast", "Daily Breakfast", "Kuliner", 18, true],
    ["chef", "Private Chef", "Layanan", 11, true],
    ["transfer", "Airport Transfer", "Transportasi", 15, true],
    ["butler", "Dedicated Butler", "Layanan", 9, true],
    ["spa", "In-villa Spa", "Wellness", 8, true],
  ].map(([slug, name, group, villaCount, isActive], index) => ({
    id: String(slug),
    slug: String(slug),
    name: String(name),
    description: null,
    group: String(group),
    icon: null,
    sortOrder: index,
    isActive: Boolean(isActive),
    villaCount: Number(villaCount),
  }));
  const promotions: CatalogPromotion[] = [
    ["escape20", "Private Escape", "ESCAPE20", "PERCENTAGE", 20, "2026-07-01", "2026-08-31", 48, 100, true],
    ["staylong", "Stay Longer", "STAYLONG", "PERCENTAGE", 15, "2026-07-01", "2026-12-20", 31, 150, true],
    ["gold500", "Gold Circle Reward", "GOLD500", "FIXED_AMOUNT", 500000, "2026-01-01", "2026-12-31", 72, 250, true],
  ].map(([id, name, code, discountType, discountValue, startsAt, endsAt, usageCount, usageLimit, isActive]) => ({
    id: String(id),
    name: String(name),
    code: String(code),
    description: null,
    discountType: discountType as CatalogPromotion["discountType"],
    discountValue: Number(discountValue),
    maxDiscount: null,
    minNights: null,
    minSubtotal: null,
    usageLimit: Number(usageLimit),
    usageCount: Number(usageCount),
    startsAt: String(startsAt),
    endsAt: String(endsAt),
    isActive: Boolean(isActive),
    appliesToAll: true,
    villaCount: 0,
  }));

  return {
    categories: new Map(categories.map((item) => [item.id, item])),
    amenities: new Map(amenities.map((item) => [item.id, item])),
    promotions: new Map(promotions.map((item) => [item.id, item])),
  };
}
