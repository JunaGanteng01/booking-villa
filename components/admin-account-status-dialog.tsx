"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, UserRoundX, X } from "lucide-react";

export function AdminAccountStatusDialog({
  open,
  active,
  userName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  active: boolean;
  userName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center bg-emerald-950/65 p-4 backdrop-blur-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="account-dialog-title"
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-[1.8rem] bg-[#fffdf8] p-6 shadow-2xl dark:bg-[#0c1c18]"
          >
            <div className="flex items-start justify-between gap-4">
              <span
                className={`grid size-12 place-items-center rounded-2xl ${
                  active
                    ? "bg-rose-100 text-rose-600 dark:bg-rose-300/10 dark:text-rose-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200"
                }`}
              >
                {active ? (
                  <AlertTriangle className="size-5" />
                ) : (
                  <CheckCircle2 className="size-5" />
                )}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="grid size-9 place-items-center rounded-full bg-emerald-950/5 dark:bg-white/7"
                aria-label="Tutup dialog"
              >
                <X className="size-4" />
              </button>
            </div>
            <h2
              id="account-dialog-title"
              className="mt-5 font-serif text-2xl font-semibold"
            >
              {active ? "Nonaktifkan akun?" : "Aktifkan kembali akun?"}
            </h2>
            <p className="mt-3 text-sm leading-6 opacity-50">
              {active
                ? `${userName} akan langsung keluar dari semua perangkat dan tidak dapat mengakses dashboard sampai akun diaktifkan kembali.`
                : `${userName} akan kembali dapat masuk dan menggunakan fitur sesuai role yang diberikan.`}
            </p>
            {active ? (
              <div className="mt-5 rounded-2xl bg-rose-50 p-4 text-xs leading-5 text-rose-700 dark:bg-rose-300/8 dark:text-rose-200">
                Data pengguna dan riwayat aktivitas tetap tersimpan. Tindakan
                ini dapat dibatalkan kapan saja.
              </div>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-full border border-emerald-950/10 px-4 text-sm font-bold dark:border-white/10"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-white ${
                  active ? "bg-rose-600" : "bg-emerald-700"
                }`}
              >
                {active ? <UserRoundX className="size-4" /> : null}
                {active ? "Ya, nonaktifkan" : "Aktifkan akun"}
              </button>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
