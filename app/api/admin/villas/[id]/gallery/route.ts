import { NextResponse } from "next/server";
import { z } from "zod";
import {
  addAdminVillaImage,
  getAdminVillaRecord,
  replaceAdminVillaImages,
} from "@/lib/admin-villa-store";
import { uploadVillaGalleryImage } from "@/lib/cloudinary-service";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

const galleryOrderSchema = z.object({
  images: z
    .array(
      z.object({
        id: z.string().min(1),
        sortOrder: z.number().int().min(0),
        isCover: z.boolean().optional(),
        alt: z.string().trim().max(180).nullable().optional(),
      }),
    )
    .min(1)
    .max(20),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return forbidden();
  const { id } = await params;
  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: "Form upload tidak valid." }, { status: 400 });
  }

  const files = [...form.getAll("files"), ...form.getAll("file")].filter(
    (entry): entry is File => entry instanceof File && entry.size > 0,
  );
  if (!files.length || files.length > 10) {
    return NextResponse.json(
      { message: "Unggah minimal 1 dan maksimal 10 foto sekaligus." },
      { status: 400 },
    );
  }
  const requestedCover = form.get("isCover") === "true";
  const altPrefix = typeof form.get("alt") === "string" ? String(form.get("alt")).trim() : "";

  try {
    const databaseVilla = await prisma.villa.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true, slug: true, name: true, _count: { select: { images: true } } },
    });
    if (!databaseVilla) return notFound();
    const uploads = await Promise.all(
      files.map((file) => uploadVillaGalleryImage(file, databaseVilla.slug)),
    );
    const created = await prisma.$transaction(async (tx) => {
      if (requestedCover) {
        await tx.villaImage.updateMany({
          where: { villaId: databaseVilla.id },
          data: { isCover: false },
        });
      }

      return Promise.all(
        uploads.map((upload, index) =>
          tx.villaImage.create({
            data: {
              villaId: databaseVilla.id,
              url: upload.url,
              cloudinaryId: upload.cloudinaryId,
              width: upload.width,
              height: upload.height,
              alt: altPrefix || `${databaseVilla.name} gallery ${databaseVilla._count.images + index + 1}`,
              sortOrder: databaseVilla._count.images + index,
              isCover: requestedCover ? index === 0 : databaseVilla._count.images === 0 && index === 0,
            },
          }),
        ),
      );
    });
    return NextResponse.json(
      { images: created, meta: { source: "database", provider: uploads[0].provider } },
      { status: 201 },
    );
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Gallery upload error", error);
      return NextResponse.json(
        { message: error instanceof Error ? error.message : "Foto galeri gagal diunggah." },
        { status: 500 },
      );
    }

    const villa = getAdminVillaRecord(id);
    if (!villa) return notFound();
    try {
      const uploads = await Promise.all(files.map((file) => uploadVillaGalleryImage(file, villa.slug)));
      const images = uploads.map((upload, index) =>
        addAdminVillaImage(id, {
          url: upload.url,
          cloudinaryId: upload.cloudinaryId,
          width: upload.width,
          height: upload.height,
          alt: altPrefix || `${villa.name} gallery ${villa.images.length + index + 1}`,
          isCover: requestedCover && index === 0,
        }),
      );
      return NextResponse.json(
        {
          images: images.filter(Boolean),
          meta: { source: "memory-fallback", provider: uploads[0].provider },
        },
        { status: 201 },
      );
    } catch (uploadError) {
      return NextResponse.json(
        { message: uploadError instanceof Error ? uploadError.message : "Foto galeri gagal diunggah." },
        { status: 400 },
      );
    }
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
  const parsed = galleryOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Urutan galeri tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const coverId = parsed.data.images.find((image) => image.isCover)?.id ?? parsed.data.images[0].id;

  try {
    const villa = await prisma.villa.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true, images: { select: { id: true } } },
    });
    if (!villa) return notFound();
    const validIds = new Set(villa.images.map((image) => image.id));
    if (parsed.data.images.some((image) => !validIds.has(image.id))) {
      return NextResponse.json({ message: "Galeri berisi foto yang bukan milik villa ini." }, { status: 400 });
    }
    await prisma.$transaction(
      parsed.data.images.map((image, index) =>
        prisma.villaImage.update({
          where: { id: image.id },
          data: {
            sortOrder: index,
            isCover: image.id === coverId,
            ...(image.alt !== undefined ? { alt: image.alt } : {}),
          },
        }),
      ),
    );
    const images = await prisma.villaImage.findMany({
      where: { villaId: villa.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ images, meta: { source: "database" } });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Gallery reorder error", error);
      return NextResponse.json({ message: "Galeri belum dapat diperbarui." }, { status: 500 });
    }
    const villa = getAdminVillaRecord(id);
    if (!villa) return notFound();
    const currentById = new Map(villa.images.map((image) => [image.id, image]));
    if (parsed.data.images.some((image) => !currentById.has(image.id))) {
      return NextResponse.json({ message: "Galeri berisi foto yang bukan milik villa ini." }, { status: 400 });
    }
    const images = replaceAdminVillaImages(
      id,
      parsed.data.images.map((item, index) => ({
        ...currentById.get(item.id)!,
        alt: item.alt === undefined ? currentById.get(item.id)!.alt : item.alt,
        sortOrder: index,
        isCover: item.id === coverId,
      })),
    );
    return NextResponse.json({ images, meta: { source: "memory-fallback" } });
  }
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
