import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  deleteAdminVillaRecord,
  getAdminVillaRecord,
  updateAdminVillaRecord,
  type AdminVillaMutation,
} from "@/lib/admin-villa-store";
import {
  adminVillaPatchSchema,
  normalizeAdminVillaPayload,
  slugifyMasterData,
} from "@/lib/admin-villa-validation";
import { adminVillaInclude, serializePrismaVilla } from "@/lib/admin-villa-prisma";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return forbidden();
  const { id } = await params;

  try {
    const villa = await prisma.villa.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: adminVillaInclude,
    });
    if (!villa) return notFound();
    return NextResponse.json({ villa: serializePrismaVilla(villa), meta: { source: "database" } });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
    const villa = getAdminVillaRecord(id);
    if (!villa) return notFound();
    return NextResponse.json({ villa, meta: { source: "memory-fallback" } });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return forbidden();
  const { id } = await params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Body request harus JSON valid." }, { status: 400 });
  }

  const parsed = adminVillaPatchSchema.safeParse(normalizeAdminVillaPayload(body));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Perubahan villa tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  if (!Object.keys(parsed.data).length) {
    return NextResponse.json({ message: "Tidak ada perubahan yang dikirim." }, { status: 400 });
  }

  try {
    const current = await prisma.villa.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!current) return notFound();
    const villa = await prisma.villa.update({
      where: { id: current.id },
      data: createUpdateData(parsed.data),
      include: adminVillaInclude,
    });
    return NextResponse.json({ villa: serializePrismaVilla(villa), meta: { source: "database" } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "Slug villa sudah digunakan." }, { status: 409 });
    }
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
    const villa = updateAdminVillaRecord(id, toFallbackPatch(parsed.data));
    if (!villa) return notFound();
    return NextResponse.json({ villa, meta: { source: "memory-fallback" } });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return forbidden();
  const { id } = await params;

  try {
    const villa = await prisma.villa.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true, _count: { select: { bookings: true } } },
    });
    if (!villa) return notFound();

    if (villa._count.bookings > 0) {
      await prisma.villa.update({
        where: { id: villa.id },
        data: { status: "ARCHIVED", isFeatured: false },
      });
      return NextResponse.json({ message: "Villa diarsipkan karena memiliki riwayat booking.", mode: "archived" });
    }

    await prisma.villa.delete({ where: { id: villa.id } });
    return NextResponse.json({ message: "Villa berhasil dihapus.", mode: "deleted" });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) return serverError(error);
    if (!deleteAdminVillaRecord(id)) return notFound();
    return NextResponse.json({
      message: "Villa berhasil dihapus dari data development.",
      mode: "deleted",
      meta: { source: "memory-fallback" },
    });
  }
}

function createUpdateData(data: typeof adminVillaPatchSchema._output): Prisma.VillaUpdateInput {
  const update: Prisma.VillaUpdateInput = {};
  const scalarKeys = [
    "name",
    "slug",
    "location",
    "address",
    "city",
    "province",
    "country",
    "shortDescription",
    "description",
    "pricePerNight",
    "weekendPricePerNight",
    "capacity",
    "bedrooms",
    "bathrooms",
    "sizeSqm",
    "status",
    "isFeatured",
  ] as const;

  for (const key of scalarKeys) {
    if (data[key] !== undefined) Object.assign(update, { [key]: data[key] });
  }
  if (data.status !== undefined) {
    update.publishedAt = data.status === "PUBLISHED" ? new Date() : null;
  }
  if (data.category !== undefined) {
    const slug = slugifyMasterData(data.category);
    update.category = {
      connectOrCreate: {
        where: { slug },
        create: { name: data.category, slug },
      },
    };
  }
  if (data.amenities !== undefined) {
    update.amenities = {
      deleteMany: {},
      create: data.amenities.map((name) => {
        const slug = slugifyMasterData(name);
        return {
          amenity: {
            connectOrCreate: { where: { slug }, create: { name, slug } },
          },
        };
      }),
    };
  }
  if (data.images !== undefined) {
    update.images = {
      deleteMany: {},
      create: data.images.map((image, index) => ({
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
  return update;
}

function toFallbackPatch(data: typeof adminVillaPatchSchema._output): Partial<AdminVillaMutation> {
  return {
    ...data,
    images: data.images?.map((image, index) => ({
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

function isAdmin(request: Request) {
  const role = request.headers.get("x-user-role");
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

function forbidden() {
  return NextResponse.json({ message: "Forbidden" }, { status: 403 });
}

function notFound() {
  return NextResponse.json({ message: "Villa tidak ditemukan." }, { status: 404 });
}

function serverError(error: unknown) {
  console.error("Admin villa detail API error", error);
  return NextResponse.json({ message: "Data villa belum dapat diproses." }, { status: 500 });
}
