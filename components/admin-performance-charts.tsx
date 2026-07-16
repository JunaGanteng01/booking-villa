"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type RevenuePoint = {
  label: string;
  value: number;
};

export type BookingStatusPoint = {
  label: string;
  value: number;
  color: string;
};

type AdminPerformanceChartsProps = {
  revenue: RevenuePoint[];
  bookingStatuses: BookingStatusPoint[];
  revenueTitle?: string;
  revenueTotal: string;
  revenueTrend: string;
  conversionRate: string;
  conversionTrend: string;
};

export function AdminPerformanceCharts({
  revenue,
  bookingStatuses,
  revenueTitle = "Pendapatan 12 bulan",
  revenueTotal,
  revenueTrend,
  conversionRate,
  conversionTrend,
}: AdminPerformanceChartsProps) {
  const reduceMotion = useReducedMotion();
  const maxRevenue = Math.max(...revenue.map((item) => item.value), 1);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
      <section className="rounded-[1.7rem] border border-emerald-950/8 bg-white/68 p-5 dark:border-white/8 dark:bg-white/[0.045] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
              Revenue trend
            </p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">
              {revenueTitle}
            </h2>
          </div>
          <p className="shrink-0 text-right">
            <span className="block text-xl font-bold">{revenueTotal}</span>
            <span className="mt-1 block text-xs text-emerald-600">
              {revenueTrend}
            </span>
          </p>
        </div>

        <div
          className="mt-8 flex h-64 items-end gap-2 sm:gap-3"
          role="img"
          aria-label={`Grafik pendapatan dengan total ${revenueTotal}`}
        >
          {revenue.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="group flex h-full min-w-0 flex-1 flex-col justify-end gap-2"
            >
              <motion.div
                initial={reduceMotion ? false : { height: 0 }}
                animate={{ height: `${(item.value / maxRevenue) * 88}%` }}
                transition={{ duration: 0.65, delay: index * 0.035 }}
                className={cn(
                  "relative min-h-2 rounded-t-lg bg-emerald-200 transition-colors group-hover:bg-emerald-600 dark:bg-emerald-300/20",
                  index === revenue.length - 1 &&
                    "bg-emerald-700 dark:bg-emerald-400",
                )}
                title={`${item.label}: Rp${item.value}jt`}
              >
                <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-emerald-950 px-2 py-1 text-[0.55rem] font-bold text-white group-hover:block">
                  Rp{item.value}jt
                </span>
              </motion.div>
              <span className="truncate text-center text-[0.55rem] opacity-35">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.7rem] border border-emerald-950/8 bg-emerald-950 p-5 text-white sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-200">
          Booking health
        </p>
        <h2 className="mt-2 font-serif text-2xl font-semibold">
          Status reservasi
        </h2>
        <div className="mt-6 space-y-5">
          {bookingStatuses.map((item, index) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-white/60">
                  <span className={cn("size-2 rounded-full", item.color)} />
                  {item.label}
                </span>
                <strong>{item.value}%</strong>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  initial={reduceMotion ? false : { width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 0.7, delay: index * 0.06 }}
                  className={cn("h-full rounded-full", item.color)}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl bg-white/7 p-4">
          <p className="text-xs text-white/45">Conversion rate</p>
          <p className="mt-2 text-3xl font-semibold">{conversionRate}</p>
          <p className="mt-1 text-xs text-emerald-300">{conversionTrend}</p>
        </div>
      </section>
    </div>
  );
}
