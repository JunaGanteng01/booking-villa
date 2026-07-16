import { Prisma } from "@prisma/client";

export const adminVillaInclude = {
  category: true,
  images: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }] },
  amenities: {
    include: { amenity: true },
    orderBy: { createdAt: "asc" as const },
  },
  _count: { select: { bookings: true, reviews: true } },
} satisfies Prisma.VillaInclude;

type PrismaAdminVilla = Prisma.VillaGetPayload<{ include: typeof adminVillaInclude }>;

export function serializePrismaVilla(villa: PrismaAdminVilla) {
  return {
    ...villa,
    category: villa.category.name,
    categoryId: villa.category.id,
    amenities: villa.amenities.map((item) => item.amenity.name),
  };
}
