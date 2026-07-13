import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const userRole = req.headers.get("x-user-role");
    
    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const villaId = searchParams.get("villaId");
    const isFeatured = searchParams.get("isFeatured");
    
    const whereClause: any = {};
    if (villaId) whereClause.villaId = villaId;
    if (isFeatured !== null) whereClause.isFeatured = isFeatured === 'true';
    
    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, email: true }
        },
        villa: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    
    return NextResponse.json({ reviews }, { status: 200 });
  } catch (error) {
    console.error("Admin get reviews error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
