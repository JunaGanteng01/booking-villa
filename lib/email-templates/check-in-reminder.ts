import type { SendAutomatedEmailInput } from "@/lib/email-service";

export type CheckInReminderTemplateInput = {
  guestName: string;
  guestEmail: string;
  bookingCode: string;
  villaName: string;
  checkIn: string | Date;
  checkOut: string | Date;
  villaAddress: string;
  mapsUrl?: string;
  checkInTime?: string;
  checkOutTime?: string;
  conciergePhone?: string;
  arrivalNotes?: string[];
  baseUrl?: string;
  bookingPath?: string;
};

export function createCheckInReminderEmail(
  input: CheckInReminderTemplateInput,
): SendAutomatedEmailInput {
  const data = normalizeInput(input);
  const checkInDate = formatDate(data.checkIn);
  const checkOutDate = formatDate(data.checkOut);
  const bookingUrl = new URL(data.bookingPath, `${data.baseUrl}/`).toString();
  const mapsUrl = data.mapsUrl ?? createGoogleMapsUrl(data.villaAddress);

  return {
    to: { email: data.guestEmail, name: data.guestName },
    subject: `Pengingat check-in — ${data.villaName}, ${checkInDate}`,
    html: `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pengingat check-in ${escapeHtml(data.villaName)}</title>
  </head>
  <body style="margin:0;background:#eef3ef;color:#173e34;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Perjalanan Anda ke ${escapeHtml(data.villaName)} segera dimulai.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef3ef;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 22px 60px rgba(4,54,44,.12);">
            <tr>
              <td style="padding:34px 36px;background:linear-gradient(135deg,#073f35,#08745a);color:#ffffff;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-family:Georgia,'Times New Roman',serif;font-size:27px;font-weight:700;">Villaku</td>
                    <td align="right" style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#f3d98e;">Arrival guide</td>
                  </tr>
                </table>
                <div style="margin-top:30px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#f3d98e;">Waktunya bersiap</div>
                <h1 style="margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:1.08;letter-spacing:-1px;">Liburan Anda sudah dekat.</h1>
                <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,.75);">Halo ${escapeHtml(data.guestName)}, berikut detail kedatangan untuk booking ${escapeHtml(data.bookingCode)}.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 36px 36px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e3eae4;border-radius:20px;background:#f8faf7;">
                  <tr>
                    <td style="padding:22px;">
                      <div style="font-family:Georgia,'Times New Roman',serif;font-size:23px;font-weight:700;color:#0b5543;">${escapeHtml(data.villaName)}</div>
                      <div style="margin-top:9px;font-size:13px;line-height:1.6;color:#687a73;">${escapeHtml(data.villaAddress)}</div>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;border-collapse:separate;border-spacing:10px 0;">
                  <tr>
                    <td width="50%" style="border-radius:17px;background:#f5f0e4;padding:18px;">
                      <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#8a7a50;">Check-in</div>
                      <div style="margin-top:7px;font-size:14px;font-weight:700;line-height:1.5;color:#3f492d;">${escapeHtml(checkInDate)}</div>
                      <div style="margin-top:4px;font-size:12px;color:#7f805e;">Mulai pukul ${escapeHtml(data.checkInTime)} WITA</div>
                    </td>
                    <td width="50%" style="border-radius:17px;background:#eef6f2;padding:18px;">
                      <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#4d786b;">Check-out</div>
                      <div style="margin-top:7px;font-size:14px;font-weight:700;line-height:1.5;color:#2e5147;">${escapeHtml(checkOutDate)}</div>
                      <div style="margin-top:4px;font-size:12px;color:#6e867e;">Sebelum pukul ${escapeHtml(data.checkOutTime)} WITA</div>
                    </td>
                  </tr>
                </table>

                <div style="margin-top:24px;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#7b8a84;">Sebelum berangkat</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:10px;">
                  ${data.arrivalNotes.map((note, index) => noteRow(index + 1, note)).join("")}
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:26px;">
                  <tr>
                    <td align="center" style="padding:0 5px 10px;">
                      <a href="${escapeHtml(mapsUrl)}" style="display:inline-block;border-radius:999px;background:#07845f;padding:14px 22px;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;">Buka petunjuk arah</a>
                    </td>
                    <td align="center" style="padding:0 5px 10px;">
                      <a href="${escapeHtml(bookingUrl)}" style="display:inline-block;border:1px solid #cfdad4;border-radius:999px;background:#ffffff;padding:13px 22px;color:#1d5848;font-size:13px;font-weight:700;text-decoration:none;">Lihat reservasi</a>
                    </td>
                  </tr>
                </table>

                <div style="margin-top:22px;border-radius:16px;background:#fff8e7;padding:17px 19px;font-size:12px;line-height:1.7;color:#74623b;">
                  Butuh bantuan saat perjalanan? Hubungi concierge di <strong>${escapeHtml(data.conciergePhone)}</strong>. Tim kami siap membantu pukul 07.00–23.00 WITA.
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:22px;background:#f8faf7;font-size:11px;line-height:1.6;color:#83908b;">Villaku Private Resorts · Bali, Indonesia<br />Pengingat otomatis untuk booking ${escapeHtml(data.bookingCode)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: [
      "VILLAKU PRIVATE RESORTS — PENGINGAT CHECK-IN",
      "",
      `Halo ${data.guestName}, perjalanan Anda ke ${data.villaName} sudah dekat.`,
      `Booking: ${data.bookingCode}`,
      `Alamat: ${data.villaAddress}`,
      `Check-in: ${checkInDate}, mulai ${data.checkInTime} WITA`,
      `Check-out: ${checkOutDate}, sebelum ${data.checkOutTime} WITA`,
      "",
      "Sebelum berangkat:",
      ...data.arrivalNotes.map((note) => `- ${note}`),
      "",
      `Petunjuk arah: ${mapsUrl}`,
      `Lihat reservasi: ${bookingUrl}`,
      `Concierge: ${data.conciergePhone}`,
    ].join("\n"),
    tags: [
      { name: "category", value: "checkin_reminder" },
      { name: "booking", value: tagSafe(data.bookingCode) },
    ],
    idempotencyKey: `booking:${tagSafe(data.bookingCode)}:checkin-reminder:${dateKey(data.checkIn)}`,
  };
}

function normalizeInput(input: CheckInReminderTemplateInput) {
  const data = {
    ...input,
    guestName: input.guestName.trim(),
    guestEmail: input.guestEmail.trim().toLowerCase(),
    bookingCode: input.bookingCode.trim(),
    villaName: input.villaName.trim(),
    villaAddress: input.villaAddress.trim(),
    checkInTime: input.checkInTime?.trim() || "14.00",
    checkOutTime: input.checkOutTime?.trim() || "11.00",
    conciergePhone: input.conciergePhone?.trim() || "+62 811 3838 2026",
    arrivalNotes:
      input.arrivalNotes?.map((note) => note.trim()).filter(Boolean) ?? [
        "Siapkan identitas sesuai nama pemesan.",
        "Konfirmasikan estimasi waktu tiba kepada concierge.",
        "Simpan kode booking untuk proses check-in.",
      ],
    baseUrl: normalizeBaseUrl(input.baseUrl),
    bookingPath: normalizePath(input.bookingPath ?? "/dashboard"),
    mapsUrl: input.mapsUrl ? normalizeExternalUrl(input.mapsUrl) : undefined,
  };

  if (
    !data.guestName ||
    !data.guestEmail ||
    !data.bookingCode ||
    !data.villaName ||
    !data.villaAddress
  ) {
    throw new Error("Data template pengingat check-in belum lengkap.");
  }

  return data;
}

function noteRow(index: number, note: string) {
  return `<tr>
    <td width="34" valign="top" style="padding:8px 0;"><span style="display:inline-block;width:24px;height:24px;border-radius:999px;background:#e2f1e9;text-align:center;font-size:11px;font-weight:700;line-height:24px;color:#167359;">${index}</span></td>
    <td style="padding:9px 0;font-size:13px;line-height:1.6;color:#50675f;">${escapeHtml(note)}</td>
  </tr>`;
}

function formatDate(value: string | Date) {
  const date = parseDate(value);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  }).format(date);
}

function dateKey(value: string | Date) {
  const date = parseDate(value);
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Makassar",
  }).format(date);
}

function parseDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(`${value}T12:00:00+08:00`);
  if (Number.isNaN(date.getTime())) throw new Error("Tanggal check-in tidak valid.");
  return date;
}

function createGoogleMapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function normalizeBaseUrl(value?: string) {
  const url = new URL(value?.trim() || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Base URL check-in tidak valid.");
  return url.origin;
}

function normalizePath(value: string) {
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Path booking tidak valid.");
  return path;
}

function normalizeExternalUrl(value: string) {
  const url = new URL(value.trim());
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("URL peta tidak valid.");
  return url.toString();
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
