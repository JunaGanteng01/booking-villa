import type { SendAutomatedEmailInput } from "@/lib/email-service";

export type ReviewRequestTemplateInput = {
  guestName: string;
  guestEmail: string;
  bookingCode: string;
  villaName: string;
  villaId: string;
  checkOut: string | Date;
  baseUrl?: string;
  reviewPath?: string;
  incentiveText?: string;
};

export function createReviewRequestEmail(
  input: ReviewRequestTemplateInput,
): SendAutomatedEmailInput {
  const data = normalizeInput(input);
  const reviewUrl = new URL(data.reviewPath, `${data.baseUrl}/`).toString();
  const checkOut = formatDate(data.checkOut);

  return {
    to: { email: data.guestEmail, name: data.guestName },
    subject: `Bagaimana pengalaman Anda di ${data.villaName}?`,
    html: `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ceritakan pengalaman Anda bersama Villaku</title>
  </head>
  <body style="margin:0;background:#f5f0e7;color:#173d34;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Ulasan Anda membantu kami menciptakan pengalaman menginap yang lebih berkesan.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f0e7;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 22px 60px rgba(4,54,44,.11);">
            <tr>
              <td align="center" style="padding:38px 36px 34px;background:#073f35;color:#ffffff;">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:27px;font-weight:700;">Villaku</div>
                <div style="margin-top:24px;font-size:28px;letter-spacing:7px;color:#efcf71;">★ ★ ★ ★ ★</div>
                <h1 style="margin:18px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:36px;line-height:1.1;letter-spacing:-.8px;">Semoga Anda membawa pulang kenangan indah.</h1>
                <p style="margin:16px auto 0;max-width:470px;font-size:15px;line-height:1.7;color:rgba(255,255,255,.72);">Halo ${escapeHtml(data.guestName)}, terima kasih telah memilih ${escapeHtml(data.villaName)}.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 38px 38px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e5ebe6;border-radius:18px;background:#f8faf7;">
                  <tr>
                    <td style="padding:20px 22px;">
                      <div style="font-size:10px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:#87938e;">Kunjungan Anda</div>
                      <div style="margin-top:7px;font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:700;color:#135342;">${escapeHtml(data.villaName)}</div>
                      <div style="margin-top:6px;font-size:12px;color:#718079;">Check-out ${escapeHtml(checkOut)} · Booking ${escapeHtml(data.bookingCode)}</div>
                    </td>
                  </tr>
                </table>

                <h2 style="margin:28px 0 0;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:25px;color:#173f35;">Bagaimana pengalaman Anda?</h2>
                <p style="margin:11px auto 0;max-width:470px;text-align:center;font-size:14px;line-height:1.7;color:#667871;">Ulasan singkat Anda membantu tamu lain memilih villa yang tepat dan membantu tim kami terus meningkatkan layanan.</p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;">
                  <tr>
                    <td align="center">
                      <a href="${escapeHtml(reviewUrl)}" style="display:inline-block;border-radius:999px;background:#07845f;padding:15px 27px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;box-shadow:0 12px 28px rgba(7,132,95,.22);">Tulis ulasan</a>
                    </td>
                  </tr>
                </table>

                ${
                  data.incentiveText
                    ? `<div style="margin-top:24px;border-radius:16px;background:#fff8e6;padding:16px 18px;text-align:center;font-size:12px;line-height:1.7;color:#78633a;"><strong style="color:#9b7116;">Benefit tamu:</strong> ${escapeHtml(data.incentiveText)}</div>`
                    : ""
                }

                <p style="margin:25px 0 0;text-align:center;font-size:11px;line-height:1.6;color:#89948f;">Tautan ulasan hanya berlaku untuk reservasi ini. Tim Villaku tidak akan pernah meminta data pembayaran melalui formulir ulasan.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:22px;background:#f8faf7;font-size:11px;line-height:1.6;color:#83908b;">Villaku Private Resorts · Bali, Indonesia<br />Terima kasih telah menjadi bagian dari perjalanan kami.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: [
      "VILLAKU PRIVATE RESORTS — PERMINTAAN ULASAN",
      "",
      `Halo ${data.guestName},`,
      `Terima kasih telah menginap di ${data.villaName}.`,
      `Check-out: ${checkOut}`,
      `Booking: ${data.bookingCode}`,
      "",
      "Ulasan singkat Anda membantu tamu lain dan membantu tim kami meningkatkan layanan.",
      `Tulis ulasan: ${reviewUrl}`,
      ...(data.incentiveText ? ["", `Benefit tamu: ${data.incentiveText}`] : []),
    ].join("\n"),
    tags: [
      { name: "category", value: "review_request" },
      { name: "booking", value: tagSafe(data.bookingCode) },
    ],
    idempotencyKey: `booking:${tagSafe(data.bookingCode)}:review-request`,
  };
}

function normalizeInput(input: ReviewRequestTemplateInput) {
  const bookingCode = input.bookingCode.trim();
  const villaId = input.villaId.trim();
  const reviewPath =
    input.reviewPath?.trim() ||
    `/reviews/new?bookingId=${encodeURIComponent(bookingCode)}&villaId=${encodeURIComponent(villaId)}`;
  const data = {
    ...input,
    guestName: input.guestName.trim(),
    guestEmail: input.guestEmail.trim().toLowerCase(),
    bookingCode,
    villaName: input.villaName.trim(),
    villaId,
    incentiveText: input.incentiveText?.trim(),
    baseUrl: normalizeBaseUrl(input.baseUrl),
    reviewPath: normalizePath(reviewPath),
  };

  if (!data.guestName || !data.guestEmail || !bookingCode || !data.villaName || !villaId) {
    throw new Error("Data template permintaan ulasan belum lengkap.");
  }

  return data;
}

function formatDate(value: string | Date) {
  const raw = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T12:00:00+08:00`
    : value;
  const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) throw new Error("Tanggal check-out tidak valid.");
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  }).format(date);
}

function normalizeBaseUrl(value?: string) {
  const url = new URL(value?.trim() || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Base URL ulasan tidak valid.");
  return url.origin;
}

function normalizePath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) throw new Error("Path ulasan tidak valid.");
  return value;
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
