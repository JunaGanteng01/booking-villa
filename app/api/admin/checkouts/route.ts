import { NextResponse } from "next/server";
import { listReceptionCheckoutBookings } from "@/lib/checkout-service";

export async function GET(request: Request) {
  const role = request.headers.get("x-user-role")?.trim();
  if (!["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"].includes(role ?? "")) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Daftar checkout hanya tersedia untuk tim operasional." },
      { status: 403 },
    );
  }

  try {
    const bookings = await listReceptionCheckoutBookings();
    return NextResponse.json({
      data: { bookings },
      meta: { source: "database", generatedAt: new Date().toISOString() },
    });
  } catch (error) {
    console.error("Reception checkout list error", error);
    return NextResponse.json(
      { error: "CHECKOUT_LIST_FAILED", message: "Daftar checkout belum dapat dimuat." },
      { status: 500 },
    );
  }
}
