"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminMetric = {
  label: string;
  value: string;
  trend?: string;
  trendLabel?: string;
  positive?: boolean;
  helper?: string;
  icon: LucideIcon;
  tone: "emerald" | "sky" | "amber" | "rose" | "violet";
};

const tones = {
  emerald:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-300/10 dark:text-sky-200",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-300/10 dark:text-rose-200",
  violet:
    "bg-violet-100 text-violet-700 dark:bg-violet-300/10 dark:text-violet-200",
};

export function AdminMetricSummary({
  metrics,
  className,
}: {
  metrics: AdminMetric[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 xl:grid-cols-4", className)}>
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const TrendIcon = metric.positive ? ArrowUpRight : ArrowDownRight;
        return (
          <motion.article
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.045 }}
            whileHover={{ y: -3 }}
            className="rounded-2xl border border-emerald-950/8 bg-white/66 p-4 shadow-[0_12px_40px_rgba(4,34,28,0.035)] dark:border-white/8 dark:bg-white/[0.045] sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-emerald-950/42 dark:text-white/40">
                  {metric.label}
                </p>
                <p className="mt-2 truncate text-2xl font-semibold sm:text-3xl">
                  {metric.value}
                </p>
                {metric.trend ? (
                  <p
                    className={cn(
                      "mt-2 inline-flex items-center gap-1 text-[0.65rem] font-bold",
                      metric.positive ? "text-emerald-600" : "text-rose-500",
                    )}
                  >
                    <TrendIcon className="size-3" />
                    {metric.trend}
                    <span className="font-normal opacity-50">
                      {metric.trendLabel ?? "vs lalu"}
                    </span>
                  </p>
                ) : metric.helper ? (
                  <p className="mt-1 text-[0.65rem] opacity-35">
                    {metric.helper}
                  </p>
                ) : null}
              </div>
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl",
                  tones[metric.tone],
                )}
              >
                <Icon className="size-4" />
              </span>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
