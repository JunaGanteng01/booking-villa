import { NextResponse } from "next/server";
import { createBookingInvoice } from "@/lib/invoice-service";

export async function GET(request: Request) {
  const bookingId = decodeURIComponent(
    new URL(request.url).pathname.split("/").filter(Boolean)[2] ?? "",
  );
  const invoice = await createBookingInvoice(bookingId);

  if (!invoice) {
    return NextResponse.json(
      {
        error: "BOOKING_NOT_FOUND",
        message: "Invoice untuk pesanan ini tidak ditemukan.",
      },
      { status: 404 },
    );
  }

  const body = invoice.pdf.buffer.slice(
    invoice.pdf.byteOffset,
    invoice.pdf.byteOffset + invoice.pdf.byteLength,
  ) as ArrayBuffer;
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(invoice.pdf.byteLength),
      "Content-Disposition": `attachment; filename="${invoice.fileName}"`,
      "Cache-Control": "no-store",
      "X-Invoice-Source": invoice.source,
    },
  });
}
