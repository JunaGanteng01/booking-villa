"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell } from "lucide-react";
import type { MouseEventHandler } from "react";
import { cn } from "@/lib/utils";

type NotificationBellProps = {
  unreadCount?: number;
  expanded?: boolean;
  controls?: string;
  hasPopup?: "dialog" | false;
  label?: string;
  className?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export function NotificationBell({
  unreadCount = 0,
  expanded = false,
  controls,
  hasPopup = "dialog",
  label = "Buka notifikasi",
  className,
  disabled = false,
  onClick,
}: NotificationBellProps) {
  const shouldReduceMotion = useReducedMotion();
  const safeCount = Math.max(0, Math.floor(unreadCount));
  const badgeLabel = safeCount > 99 ? "99+" : String(safeCount);
  const accessibleLabel =
    safeCount > 0 ? `${label}, ${safeCount} belum dibaca` : `${label}, tidak ada notifikasi baru`;

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={accessibleLabel}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-haspopup={hasPopup || undefined}
      whileHover={shouldReduceMotion || disabled ? undefined : { y: -2, scale: 1.03 }}
      whileTap={shouldReduceMotion || disabled ? undefined : { scale: 0.94 }}
      className={cn(
        "relative grid size-10 shrink-0 place-items-center rounded-full border border-emerald-950/10 bg-white/62 text-emerald-950 shadow-sm backdrop-blur-xl transition-[background-color,border-color,color,box-shadow] hover:border-emerald-700/20 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/6 dark:text-white dark:hover:border-white/16 dark:hover:bg-white/10",
        className,
      )}
    >
      <Bell
        className={cn(
          "size-[1.05rem]",
          safeCount > 0 && "fill-amber-300/18 text-emerald-800 dark:text-amber-100",
        )}
        strokeWidth={1.9}
        aria-hidden
      />

      <AnimatePresence initial={false}>
        {safeCount > 0 ? (
          <motion.span
            key={badgeLabel}
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.55, y: 3 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.55 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-[#fffaf2] bg-amber-500 px-1 text-[0.58rem] font-extrabold leading-none text-emerald-950 shadow-[0_5px_14px_rgba(217,164,42,0.34)] dark:border-[#071211]"
            aria-hidden
          >
            {badgeLabel}
            {!shouldReduceMotion ? (
              <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-amber-400/60" />
            ) : null}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.button>
  );
}
