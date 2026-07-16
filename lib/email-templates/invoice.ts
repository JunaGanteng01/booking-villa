import type { SendAutomatedEmailInput } from "@/lib/email-service";

export type InvoiceEmailLineItem = {
  label: string;
  quantity?: number;
  unitAmount?: number;
  totalAmount: number;
};

export type InvoiceEmailTemplateInput = {
  guestName: string;
  guestEmail: string;
  invoiceNumber: string;
  bookingCode: string;
  villaName: string;
  issuedAt: string | Date;
  dueAt?: string | Date | null;
  lineItems: InvoiceEmailLineItem[];
  subtotal: number;
  discountAmount?: number;
  serviceFee?: number;
  taxAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  currency?: string;
  baseUrl?: string;
  invoicePath?: string;
};

export function createInvoiceEmail(
  input: InvoiceEmailTemplateInput,
): SendAutomatedEmailInput {
  const data = normalizeInvoiceInput(input);
  const balance = Math.max(0, data.totalAmount - data.paidAmount);
  const status = balance === 0 ? "LUNAS" : data.paidAmount > 0 ? "DIBAYAR SEBAGIAN" : "MENUNGGU PEMBAYARAN";
  const invoiceUrl = new URL(data.invoicePath, `${data.baseUrl}/`).toString();
  const issuedAt = formatDate(data.issuedAt);
  const dueAt = data.dueAt ? formatDate(data.dueAt) : "Bayar segera";

  return {
    to: { email: data.guestEmail, name: data.guestName },
    subject: `Invoice ${data.invoiceNumber} — Booking ${data.bookingCode}`,
    html: `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invoice ${escapeHtml(data.invoiceNumber)}</title>
  </head>
  <body style="margin:0;background:#f3efe7;color:#183a32;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Invoice ${escapeHtml(data.invoiceNumber)} untuk booking ${escapeHtml(data.bookingCode)}.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3efe7;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 22px 60px rgba(4,54,44,.12);">
            <tr>
              <td style="padding:32px 36px;background:#073f35;color:#ffffff;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;">Villaku</td>
                    <td align="right" style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#dfc47a;">Invoice</td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
                  <tr>
                    <td>
                      <div style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:rgba(255,255,255,.55);">Nomor invoice</div>
                      <div style="margin-top:7px;font-family:Georgia,'Times New Roman',serif;font-size:29px;font-weight:700;">${escapeHtml(data.invoiceNumber)}</div>
                    </td>
                    <td align="right" valign="bottom">
                      <span style="display:inline-block;border-radius:999px;background:${balance === 0 ? "#0f765a" : "#9a7115"};padding:8px 12px;font-size:10px;font-weight:700;letter-spacing:1px;color:#ffffff;">${status}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 36px 36px;">
                <p style="margin:0;font-size:15px;line-height:1.7;color:#526861;">Halo ${escapeHtml(data.guestName)}, berikut rincian tagihan reservasi Anda di <strong style="color:#173f35;">${escapeHtml(data.villaName)}</strong>.</p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;border:1px solid #e7ebe6;border-radius:18px;background:#f8faf7;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#80908a;">Booking</td>
                          <td align="right" style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#80908a;">Tanggal terbit</td>
                        </tr>
                        <tr>
                          <td style="padding-top:6px;font-size:15px;font-weight:700;color:#174a3d;">${escapeHtml(data.bookingCode)}</td>
                          <td align="right" style="padding-top:6px;font-size:14px;color:#354f47;">${escapeHtml(issuedAt)}</td>
                        </tr>
                        <tr>
                          <td style="padding-top:13px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#80908a;">Properti</td>
                          <td align="right" style="padding-top:13px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#80908a;">Jatuh tempo</td>
                        </tr>
                        <tr>
                          <td style="padding-top:6px;font-size:14px;color:#354f47;">${escapeHtml(data.villaName)}</td>
                          <td align="right" style="padding-top:6px;font-size:14px;color:#354f47;">${escapeHtml(dueAt)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;border-collapse:collapse;">
                  <tr>
                    <th align="left" style="border-bottom:1px solid #dfe6df;padding:10px 0;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#84918d;">Rincian</th>
                    <th align="center" style="border-bottom:1px solid #dfe6df;padding:10px 8px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#84918d;">Qty</th>
                    <th align="right" style="border-bottom:1px solid #dfe6df;padding:10px 0;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#84918d;">Jumlah</th>
                  </tr>
                  ${data.lineItems.map((item) => invoiceLineRow(item, data.currency)).join("")}
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;">
                  ${amountRow("Subtotal", data.subtotal, data.currency)}
                  ${data.discountAmount > 0 ? amountRow("Diskon", -data.discountAmount, data.currency) : ""}
                  ${data.serviceFee > 0 ? amountRow("Biaya layanan", data.serviceFee, data.currency) : ""}
                  ${data.taxAmount > 0 ? amountRow("Pajak", data.taxAmount, data.currency) : ""}
                  <tr>
                    <td style="border-top:1px solid #dfe6df;padding-top:15px;font-size:14px;font-weight:700;color:#20453b;">Total invoice</td>
                    <td align="right" style="border-top:1px solid #dfe6df;padding-top:15px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#087153;">${escapeHtml(formatMoney(data.totalAmount, data.currency))}</td>
                  </tr>
                  ${data.paidAmount > 0 ? amountRow("Sudah dibayar", -data.paidAmount, data.currency) : ""}
                  <tr>
                    <td style="padding-top:13px;font-size:14px;font-weight:700;color:#20453b;">Sisa tagihan</td>
                    <td align="right" style="padding-top:13px;font-size:17px;font-weight:700;color:#9a7115;">${escapeHtml(formatMoney(balance, data.currency))}</td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
                  <tr>
                    <td align="center">
                      <a href="${escapeHtml(invoiceUrl)}" style="display:inline-block;border-radius:999px;background:#07845f;padding:15px 26px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;box-shadow:0 12px 28px rgba(7,132,95,.22);">Lihat &amp; unduh invoice</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;text-align:center;font-size:12px;line-height:1.6;color:#82908a;">Jika pembayaran sudah dilakukan, abaikan pengingat ini. Status akan diperbarui setelah verifikasi.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:22px;background:#f8faf7;font-size:11px;line-height:1.6;color:#83908b;">Villaku Private Resorts · Bali, Indonesia<br />Dokumen untuk reservasi ${escapeHtml(data.bookingCode)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: buildPlainTextInvoice(data, { issuedAt, dueAt, balance, status, invoiceUrl }),
    tags: [
      { name: "category", value: "invoice" },
      { name: "booking", value: tagSafe(data.bookingCode) },
    ],
    idempotencyKey: `invoice:${tagSafe(data.invoiceNumber)}:email`,
  };
}

function normalizeInvoiceInput(input: InvoiceEmailTemplateInput) {
  const data = {
    ...input,
    guestName: input.guestName.trim(),
    guestEmail: input.guestEmail.trim().toLowerCase(),
    invoiceNumber: input.invoiceNumber.trim(),
    bookingCode: input.bookingCode.trim(),
    villaName: input.villaName.trim(),
    lineItems: input.lineItems.map((item) => ({
      label: item.label.trim(),
      quantity: Math.max(1, Math.trunc(item.quantity ?? 1)),
      unitAmount: Math.max(0, Math.round(item.unitAmount ?? item.totalAmount)),
      totalAmount: Math.round(item.totalAmount),
    })),
    subtotal: Math.max(0, Math.round(input.subtotal)),
    discountAmount: Math.max(0, Math.round(input.discountAmount ?? 0)),
    serviceFee: Math.max(0, Math.round(input.serviceFee ?? 0)),
    taxAmount: Math.max(0, Math.round(input.taxAmount ?? 0)),
    totalAmount: Math.max(0, Math.round(input.totalAmount)),
    paidAmount: Math.max(0, Math.round(input.paidAmount ?? 0)),
    currency: input.currency?.trim().toUpperCase() || "IDR",
    baseUrl: normalizeBaseUrl(input.baseUrl),
    invoicePath: normalizePath(input.invoicePath ?? "/dashboard"),
  };

  if (
    !data.guestName ||
    !data.guestEmail ||
    !data.invoiceNumber ||
    !data.bookingCode ||
    !data.villaName ||
    !data.lineItems.length ||
    data.lineItems.some((item) => !item.label)
  ) {
    throw new Error("Data template invoice belum lengkap.");
  }

  return data;
}

function invoiceLineRow(item: ReturnType<typeof normalizeInvoiceInput>["lineItems"][number], currency: string) {
  const unitLabel = item.quantity > 1 ? `${formatMoney(item.unitAmount, currency)} / unit` : "";
  return `<tr>
    <td style="border-bottom:1px solid #eef1ed;padding:14px 0;font-size:13px;line-height:1.5;color:#304e45;">${escapeHtml(item.label)}${unitLabel ? `<div style="margin-top:3px;font-size:10px;color:#89948f;">${escapeHtml(unitLabel)}</div>` : ""}</td>
    <td align="center" style="border-bottom:1px solid #eef1ed;padding:14px 8px;font-size:12px;color:#6f7e78;">${item.quantity}</td>
    <td align="right" style="border-bottom:1px solid #eef1ed;padding:14px 0;font-size:13px;font-weight:700;color:#24483e;">${escapeHtml(formatMoney(item.totalAmount, currency))}</td>
  </tr>`;
}

function amountRow(label: string, amount: number, currency: string) {
  return `<tr>
    <td style="padding:6px 0;font-size:12px;color:#74817c;">${escapeHtml(label)}</td>
    <td align="right" style="padding:6px 0;font-size:12px;font-weight:700;color:#354f47;">${escapeHtml(formatMoney(amount, currency))}</td>
  </tr>`;
}

function buildPlainTextInvoice(
  data: ReturnType<typeof normalizeInvoiceInput>,
  meta: { issuedAt: string; dueAt: string; balance: number; status: string; invoiceUrl: string },
) {
  return [
    "VILLAKU PRIVATE RESORTS — INVOICE",
    "",
    `Invoice: ${data.invoiceNumber}`,
    `Booking: ${data.bookingCode}`,
    `Tamu: ${data.guestName}`,
    `Villa: ${data.villaName}`,
    `Tanggal terbit: ${meta.issuedAt}`,
    `Jatuh tempo: ${meta.dueAt}`,
    `Status: ${meta.status}`,
    "",
    "RINCIAN",
    ...data.lineItems.map(
      (item) => `- ${item.label} x${item.quantity}: ${formatMoney(item.totalAmount, data.currency)}`,
    ),
    "",
    `Subtotal: ${formatMoney(data.subtotal, data.currency)}`,
    ...(data.discountAmount > 0 ? [`Diskon: -${formatMoney(data.discountAmount, data.currency)}`] : []),
    ...(data.serviceFee > 0 ? [`Biaya layanan: ${formatMoney(data.serviceFee, data.currency)}`] : []),
    ...(data.taxAmount > 0 ? [`Pajak: ${formatMoney(data.taxAmount, data.currency)}`] : []),
    `Total invoice: ${formatMoney(data.totalAmount, data.currency)}`,
    `Sudah dibayar: ${formatMoney(data.paidAmount, data.currency)}`,
    `Sisa tagihan: ${formatMoney(meta.balance, data.currency)}`,
    "",
    `Lihat dan unduh invoice: ${meta.invoiceUrl}`,
  ].join("\n");
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Tanggal invoice tidak valid.");
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  }).format(date);
}

function normalizeBaseUrl(value?: string) {
  const url = new URL(value?.trim() || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Base URL invoice tidak valid.");
  return url.origin;
}

function normalizePath(value: string) {
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Path invoice tidak valid.");
  return path;
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
