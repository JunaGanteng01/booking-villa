import type { SendAutomatedEmailInput } from "@/lib/email-service";

export type BookingConfirmationTemplateInput = {
  guestName: string;
  guestEmail: string;
  bookingCode: string;
  villaName: string;
  checkIn: string | Date;
  checkOut: string | Date;
  nights: number;
  guests: number;
  totalAmount: number;
  currency?: string;
  paymentStatus?: "PAID" | "PARTIALLY_PAID" | "UNPAID";
  baseUrl?: string;
  manageBookingPath?: string;
};

export function createBookingConfirmationEmail(
  input: BookingConfirmationTemplateInput,
): SendAutomatedEmailInput {
  const data = normalizeTemplateInput(input);
  const manageBookingUrl = buildAbsoluteUrl(data.baseUrl, data.manageBookingPath);
  const checkIn = formatStayDate(data.checkIn);
  const checkOut = formatStayDate(data.checkOut);
  const total = formatMoney(data.totalAmount, data.currency);
  const paymentLabel = paymentStatusLabel(data.paymentStatus);
  const previewText = `Booking ${data.bookingCode} di ${data.villaName} telah dikonfirmasi.`;

  return {
    to: {
      email: data.guestEmail,
      name: data.guestName,
    },
    subject: `Booking ${data.bookingCode} dikonfirmasi — ${data.villaName}`,
    html: `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(previewText)}</title>
  </head>
  <body style="margin:0;background:#f3efe7;color:#12372f;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(previewText)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3efe7;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 22px 60px rgba(4,54,44,.12);">
            <tr>
              <td style="padding:34px 36px;background:#073f35;color:#ffffff;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;letter-spacing:-.5px;">Villaku</td>
                    <td align="right" style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#dfc47a;">Private Resorts</td>
                  </tr>
                </table>
                <div style="margin-top:28px;display:inline-block;border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:7px 12px;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#f4d98e;">Reservasi dikonfirmasi</div>
                <h1 style="margin:18px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:1.08;font-weight:700;letter-spacing:-1px;">Perjalanan Anda siap dimulai.</h1>
                <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,.72);">Halo ${escapeHtml(data.guestName)}, reservasi Anda di ${escapeHtml(data.villaName)} telah kami konfirmasi.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 36px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e5e9e2;border-radius:20px;background:#f8faf7;">
                  <tr>
                    <td style="padding:24px;">
                      <div style="font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#6f817b;">Kode booking</div>
                      <div style="margin-top:6px;font-family:Georgia,'Times New Roman',serif;font-size:27px;font-weight:700;color:#0d493d;">${escapeHtml(data.bookingCode)}</div>
                      <div style="margin-top:4px;font-size:14px;color:#61716b;">${escapeHtml(data.villaName)}</div>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;border-collapse:separate;border-spacing:0 10px;">
                  ${detailRow("Check-in", checkIn)}
                  ${detailRow("Check-out", checkOut)}
                  ${detailRow("Durasi", `${data.nights} malam`)}
                  ${detailRow("Tamu", `${data.guests} orang`)}
                  ${detailRow("Total reservasi", total, true)}
                  ${detailRow("Status pembayaran", paymentLabel)}
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;">
                  <tr>
                    <td align="center">
                      <a href="${escapeHtml(manageBookingUrl)}" style="display:inline-block;border-radius:999px;background:#07845f;padding:15px 26px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;box-shadow:0 12px 28px rgba(7,132,95,.22);">Kelola reservasi</a>
                    </td>
                  </tr>
                </table>

                <div style="margin-top:28px;border-top:1px solid #edf0eb;padding-top:22px;font-size:13px;line-height:1.7;color:#718079;">
                  Simpan email ini untuk proses check-in. Tim concierge Villaku siap membantu setiap hari pukul 07.00–23.00 WITA.
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:22px 28px;background:#f8faf7;font-size:11px;line-height:1.6;color:#83908b;">
                Villaku Private Resorts · Bali, Indonesia<br />Email otomatis ini dikirim untuk reservasi ${escapeHtml(data.bookingCode)}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: [
      "VILLAKU PRIVATE RESORTS",
      "",
      `Halo ${data.guestName},`,
      `Reservasi Anda di ${data.villaName} telah dikonfirmasi.`,
      "",
      `Kode booking: ${data.bookingCode}`,
      `Check-in: ${checkIn}`,
      `Check-out: ${checkOut}`,
      `Durasi: ${data.nights} malam`,
      `Tamu: ${data.guests} orang`,
      `Total reservasi: ${total}`,
      `Status pembayaran: ${paymentLabel}`,
      "",
      `Kelola reservasi: ${manageBookingUrl}`,
      "",
      "Tim concierge Villaku siap membantu setiap hari pukul 07.00–23.00 WITA.",
    ].join("\n"),
    tags: [
      { name: "category", value: "booking_confirmation" },
      { name: "booking", value: tagSafe(data.bookingCode) },
    ],
    idempotencyKey: `booking:${tagSafe(data.bookingCode)}:confirmation-email`,
  };
}

function normalizeTemplateInput(input: BookingConfirmationTemplateInput) {
  const guestName = input.guestName.trim();
  const guestEmail = input.guestEmail.trim().toLowerCase();
  const bookingCode = input.bookingCode.trim();
  const villaName = input.villaName.trim();
  const nights = Math.max(1, Math.trunc(input.nights));
  const guests = Math.max(1, Math.trunc(input.guests));
  const totalAmount = Math.max(0, Math.round(input.totalAmount));

  if (!guestName || !guestEmail || !bookingCode || !villaName) {
    throw new Error("Data utama template konfirmasi booking belum lengkap.");
  }

  return {
    ...input,
    guestName,
    guestEmail,
    bookingCode,
    villaName,
    nights,
    guests,
    totalAmount,
    currency: input.currency?.trim().toUpperCase() || "IDR",
    paymentStatus: input.paymentStatus ?? "PAID",
    baseUrl: normalizeBaseUrl(input.baseUrl),
    manageBookingPath: normalizeManagePath(input.manageBookingPath),
  };
}

function detailRow(label: string, value: string, emphasized = false) {
  return `<tr>
    <td style="padding:9px 0;font-size:13px;color:#74817c;">${escapeHtml(label)}</td>
    <td align="right" style="padding:9px 0;font-size:${emphasized ? "16px" : "13px"};font-weight:700;color:${emphasized ? "#0b7459" : "#233f37"};">${escapeHtml(value)}</td>
  </tr>`;
}

function formatStayDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(`${value}T12:00:00+08:00`);
  if (Number.isNaN(date.getTime())) throw new Error("Tanggal booking tidak valid.");

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  }).format(date);
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function paymentStatusLabel(status: BookingConfirmationTemplateInput["paymentStatus"]) {
  if (status === "PARTIALLY_PAID") return "Deposit diterima";
  if (status === "UNPAID") return "Menunggu pembayaran";
  return "Lunas";
}

function normalizeBaseUrl(value?: string) {
  const fallback = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = new URL(value?.trim() || fallback);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Base URL email harus menggunakan HTTP atau HTTPS.");
  }
  return url.origin;
}

function normalizeManagePath(value?: string) {
  const path = value?.trim() || "/dashboard";
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Path pengelolaan booking tidak valid.");
  }
  return path;
}

function buildAbsoluteUrl(baseUrl: string, path: string) {
  return new URL(path, `${baseUrl}/`).toString();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tagSafe(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}
