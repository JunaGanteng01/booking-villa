import { NextResponse } from "next/server";
import { listDatabaseBookingRecords } from "@/lib/booking-database";
import { isPrismaDatabaseUnavailableError } from "@/lib/prisma-errors";

export async function GET(request: Request) {
  const role = request.headers.get("x-user-role") ?? "";
  if (!["SUPER_ADMIN", "ADMIN", "RECEPTIONIST", "FINANCE"].includes(role)) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Anda tidak memiliki akses melihat booking." },
      { status: 403 },
    );
  }

  try {
    return NextResponse.json({
      data: { bookings: await listDatabaseBookingRecords() },
      meta: {
        source: "database",
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Admin booking database read error", error);
    return NextResponse.json(
      {
        error: isPrismaDatabaseUnavailableError(error)
          ? "DATABASE_UNAVAILABLE"
          : "BOOKING_LIST_FAILED",
        message: isPrismaDatabaseUnavailableError(error)
          ? "Database PostgreSQL belum tersedia."
          : "Daftar booking belum dapat dimuat.",
      },
      { status: isPrismaDatabaseUnavailableError(error) ? 503 : 500 },
    );
  }
}
