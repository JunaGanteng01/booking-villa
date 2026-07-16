import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createAdminVillaRecord,
  listAdminVillaRecords,
  type AdminVillaMutation,
} from "@/lib/admin-villa-store";
import {
  adminVillaSchema,
  normalizeAdminVillaPayload,
  slugifyMasterData,
} from "@/lib/admin-villa-validation";
import { adminVillaInclude, serializePrismaVilla } from "@/lib/admin-villa-prisma";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "MAINTENANCE"]).optional(),
  category: z.string().trim().max(80).optional(),
  location: z.string().trim().max(120).optional(),
});

export async function GET(request: Request) {
  if (!isAdmin(request)) return forbidden();

  const parsed = listQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Filter villa tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { page, limit, search, status, category, location } = parsed.data;
  const where: Prisma.VillaWhereInput = {
    ...(status ? { status } : {}),
    ...(category
      ? {
          category: {
            OR: [
              { id: category },
              { slug: category.toLowerCase() },
              { name: { equals: category, mode: "insensitive" } },
            ],
          },
        }
      : {}),
    ...(location ? { location: { equals: location, mode: "insensitive" } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  try {
    const [villas, total] = await prisma.$transaction([
      prisma.villa.findMany({
        where,
        include: adminVillaInclude,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.villa.count({ where }),
    ]);
    return listResponse(villas.map(serializePrismaVilla), total, page, limit, "database");
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);

    const filtered = listAdminVillaRecords().filter((villa) => {
      if (status && villa.status !== status) return false;
      if (category && villa.category.toLowerCase() !== category.toLowerCase()) return false;
      if (location && villa.location.toLowerCase() !== location.toLowerCase()) return false;
      if (search) {
        const haystack = `${villa.name} ${villa.slug} ${villa.location}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
    return listResponse(
      filtered.slice((page - 1) * limit, page * limit),
      filtered.length,
      page,
      limit,
      "memory-fallback",
    );
  }
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Body request harus JSON valid." }, { status: 400 });
  }

  const parsed = adminVillaSchema.safeParse(normalizeAdminVillaPayload(body));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data villa belum valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  try {
    const villa = await prisma.villa.create({
      data: createPrismaVillaData(data),
      include: adminVillaInclude,
    });
    return NextResponse.json(
      { villa: serializePrismaVilla(villa), meta: { source: "database" } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "Slug villa sudah digunakan." }, { status: 409 });
    }
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);

    if (listAdminVillaRecords().some((villa) => villa.slug === data.slug)) {
      return NextResponse.json({ message: "Slug villa sudah digunakan." }, { status: 409 });
    }
    const villa = createAdminVillaRecord(toFallbackMutation(data));
    return NextResponse.json(
      { villa, meta: { source: "memory-fallback" } },
      { status: 201 },
    );
  }
}

function createPrismaVillaData(data: z.infer<typeof adminVillaSchema>): Prisma.VillaCreateInput {
  const categorySlug = slugifyMasterData(data.category);
  return {
    slug: data.slug,
    name: data.name,
    shortDescription: data.shortDescription,
    description: data.description,
    location: data.location,
    address: data.address,
    city: data.city,
    province: data.province,
    country: data.country,
    pricePerNight: data.pricePerNight,
    weekendPricePerNight: data.weekendPricePerNight ?? null,
    capacity: data.capacity,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    sizeSqm: data.sizeSqm ?? null,
    status: data.status,
    isFeatured: data.isFeatured,
    publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    category: {
      connectOrCreate: {
        where: { slug: categorySlug },
        create: { name: data.category, slug: categorySlug },
      },
    },
    amenities: {
      create: data.amenities.map((name) => {
        const slug = slugifyMasterData(name);
        return {
          amenity: {
            connectOrCreate: {
              where: { slug },
              create: { name, slug },
            },
          },
        };
      }),
    },
    images: {
      create: data.images.map((image, index) => ({
        url: image.url,
        cloudinaryId: image.cloudinaryId ?? null,
        alt: image.alt ?? `${data.name} ${index === 0 ? "cover" : `gallery ${index + 1}`}`,
        width: image.width ?? null,
        height: image.height ?? null,
        sortOrder: image.sortOrder ?? index,
        isCover: image.isCover ?? index === 0,
      })),
    },
  };
}

function toFallbackMutation(data: z.infer<typeof adminVillaSchema>): AdminVillaMutation {
  return {
    ...data,
    weekendPricePerNight: data.weekendPricePerNight ?? null,
    sizeSqm: data.sizeSqm ?? null,
    images: data.images.map((image, index) => ({
      url: image.url,
      cloudinaryId: image.cloudinaryId ?? null,
      alt: image.alt ?? null,
      width: image.width ?? null,
      height: image.height ?? null,
      sortOrder: image.sortOrder ?? index,
      isCover: image.isCover ?? index === 0,
    })),
  };
}

function listResponse(villas: unknown[], total: number, page: number, limit: number, source: string) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return NextResponse.json({
    villas,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
    meta: { source },
  });
}

function isAdmin(request: Request) {
  const role = request.headers.get("x-user-role");
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

function forbidden() {
  return NextResponse.json({ message: "Forbidden" }, { status: 403 });
}

function serverError(error: unknown) {
  console.error("Admin villa API error", error);
  return NextResponse.json({ message: "Data villa belum dapat diproses." }, { status: 500 });
}
