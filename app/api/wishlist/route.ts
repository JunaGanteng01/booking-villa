import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const wishlists = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        villa: {
          select: {
            id: true,
            name: true,
            location: true,
            pricePerNight: true,
            ratingAverage: true,
            images: {
              where: { isCover: true },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json({ wishlists }, { status: 200 });
  } catch (error) {
    console.error("Get wishlist error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { villaId } = body;
    
    if (!villaId) {
      return NextResponse.json(
        { message: "villaId dibutuhkan" },
        { status: 400 }
      );
    }
    
    // Check if already in wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_villaId: {
          userId,
          villaId,
        },
      },
    });
    
    if (existing) {
      return NextResponse.json(
        { message: "Villa sudah ada di wishlist" },
        { status: 400 }
      );
    }
    
    const wishlist = await prisma.wishlist.create({
      data: {
        userId,
        villaId,
      },
    });
    
    return NextResponse.json({ wishlist, message: "Berhasil ditambahkan ke wishlist" }, { status: 201 });
  } catch (error) {
    console.error("Add wishlist error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
