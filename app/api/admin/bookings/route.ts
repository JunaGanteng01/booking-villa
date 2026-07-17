import { NextResponse } from "next/server";
import { listBookingRecords } from "@/lib/booking-store";

export async function GET(request: Request) {
  const role = request.headers.get("x-user-role") ?? "";
  if (!["SUPER_ADMIN", "ADMIN", "RECEPTIONIST", "FINANCE"].includes(role)) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Anda tidak memiliki akses melihat booking." },
      { status: 403 },
    );
  }

  return NextResponse.json({
    data: {
      bookings: listBookingRecords(),
    },
    meta: {
      source: "live-booking-store",
      generatedAt: new Date().toISOString(),
    },
  });
}
