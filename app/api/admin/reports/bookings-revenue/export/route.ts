import { NextResponse } from "next/server";
import { GET as getReport } from "@/app/api/admin/reports/bookings-revenue/route";
import {
  createReportPdf,
  createReportSpreadsheet,
  type ReportExportRow,
  type ReportExportTotals,
} from "@/lib/report-export-service";

type ReportPayload = {
  rows: ReportExportRow[];
  totals: ReportExportTotals;
  filters: { from: string; to: string };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format")?.toLowerCase();
  if (format !== "pdf" && format !== "excel") {
    return NextResponse.json(
      { message: "Format ekspor harus pdf atau excel." },
      { status: 400 },
    );
  }
  url.searchParams.delete("format");
  url.pathname = "/api/admin/reports/bookings-revenue";
  const reportResponse = await getReport(
    new Request(url, { headers: request.headers }),
  );
  if (!reportResponse.ok) return reportResponse;
  const report = (await reportResponse.json()) as ReportPayload;
  const baseName = `villaku-laporan-${report.filters.from.slice(0, 10)}-${report.filters.to.slice(0, 10)}`;

  if (format === "pdf") {
    const pdf = createReportPdf(report.rows, report.totals, report.filters);
    return new Response(pdf as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${baseName}.pdf"`,
        "Content-Length": String(pdf.byteLength),
      },
    });
  }
  const workbook = createReportSpreadsheet(report.rows);
  return new Response(workbook, {
    headers: {
      "Content-Type": "application/vnd.ms-excel;charset=utf-8",
      "Content-Disposition": `attachment; filename="${baseName}.xls"`,
      "Content-Length": String(new TextEncoder().encode(workbook).byteLength),
    },
  });
}
