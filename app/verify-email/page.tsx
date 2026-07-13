"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type VerificationState =
  | { status: "verifying" }
  | { status: "success"; email: string }
  | { status: "failed"; reason: "expired" | "invalid" | "missing" };

const failureCopy = {
  expired: {
    eyebrow: "Tautan kedaluwarsa",
    title: "Waktu verifikasi telah habis.",
    description:
      "Tautan ini berlaku selama 24 jam. Minta email baru agar kami dapat mengirimkan tautan yang masih aktif.",
    icon: Clock3,
  },
  invalid: {
    eyebrow: "Token tidak valid",
    title: "Kami tidak dapat mengenali tautan ini.",
    description:
      "Token mungkin sudah digunakan atau tidak lengkap. Pastikan Anda membuka tautan terbaru dari email VillaKu.",
    icon: XCircle,
  },
  missing: {
    eyebrow: "Token tidak ditemukan",
    title: "Tautan verifikasi belum lengkap.",
    description:
      "Buka kembali tombol verifikasi dari email VillaKu, atau minta kami mengirim ulang email verifikasi.",
    icon: AlertTriangle,
  },
};

export default function VerifyEmailPage() {
  const shouldReduceMotion = useReducedMotion();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [verification, setVerification] = useState<VerificationState>({ status: "verifying" });
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("villaku-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light";

    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    const timer = window.setTimeout(() => {
      if (token === "valid-token") {
        setVerification({ status: "success", email: "maya.putri@example.com" });
        return;
      }
      if (token === "expired-token") {
        setVerification({ status: "failed", reason: "expired" });
        return;
      }
      setVerification({ status: "failed", reason: token ? "invalid" : "missing" });
    }, shouldReduceMotion ? 120 : 1050);

    return () => window.clearTimeout(timer);
  }, [shouldReduceMotion]);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("villaku-theme", next);
      return next;
    });
  };

  const resendVerification = async () => {
    setResendState("sending");
    await new Promise((resolve) => window.setTimeout(resolve, 850));
    setResendState("sent");
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-24 text-foreground sm:px-6">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(247,217,140,0.34),transparent_27rem),radial-gradient(circle_at_86%_82%,rgba(4,120,87,0.16),transparent_31rem)]"
      />
      <motion.div
        aria-hidden
        className="absolute -left-20 top-1/3 size-72 rounded-full border border-amber-400/15"
        animate={shouldReduceMotion ? undefined : { y: [0, -18, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -right-16 bottom-10 size-56 rounded-full bg-emerald-700/7 blur-sm"
        animate={shouldReduceMotion ? undefined : { y: [0, 16, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="Kembali ke beranda VillaKu">
          <span className="grid size-10 place-items-center rounded-full bg-emerald-700 text-sm font-bold text-white shadow-[0_10px_28px_rgba(4,120,87,0.24)] transition-transform group-hover:rotate-6 group-hover:scale-105">
            V
          </span>
          <span>
            <span className="block font-serif text-xl font-semibold leading-none text-emerald-950 dark:text-white">Villaku</span>
            <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.24em] text-emerald-950/44 dark:text-white/44">Guest circle</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          className="grid size-10 place-items-center rounded-full border border-emerald-950/10 bg-white/68 shadow-sm backdrop-blur-xl transition-transform hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/8"
          aria-label="Ubah tema gelap atau terang"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </header>

      <section className="relative z-10 w-full max-w-3xl">
        <div className="overflow-hidden rounded-[2.2rem] border border-emerald-950/10 bg-white/64 shadow-[0_34px_120px_rgba(4,34,28,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b1f1b]/76">
          <div className="h-1.5 bg-emerald-950/6 dark:bg-white/6">
            <motion.div
              className={`h-full origin-left ${
                verification.status === "failed" ? "bg-red-400" : "bg-gradient-to-r from-emerald-600 to-amber-300"
              }`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: verification.status === "verifying" ? 0.68 : 1 }}
              transition={{ duration: verification.status === "verifying" ? 1 : 0.4, ease: "easeOut" }}
            />
          </div>

          <div className="p-6 sm:p-10 lg:p-12">
            <AnimatePresence mode="wait">
              {verification.status === "verifying" ? (
                <VerifyingState key="verifying" shouldReduceMotion={Boolean(shouldReduceMotion)} />
              ) : null}
              {verification.status === "success" ? (
                <SuccessState key="success" email={verification.email} shouldReduceMotion={Boolean(shouldReduceMotion)} />
              ) : null}
              {verification.status === "failed" ? (
                <FailedState
                  key={`failed-${verification.reason}`}
                  reason={verification.reason}
                  resendState={resendState}
                  onResend={resendVerification}
                  shouldReduceMotion={Boolean(shouldReduceMotion)}
                />
              ) : null}
            </AnimatePresence>
          </div>

          <div className="border-t border-emerald-950/8 bg-emerald-950/[0.025] px-6 py-4 dark:border-white/8 dark:bg-white/[0.025] sm:px-10">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-950/42 dark:text-white/40">
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-700 dark:text-emerald-300" /> Token diproses secara aman
              </span>
              <Link href="/login" className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200">
                Kembali ke login <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[0.68rem] text-emerald-950/38 dark:text-white/36">
          <span className="mr-1 font-bold uppercase tracking-[0.14em]">Coba status:</span>
          <Link href="/verify-email?token=valid-token" className="rounded-full border border-emerald-950/10 bg-white/44 px-3 py-1.5 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/9">
            Token valid
          </Link>
          <Link href="/verify-email?token=expired-token" className="rounded-full border border-emerald-950/10 bg-white/44 px-3 py-1.5 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/9">
            Token kedaluwarsa
          </Link>
          <Link href="/verify-email?token=invalid-token" className="rounded-full border border-emerald-950/10 bg-white/44 px-3 py-1.5 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/9">
            Token tidak valid
          </Link>
        </div>
      </section>
    </main>
  );
}

function VerifyingState({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
      className="py-8 text-center"
    >
      <div className="relative mx-auto grid size-24 place-items-center">
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full border border-emerald-500/18"
          animate={shouldReduceMotion ? undefined : { scale: [0.88, 1.18], opacity: [0.7, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
        <span className="grid size-18 place-items-center rounded-full bg-emerald-700 text-white shadow-[0_18px_45px_rgba(4,120,87,0.24)]">
          <Loader2 className={`size-8 ${shouldReduceMotion ? "" : "animate-spin"}`} />
        </span>
      </div>
      <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">Verifikasi sedang berlangsung</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] text-emerald-950 dark:text-white sm:text-5xl">Memeriksa tautan Anda…</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-emerald-950/50 dark:text-white/48">Tunggu sebentar. Kami sedang memastikan token verifikasi aman dan masih aktif.</p>
    </motion.div>
  );
}

function SuccessState({ email, shouldReduceMotion }: { email: string; shouldReduceMotion: boolean }) {
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      className="py-4 text-center"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { scale: 0, rotate: -14 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 16, stiffness: 210, delay: 0.08 }}
        className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-700 text-white shadow-[0_18px_48px_rgba(4,120,87,0.28)] ring-8 ring-emerald-600/8"
      >
        <Check className="size-9" strokeWidth={2.4} />
      </motion.div>
      <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">Verifikasi berhasil</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] text-emerald-950 dark:text-white sm:text-5xl">Email Anda telah terverifikasi.</h1>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-emerald-950/50 dark:text-white/48">Akun untuk <span className="font-semibold text-emerald-950 dark:text-white">{email}</span> kini aktif. Anda dapat masuk dan melanjutkan rencana perjalanan.</p>
      <div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-emerald-600/8 px-4 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-300/8 dark:text-emerald-300">
        <CheckCircle2 className="size-4" /> Status akun: aktif
      </div>
      <div className="mx-auto mt-8 grid max-w-md gap-3 sm:grid-cols-2">
        <Button asChild size="lg" variant="gold">
          <Link href="/login">Masuk sekarang <ArrowRight /></Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/dashboard">Lihat dashboard</Link>
        </Button>
      </div>
    </motion.div>
  );
}

function FailedState({
  reason,
  resendState,
  onResend,
  shouldReduceMotion,
}: {
  reason: "expired" | "invalid" | "missing";
  resendState: "idle" | "sending" | "sent";
  onResend: () => void;
  shouldReduceMotion: boolean;
}) {
  const content = failureCopy[reason];
  const Icon = content.icon;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      className="py-4 text-center"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { scale: 0, rotate: 12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 17, stiffness: 210, delay: 0.08 }}
        className="mx-auto grid size-20 place-items-center rounded-full bg-red-500/10 text-red-600 ring-8 ring-red-500/5 dark:bg-red-300/9 dark:text-red-300 dark:ring-red-300/4"
      >
        <Icon className="size-8" />
      </motion.div>
      <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-red-600 dark:text-red-300">{content.eyebrow}</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] text-emerald-950 dark:text-white sm:text-5xl">{content.title}</h1>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-emerald-950/50 dark:text-white/48">{content.description}</p>

      <AnimatePresence mode="wait">
        {resendState === "sent" ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-7 flex max-w-md items-start gap-3 rounded-2xl border border-emerald-500/16 bg-emerald-500/7 p-4 text-left"
            role="status"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-300">
              <Mail className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Email baru telah dikirim</p>
              <p className="mt-1 text-xs leading-5 text-emerald-950/46 dark:text-white/44">Periksa inbox maya.putri@example.com dan buka tautan terbaru.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto mt-8 grid max-w-md gap-3 sm:grid-cols-2">
            <Button type="button" size="lg" variant="gold" onClick={onResend} disabled={resendState === "sending"}>
              {resendState === "sending" ? <><Loader2 className="animate-spin" /> Mengirim…</> : <><RefreshCw /> Kirim ulang</>}
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">Daftar kembali</Link>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
