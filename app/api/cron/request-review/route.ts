import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Basic protection to ensure only cron or authorized clients can hit this
    // In production, we should check a CRON_SECRET token
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Find bookings that checked out in the past 24 hours, are COMPLETED, and have no review
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const today = new Date();

    const bookingsToReview = await prisma.booking.findMany({
      where: {
        status: "COMPLETED", // Assuming COMPLETED means they finished their stay
        checkOut: {
          gte: yesterday,
          lte: today,
        },
        villa: {
          reviews: {
            none: {} // Simplified: we should ideally check if *this user* reviewed this booking
          }
        }
      },
      include: {
        user: true,
        villa: true,
      }
    });

    const emailsSent = [];

    for (const booking of bookingsToReview) {
      if (!booking.userId || !booking.user) {
        continue;
      }

      // Check if user already reviewed this specific villa recently
      const existingReview = await prisma.review.findFirst({
        where: {
          userId: booking.userId,
          villaId: booking.villaId,
        }
      });

      if (!existingReview) {
        // Simulate sending email
        const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/villas/${booking.villaId}/review`;
        
        console.log(`[CRON] Mengirim email permintaan ulasan ke ${booking.user.email} untuk villa ${booking.villa.name}. Link: ${reviewUrl}`);
        
        emailsSent.push({
          bookingId: booking.id,
          userEmail: booking.user.email,
        });
        
        // Mark as sent or save log if needed
      }
    }

    return NextResponse.json({
      message: "Proses trigger permintaan ulasan selesai",
      processedCount: emailsSent.length,
      details: emailsSent,
    }, { status: 200 });

  } catch (error) {
    console.error("Cron review trigger error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
