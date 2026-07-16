"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarCheck2,
  ChevronDown,
  CircleDollarSign,
  Download,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { AdminMetricSummary } from "@/components/admin-metric-summary";
import { AdminPageShell } from "@/components/admin-page-shell";
import { AdminPerformanceCharts } from "@/components/admin-performance-charts";
import { useAppNotifications } from "@/components/notification-root";

const months = [
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
];
const revenue = [42, 58, 49, 71, 63, 82, 76, 91, 86, 104, 97, 118].map(
  (value, index) => ({ label: months[index], value }),
);
const bookingStatuses = [
  { label: "Dikonfirmasi", value: 68, color: "bg-emerald-400" },
  { label: "Menunggu", value: 18, color: "bg-amber-300" },
  { label: "Check-in", value: 9, color: "bg-sky-300" },
  { label: "Dibatalkan", value: 5, color: "bg-rose-300" },
];
type DashboardPeriod = "7" | "30" | "90" | "365";
const dashboardByPeriod = {
  "7": {
    label: "7 hari terakhir",
    revenueTitle: "Pendapatan harian",
    revenue: [
      { label: "Sen", value: 15 },
      { label: "Sel", value: 22 },
      { label: "Rab", value: 18 },
      { label: "Kam", value: 31 },
      { label: "Jum", value: 28 },
      { label: "Sab", value: 39 },
      { label: "Min", value: 35 },
    ],
    metrics: {
      revenue: "Rp188jt",
      bookings: "31",
      occupancy: "78%",
      customers: "19",
    },
    revenueTrend: "+8,2% WoW",
    conversionRate: "6,9%",
    conversionTrend: "+0,6% dari pekan lalu",
  },
  "30": {
    label: "30 hari terakhir",
    revenueTitle: "Pendapatan mingguan",
    revenue: [
      { label: "W1", value: 142 },
      { label: "W2", value: 186 },
      { label: "W3", value: 219 },
      { label: "W4", value: 296 },
    ],
    metrics: {
      revenue: "Rp842,6jt",
      bookings: "156",
      occupancy: "82%",
      customers: "94",
    },
    revenueTrend: "+18,4% MoM",
    conversionRate: "7,8%",
    conversionTrend: "+1,2% dari bulan lalu",
  },
  "90": {
    label: "90 hari terakhir",
    revenueTitle: "Pendapatan tiga bulan",
    revenue: [
      { label: "Mei", value: 622 },
      { label: "Jun", value: 748 },
      { label: "Jul", value: 843 },
    ],
    metrics: {
      revenue: "Rp2,21M",
      bookings: "428",
      occupancy: "80%",
      customers: "257",
    },
    revenueTrend: "+14,1% QoQ",
    conversionRate: "7,4%",
    conversionTrend: "+0,9% dari kuartal lalu",
  },
  "365": {
    label: "12 bulan terakhir",
    revenueTitle: "Pendapatan 12 bulan",
    revenue,
    metrics: {
      revenue: "Rp8,94M",
      bookings: "1.842",
      occupancy: "79%",
      customers: "1.126",
    },
    revenueTrend: "+18,4% YoY",
    conversionRate: "7,8%",
    conversionTrend: "+1,2% dari tahun lalu",
  },
} satisfies Record<DashboardPeriod, object>;
const villas = [
  {
    name: "Sagara Beach House",
    location: "Canggu",
    occupancy: 94,
    revenue: "Rp152,4jt",
  },
  {
    name: "Villa Aruna Cliffside",
    location: "Uluwatu",
    occupancy: 88,
    revenue: "Rp139,8jt",
  },
  {
    name: "Luna Honeymoon Villa",
    location: "Seminyak",
    occupancy: 81,
    revenue: "Rp88,2jt",
  },
  {
    name: "Nara Jungle Residence",
    location: "Ubud",
    occupancy: 76,
    revenue: "Rp76,5jt",
  },
];
const recentBookings = [
  {
    code: "VLK-260823-1482",
    guest: "Maya Putri",
    villa: "Villa Aruna Cliffside",
    value: "Rp21.312.000",
    status: "Menunggu",
  },
  {
    code: "VLK-260902-1519",
    guest: "Rizky Ananda",
    villa: "Sagara Beach House",
    value: "Rp29.400.000",
    status: "Dikonfirmasi",
  },
  {
    code: "VLK-260812-1441",
    guest: "Daniel Wijaya",
    villa: "Luna Honeymoon Villa",
    value: "Rp9.912.000",
    status: "Check-in",
  },
];

export default function AdminAnalyticsPage() {
  const reduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const [period, setPeriod] = useState<DashboardPeriod>("30");
  const dashboard = dashboardByPeriod[period];
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
              <Sparkles className="size-3.5" /> Executive overview
            </span>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Selamat datang, Ayu.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 opacity-48">
              Pantau pendapatan, reservasi, okupansi, dan pengalaman tamu dari
              satu pusat kendali.
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
              onClick={() =>
                notify({
                  title: "Laporan dashboard disiapkan",
                  description: `${dashboard.label} siap diekspor.`,
                  variant: "success",
                })
              }
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white"
            >
              <Download className="size-4" /> Ekspor
            </button>
          </div>
        </div>
        <AdminMetricSummary
          className="mt-7"
          metrics={[
            {
              label: "Total pendapatan",
              value: dashboard.metrics.revenue,
              trend: "+18,4%",
              positive: true,
              icon: CircleDollarSign,
              tone: "emerald",
            },
            {
              label: "Total booking",
              value: dashboard.metrics.bookings,
              trend: "+12,8%",
              positive: true,
              icon: CalendarCheck2,
              tone: "sky",
            },
            {
              label: "Okupansi",
              value: dashboard.metrics.occupancy,
              trend: "+6,2%",
              positive: true,
              icon: TrendingUp,
              tone: "amber",
            },
            {
              label: "Customer baru",
              value: dashboard.metrics.customers,
              trend: "-2,1%",
              positive: false,
              icon: Users,
              tone: "rose",
            },
          ]}
        />
        <div className="mt-6">
          <AdminPerformanceCharts
            revenue={dashboard.revenue}
            bookingStatuses={bookingStatuses}
            revenueTitle={dashboard.revenueTitle}
            revenueTotal={dashboard.metrics.revenue}
            revenueTrend={dashboard.revenueTrend}
            conversionRate={dashboard.conversionRate}
            conversionTrend={dashboard.conversionTrend}
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
              {villas.map((villa, index) => (
                <motion.div
                  key={villa.name}
                  initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 sm:p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{villa.name}</p>
                      <p className="mt-1 text-xs opacity-38">
                        {villa.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{villa.occupancy}%</p>
                      <p className="mt-1 text-xs opacity-38">{villa.revenue}</p>
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
              {recentBookings.map((booking) => (
                <div
                  key={booking.code}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4 sm:p-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {booking.guest} · {booking.villa}
                    </p>
                    <p className="mt-1 font-mono text-[0.62rem] font-bold text-emerald-700 dark:text-emerald-300">
                      {booking.code}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{booking.value}</p>
                    <p className="mt-1 text-[0.62rem] opacity-38">
                      {booking.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AdminPageShell>
  );
}
