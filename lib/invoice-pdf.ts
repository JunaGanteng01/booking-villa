import type { BookingStoreRecord } from "@/lib/booking-store";
import type {
  ManualPaymentProofRecord,
  SavedBookingPaymentMethod,
  StripeCheckoutSessionRecord,
} from "@/lib/payment-store";

export type InvoicePdfInput = {
  booking: BookingStoreRecord;
  payment?: SavedBookingPaymentMethod | null;
  manualConfirmation?: ManualPaymentProofRecord | null;
  stripeSession?: StripeCheckoutSessionRecord | null;
  provider?: string | null;
  invoiceNumber?: string;
  issuedAt?: string;
};

type PdfColor = [number, number, number];

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const marginX = 48;
const emerald: PdfColor = [0.03, 0.22, 0.16];
const emeraldMuted: PdfColor = [0.09, 0.39, 0.27];
const gold: PdfColor = [0.78, 0.58, 0.28];
const beige: PdfColor = [0.95, 0.91, 0.84];
const softGray: PdfColor = [0.94, 0.95, 0.93];
const ink: PdfColor = [0.08, 0.1, 0.09];
const muted: PdfColor = [0.38, 0.42, 0.4];
const white: PdfColor = [1, 1, 1];

export function generateInvoicePdf(input: InvoicePdfInput) {
  const invoice = normalizeInvoiceInput(input);
  const content = createInvoiceContent(invoice);
  const encoder = new TextEncoder();
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
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

  return encoder.encode(pdf);
}

export function createInvoiceFileName(booking: BookingStoreRecord) {
  return `villaku-invoice-${booking.bookingCode.toLowerCase()}.pdf`;
}

function normalizeInvoiceInput(input: InvoicePdfInput) {
  const invoiceNumber =
    input.invoiceNumber ??
    input.manualConfirmation?.id ??
    `INV-${input.booking.bookingCode.replace(/[^A-Z0-9]/gi, "")}`;
  const issuedAt = input.issuedAt ?? new Date().toISOString();
  const provider =
    input.provider ??
    input.stripeSession?.provider ??
    (input.payment?.method.id === "bank-transfer" ? "MANUAL_TRANSFER" : null) ??
    "PAYMENT_GATEWAY";

  return {
    ...input,
    invoiceNumber,
    issuedAt,
    provider,
  };
}

function createInvoiceContent(invoice: ReturnType<typeof normalizeInvoiceInput>) {
  const { booking, payment, manualConfirmation, stripeSession } = invoice;
  const commands: string[] = [];

  commands.push(rect(0, 722, PAGE_WIDTH, 120, emerald));
  commands.push(rect(0, 696, PAGE_WIDTH, 26, emeraldMuted));
  commands.push(rect(marginX, 718, 84, 3, gold));
  commands.push(textAt("VillaKu", 48, 792, 24, "F2", white));
  commands.push(textAt("Premium Villa Booking", 48, 768, 10, "F1", [0.86, 0.93, 0.88]));
  commands.push(textAt("INVOICE", 428, 794, 22, "F2", white));
  commands.push(textAt(invoice.invoiceNumber, 428, 772, 10, "F1", [0.86, 0.93, 0.88]));

  commands.push(rect(48, 606, 238, 82, softGray));
  commands.push(rect(309, 606, 238, 82, softGray));
  commands.push(textAt("Bill To", 64, 666, 9, "F2", gold));
  commands.push(textAt(booking.guest.name, 64, 647, 13, "F2", ink));
  commands.push(textAt(booking.guest.email, 64, 629, 9, "F1", muted));
  commands.push(textAt(booking.guest.phone, 64, 614, 9, "F1", muted));
  commands.push(textAt("Booking", 325, 666, 9, "F2", gold));
  commands.push(textAt(booking.bookingCode, 325, 647, 13, "F2", ink));
  commands.push(textAt(`${booking.villaName} - ${booking.guests} guest`, 325, 629, 9, "F1", muted));
  commands.push(textAt(`${formatDate(booking.checkIn)} to ${formatDate(booking.checkOut)}`, 325, 614, 9, "F1", muted));

  commands.push(labelValueRow("Issued", formatDate(invoice.issuedAt), 48, 574));
  commands.push(labelValueRow("Provider", invoice.provider.replace(/_/g, " "), 218, 574));
  commands.push(labelValueRow("Booking Status", booking.status, 388, 574));
  commands.push(labelValueRow("Payment Status", booking.paymentStatus, 48, 536));
  commands.push(labelValueRow("Payment Method", payment?.method.title ?? "Not selected", 218, 536));
  commands.push(labelValueRow("Nights", `${booking.nights} night`, 388, 536));

  const tableTop = 492;
  commands.push(rect(48, tableTop, 499, 28, emerald));
  commands.push(textAt("Description", 64, tableTop + 10, 10, "F2", white));
  commands.push(rightTextAt("Amount", 529, tableTop + 10, 10, "F2", white));

  let rowY = tableTop - 26;
  const invoiceRows = [
    ...booking.lineItems.map((item) => ({
      label: item.label,
      amount: item.amount,
    })),
    ...(payment && payment.fee > 0
      ? [
          {
            label: `Payment fee - ${payment.method.title}`,
            amount: payment.fee,
          },
        ]
      : []),
  ];

  invoiceRows.slice(0, 9).forEach((row, index) => {
    if (index % 2 === 0) commands.push(rect(48, rowY - 5, 499, 22, [0.98, 0.97, 0.94]));
    commands.push(textAt(row.label, 64, rowY, 9, "F1", ink));
    commands.push(rightTextAt(formatRupiah(row.amount), 529, rowY, 9, "F1", ink));
    rowY -= 24;
  });

  commands.push(line(48, rowY + 7, 547, rowY + 7, [0.78, 0.8, 0.76], 0.8));
  rowY -= 18;
  commands.push(totalRow("Total booking", booking.amounts.totalAmount, rowY, false));
  rowY -= 22;
  commands.push(totalRow("Payable now", payment?.amount ?? booking.amounts.depositAmount, rowY, true));
  rowY -= 22;
  commands.push(totalRow("Remaining balance", booking.amounts.remainingAmount, rowY, false));

  const paymentY = 142;
  commands.push(rect(48, paymentY, 499, 88, beige));
  commands.push(textAt("Payment Note", 64, paymentY + 60, 10, "F2", emerald));
  commands.push(
    textAt(
      paymentNote({
        paymentStatus: booking.paymentStatus,
        manualStatus: manualConfirmation?.status,
        stripeStatus: stripeSession?.paymentStatus,
      }),
      64,
      paymentY + 38,
      9,
      "F1",
      ink,
    ),
  );
  commands.push(textAt(`Updated: ${formatDateTime(booking.updatedAt)}`, 64, paymentY + 18, 8, "F1", muted));

  commands.push(line(48, 92, 547, 92, [0.82, 0.84, 0.8], 0.8));
  commands.push(textAt("Thank you for choosing VillaKu.", 48, 72, 10, "F2", emerald));
  commands.push(textAt("This invoice is generated from the VillaKu booking system.", 48, 55, 8, "F1", muted));
  commands.push(rightTextAt("villaku.local", 547, 55, 8, "F1", muted));

  return commands.join("\n");
}

function labelValueRow(label: string, value: string, x: number, y: number) {
  return [
    textAt(label, x, y + 15, 8, "F2", gold),
    textAt(value, x, y, 10, "F1", ink),
  ].join("\n");
}

function totalRow(label: string, amount: number, y: number, highlight: boolean) {
  return [
    highlight ? rect(320, y - 7, 227, 24, [0.9, 0.96, 0.92]) : "",
    textAt(label, 337, y, highlight ? 11 : 10, highlight ? "F2" : "F1", ink),
    rightTextAt(formatRupiah(amount), 529, y, highlight ? 11 : 10, "F2", ink),
  ].join("\n");
}

function paymentNote({
  paymentStatus,
  manualStatus,
  stripeStatus,
}: {
  paymentStatus: BookingStoreRecord["paymentStatus"];
  manualStatus?: ManualPaymentProofRecord["status"];
  stripeStatus?: StripeCheckoutSessionRecord["paymentStatus"];
}) {
  if (paymentStatus === "PAID") return "Payment has been confirmed. Your villa booking is secured.";
  if (manualStatus) return "Manual transfer proof has been received and is waiting for finance review.";
  if (stripeStatus === "failed") return "Stripe payment failed. Please retry payment from the payment page.";
  if (paymentStatus === "REFUNDED") return "Refund has been processed for this booking.";
  return "Payment is still pending. Please complete payment before the booking hold expires.";
}

function rect(x: number, y: number, width: number, height: number, color: PdfColor) {
  return `q\n${colorCommand(color, "rg")}\n${number(x)} ${number(y)} ${number(width)} ${number(height)} re f\nQ`;
}

function line(x1: number, y1: number, x2: number, y2: number, color: PdfColor, width: number) {
  return `q\n${colorCommand(color, "RG")}\n${number(width)} w\n${number(x1)} ${number(y1)} m\n${number(x2)} ${number(y2)} l\nS\nQ`;
}

function textAt(
  value: string,
  x: number,
  y: number,
  size: number,
  font: "F1" | "F2",
  color: PdfColor,
) {
  return `BT\n/${font} ${number(size)} Tf\n${colorCommand(color, "rg")}\n1 0 0 1 ${number(x)} ${number(y)} Tm\n(${escapePdfText(value)}) Tj\nET`;
}

function rightTextAt(
  value: string,
  rightX: number,
  y: number,
  size: number,
  font: "F1" | "F2",
  color: PdfColor,
) {
  return textAt(value, rightX - estimateTextWidth(value, size, font), y, size, font, color);
}

function colorCommand(color: PdfColor, operator: "rg" | "RG") {
  return `${number(color[0])} ${number(color[1])} ${number(color[2])} ${operator}`;
}

function estimateTextWidth(value: string, size: number, font: "F1" | "F2") {
  const weight = font === "F2" ? 0.57 : 0.52;
  return sanitizePdfText(value).length * size * weight;
}

function formatRupiah(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function number(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function escapePdfText(value: string) {
  return sanitizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function sanitizePdfText(value: string) {
  return value.replace(/[^\x20-\x7E]/g, "-");
}
