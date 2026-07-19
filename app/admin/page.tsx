"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  CalendarCheck2,
  ChevronDown,
  CircleDollarSign,
  Download,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminMetricSummary } from "@/components/admin-metric-summary";
import { AdminPageShell } from "@/components/admin-page-shell";
import { AdminPerformanceCharts } from "@/components/admin-performance-charts";
import { useAppNotifications } from "@/components/notification-root";
import { cn } from "@/lib/utils";

type DashboardPeriod = "7" | "30" | "90" | "365";
type AnalyticsData = {
  range: { from: string; to: string };
  metrics: {
    revenue: number;
    bookings: number;
    occupancy: number;
    customers: number;
    conversion: number;
    trends: {
      revenue: number;
      bookings: number;
      occupancy: number;
      customers: number;
      conversion: number;
    };
  };
  revenueSeries: Array<{ label: string; revenue: number; bookings: number }>;
  bookingStatuses: Array<{ status: string; count: number }>;
  topVillas: Array<{
    villaId: string;
    villaName: string;
    bookings: number;
    nights: number;
    revenue: number;
    occupancy: number;
  }>;
  recentBookings: Array<{
    id: string;
    bookingCode: string;
    villaName: string;
    guestName: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    paidAmount: number;
    createdAt: string;
  }>;
};

const periodMeta: Record<
  DashboardPeriod,
  { api: string; label: string; revenueTitle: string }
> = {
  "7": {
    api: "7d",
    label: "7 hari terakhir",
    revenueTitle: "Pendapatan harian",
  },
  "30": {
    api: "30d",
    label: "30 hari terakhir",
    revenueTitle: "Pendapatan harian",
  },
  "90": {
    api: "90d",
    label: "90 hari terakhir",
    revenueTitle: "Pendapatan mingguan",
  },
  "365": {
    api: "12m",
    label: "12 bulan terakhir",
    revenueTitle: "Pendapatan bulanan",
  },
};

const statusMeta: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-slate-300" },
  PENDING: { label: "Menunggu", color: "bg-amber-300" },
  WAITING_PAYMENT: { label: "Menunggu bayar", color: "bg-amber-300" },
  CONFIRMED: { label: "Dikonfirmasi", color: "bg-emerald-400" },
  COMPLETED: { label: "Selesai", color: "bg-sky-300" },
  CANCELLED: { label: "Dibatalkan", color: "bg-rose-300" },
  EXPIRED: { label: "Kedaluwarsa", color: "bg-orange-300" },
  REFUNDED: { label: "Refund", color: "bg-violet-300" },
};

export default function AdminAnalyticsPage() {
  const reduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const [period, setPeriod] = useState<DashboardPeriod>("30");
  const [dashboard, setDashboard] = useState<AnalyticsData | null>(null);
  const [userName, setUserName] = useState("Admin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshDashboard = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/analytics/metrics?period=${periodMeta[period].api}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as {
        data?: AnalyticsData;
        message?: string;
      };
      if (!response.ok || !payload.data) {
        throw new Error(payload.message || "Metrik overview belum dapat dimuat.");
      }
      setDashboard(payload.data);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Metrik overview belum dapat dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    let active = true;
    void fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { user?: { name?: string } }) => {
        if (active && payload.user?.name) setUserName(payload.user.name);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    void refreshDashboard();
    const interval = window.setInterval(() => void refreshDashboard(), 30_000);
    const onFocus = () => void refreshDashboard();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshDashboard]);

  const revenueSeries = useMemo(
    () =>
      dashboard?.revenueSeries.length
        ? dashboard.revenueSeries.map((item) => ({
            label: formatSeriesLabel(item.label, period),
            value: Math.round((item.revenue / 1_000_000) * 10) / 10,
          }))
        : [{ label: "Belum ada", value: 0 }],
    [dashboard, period],
  );
  const bookingStatuses = useMemo(() => {
    const total =
      dashboard?.bookingStatuses.reduce((sum, item) => sum + item.count, 0) ??
      0;
    return (dashboard?.bookingStatuses ?? []).map((item) => ({
      label: statusMeta[item.status]?.label ?? item.status,
      value: total ? Math.round((item.count / total) * 100) : 0,
      color: statusMeta[item.status]?.color ?? "bg-slate-300",
    }));
  }, [dashboard]);
  const metrics = dashboard?.metrics;
  const meta = periodMeta[period];

  const exportDashboard = () => {
    if (!dashboard) {
      notify({
        title: "Data belum tersedia",
        description: "Tunggu overview selesai dimuat sebelum mengekspor.",
        variant: "error",
      });
      return;
    }
    downloadCsv(
      `villaku-overview-${period}hari.csv`,
      [
        ["Periode", meta.label],
        ["Pendapatan", dashboard.metrics.revenue],
        ["Booking", dashboard.metrics.bookings],
        ["Okupansi", `${dashboard.metrics.occupancy}%`],
        ["Customer", dashboard.metrics.customers],
        [],
        ["Kode", "Tamu", "Villa", "Status", "Dibayar"],
        ...dashboard.recentBookings.map((booking) => [
          booking.bookingCode,
          booking.guestName,
          booking.villaName,
          booking.status,
          booking.paidAmount,
        ]),
      ],
    );
    notify({
      title: "Laporan overview diunduh",
      description: `${meta.label} berhasil diekspor dari PostgreSQL.`,
      variant: "success",
    });
  };

  return (
    <AdminPageShell
      title="Overview"
      subtitle="Ringkasan performa operasional Villaku"
      active="Overview"
    >
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <motion.div
            initial={
              reduceMotion ? false : { opacity: 0, y: 16, filter: "blur(8px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
              <Sparkles className="size-3.5" /> PostgreSQL live overview
            </span>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Selamat datang, {userName}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 opacity-48">
              Pantau pembayaran aktual, reservasi, okupansi, dan customer dari
              satu sumber data yang sama.
            </p>
          </motion.div>
          <div className="flex flex-wrap gap-2">
            <label className="relative">
              <span className="sr-only">Periode laporan</span>
              <select
                value={period}
                onChange={(event) =>
                  setPeriod(event.target.value as DashboardPeriod)
                }
                className="h-11 appearance-none rounded-full border border-emerald-950/10 bg-white/72 pl-4 pr-10 text-sm font-bold outline-none dark:border-white/10 dark:bg-white/6"
              >
                <option value="7">7 hari</option>
                <option value="30">30 hari</option>
                <option value="90">90 hari</option>
                <option value="365">12 bulan</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 opacity-40" />
            </label>
            <button
              type="button"
              onClick={() => void refreshDashboard()}
              className="grid size-11 place-items-center rounded-full border border-emerald-950/10 bg-white/72 dark:border-white/10 dark:bg-white/6"
              aria-label="Muat ulang overview"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </button>
            <button
              type="button"
              onClick={exportDashboard}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white"
            >
              <Download className="size-4" /> Ekspor
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-rose-300/40 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-300/8 dark:text-rose-200">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <AdminMetricSummary
          className={cn("mt-7", loading && !dashboard && "animate-pulse")}
          metrics={[
            {
              label: "Pembayaran diterima",
              value: metrics ? formatRupiahCompact(metrics.revenue) : "Rp 0",
              trend: metrics ? formatTrend(metrics.trends.revenue) : undefined,
              positive: (metrics?.trends.revenue ?? 0) >= 0,
              icon: CircleDollarSign,
              tone: "emerald",
            },
            {
              label: "Total booking",
              value: String(metrics?.bookings ?? 0),
              trend: metrics ? formatTrend(metrics.trends.bookings) : undefined,
              positive: (metrics?.trends.bookings ?? 0) >= 0,
              icon: CalendarCheck2,
              tone: "sky",
            },
            {
              label: "Okupansi",
              value: `${metrics?.occupancy ?? 0}%`,
              trend: metrics ? formatTrend(metrics.trends.occupancy) : undefined,
              positive: (metrics?.trends.occupancy ?? 0) >= 0,
              icon: TrendingUp,
              tone: "amber",
            },
            {
              label: "Customer unik",
              value: String(metrics?.customers ?? 0),
              trend: metrics ? formatTrend(metrics.trends.customers) : undefined,
              positive: (metrics?.trends.customers ?? 0) >= 0,
              icon: Users,
              tone: "rose",
            },
          ]}
        />

        <div className="mt-6">
          <AdminPerformanceCharts
            revenue={revenueSeries}
            bookingStatuses={bookingStatuses}
            revenueTitle={meta.revenueTitle}
            revenueTotal={formatRupiahCompact(metrics?.revenue ?? 0)}
            revenueTrend={formatTrend(metrics?.trends.revenue ?? 0)}
            conversionRate={`${metrics?.conversion ?? 0}%`}
            conversionTrend={`${formatTrend(metrics?.trends.conversion ?? 0)} dibanding periode lalu`}
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <section className="overflow-hidden rounded-[1.7rem] border border-emerald-950/8 bg-white/68 dark:border-white/8 dark:bg-white/[0.045]">
            <div className="border-b border-emerald-950/8 p-5 dark:border-white/8">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                Property performance
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold">
                Okupansi villa
              </h2>
            </div>
            <div className="divide-y divide-emerald-950/7 dark:divide-white/7">
              {(dashboard?.topVillas ?? []).map((villa, index) => (
                <motion.div
                  key={villa.villaId}
                  initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 sm:p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{villa.villaName}</p>
                      <p className="mt-1 text-xs opacity-38">
                        {villa.bookings} booking · {villa.nights} malam
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{villa.occupancy}%</p>
                      <p className="mt-1 text-xs opacity-38">
                        {formatRupiahCompact(villa.revenue)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-950/7 dark:bg-white/7">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${villa.occupancy}%` }}
                      transition={{ duration: 0.8, delay: index * 0.08 }}
                      className="h-full rounded-full bg-[linear-gradient(90deg,#059669,#d6a84f)]"
                    />
                  </div>
                </motion.div>
              ))}
              {!loading && !dashboard?.topVillas.length ? (
                <EmptyState text="Belum ada performa villa pada periode ini." />
              ) : null}
            </div>
          </section>

          <section className="overflow-hidden rounded-[1.7rem] border border-emerald-950/8 bg-white/68 dark:border-white/8 dark:bg-white/[0.045]">
            <div className="border-b border-emerald-950/8 p-5 dark:border-white/8">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                Live activity
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold">
                Booking terbaru
              </h2>
            </div>
            <div className="divide-y divide-emerald-950/7 dark:divide-white/7">
              {(dashboard?.recentBookings ?? []).map((booking) => (
                <div
                  key={booking.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4 sm:p-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {booking.guestName} · {booking.villaName}
                    </p>
                    <p className="mt-1 font-mono text-[0.62rem] font-bold text-emerald-700 dark:text-emerald-300">
                      {booking.bookingCode}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {formatRupiahCompact(booking.paidAmount)}
                    </p>
                    <p className="mt-1 text-[0.62rem] opacity-38">
                      {statusMeta[booking.status]?.label ?? booking.status} ·{" "}
                      {paymentLabel(booking.paymentStatus)}
                    </p>
                  </div>
                </div>
              ))}
              {!loading && !dashboard?.recentBookings.length ? (
                <EmptyState text="Belum ada booking pada periode ini." />
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </AdminPageShell>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="p-8 text-center text-sm opacity-45">{text}</p>;
}

function formatRupiahCompact(value: number) {
  if (!value) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatTrend(value: number) {
  return `${value > 0 ? "+" : ""}${value}%`;
}

function formatSeriesLabel(value: string, period: DashboardPeriod) {
  if (period === "365" && /^\d{4}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat("id-ID", { month: "short" }).format(
      new Date(`${value}-01T00:00:00.000Z`),
    );
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(parsed);
}

function paymentLabel(status: string) {
  if (status === "PAID") return "Lunas";
  if (status === "PARTIALLY_PAID") return "Deposit terverifikasi";
  if (status === "FAILED") return "Gagal";
  if (status === "REFUNDED") return "Refund";
  return "Belum dibayar";
}

function downloadCsv(fileName: string, rows: Array<Array<string | number>>) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
  const url = URL.createObjectURL(
    new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
