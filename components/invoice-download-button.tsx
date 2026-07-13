"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  BookingDraft,
  ManualPaymentConfirmation,
  PaymentDraft,
} from "@/lib/booking-draft";
import { formatRupiah } from "@/lib/villa-data";

export function InvoiceDownloadButton({
  booking,
  payment,
  manualConfirmation,
}: {
  booking: BookingDraft;
  payment: PaymentDraft | null;
  manualConfirmation: ManualPaymentConfirmation | null;
}) {
  const downloadInvoice = () => {
    const pdf = createInvoicePdf(booking, payment, manualConfirmation);
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `villaku-invoice-${booking.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 800);
  };

  return (
    <Button className="w-full" variant="gold" type="button" onClick={downloadInvoice}>
      <Download />
      Unduh invoice PDF
    </Button>
  );
}

function createInvoicePdf(
  booking: BookingDraft,
  payment: PaymentDraft | null,
  manualConfirmation: ManualPaymentConfirmation | null,
) {
  const lines = [
    "VillaKu Invoice",
    `Invoice: ${manualConfirmation?.id ?? `INV-${booking.id}`}`,
    `Booking: ${booking.id}`,
    `Villa: ${booking.villa.name}`,
    `Guest: ${booking.guest.name || "-"}`,
    `Stay: ${booking.stay.checkIn} to ${booking.stay.checkOut}`,
    `Guests: ${booking.stay.guests}`,
    "",
    "Price Detail",
    `Subtotal villa: ${formatRupiah(booking.pricing.subtotal)}`,
    `Guest service: ${formatRupiah(booking.pricing.guestService)}`,
    `Add-ons: ${formatRupiah(booking.pricing.addOnsTotal)}`,
    `Discount: -${formatRupiah(booking.pricing.discount)}`,
    `Service: ${formatRupiah(booking.pricing.service)}`,
    `Tax: ${formatRupiah(booking.pricing.tax)}`,
    `Total booking: ${formatRupiah(booking.pricing.total)}`,
    `Deposit: ${formatRupiah(booking.pricing.deposit)}`,
    "",
    "Payment",
    `Method: ${payment?.method.title ?? "Not selected"}`,
    `Payable now: ${formatRupiah(payment?.amount ?? booking.pricing.deposit)}`,
    `Status: ${manualConfirmation?.status ?? payment?.status ?? "draft"}`,
    "",
    "This PDF is generated from frontend mock data.",
  ];
  const content = createPdfTextContent(lines);
  const encoder = new TextEncoder();
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

function createPdfTextContent(lines: string[]) {
  const commands = ["BT", "/F1 20 Tf", "50 790 Td", `(${escapePdfText(lines[0] ?? "Invoice")}) Tj`, "/F1 11 Tf"];
  lines.slice(1).forEach((line) => {
    commands.push("0 -18 Td");
    commands.push(`(${escapePdfText(line)}) Tj`);
  });
  commands.push("ET");

  return commands.join("\n");
}

function escapePdfText(value: string) {
  return value
    .replace(/[^\x20-\x7E]/g, "-")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}
