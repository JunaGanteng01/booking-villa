import { NextResponse } from "next/server";
import { getAdminVillaRecord, replaceAdminVillaImages } from "@/lib/admin-villa-store";
import { prisma } from "@/lib/prisma";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id, imageId } = await params;

  try {
    const image = await prisma.villaImage.findFirst({
      where: { id: imageId, villa: { OR: [{ id }, { slug: id }] } },
    });
    if (!image) return notFound();
    await prisma.$transaction(async (tx) => {
      await tx.villaImage.delete({ where: { id: image.id } });
      if (image.isCover) {
        const nextCover = await tx.villaImage.findFirst({
          where: { villaId: image.villaId },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        });
        if (nextCover) {
          await tx.villaImage.update({ where: { id: nextCover.id }, data: { isCover: true } });
        }
      }
    });
    return NextResponse.json({ message: "Foto galeri berhasil dihapus." });
  } catch (error) {
    if (!isPrismaDatabaseUnavailableError(error)) {
      console.error("Gallery delete error", error);
      return NextResponse.json({ message: "Foto galeri belum dapat dihapus." }, { status: 500 });
    }
    const villa = getAdminVillaRecord(id);
    if (!villa || !villa.images.some((image) => image.id === imageId)) return notFound();
    const images = villa.images.filter((image) => image.id !== imageId);
    if (images.length && !images.some((image) => image.isCover)) images[0].isCover = true;
    replaceAdminVillaImages(id, images);
    return NextResponse.json({
      message: "Foto galeri berhasil dihapus.",
      meta: { source: "memory-fallback" },
    });
  }
}

function isAdmin(request: Request) {
  const role = request.headers.get("x-user-role");
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

function notFound() {
  return NextResponse.json({ message: "Foto galeri tidak ditemukan." }, { status: 404 });
}
