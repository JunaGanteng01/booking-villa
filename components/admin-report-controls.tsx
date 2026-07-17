"use client";

import { ChevronDown, Download, FileSpreadsheet } from "lucide-react";
import { useState } from "react";

export type ReportExportFormat = "csv" | "xls";
type ReportPeriod = "7" | "30" | "90" | "365" | "custom";

export function AdminReportControls({
  from,
  to,
  onFromChange,
  onToChange,
  onExport,
  additionalFilter,
  exportDisabled = false,
}: {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onExport: (format: ReportExportFormat) => void;
  additionalFilter?: React.ReactNode;
  exportDisabled?: boolean;
}) {
  const [period, setPeriod] = useState<ReportPeriod>("custom");

  const changePeriod = (value: ReportPeriod) => {
    setPeriod(value);
    if (value === "custom") return;
    const end = to ? new Date(`${to}T00:00:00`) : new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - Number(value) + 1);
    onFromChange(toIsoDate(start));
    onToChange(toIsoDate(end));
  };

  return (
    <section className="rounded-[1.5rem] border border-emerald-950/8 bg-white/68 p-4 dark:border-white/8 dark:bg-white/[0.045]">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label>
          <span className="mb-2 block text-xs font-bold opacity-45">
            Pilihan periode
          </span>
          <span className="relative block">
            <select
              value={period}
              onChange={(event) =>
                changePeriod(event.target.value as ReportPeriod)
              }
              className="h-11 w-full appearance-none rounded-xl border border-emerald-950/10 bg-white/72 px-3 pr-10 text-sm font-semibold outline-none dark:border-white/10 dark:bg-[#10231e]"
            >
              <option value="7">7 hari terakhir</option>
              <option value="30">30 hari terakhir</option>
              <option value="90">90 hari terakhir</option>
              <option value="365">12 bulan terakhir</option>
              <option value="custom">Tanggal khusus</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-40" />
          </span>
        </label>
        <DateField
          label="Dari tanggal"
          value={from}
          max={to}
          onChange={(value) => {
            setPeriod("custom");
            onFromChange(value);
          }}
        />
        <DateField
          label="Sampai tanggal"
          value={to}
          min={from}
          onChange={(value) => {
            setPeriod("custom");
            onToChange(value);
          }}
        />
        {additionalFilter}
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-emerald-950/7 pt-4 dark:border-white/7">
        <button
          type="button"
          disabled={exportDisabled}
          onClick={() => onExport("csv")}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-950/10 bg-white/72 px-4 text-xs font-bold transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40 dark:border-white/10 dark:bg-white/6"
        >
          <Download className="size-3.5" /> Unduh CSV
        </button>
        <button
          type="button"
          disabled={exportDisabled}
          onClick={() => onExport("xls")}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-700 px-4 text-xs font-bold text-white transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40"
        >
          <FileSpreadsheet className="size-3.5" /> Ekspor Excel
        </button>
      </div>
    </section>
  );
}

function DateField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold opacity-45">{label}</span>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-emerald-950/10 bg-white/72 px-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-[#10231e]"
      />
    </label>
  );
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
