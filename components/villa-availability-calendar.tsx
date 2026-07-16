"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarCheck2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eraser,
  Info,
  Lock,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppNotifications } from "@/components/notification-root";
import { getVillaAvailability, updateVillaAvailability } from "@/lib/admin-api-client";
import { cn } from "@/lib/utils";

type AvailabilityStatus = "AVAILABLE" | "BOOKED" | "PENDING" | "MAINTENANCE" | "BLOCKED";

const statusMeta: Record<
  AvailabilityStatus,
  { label: string; shortLabel: string; className: string; dotClass: string; icon: typeof Check }
> = {
  AVAILABLE: {
    label: "Tersedia",
    shortLabel: "Available",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-300/12 dark:bg-emerald-300/8 dark:text-emerald-100",
    dotClass: "bg-emerald-500",
    icon: Check,
  },
  BOOKED: {
    label: "Dipesan",
    shortLabel: "Booked",
    className: "border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-300/12 dark:bg-sky-300/10 dark:text-sky-100",
    dotClass: "bg-sky-500",
    icon: CalendarCheck2,
  },
  PENDING: {
    label: "Menunggu",
    shortLabel: "Pending",
    className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-300/12 dark:bg-amber-300/8 dark:text-amber-100",
    dotClass: "bg-amber-500",
    icon: Clock3,
  },
  MAINTENANCE: {
    label: "Perawatan",
    shortLabel: "Maintenance",
    className: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-300/12 dark:bg-rose-300/8 dark:text-rose-100",
    dotClass: "bg-rose-500",
    icon: Wrench,
  },
  BLOCKED: {
    label: "Diblokir",
    shortLabel: "Blocked",
    className: "border-slate-300 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/7 dark:text-white/58",
    dotClass: "bg-slate-500",
    icon: Lock,
  },
};

const weekDays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });
const fullDateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function createSeedAvailability() {
  const result: Record<string, AvailabilityStatus> = {};
  for (let month = 6; month <= 9; month += 1) {
    const lastDay = new Date(2026, month + 1, 0).getDate();
    for (let day = 1; day <= lastDay; day += 1) {
      let status: AvailabilityStatus = "AVAILABLE";
      if ((day >= 3 && day <= 6) || (day >= 24 && day <= 28)) status = "BOOKED";
      else if (day === 10 || day === 11 || day === 20) status = "PENDING";
      else if (day === 15 || day === 16) status = "MAINTENANCE";
      else if (day === 21) status = "BLOCKED";
      result[dateKey(new Date(2026, month, day))] = status;
    }
  }
  return result;
}

const bookingLabels: Record<string, string> = {
  "2026-08-03": "VLK-1482",
  "2026-08-24": "VLK-1519",
  "2026-09-03": "VLK-1564",
};

export function VillaAvailabilityCalendar({ villaId }: { villaId?: string }) {
  const shouldReduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const [month, setMonth] = useState(() => new Date(2026, 7, 1));
  const [availability, setAvailability] = useState<Record<string, AvailabilityStatus>>(createSeedAvailability);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<AvailabilityStatus>("BLOCKED");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!villaId) return;
    const from = dateKey(new Date(month.getFullYear(), month.getMonth(), 1));
    const to = dateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
    let active = true;
    setIsLoading(true);
    getVillaAvailability(villaId, from, to)
      .then(({ days }) => {
        if (!active) return;
        setAvailability((current) => ({ ...current, ...Object.fromEntries(days.map((day) => [day.date, day.status])) }));
      })
      .catch((error: unknown) => {
        if (active) notify({ title: "Kalender gagal dimuat", description: error instanceof Error ? error.message : "Silakan coba lagi.", variant: "error" });
      })
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, villaId]);

  const calendarDays = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const leading = (firstDay.getDay() + 6) % 7;
    const lastDate = new Date(year, monthIndex + 1, 0).getDate();
    const cells: Array<Date | null> = Array.from({ length: leading }, () => null);
    for (let day = 1; day <= lastDate; day += 1) cells.push(new Date(year, monthIndex, day));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);

  const stats = useMemo(() => {
    const keys = calendarDays.filter((day): day is Date => Boolean(day)).map(dateKey);
    return (Object.keys(statusMeta) as AvailabilityStatus[]).reduce(
      (result, status) => ({
        ...result,
        [status]: keys.filter((key) => (availability[key] ?? "AVAILABLE") === status).length,
      }),
      {} as Record<AvailabilityStatus, number>,
    );
  }, [availability, calendarDays]);

  const isInRange = (key: string) => {
    if (!rangeStart) return false;
    if (!rangeEnd) return key === rangeStart;
    return key >= rangeStart && key <= rangeEnd;
  };

  const selectDate = (key: string) => {
    if (!rangeStart || rangeEnd) {
      setRangeStart(key);
      setRangeEnd(null);
      return;
    }
    if (key < rangeStart) {
      setRangeStart(key);
      return;
    }
    setRangeEnd(key);
  };

  const selectedKeys = useMemo(() => {
    if (!rangeStart) return [];
    const start = dateFromKey(rangeStart);
    const end = dateFromKey(rangeEnd ?? rangeStart);
    const keys: string[] = [];
    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      keys.push(dateKey(cursor));
    }
    return keys;
  }, [rangeEnd, rangeStart]);

  const applyStatus = async () => {
    if (!selectedKeys.length) {
      notify({ title: "Pilih tanggal terlebih dahulu", description: "Klik satu tanggal atau rentang tanggal pada kalender.", variant: "warning" });
      return;
    }
    if (!villaId) {
      notify({ title: "Simpan villa terlebih dahulu", description: "Kalender dapat diatur setelah data villa dibuat.", variant: "info" });
      return;
    }
    const previous = { ...availability };
    setAvailability((current) => {
      const next = { ...current };
      selectedKeys.forEach((key) => {
        next[key] = nextStatus;
      });
      return next;
    });
    try {
      await updateVillaAvailability(villaId, { from: selectedKeys[0], to: selectedKeys.at(-1), status: nextStatus });
      notify({ title: `${selectedKeys.length} tanggal diperbarui`, description: `Status disimpan sebagai ${statusMeta[nextStatus].label}.`, variant: "success" });
      setRangeStart(null);
      setRangeEnd(null);
    } catch (error) {
      setAvailability(previous);
      notify({ title: "Ketersediaan gagal disimpan", description: error instanceof Error ? error.message : "Silakan coba lagi.", variant: "error" });
    }
  };

  const rangeLabel = rangeStart
    ? rangeEnd
      ? `${fullDateFormatter.format(dateFromKey(rangeStart))} – ${fullDateFormatter.format(dateFromKey(rangeEnd))}`
      : fullDateFormatter.format(dateFromKey(rangeStart))
    : "Belum ada tanggal dipilih";

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-5">
        {(Object.keys(statusMeta) as AvailabilityStatus[]).map((status) => {
          const meta = statusMeta[status];
          return (
            <div key={status} className="flex items-center gap-2 rounded-xl border border-emerald-950/7 bg-white/50 px-3 py-2.5 dark:border-white/7 dark:bg-white/[0.025]">
              <span className={cn("size-2.5 shrink-0 rounded-full", meta.dotClass)} />
              <span className="min-w-0 flex-1 truncate text-[0.65rem] font-semibold text-emerald-950/48 dark:text-white/46">{meta.label}</span>
              <span className="text-xs font-bold">{stats[status]}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-950/8 bg-white/54 dark:border-white/8 dark:bg-white/[0.025]">
        <div className="flex flex-col gap-4 border-b border-emerald-950/8 p-4 dark:border-white/8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="grid size-9 place-items-center rounded-xl border border-emerald-950/8 bg-white/70 transition hover:-translate-x-0.5 dark:border-white/8 dark:bg-white/6" aria-label="Bulan sebelumnya"><ChevronLeft className="size-4" /></button>
            <button type="button" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="grid size-9 place-items-center rounded-xl border border-emerald-950/8 bg-white/70 transition hover:translate-x-0.5 dark:border-white/8 dark:bg-white/6" aria-label="Bulan berikutnya"><ChevronRight className="size-4" /></button>
            <motion.h3 key={month.toISOString()} initial={shouldReduceMotion ? false : { opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="ml-2 font-serif text-xl font-semibold capitalize">{monthFormatter.format(month)}{isLoading ? <span className="ml-2 text-xs font-sans font-normal opacity-45">Memuat...</span> : null}</motion.h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-950/40 dark:text-white/38"><Info className="size-3.5" /> Klik tanggal awal dan akhir untuk memilih rentang</div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[680px] p-3 sm:p-4">
            <div className="grid grid-cols-7 gap-1.5">{weekDays.map((day) => <div key={day} className="py-2 text-center text-[0.62rem] font-bold uppercase tracking-[0.12em] text-emerald-950/34 dark:text-white/32">{day}</div>)}</div>
            <motion.div key={`${month.getFullYear()}-${month.getMonth()}`} initial={shouldReduceMotion ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} className="mt-1 grid grid-cols-7 gap-1.5">
              {calendarDays.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="min-h-20 rounded-xl bg-emerald-950/[0.018] dark:bg-white/[0.012]" />;
                const key = dateKey(day);
                const status = availability[key] ?? "AVAILABLE";
                const meta = statusMeta[status];
                const StatusIcon = meta.icon;
                const selected = isInRange(key);
                return (
                  <motion.button
                    type="button"
                    key={key}
                    onClick={() => selectDate(key)}
                    whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                    className={cn("relative min-h-20 overflow-hidden rounded-xl border p-2 text-left transition-shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20", meta.className, selected && "z-10 ring-2 ring-emerald-700 ring-offset-2 ring-offset-[#f8f8f4] dark:ring-emerald-300 dark:ring-offset-[#071310]")}
                    aria-label={`${fullDateFormatter.format(day)}, ${meta.label}${selected ? ", dipilih" : ""}`}
                    aria-pressed={selected}
                  >
                    <span className="flex items-start justify-between"><span className="text-sm font-bold">{day.getDate()}</span><StatusIcon className="size-3.5 opacity-55" /></span>
                    <span className="mt-3 block truncate text-[0.56rem] font-bold uppercase tracking-[0.08em] opacity-60">{bookingLabels[key] ?? meta.shortLabel}</span>
                    {selected ? <motion.span layoutId="calendar-selection" className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-current" /> : null}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {rangeStart ? (
          <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="mt-4 rounded-2xl bg-emerald-950 p-4 text-white sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-amber-200">Rentang dipilih · {selectedKeys.length} hari</p>
                <p className="mt-1.5 font-serif text-lg font-semibold">{rangeLabel}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="relative"><span className="sr-only">Status baru</span><select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as AvailabilityStatus)} className="h-10 appearance-none rounded-full border border-white/12 bg-white/8 pl-4 pr-9 text-xs font-semibold text-white outline-none"><option className="text-emerald-950" value="AVAILABLE">Tersedia</option><option className="text-emerald-950" value="BOOKED">Dipesan</option><option className="text-emerald-950" value="PENDING">Menunggu</option><option className="text-emerald-950" value="MAINTENANCE">Perawatan</option><option className="text-emerald-950" value="BLOCKED">Diblokir</option></select><ChevronRight className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 rotate-90 text-white/50" /></label>
                <button type="button" onClick={() => { setRangeStart(null); setRangeEnd(null); }} className="grid size-10 place-items-center rounded-full border border-white/12 text-white/60" aria-label="Hapus pilihan tanggal"><Eraser className="size-4" /></button>
                <button type="button" onClick={() => void applyStatus()} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-amber-300 px-5 text-xs font-bold text-emerald-950"><Check className="size-4" /> Terapkan status</button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-600/10 bg-amber-50/50 p-3.5 dark:border-amber-200/8 dark:bg-amber-200/[0.03]">
        <Info className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-200" />
        <p className="text-xs leading-5 text-emerald-950/46 dark:text-white/42">Perubahan kalender disimpan melalui API. Tanggal booking yang sudah terkonfirmasi tetap dilindungi agar tidak tertimpa status operasional.</p>
      </div>
    </div>
  );
}
