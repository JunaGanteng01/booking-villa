import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createCatalogAmenity,
  createCatalogCategory,
  createCatalogPromotion,
  deleteCatalogAmenity,
  deleteCatalogCategory,
  deleteCatalogPromotion,
  listCatalogAmenities,
  listCatalogCategories,
  listCatalogPromotions,
  updateCatalogAmenity,
  updateCatalogCategory,
  updateCatalogPromotion,
} from "@/lib/admin-catalog-store";
import { slugifyMasterData } from "@/lib/admin-villa-validation";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";
import { hasPermission } from "@/lib/rbac";

export type CatalogKind = "category" | "amenity" | "promotion";

const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
const amenitySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  group: z.string().trim().max(80).nullable().optional(),
  icon: z.string().trim().max(80).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
const promotionSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    code: z
      .string()
      .trim()
      .min(4)
      .max(40)
      .transform((value) => value.toUpperCase()),
    description: z.string().trim().max(2000).nullable().optional(),
    discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    discountValue: z.number().int().positive(),
    maxDiscount: z.number().int().positive().nullable().optional(),
    minNights: z.number().int().min(1).max(365).nullable().optional(),
    minSubtotal: z.number().int().positive().nullable().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),
    startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    isActive: z.boolean().default(false),
    appliesToAll: z.boolean().default(true),
  })
  .refine((data) => data.endsAt >= data.startsAt, {
    message: "Tanggal akhir promo harus setelah tanggal mulai.",
    path: ["endsAt"],
  })
  .refine(
    (data) => data.discountType !== "PERCENTAGE" || data.discountValue <= 100,
    {
      message: "Diskon persentase maksimal 100%.",
      path: ["discountValue"],
    },
  );

export async function handleCatalogList(request: Request, kind: CatalogKind) {
  if (!canView(request)) return forbidden();
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim().toLowerCase() ?? "";
  const active = url.searchParams.get("active");

  try {
    if (kind === "category") {
      const items = await prisma.category.findMany({
        where: {
          ...(active !== null ? { isActive: active === "true" } : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { slug: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: { _count: { select: { villas: true } } },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      });
      return successList(
        items.map((item) => ({ ...item, villaCount: item._count.villas })),
        "database",
      );
    }
    if (kind === "amenity") {
      const items = await prisma.amenity.findMany({
        where: {
          ...(active !== null ? { isActive: active === "true" } : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { group: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: { _count: { select: { villas: true } } },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      });
      return successList(
        items.map((item) => ({ ...item, villaCount: item._count.villas })),
        "database",
      );
    }
    const items = await prisma.promotion.findMany({
      where: {
        ...(active !== null ? { isActive: active === "true" } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { villas: true } } },
      orderBy: [{ startsAt: "desc" }, { name: "asc" }],
    });
    return successList(
      items.map((item) => ({ ...item, villaCount: item._count.villas })),
      "database",
    );
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error))
      return serverError(kind, error);
    const items = fallbackList(kind).filter((item) => {
      if (active !== null && item.isActive !== (active === "true"))
        return false;
      if (search && !JSON.stringify(item).toLowerCase().includes(search))
        return false;
      return true;
    });
    return successList(items, "memory-fallback");
  }
}

export async function handleCatalogCreate(request: Request, kind: CatalogKind) {
  if (!canManage(request)) return forbidden();
  const body = await readJson(request);
  if (!body.ok) return body.response;
  const normalized = normalizePayload(kind, body.value);
  const schema =
    kind === "category"
      ? categorySchema
      : kind === "amenity"
        ? amenitySchema
        : promotionSchema;
  const parsed = schema.safeParse(normalized);
  if (!parsed.success) return validationError(parsed.error);

  try {
    if (kind === "category") {
      const data = parsed.data as z.infer<typeof categorySchema>;
      const item = await prisma.category.create({
        data: { ...data, slug: data.slug ?? slugifyMasterData(data.name) },
      });
      return created(item, "database");
    }
    if (kind === "amenity") {
      const data = parsed.data as z.infer<typeof amenitySchema>;
      const item = await prisma.amenity.create({
        data: { ...data, slug: data.slug ?? slugifyMasterData(data.name) },
      });
      return created(item, "database");
    }
    const data = parsed.data as z.infer<typeof promotionSchema>;
    const item = await prisma.promotion.create({
      data: promotionDatabaseData(data),
    });
    return created(item, "database");
  } catch (error) {
    if (isUniqueConflict(error)) return conflict();
    if (!isPrismaDatabaseUnavailableError(error))
      return serverError(kind, error);

    if (kind === "category") {
      const data = parsed.data as z.infer<typeof categorySchema>;
      if (
        listCatalogCategories().some(
          (item) => item.slug === (data.slug ?? slugifyMasterData(data.name)),
        )
      )
        return conflict();
      return created(
        createCatalogCategory({
          ...data,
          slug: data.slug ?? slugifyMasterData(data.name),
          description: data.description ?? null,
          imageUrl: data.imageUrl ?? null,
        }),
        "memory-fallback",
      );
    }
    if (kind === "amenity") {
      const data = parsed.data as z.infer<typeof amenitySchema>;
      if (
        listCatalogAmenities().some(
          (item) => item.slug === (data.slug ?? slugifyMasterData(data.name)),
        )
      )
        return conflict();
      return created(
        createCatalogAmenity({
          ...data,
          slug: data.slug ?? slugifyMasterData(data.name),
          description: data.description ?? null,
          group: data.group ?? null,
          icon: data.icon ?? null,
        }),
        "memory-fallback",
      );
    }
    const data = parsed.data as z.infer<typeof promotionSchema>;
    if (listCatalogPromotions().some((item) => item.code === data.code))
      return conflict();
    return created(
      createCatalogPromotion({
        ...data,
        description: data.description ?? null,
        maxDiscount: data.maxDiscount ?? null,
        minNights: data.minNights ?? null,
        minSubtotal: data.minSubtotal ?? null,
        usageLimit: data.usageLimit ?? null,
      }),
      "memory-fallback",
    );
  }
}

export async function handleCatalogPatch(
  request: Request,
  kind: CatalogKind,
  id: string,
) {
  if (!canManage(request)) return forbidden();
  const body = await readJson(request);
  if (!body.ok) return body.response;
  const normalized = normalizePayload(kind, body.value);
  const schema =
    kind === "category"
      ? categorySchema.partial()
      : kind === "amenity"
        ? amenitySchema.partial()
        : promotionPatchSchema();
  const parsed = schema.safeParse(normalized);
  if (!parsed.success) return validationError(parsed.error);
  if (!Object.keys(parsed.data).length)
    return NextResponse.json(
      { message: "Tidak ada perubahan." },
      { status: 400 },
    );

  try {
    if (kind === "category") {
      const data = parsed.data as Partial<z.infer<typeof categorySchema>>;
      const item = await prisma.category.update({
        where: { id },
        data: {
          ...data,
          ...(data.name && !data.slug
            ? { slug: slugifyMasterData(data.name) }
            : {}),
        },
      });
      return updated(item, "database");
    }
    if (kind === "amenity") {
      const data = parsed.data as Partial<z.infer<typeof amenitySchema>>;
      const item = await prisma.amenity.update({
        where: { id },
        data: {
          ...data,
          ...(data.name && !data.slug
            ? { slug: slugifyMasterData(data.name) }
            : {}),
        },
      });
      return updated(item, "database");
    }
    const data = parsed.data as Partial<z.infer<typeof promotionSchema>>;
    const item = await prisma.promotion.update({
      where: { id },
      data: promotionDatabasePatch(data),
    });
    return updated(item, "database");
  } catch (error) {
    if (isUniqueConflict(error)) return conflict();
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    )
      return notFound();
    if (!isPrismaDatabaseUnavailableError(error))
      return serverError(kind, error);
    const item =
      kind === "category"
        ? updateCatalogCategory(id, parsed.data)
        : kind === "amenity"
          ? updateCatalogAmenity(id, parsed.data)
          : updateCatalogPromotion(
              id,
              parsed.data as Partial<
                ReturnType<typeof listCatalogPromotions>[number]
              >,
            );
    return item ? updated(item, "memory-fallback") : notFound();
  }
}

export async function handleCatalogDelete(
  request: Request,
  kind: CatalogKind,
  id: string,
) {
  if (!canManage(request)) return forbidden();

  try {
    if (kind === "category") {
      const item = await prisma.category.findUnique({
        where: { id },
        include: { _count: { select: { villas: true } } },
      });
      if (!item) return notFound();
      if (item._count.villas) {
        await prisma.category.update({
          where: { id },
          data: { isActive: false },
        });
        return deactivated();
      }
      await prisma.category.delete({ where: { id } });
    } else if (kind === "amenity") {
      const item = await prisma.amenity.findUnique({
        where: { id },
        include: { _count: { select: { villas: true } } },
      });
      if (!item) return notFound();
      if (item._count.villas) {
        await prisma.amenity.update({
          where: { id },
          data: { isActive: false },
        });
        return deactivated();
      }
      await prisma.amenity.delete({ where: { id } });
    } else {
      const item = await prisma.promotion.findUnique({ where: { id } });
      if (!item) return notFound();
      if (item.usageCount > 0) {
        await prisma.promotion.update({
          where: { id },
          data: { isActive: false },
        });
        return deactivated();
      }
      await prisma.promotion.delete({ where: { id } });
    }
    return NextResponse.json({
      message: "Data berhasil dihapus.",
      mode: "deleted",
    });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error))
      return serverError(kind, error);
    const before =
      kind === "category"
        ? listCatalogCategories()
        : kind === "amenity"
          ? listCatalogAmenities()
          : listCatalogPromotions();
    const current = before.find(
      (item) =>
        item.id === id ||
        ("slug" in item && item.slug === id) ||
        ("code" in item && item.code.toLowerCase() === id.toLowerCase()),
    );
    if (!current) return notFound();
    const item =
      kind === "category"
        ? deleteCatalogCategory(id)
        : kind === "amenity"
          ? deleteCatalogAmenity(id)
          : deleteCatalogPromotion(id);
    if (!item) return notFound();
    const active = "isActive" in item ? item.isActive : false;
    return NextResponse.json({
      message: active
        ? "Data berhasil dihapus."
        : "Data dinonaktifkan karena sudah digunakan.",
      mode: active ? "deleted" : "deactivated",
      meta: { source: "memory-fallback" },
    });
  }
}

function normalizePayload(kind: CatalogKind, value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const input = value as Record<string, unknown>;
  if (kind !== "promotion") {
    return { ...input, isActive: input.isActive ?? input.active };
  }
  const rawType = input.discountType ?? input.type;
  return {
    ...input,
    discountType:
      rawType === "PERCENT"
        ? "PERCENTAGE"
        : rawType === "FIXED"
          ? "FIXED_AMOUNT"
          : rawType,
    discountValue: input.discountValue ?? input.value,
    startsAt: input.startsAt ?? input.start,
    endsAt: input.endsAt ?? input.end,
    usageLimit: input.usageLimit ?? input.limit,
    isActive: input.isActive ?? input.active,
  };
}

function promotionPatchSchema() {
  return z.object({
    name: z.string().trim().min(2).max(120).optional(),
    code: z
      .string()
      .trim()
      .min(4)
      .max(40)
      .transform((value) => value.toUpperCase())
      .optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).optional(),
    discountValue: z.number().int().positive().optional(),
    maxDiscount: z.number().int().positive().nullable().optional(),
    minNights: z.number().int().min(1).max(365).nullable().optional(),
    minSubtotal: z.number().int().positive().nullable().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),
    startsAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    endsAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    isActive: z.boolean().optional(),
    appliesToAll: z.boolean().optional(),
  });
}

function promotionDatabaseData(
  data: z.infer<typeof promotionSchema>,
): Prisma.PromotionCreateInput {
  return {
    ...data,
    startsAt: new Date(`${data.startsAt}T00:00:00.000Z`),
    endsAt: new Date(`${data.endsAt}T23:59:59.999Z`),
  };
}

function promotionDatabasePatch(
  data: Partial<z.infer<typeof promotionSchema>>,
): Prisma.PromotionUpdateInput {
  return {
    ...data,
    ...(data.startsAt
      ? { startsAt: new Date(`${data.startsAt}T00:00:00.000Z`) }
      : {}),
    ...(data.endsAt
      ? { endsAt: new Date(`${data.endsAt}T23:59:59.999Z`) }
      : {}),
  };
}

function fallbackList(kind: CatalogKind) {
  return kind === "category"
    ? listCatalogCategories()
    : kind === "amenity"
      ? listCatalogAmenities()
      : listCatalogPromotions();
}

async function readJson(request: Request) {
  try {
    return { ok: true as const, value: await request.json() };
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Body request harus JSON valid." },
        { status: 400 },
      ),
    };
  }
}

function successList(items: unknown[], source: string) {
  return NextResponse.json({ items, total: items.length, meta: { source } });
}
function created(item: unknown, source: string) {
  return NextResponse.json({ item, meta: { source } }, { status: 201 });
}
function updated(item: unknown, source: string) {
  return NextResponse.json({ item, meta: { source } });
}
function validationError(error: z.ZodError) {
  return NextResponse.json(
    {
      message: "Data master belum valid.",
      errors: error.flatten().fieldErrors,
    },
    { status: 400 },
  );
}
function canView(request: Request) {
  return hasPermission(request.headers.get("x-user-role") ?? "", "villas.view");
}
function canManage(request: Request) {
  return hasPermission(
    request.headers.get("x-user-role") ?? "",
    "villas.manage",
  );
}
function forbidden() {
  return NextResponse.json({ message: "Forbidden" }, { status: 403 });
}
function notFound() {
  return NextResponse.json(
    { message: "Data tidak ditemukan." },
    { status: 404 },
  );
}
function conflict() {
  return NextResponse.json(
    { message: "Nama, slug, atau kode sudah digunakan." },
    { status: 409 },
  );
}
function deactivated() {
  return NextResponse.json({
    message: "Data dinonaktifkan karena sudah digunakan.",
    mode: "deactivated",
  });
}
function isUniqueConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
function serverError(kind: CatalogKind, error: unknown) {
  console.error(`Admin ${kind} API error`, error);
  return NextResponse.json(
    { message: "Data master belum dapat diproses." },
    { status: 500 },
  );
}
