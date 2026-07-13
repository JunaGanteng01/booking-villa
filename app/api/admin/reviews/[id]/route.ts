import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = req.headers.get("x-user-role");
    
    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    
    const { id } = await params;
    const body = await req.json();
    
    if (body.isFeatured === undefined) {
      return NextResponse.json({ message: "Field isFeatured dibutuhkan" }, { status: 400 });
    }
    
    const review = await prisma.review.update({
      where: { id },
      data: {
        isFeatured: body.isFeatured,
      },
    });
    
    return NextResponse.json({ review, message: "Review berhasil diperbarui" }, { status: 200 });
  } catch (error) {
    console.error("Admin update review error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = req.headers.get("x-user-role");
    
    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    
    const { id } = await params;
    
    const review = await prisma.review.findUnique({
      where: { id }
    });
    
    if (!review) {
      return NextResponse.json({ message: "Review tidak ditemukan" }, { status: 404 });
    }
    
    await prisma.review.delete({
      where: { id },
    });
    
    // Update villa rating average
    const aggregations = await prisma.review.aggregate({
      where: { villaId: review.villaId },
      _avg: { rating: true },
      _count: { id: true },
    });
    
    await prisma.villa.update({
      where: { id: review.villaId },
      data: {
        ratingAverage: aggregations._avg.rating || 0,
        reviewCount: aggregations._count.id || 0,
      },
    });
    
    return NextResponse.json({ message: "Review berhasil dihapus" }, { status: 200 });
  } catch (error) {
    console.error("Admin delete review error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
