"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Clock3,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi.")
    .email("Masukkan alamat email yang valid."),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const reveal = {
  hidden: { opacity: 0, y: 22, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export default function ForgotPasswordPage() {
  const shouldReduceMotion = useReducedMotion();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors, isValid, touchedFields },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: { email: "" },
  });

  const watchedEmail = watch("email");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("villaku-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light";

    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  useEffect(() => {
    if (errors.root?.account) clearErrors("root.account");
  }, [clearErrors, watchedEmail]);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("villaku-theme", next);
      return next;
    });
  };

  const onSubmit = async ({ email }: ForgotPasswordForm) => {
    setIsSubmitting(true);
    clearErrors("root.account");
    await new Promise((resolve) => window.setTimeout(resolve, 900));

    if (email.trim().toLowerCase() === "tidakada@villaku.test") {
      setError("root.account", {
        type: "manual",
        message: "Kami tidak menemukan akun dengan email tersebut. Periksa kembali atau daftar akun baru.",
      });
      setIsSubmitting(false);
      return;
    }

    setSentEmail(email.trim());
    setIsSubmitting(false);
  };

  const resendEmail = async () => {
    setResendState("sending");
    await new Promise((resolve) => window.setTimeout(resolve, 750));
    setResendState("sent");
    window.setTimeout(() => setResendState("idle"), 2600);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(247,217,140,0.32),transparent_27rem),radial-gradient(circle_at_86%_78%,rgba(4,120,87,0.15),transparent_30rem)]"
      />

      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="Kembali ke beranda VillaKu">
          <span className="grid size-10 place-items-center rounded-full bg-emerald-700 text-sm font-bold text-white shadow-[0_10px_28px_rgba(4,120,87,0.24)] transition-transform group-hover:rotate-6 group-hover:scale-105">V</span>
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

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[minmax(0,0.84fr)_minmax(34rem,1.16fr)]">
        <section className="relative hidden min-h-screen overflow-hidden bg-emerald-950 text-white lg:block">
          <motion.img
            src="https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1800&q=88"
            alt="Ruang villa tropis yang tenang dan privat"
            className="absolute inset-0 h-full w-full object-cover"
            initial={shouldReduceMotion ? false : { scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,32,26,0.18),rgba(3,32,26,0.9)),linear-gradient(90deg,rgba(3,32,26,0.15),transparent)]" />
          <div aria-hidden className="absolute -bottom-24 -left-20 size-96 rounded-full bg-emerald-400/16 blur-3xl" />

          <motion.div
            initial={shouldReduceMotion ? false : "hidden"}
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
            className="relative flex min-h-screen flex-col justify-end p-10 xl:p-14"
          >
            <motion.div variants={reveal} className="inline-flex w-fit items-center gap-2 rounded-full border border-white/16 bg-white/9 px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-amber-200 backdrop-blur-xl">
              <ShieldCheck className="size-4" /> Secure account recovery
            </motion.div>
            <motion.h1 variants={reveal} className="mt-7 max-w-xl font-serif text-5xl font-semibold leading-[0.97] tracking-[-0.045em] xl:text-6xl">
              Kembali ke perjalanan Anda dengan tenang.
            </motion.h1>
            <motion.p variants={reveal} className="mt-5 max-w-lg text-base leading-7 text-white/60">
              Kami akan mengirimkan tautan aman untuk membuat password baru. Tautan hanya berlaku selama 30 menit.
            </motion.p>
            <motion.div variants={reveal} className="mt-9 grid gap-3">
              <RecoveryStep number="01" title="Masukkan email akun" />
              <RecoveryStep number="02" title="Buka tautan pemulihan" />
              <RecoveryStep number="03" title="Buat password baru" />
            </motion.div>
          </motion.div>
        </section>

        <section className="flex items-center justify-center px-4 pb-12 pt-24 sm:px-8 lg:px-12 xl:px-20">
          <div className="w-full max-w-xl">
            <AnimatePresence mode="wait">
              {sentEmail ? (
                <ResetLinkSent
                  key="sent"
                  email={sentEmail}
                  resendState={resendState}
                  onResend={resendEmail}
                  shouldReduceMotion={Boolean(shouldReduceMotion)}
                />
              ) : (
                <motion.div
                  key="form"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12, filter: "blur(8px)" }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-950/10 bg-white/58 px-3 py-1.5 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-emerald-700 backdrop-blur-xl dark:border-white/10 dark:bg-white/6 dark:text-emerald-300">
                    <Sparkles className="size-3.5" /> Pemulihan akun
                  </span>
                  <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">Lupa password</p>
                  <h1 className="mt-3 font-serif text-4xl font-semibold leading-none tracking-[-0.045em] text-emerald-950 dark:text-white sm:text-5xl">Kami bantu Anda masuk kembali.</h1>
                  <p className="mt-4 max-w-lg text-sm leading-7 text-emerald-950/52 dark:text-white/50 sm:text-base">Masukkan email yang terdaftar. Instruksi untuk mengatur ulang password akan dikirim ke inbox Anda.</p>

                  <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
                    <label htmlFor="email" className="grid gap-2 text-xs font-semibold text-emerald-950/62 dark:text-white/60">
                      Alamat email
                      <span
                        className={cn(
                          "flex h-13 items-center gap-3 rounded-2xl border bg-white/54 px-4 shadow-sm transition-[border-color,box-shadow] focus-within:ring-4 dark:bg-white/5",
                          errors.email
                            ? "border-red-500/45 focus-within:border-red-500/60 focus-within:ring-red-500/8 dark:border-red-300/40"
                            : "border-emerald-950/10 focus-within:border-emerald-600/32 focus-within:ring-emerald-500/8 dark:border-white/10",
                        )}
                      >
                        <Mail className={cn("size-[1.05rem] shrink-0", errors.email ? "text-red-500 dark:text-red-300" : "text-emerald-700/64 dark:text-emerald-300/62")} />
                        <input
                          id="email"
                          type="email"
                          placeholder="nama@email.com"
                          autoComplete="email"
                          aria-invalid={Boolean(errors.email)}
                          aria-describedby={errors.email ? "email-error" : undefined}
                          className="h-full min-w-0 flex-1 bg-transparent text-sm font-normal text-emerald-950 outline-none placeholder:text-emerald-950/28 dark:text-white dark:placeholder:text-white/26"
                          {...register("email")}
                        />
                        {touchedFields.email && !errors.email ? <Check className="size-4 text-emerald-600 dark:text-emerald-300" /> : null}
                      </span>
                      <AnimatePresence initial={false}>
                        {errors.email ? (
                          <motion.span id="email-error" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-300" role="alert">
                            <span className="size-1.5 rounded-full bg-current" /> {errors.email.message}
                          </motion.span>
                        ) : null}
                      </AnimatePresence>
                    </label>

                    <AnimatePresence initial={false}>
                      {errors.root?.account ? (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-3 rounded-2xl border border-red-500/18 bg-red-500/8 p-4 text-sm text-red-700 dark:border-red-300/16 dark:bg-red-300/7 dark:text-red-200" role="alert">
                          <CircleAlert className="mt-0.5 size-4 shrink-0" />
                          <div>
                            <p className="font-semibold">Akun belum ditemukan</p>
                            <p className="mt-1 text-xs leading-5 opacity-80">{errors.root.account.message}</p>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <Button type="submit" size="lg" variant="gold" className="w-full" disabled={isSubmitting || !isValid}>
                      {isSubmitting ? <><Loader2 className="animate-spin" /> Mengirim tautan…</> : <>Kirim tautan pemulihan <ArrowRight /></>}
                    </Button>
                  </form>

                  <div className="mt-6 rounded-2xl border border-emerald-950/8 bg-white/38 p-4 text-xs leading-5 text-emerald-950/42 dark:border-white/8 dark:bg-white/4 dark:text-white/40">
                    <div className="flex gap-3">
                      <KeyRound className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
                      <p>Gunakan <span className="font-semibold">tidakada@villaku.test</span> untuk mencoba status akun tidak ditemukan. Email lain akan menampilkan status berhasil.</p>
                    </div>
                  </div>

                  <Link href="/login" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200">
                    <ArrowLeft className="size-4" /> Kembali ke login
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </main>
  );
}

function RecoveryStep({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 p-3.5 backdrop-blur-xl">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-300/14 text-[0.65rem] font-bold text-amber-200">{number}</span>
      <span className="text-sm font-medium text-white/74">{title}</span>
    </div>
  );
}

function ResetLinkSent({
  email,
  resendState,
  onResend,
  shouldReduceMotion,
}: {
  email: string;
  resendState: "idle" | "sending" | "sent";
  onResend: () => void;
  shouldReduceMotion: boolean;
}) {
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      className="rounded-[2rem] border border-emerald-950/10 bg-white/58 p-7 text-center shadow-[0_24px_80px_rgba(4,34,28,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:p-10"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 16, stiffness: 210, delay: 0.1 }}
        className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-700 text-white shadow-[0_18px_48px_rgba(4,120,87,0.28)] ring-8 ring-emerald-600/8"
      >
        <Mail className="size-8" />
      </motion.div>
      <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">Periksa email Anda</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] text-emerald-950 dark:text-white sm:text-5xl">Tautan pemulihan telah dikirim.</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-emerald-950/52 dark:text-white/50">Kami mengirim instruksi reset password ke <span className="font-semibold text-emerald-950 dark:text-white">{email}</span>.</p>
      <div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-amber-300/12 px-4 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
        <Clock3 className="size-4" /> Tautan aktif selama 30 menit
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Button asChild size="lg" variant="gold">
          <Link href="/login">Kembali ke login <ArrowRight /></Link>
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={onResend} disabled={resendState === "sending"}>
          {resendState === "sending" ? <><Loader2 className="animate-spin" /> Mengirim…</> : resendState === "sent" ? <><Check /> Terkirim lagi</> : <><RefreshCw /> Kirim ulang</>}
        </Button>
      </div>
      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-emerald-950/36 dark:text-white/34">
        <LockKeyhole className="size-4 text-emerald-700 dark:text-emerald-300" /> Tidak menerima email? Periksa folder spam atau promosi.
      </p>
    </motion.div>
  );
}
