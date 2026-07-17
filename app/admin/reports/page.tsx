"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  CalendarCheck2,
  ChevronDown,
  CircleDollarSign,
  Hotel,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AdminMetricSummary } from "@/components/admin-metric-summary";
import { AdminPageShell } from "@/components/admin-page-shell";
import {
  AdminReportControls,
  type ReportExportFormat,
} from "@/components/admin-report-controls";
import { useAppNotifications } from "@/components/notification-root";

type ReportRow = {
  date: string;
  villa: string;
  bookings: number;
  nights: number;
  occupancy: number;
  guests: number;
  revenue: number;
};

const reportRows: ReportRow[] = [
  {
    date: "2026-07-02",
    villa: "Villa Aruna Cliffside",
    bookings: 8,
    nights: 21,
    occupancy: 88,
    guests: 32,
    revenue: 101760000,
  },
  {
    date: "2026-07-04",
    villa: "Nara Jungle Residence",
    bookings: 7,
    nights: 17,
    occupancy: 76,
    guests: 24,
    revenue: 62050000,
  },
  {
    date: "2026-07-06",
    villa: "Sagara Beach House",
    bookings: 9,
    nights: 24,
    occupancy: 94,
    guests: 41,
    revenue: 126000000,
  },
  {
    date: "2026-07-08",
    villa: "Luna Honeymoon Villa",
    bookings: 6,
    nights: 16,
    occupancy: 81,
    guests: 12,
    revenue: 59040000,
  },
  {
    date: "2026-07-11",
    villa: "Kirana Rice Field Retreat",
    bookings: 5,
    nights: 14,
    occupancy: 72,
    guests: 18,
    revenue: 46200000,
  },
  {
    date: "2026-07-14",
    villa: "Amerta Ocean Pavilion",
    bookings: 10,
    nights: 26,
    occupancy: 91,
    guests: 37,
    revenue: 148200000,
  },
];

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("id-ID");

export default function ReportsPage() {
  const reduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const [from, setFrom] = useState("2026-07-01");
  const [to, setTo] = useState("2026-07-16");
  const [villa, setVilla] = useState("ALL");

  const rows = useMemo(
    () =>
      reportRows.filter(
        (item) =>
          item.date >= from &&
          item.date <= to &&
          (villa === "ALL" || item.villa === villa),
      ),
    [from, to, villa],
  );
  const totals = useMemo(
    () => ({
      revenue: rows.reduce((sum, item) => sum + item.revenue, 0),
      bookings: rows.reduce((sum, item) => sum + item.bookings, 0),
      guests: rows.reduce((sum, item) => sum + item.guests, 0),
      occupancy: rows.length
        ? Math.round(
            rows.reduce((sum, item) => sum + item.occupancy, 0) / rows.length,
          )
        : 0,
    }),
    [rows],
  );

  const download = (format: ReportExportFormat) => {
    if (!rows.length) {
      notify({
        title: "Tidak ada data untuk diekspor",
        description: "Ubah periode atau filter villa terlebih dahulu.",
        variant: "error",
      });
      return;
    }
    const headers = [
      "Tanggal",
      "Villa",
      "Booking",
      "Malam",
      "Okupansi",
      "Tamu",
      "Pendapatan",
    ];
    const values = rows.map((item) => [
      item.date,
      item.villa,
      item.bookings,
      item.nights,
      `${item.occupancy}%`,
      item.guests,
      item.revenue,
    ]);
    const fileName = `villaku-laporan-${from}-${to}`;

    if (format === "csv") {
      const escapeCsv = (value: string | number) =>
        `"${String(value).replaceAll('"', '""')}"`;
      const csv = [headers, ...values]
        .map((row) => row.map(escapeCsv).join(","))
        .join("\r\n");
      downloadFile(`\uFEFF${csv}`, `${fileName}.csv`, "text/csv;charset=utf-8");
    } else {
      const escapeXml = (value: string | number) =>
        String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;");
      const xmlRows = [headers, ...values]
        .map(
          (row) =>
            `<Row>${row
              .map(
                (cell) =>
                  `<Cell><Data ss:Type="${typeof cell === "number" ? "Number" : "String"}">${escapeXml(cell)}</Data></Cell>`,
              )
              .join("")}</Row>`,
        )
        .join("");
      const workbook = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Laporan Villaku"><Table>${xmlRows}</Table></Worksheet></Workbook>`;
      downloadFile(
        workbook,
        `${fileName}.xls`,
        "application/vnd.ms-excel;charset=utf-8",
      );
    }
    notify({
      title: `Laporan ${format.toUpperCase()} berhasil dibuat`,
      description: `${rows.length} baris data telah diunduh.`,
      variant: "success",
    });
  };

  return (
    <AdminPageShell
      title="Laporan"
      subtitle="Analisis performa dan ekspor data operasional"
      active="Laporan"
    >
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
              <BarChart3 className="size-3.5" /> Business intelligence
            </span>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Laporan operasional
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 opacity-48">
              Susun laporan pendapatan, reservasi, okupansi, dan tamu untuk
              periode yang Anda perlukan.
            </p>
          </motion.div>
        </div>

        <div className="mt-7">
          <AdminReportControls
            from={from}
            to={to}
            onFromChange={setFrom}
            onToChange={setTo}
            onExport={download}
            exportDisabled={!rows.length}
            additionalFilter={
              <label>
                <span className="mb-2 block text-xs font-bold opacity-45">
                  Villa
                </span>
                <span className="relative block">
                  <select
                    value={villa}
                    onChange={(event) => setVilla(event.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border border-emerald-950/10 bg-white/72 px-3 pr-10 text-sm font-semibold outline-none dark:border-white/10 dark:bg-[#10231e]"
                  >
                    <option value="ALL">Semua villa</option>
                    {reportRows.map((item) => (
                      <option key={item.villa} value={item.villa}>
                        {item.villa}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-40" />
                </span>
              </label>
            }
          />
        </div>

        <AdminMetricSummary
          className="mt-5"
          metrics={[
            {
              label: "Pendapatan",
              value: money.format(totals.revenue),
              icon: CircleDollarSign,
              tone: "emerald",
            },
            {
              label: "Total booking",
              value: number.format(totals.bookings),
              icon: CalendarCheck2,
              tone: "sky",
            },
            {
              label: "Okupansi rata-rata",
              value: `${totals.occupancy}%`,
              icon: Hotel,
              tone: "amber",
            },
            {
              label: "Tamu dilayani",
              value: number.format(totals.guests),
              icon: Users,
              tone: "rose",
            },
          ]}
        />

        <section className="mt-5 overflow-hidden rounded-[1.7rem] border border-emerald-950/8 bg-white/68 dark:border-white/8 dark:bg-white/[0.045]">
          <div className="flex items-center justify-between border-b border-emerald-950/8 p-5 dark:border-white/8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                Report detail
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold">
                Performa per villa
              </h2>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
              {rows.length} data
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-emerald-950/[0.025] text-left text-[0.62rem] font-bold uppercase tracking-[0.13em] opacity-42">
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-4 py-3.5">Villa</th>
                  <th className="px-4 py-3.5">Booking</th>
                  <th className="px-4 py-3.5">Malam</th>
                  <th className="px-4 py-3.5">Okupansi</th>
                  <th className="px-4 py-3.5">Tamu</th>
                  <th className="px-5 py-3.5 text-right">Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item, index) => (
                  <motion.tr
                    key={item.villa}
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.035 }}
                    className="border-t border-emerald-950/7 text-sm dark:border-white/7"
                  >
                    <td className="px-5 py-4 opacity-50">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-4 py-4 font-semibold">{item.villa}</td>
                    <td className="px-4 py-4">{item.bookings}</td>
                    <td className="px-4 py-4">{item.nights}</td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">
                        {item.occupancy}%
                      </span>
                    </td>
                    <td className="px-4 py-4">{item.guests}</td>
                    <td className="px-5 py-4 text-right font-bold">
                      {money.format(item.revenue)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length ? (
            <div className="grid min-h-56 place-items-center p-6 text-center">
              <div>
                <p className="font-semibold">Data laporan tidak ditemukan</p>
                <p className="mt-2 text-sm opacity-42">
                  Coba ubah rentang tanggal atau pilih semua villa.
                </p>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </AdminPageShell>
  );
}

function downloadFile(content: string, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}
