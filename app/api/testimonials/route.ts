import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const testimonials = await prisma.review.findMany({
      where: {
        isFeatured: true,
      },
      include: {
        user: {
          select: {
            name: true,
            // Assuming we might have avatar/image in the future
          }
        },
        villa: {
          select: {
            name: true,
            location: true,
          }
        }
      },
      orderBy: {
        rating: "desc", // Or createdAt: "desc"
      },
      take: 6, // Limit to 6 testimonials for landing page
    });
    
    return NextResponse.json({ testimonials }, { status: 200 });
  } catch (error) {
    console.error("Get testimonials error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
