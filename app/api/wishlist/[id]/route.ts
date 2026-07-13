import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // In Next.js 15, params is a Promise, so we must await it
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { message: "ID dibutuhkan" },
        { status: 400 }
      );
    }
    
    // Check if the wishlist item exists and belongs to the user
    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
    });
    
    if (!wishlist) {
      return NextResponse.json(
        { message: "Wishlist tidak ditemukan" },
        { status: 404 }
      );
    }
    
    if (wishlist.userId !== userId) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }
    
    await prisma.wishlist.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: "Berhasil dihapus dari wishlist" }, { status: 200 });
  } catch (error) {
    console.error("Delete wishlist error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
