"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, CreditCard, Loader2, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PaymentMethod } from "@/lib/booking-draft";
import { formatRupiah } from "@/lib/villa-data";

export function PaymentGatewayRedirect({
  open,
  method,
  amount,
  onCancel,
  onDone,
}: {
  open: boolean;
  method: PaymentMethod | null;
  amount: number;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const complete = progress >= 100;

  useEffect(() => {
    if (!open) {
      setProgress(0);
      return;
    }

    if (shouldReduceMotion) {
      setProgress(100);
      return;
    }

    setProgress(8);
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(100, current + 7));
    }, 140);

    return () => window.clearInterval(timer);
  }, [open, shouldReduceMotion]);

  return (
    <AnimatePresence>
      {open && method ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-emerald-950/54 px-4 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="gateway-title"
        >
          <motion.div
            className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/12 bg-white text-emerald-950 shadow-[0_30px_120px_rgba(4,34,28,0.32)] dark:bg-emerald-950 dark:text-white"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.24 }}
          >
            <div className="relative overflow-hidden bg-emerald-950 p-6 text-white">
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(247,217,140,0.38),transparent_18rem),radial-gradient(circle_at_86%_16%,rgba(16,185,129,0.25),transparent_20rem)]"
              />
              <button
                type="button"
                onClick={onCancel}
                className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/18"
                aria-label="Tutup redirect gateway"
              >
                <X className="size-4" />
              </button>
              <div className="relative">
                <span className="grid size-14 place-items-center rounded-full bg-white/12 text-amber-200">
                  {complete ? <CheckCircle2 className="size-7" /> : <Loader2 className="size-7 animate-spin" />}
                </span>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-white/46">
                  Gateway redirect
                </p>
                <h2 id="gateway-title" className="mt-2 font-serif text-3xl">
                  {complete ? "Gateway mock siap dibuka" : "Mengalihkan ke gateway pembayaran"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/68">
                  {complete
                    ? "Simulasi token pembayaran sudah dibuat. Integrasi gateway asli akan menyusul di layer backend."
                    : `Menyiapkan sesi aman untuk ${method.title}.`}
                </p>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-[1.5rem] border border-emerald-900/10 bg-emerald-900/5 p-4 dark:border-white/10 dark:bg-white/6">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-emerald-700 text-white">
                    <CreditCard className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{method.title}</p>
                    <p className="text-sm text-emerald-950/56 dark:text-white/50">
                      Payable now {formatRupiah(amount)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-900/10 dark:bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#047857,#d6a84f)]"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs font-semibold uppercase tracking-[0.16em] text-emerald-950/45 dark:text-white/42">
                  <span>Session</span>
                  <span>{progress}%</span>
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-amber-300/35 bg-amber-100/45 p-4 text-sm leading-6 text-emerald-950/70 dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-white/68">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-200" />
                  <p>
                    Tidak ada pembayaran sungguhan. Komponen ini hanya mensimulasikan redirect menuju gateway.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Batal
                </Button>
                <Button type="button" variant="gold" disabled={!complete} onClick={onDone}>
                  <ArrowUpRight />
                  {complete ? "Tutup simulasi" : "Menyiapkan..."}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
