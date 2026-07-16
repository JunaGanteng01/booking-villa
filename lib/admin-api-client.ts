export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

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

export type AdminVillaDto = {
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

export type AdminVillaPayload = {
  name: string;
  slug: string;
  category: string;
  location: string;
  address: string;
  shortDescription: string;
  description: string;
  imageUrl?: string;
  price: number;
  weekendPrice: number;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  sizeSqm: number;
  status: AdminVillaDto["status"];
  featured: boolean;
  amenities: string[];
};

export type AvailabilityStatus = "AVAILABLE" | "BOOKED" | "PENDING" | "MAINTENANCE" | "BLOCKED";

export type AvailabilityDay = {
  date: string;
  status: AvailabilityStatus;
  priceOverride?: number | null;
  minStayNights?: number | null;
  note?: string | null;
  bookingCode?: string | null;
};

export type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  villaCount: number;
};

export type AmenityDto = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  group: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  villaCount: number;
};

export type PromotionDto = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxDiscount: number | null;
  minNights: number;
  minSubtotal: number;
  usageLimit: number | null;
  usageCount: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  appliesToAll: boolean;
  villaCount: number;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetch(url, { ...init, headers, credentials: "same-origin" });
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    const message =
      (typeof body?.error === "string" && body.error) ||
      (typeof body?.message === "string" && body.message) ||
      `Permintaan gagal (${response.status})`;
    throw new AdminApiError(message, response.status);
  }
  return body as T;
}

function json(method: string, body?: unknown): RequestInit {
  return { method, body: body === undefined ? undefined : JSON.stringify(body) };
}

export async function listAdminVillas(params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => value !== undefined && search.set(key, String(value)));
  return request<{ villas: AdminVillaDto[]; pagination: { total: number }; meta: { source: string } }>(
    `/api/admin/villas${search.size ? `?${search}` : ""}`,
  );
}

export const getAdminVilla = (id: string) => request<{ villa: AdminVillaDto }>(`/api/admin/villas/${encodeURIComponent(id)}`);
export const createAdminVilla = (payload: AdminVillaPayload) => request<{ villa: AdminVillaDto }>("/api/admin/villas", json("POST", payload));
export const updateAdminVilla = (id: string, payload: Partial<AdminVillaPayload>) => request<{ villa: AdminVillaDto }>(`/api/admin/villas/${encodeURIComponent(id)}`, json("PATCH", payload));
export const deleteAdminVilla = (id: string) => request<{ success: boolean }>(`/api/admin/villas/${encodeURIComponent(id)}`, { method: "DELETE" });

export async function uploadVillaImages(id: string, files: File[]) {
  const body = new FormData();
  files.forEach((file) => body.append("files", file));
  return request<{ images: AdminVillaImage[] }>(`/api/admin/villas/${encodeURIComponent(id)}/gallery`, { method: "POST", body });
}

export const updateVillaGallery = (id: string, images: Array<Pick<AdminVillaImage, "id" | "sortOrder" | "isCover" | "alt">>) =>
  request<{ images: AdminVillaImage[] }>(`/api/admin/villas/${encodeURIComponent(id)}/gallery`, json("PATCH", { images }));
export const deleteVillaImage = (villaId: string, imageId: string) =>
  request<{ success: boolean }>(`/api/admin/villas/${encodeURIComponent(villaId)}/gallery/${encodeURIComponent(imageId)}`, { method: "DELETE" });

export const getVillaAvailability = (id: string, from: string, to: string) =>
  request<{ days: AvailabilityDay[] }>(`/api/admin/villas/${encodeURIComponent(id)}/availability?from=${from}&to=${to}`);
export const updateVillaAvailability = (id: string, payload: { from: string; to?: string; status: AvailabilityStatus }) =>
  request<{ updated: AvailabilityDay[] }>(`/api/admin/villas/${encodeURIComponent(id)}/availability`, json("PATCH", payload));
export const resetVillaAvailability = (id: string, from: string, to: string) =>
  request<{ success: boolean }>(`/api/admin/villas/${encodeURIComponent(id)}/availability?from=${from}&to=${to}`, { method: "DELETE" });

type CatalogKind = "categories" | "amenities" | "promotions";
type CatalogMap = { categories: CategoryDto; amenities: AmenityDto; promotions: PromotionDto };

export const listCatalog = <K extends CatalogKind>(kind: K) => request<{ items: CatalogMap[K][] }>(`/api/admin/${kind}`);
export const createCatalogItem = <K extends CatalogKind>(kind: K, payload: Record<string, unknown>) =>
  request<{ item: CatalogMap[K] }>(`/api/admin/${kind}`, json("POST", payload));
export const updateCatalogItem = <K extends CatalogKind>(kind: K, id: string, payload: Record<string, unknown>) =>
  request<{ item: CatalogMap[K] }>(`/api/admin/${kind}/${encodeURIComponent(id)}`, json("PATCH", payload));
export const deleteCatalogItem = (kind: CatalogKind, id: string) =>
  request<{ success: boolean }>(`/api/admin/${kind}/${encodeURIComponent(id)}`, { method: "DELETE" });
