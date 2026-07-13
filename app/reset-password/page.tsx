"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password minimal 8 karakter.")
      .regex(/[A-Z]/, "Tambahkan minimal satu huruf kapital.")
      .regex(/[a-z]/, "Tambahkan minimal satu huruf kecil.")
      .regex(/[0-9]/, "Tambahkan minimal satu angka."),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Konfirmasi password belum sama.",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
type TokenState = "checking" | "valid" | "invalid" | "expired";

export default function ResetPasswordPage() {
  const shouldReduceMotion = useReducedMotion();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [tokenState, setTokenState] = useState<TokenState>("checking");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, touchedFields },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = watch("password");
  const strength = useMemo(() => getPasswordStrength(password ?? ""), [password]);

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
      if (token === "valid-reset-token") setTokenState("valid");
      else if (token === "expired-reset-token") setTokenState("expired");
      else setTokenState("invalid");
    }, shouldReduceMotion ? 100 : 850);

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

  const onSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setIsSubmitting(false);
    setResetComplete(true);
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-24 text-foreground sm:px-6">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(247,217,140,0.34),transparent_27rem),radial-gradient(circle_at_86%_82%,rgba(4,120,87,0.16),transparent_31rem)]"
      />
      <div aria-hidden className="absolute left-[7%] top-1/4 size-52 rounded-full border border-amber-400/14" />
      <div aria-hidden className="absolute bottom-10 right-[8%] size-72 rounded-full bg-emerald-700/7 blur-2xl" />

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

      <section className="relative z-10 w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {tokenState === "checking" ? (
            <CheckingToken key="checking" shouldReduceMotion={Boolean(shouldReduceMotion)} />
          ) : null}
          {tokenState === "valid" && !resetComplete ? (
            <motion.div
              key="form"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16, filter: "blur(9px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
              className="overflow-hidden rounded-[2.2rem] border border-emerald-950/10 bg-white/64 shadow-[0_34px_120px_rgba(4,34,28,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b1f1b]/76"
            >
              <div className="bg-emerald-950 p-6 text-white sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-300/12 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.17em] text-emerald-200 ring-1 ring-emerald-200/12">
                      <ShieldCheck className="size-3.5" /> Token aman
                    </span>
                    <h1 className="mt-5 font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Buat password baru.</h1>
                    <p className="mt-3 max-w-lg text-sm leading-6 text-white/54">Gunakan password unik yang belum pernah dipakai pada akun VillaKu Anda.</p>
                  </div>
                  <span className="hidden size-16 shrink-0 place-items-center rounded-full bg-white/8 text-amber-200 ring-1 ring-white/10 sm:grid">
                    <KeyRound className="size-7" />
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 sm:p-8">
                <PasswordField
                  id="password"
                  label="Password baru"
                  placeholder="Minimal 8 karakter"
                  visible={showPassword}
                  onToggle={() => setShowPassword((value) => !value)}
                  error={errors.password?.message}
                  valid={Boolean(touchedFields.password && !errors.password)}
                  inputProps={register("password")}
                />

                <PasswordStrength password={password ?? ""} strength={strength} />

                <div className="mt-5">
                  <PasswordField
                    id="confirmPassword"
                    label="Konfirmasi password baru"
                    placeholder="Ulangi password baru"
                    visible={showConfirmation}
                    onToggle={() => setShowConfirmation((value) => !value)}
                    error={errors.confirmPassword?.message}
                    valid={Boolean(touchedFields.confirmPassword && !errors.confirmPassword)}
                    inputProps={register("confirmPassword")}
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-emerald-950/8 bg-emerald-950/[0.025] p-4 text-xs leading-5 text-emerald-950/44 dark:border-white/8 dark:bg-white/[0.035] dark:text-white/42">
                  <div className="flex gap-3">
                    <LockKeyhole className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
                    <p>Setelah password berhasil diubah, semua sesi lama akan dikeluarkan untuk melindungi akun Anda.</p>
                  </div>
                </div>

                <Button type="submit" variant="gold" size="lg" className="mt-6 w-full" disabled={isSubmitting || !isValid}>
                  {isSubmitting ? <><Loader2 className="animate-spin" /> Menyimpan password…</> : <>Simpan password baru <ArrowRight /></>}
                </Button>
              </form>
            </motion.div>
          ) : null}
          {tokenState === "valid" && resetComplete ? (
            <ResetComplete key="complete" shouldReduceMotion={Boolean(shouldReduceMotion)} />
          ) : null}
          {tokenState === "invalid" || tokenState === "expired" ? (
            <InvalidToken key={tokenState} state={tokenState} shouldReduceMotion={Boolean(shouldReduceMotion)} />
          ) : null}
        </AnimatePresence>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[0.68rem] text-emerald-950/38 dark:text-white/36">
          <span className="mr-1 font-bold uppercase tracking-[0.14em]">Coba token:</span>
          <Link href="/reset-password?token=valid-reset-token" className="rounded-full border border-emerald-950/10 bg-white/44 px-3 py-1.5 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/9">Valid</Link>
          <Link href="/reset-password?token=expired-reset-token" className="rounded-full border border-emerald-950/10 bg-white/44 px-3 py-1.5 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/9">Kedaluwarsa</Link>
          <Link href="/reset-password?token=invalid-reset-token" className="rounded-full border border-emerald-950/10 bg-white/44 px-3 py-1.5 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/9">Tidak valid</Link>
        </div>
      </section>
    </main>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
  error?: string;
  valid?: boolean;
  inputProps: ReturnType<ReturnType<typeof useForm<ResetPasswordForm>>["register"]>;
};

function PasswordField({ id, label, placeholder, visible, onToggle, error, valid, inputProps }: PasswordFieldProps) {
  return (
    <label htmlFor={id} className="grid gap-2 text-xs font-semibold text-emerald-950/62 dark:text-white/60">
      {label}
      <span
        className={cn(
          "flex h-13 items-center gap-3 rounded-2xl border bg-white/54 px-4 shadow-sm transition-[border-color,box-shadow] focus-within:ring-4 dark:bg-white/5",
          error
            ? "border-red-500/45 focus-within:border-red-500/60 focus-within:ring-red-500/8 dark:border-red-300/40"
            : "border-emerald-950/10 focus-within:border-emerald-600/32 focus-within:ring-emerald-500/8 dark:border-white/10",
        )}
      >
        <LockKeyhole className={cn("size-[1.05rem] shrink-0", error ? "text-red-500 dark:text-red-300" : "text-emerald-700/64 dark:text-emerald-300/62")} />
        <input
          id={id}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete="new-password"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-normal text-emerald-950 outline-none placeholder:text-emerald-950/28 dark:text-white dark:placeholder:text-white/26"
          {...inputProps}
        />
        {valid ? <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-300" /> : null}
        <button type="button" onClick={onToggle} className="grid size-9 place-items-center rounded-full text-emerald-950/36 transition-colors hover:bg-emerald-950/5 hover:text-emerald-950 dark:text-white/34 dark:hover:bg-white/7 dark:hover:text-white" aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}>
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
      <AnimatePresence initial={false}>
        {error ? (
          <motion.span id={`${id}-error`} initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-300" role="alert">
            <span className="size-1.5 rounded-full bg-current" /> {error}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </label>
  );
}

function PasswordStrength({ password, strength }: { password: string; strength: ReturnType<typeof getPasswordStrength> }) {
  const checks = [
    { label: "8+ karakter", valid: password.length >= 8 },
    { label: "Huruf besar & kecil", valid: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: "Minimal 1 angka", valid: /[0-9]/.test(password) },
  ];

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden>
          {Array.from({ length: 4 }, (_, index) => (
            <span key={index} className={cn("h-1 rounded-full transition-colors", index < strength.score ? strength.barClass : "bg-emerald-950/8 dark:bg-white/8")} />
          ))}
        </div>
        <span className={cn("w-16 text-right text-[0.66rem] font-bold", strength.textClass)}>{password ? strength.label : "Belum ada"}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
        {checks.map((check) => (
          <span key={check.label} className={cn("flex items-center gap-1 text-[0.65rem]", check.valid ? "text-emerald-700 dark:text-emerald-300" : "text-emerald-950/34 dark:text-white/32")}>
            <Check className={cn("size-3", check.valid ? "opacity-100" : "opacity-35")} /> {check.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function CheckingToken({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  return (
    <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-[2rem] border border-emerald-950/10 bg-white/60 p-8 text-center shadow-[0_24px_80px_rgba(4,34,28,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:p-10">
      <span className="mx-auto grid size-18 place-items-center rounded-full bg-emerald-700 text-white shadow-[0_18px_48px_rgba(4,120,87,0.24)]">
        <Loader2 className={cn("size-7", shouldReduceMotion ? "" : "animate-spin")} />
      </span>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Memeriksa keamanan</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-emerald-950 dark:text-white">Memvalidasi tautan reset…</h1>
    </motion.div>
  );
}

function InvalidToken({ state, shouldReduceMotion }: { state: "invalid" | "expired"; shouldReduceMotion: boolean }) {
  const expired = state === "expired";
  return (
    <motion.div initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, filter: "blur(9px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} className="rounded-[2rem] border border-emerald-950/10 bg-white/60 p-7 text-center shadow-[0_24px_80px_rgba(4,34,28,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:p-10">
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-red-500/9 text-red-600 ring-8 ring-red-500/4 dark:text-red-300">
        <AlertTriangle className="size-8" />
      </span>
      <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-red-600 dark:text-red-300">{expired ? "Token kedaluwarsa" : "Token tidak valid"}</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] text-emerald-950 dark:text-white sm:text-5xl">{expired ? "Tautan ini sudah tidak aktif." : "Tautan reset tidak dikenali."}</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-emerald-950/50 dark:text-white/48">{expired ? "Minta tautan pemulihan baru untuk menjaga keamanan akun Anda." : "Pastikan Anda membuka tautan terbaru dari email resmi VillaKu."}</p>
      <div className="mx-auto mt-8 grid max-w-md gap-3 sm:grid-cols-2">
        <Button asChild variant="gold" size="lg"><Link href="/forgot-password">Minta tautan baru <ArrowRight /></Link></Button>
        <Button asChild variant="outline" size="lg"><Link href="/login">Kembali ke login</Link></Button>
      </div>
    </motion.div>
  );
}

function ResetComplete({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  return (
    <motion.div initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, filter: "blur(9px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} className="rounded-[2rem] border border-emerald-950/10 bg-white/60 p-7 text-center shadow-[0_24px_80px_rgba(4,34,28,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:p-10">
      <motion.span initial={shouldReduceMotion ? false : { scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 16, stiffness: 210, delay: 0.1 }} className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-700 text-white shadow-[0_18px_48px_rgba(4,120,87,0.28)] ring-8 ring-emerald-600/8">
        <CheckCircle2 className="size-9" />
      </motion.span>
      <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Password berhasil diubah</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] text-emerald-950 dark:text-white sm:text-5xl">Akun Anda kembali aman.</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-emerald-950/50 dark:text-white/48">Gunakan password baru untuk masuk. Semua sesi lama telah dikeluarkan dari pratinjau akun.</p>
      <Button asChild variant="gold" size="lg" className="mt-8"><Link href="/login">Masuk dengan password baru <ArrowRight /></Link></Button>
    </motion.div>
  );
}

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password) && password.length >= 10) score += 1;

  if (score <= 1) return { score, label: "Lemah", barClass: "bg-red-500", textClass: "text-red-600 dark:text-red-300" };
  if (score === 2) return { score, label: "Cukup", barClass: "bg-amber-400", textClass: "text-amber-700 dark:text-amber-200" };
  if (score === 3) return { score, label: "Kuat", barClass: "bg-emerald-500", textClass: "text-emerald-700 dark:text-emerald-300" };
  return { score, label: "Sangat kuat", barClass: "bg-emerald-600", textClass: "text-emerald-700 dark:text-emerald-300" };
}
