export type ReportExportRow = {
  date: string;
  villa: string;
  bookings: number;
  nights: number;
  occupancy: number;
  guests: number;
  revenue: number;
};

export type ReportExportTotals = {
  bookings: number;
  nights: number;
  occupancy: number;
  guests: number;
  revenue: number;
  adr: number;
};

export function createReportSpreadsheet(rows: ReportExportRow[]) {
  const headers = [
    "Tanggal",
    "Villa",
    "Booking",
    "Malam",
    "Okupansi (%)",
    "Tamu",
    "Pendapatan (IDR)",
  ];
  const values = rows.map((row) => [
    row.date,
    row.villa,
    row.bookings,
    row.nights,
    row.occupancy,
    row.guests,
    row.revenue,
  ]);
  const cell = (value: string | number, header = false) =>
    `<Cell${header ? ' ss:StyleID="Header"' : ""}><Data ss:Type="${typeof value === "number" ? "Number" : "String"}">${escapeXml(String(value))}</Data></Cell>`;
  return `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#047857" ss:Pattern="Solid"/></Style></Styles>
<Worksheet ss:Name="Laporan VillaKu"><Table>
<Row>${headers.map((header) => cell(header, true)).join("")}</Row>
${values.map((row) => `<Row>${row.map((value) => cell(value)).join("")}</Row>`).join("\n")}
</Table></Worksheet></Workbook>`;
}

export function createReportPdf(
  rows: ReportExportRow[],
  totals: ReportExportTotals,
  period: { from: string; to: string },
) {
  const commands = [
    "0.03 0.22 0.16 rg 0 748 595 94 re f",
    pdfText("VillaKu", 42, 802, 24, true, "1 1 1"),
    pdfText(
      "LAPORAN PEMESANAN & PENDAPATAN",
      42,
      776,
      12,
      true,
      "0.85 0.94 0.89",
    ),
    pdfText(
      `${period.from.slice(0, 10)} - ${period.to.slice(0, 10)}`,
      420,
      780,
      9,
      false,
      "1 1 1",
    ),
    pdfText(`Pendapatan: ${formatMoney(totals.revenue)}`, 42, 716, 12, true),
    pdfText(
      `Booking: ${totals.bookings}   Malam: ${totals.nights}   Tamu: ${totals.guests}   Okupansi: ${totals.occupancy}%`,
      42,
      694,
      10,
    ),
    "0.05 0.36 0.25 rg 42 648 511 26 re f",
    pdfText("Tanggal", 50, 657, 8, true, "1 1 1"),
    pdfText("Villa", 110, 657, 8, true, "1 1 1"),
    pdfText("Book", 330, 657, 8, true, "1 1 1"),
    pdfText("Malam", 370, 657, 8, true, "1 1 1"),
    pdfText("Okup.", 415, 657, 8, true, "1 1 1"),
    pdfText("Pendapatan", 468, 657, 8, true, "1 1 1"),
  ];
  rows.slice(0, 22).forEach((row, index) => {
    const y = 630 - index * 24;
    if (index % 2 === 0)
      commands.push(`0.95 0.96 0.94 rg 42 ${y - 7} 511 22 re f`);
    commands.push(pdfText(row.date.slice(0, 10), 50, y, 7));
    commands.push(pdfText(truncate(row.villa, 35), 110, y, 7));
    commands.push(pdfText(String(row.bookings), 338, y, 7));
    commands.push(pdfText(String(row.nights), 382, y, 7));
    commands.push(pdfText(`${row.occupancy}%`, 421, y, 7));
    commands.push(pdfText(formatMoney(row.revenue), 468, y, 7));
  });
  if (rows.length > 22)
    commands.push(
      pdfText(
        `+ ${rows.length - 22} baris lain tersedia di ekspor Excel.`,
        42,
        86,
        8,
      ),
    );
  commands.push(
    pdfText(
      `Dibuat ${new Date().toISOString()} | VillaKu Admin`,
      42,
      48,
      7,
      false,
      "0.38 0.42 0.4",
    ),
  );
  return buildPdf(commands.join("\n"));
}

function buildPdf(content: string) {
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
  const xref = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets
    .slice(1)
    .forEach(
      (offset) => (pdf += `${String(offset).padStart(10, "0")} 00000 n \n`),
    );
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return encoder.encode(pdf);
}

function pdfText(
  value: string,
  x: number,
  y: number,
  size: number,
  bold = false,
  color = "0.08 0.1 0.09",
) {
  return `BT /${bold ? "F2" : "F1"} ${size} Tf ${color} rg ${x} ${y} Td (${escapePdf(value)}) Tj ET`;
}

function escapePdf(value: string) {
  return value.replace(/[^\x20-\x7E]/g, " ").replace(/([\\()])/g, "\\$1");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(value: string, length: number) {
  return value.length <= length ? value : `${value.slice(0, length - 3)}...`;
}

function formatMoney(value: number) {
  return `Rp${new Intl.NumberFormat("id-ID").format(value)}`;
}
