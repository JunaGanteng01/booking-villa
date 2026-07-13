import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  villaId: z.string().min(1, "ID Villa dibutuhkan"),
  rating: z.number().min(1, "Rating minimal 1").max(5, "Rating maksimal 5"),
  comment: z.string().min(10, "Komentar minimal 10 karakter").max(1000, "Komentar maksimal 1000 karakter"),
});

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
    
    const validationResult = reviewSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Input tidak valid", errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { villaId, rating, comment } = validationResult.data;
    
    // Check if user has booked this villa before
    const pastBooking = await prisma.booking.findFirst({
      where: {
        userId,
        villaId,
        status: {
          in: ["COMPLETED", "CONFIRMED"] // Assuming confirmed/completed bookings can review
        }
      }
    });
    
    if (!pastBooking) {
      return NextResponse.json(
        { message: "Anda harus pernah memesan villa ini sebelum memberikan ulasan." },
        { status: 403 }
      );
    }
    
    // Check if user already reviewed this villa
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        villaId,
      }
    });
    
    if (existingReview) {
      return NextResponse.json(
        { message: "Anda sudah memberikan ulasan untuk villa ini." },
        { status: 400 }
      );
    }
    
    const review = await prisma.review.create({
      data: {
        userId,
        villaId,
        rating,
        comment,
        isFeatured: false,
      },
    });
    
    // Update villa rating average and review count
    const aggregations = await prisma.review.aggregate({
      where: { villaId },
      _avg: { rating: true },
      _count: { id: true },
    });
    
    await prisma.villa.update({
      where: { id: villaId },
      data: {
        ratingAverage: aggregations._avg.rating || 0,
        reviewCount: aggregations._count.id || 0,
      },
    });
    
    return NextResponse.json({ review, message: "Ulasan berhasil dikirim." }, { status: 201 });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const villaId = searchParams.get("villaId");
    
    if (!villaId) {
      return NextResponse.json(
        { message: "villaId dibutuhkan" },
        { status: 400 }
      );
    }
    
    const reviews = await prisma.review.findMany({
      where: { villaId },
      include: {
        user: {
          select: {
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    
    return NextResponse.json({ reviews }, { status: 200 });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
