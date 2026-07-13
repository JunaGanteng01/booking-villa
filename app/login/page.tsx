"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi.")
    .email("Masukkan alamat email yang valid."),
  password: z.string().min(8, "Password minimal 8 karakter."),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LoginMode = "user" | "admin";

const DEMO_ACCOUNTS = {
  user: {
    email: "maya@villaku.test",
    password: "VillaKu2026",
    name: "Maya Putri",
    destination: "/dashboard",
  },
  admin: {
    email: "admin@villaku.test",
    password: "AdminVilla2026",
    name: "Ayu Prameswari",
    destination: "/admin/villas",
  },
};

const reveal = {
  hidden: { opacity: 0, y: 24, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export default function LoginPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("user");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    trigger,
    formState: { errors, isValid, touchedFields },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const watchedEmail = watch("email");
  const watchedPassword = watch("password");
  const demoAccount = DEMO_ACCOUNTS[loginMode];

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("villaku-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light";

    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");

    const params = new URLSearchParams(window.location.search);
    setLoginMode(params.get("mode") === "admin" ? "admin" : "user");
  }, []);

  useEffect(() => {
    if (errors.root?.authentication) clearErrors("root.authentication");
  }, [clearErrors, watchedEmail, watchedPassword]);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("villaku-theme", next);
      return next;
    });
  };

  const useDemoAccount = async () => {
    setValue("email", demoAccount.email, { shouldDirty: true, shouldTouch: true });
    setValue("password", demoAccount.password, { shouldDirty: true, shouldTouch: true });
    clearErrors();
    await trigger(["email", "password"]);
  };

  const selectLoginMode = (mode: LoginMode) => {
    setLoginMode(mode);
    setValue("email", "", { shouldDirty: false });
    setValue("password", "", { shouldDirty: false });
    clearErrors();
    window.history.replaceState(
      {},
      "",
      mode === "admin" ? "/login?mode=admin&callbackUrl=/admin/villas" : "/login",
    );
  };

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    clearErrors("root.authentication");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email.trim().toLowerCase(),
          password: values.password,
          rememberMe: values.rememberMe,
        }),
      });
      const payload = (await response.json()) as {
        message?: string;
        user?: { name?: string | null; email: string; role: string };
      };

      if (!response.ok || !payload.user) {
        throw new Error(payload.message || "Login gagal. Silakan coba lagi.");
      }

      const isAdmin = payload.user.role === "ADMIN" || payload.user.role === "SUPER_ADMIN";
      if (loginMode === "admin" && !isAdmin) {
        throw new Error("Akun ini tidak memiliki akses ke panel admin.");
      }

      const params = new URLSearchParams(window.location.search);
      const requestedDestination = params.get("callbackUrl");
      const safeDestination =
        requestedDestination?.startsWith("/") && !requestedDestination.startsWith("//")
          ? requestedDestination
          : isAdmin
            ? "/admin/villas"
            : "/dashboard";

      window.localStorage.setItem(
        "villaku-session-preview",
        JSON.stringify({
          email: payload.user.email,
          name: payload.user.name,
          role: payload.user.role,
          rememberMe: values.rememberMe,
          signedInAt: new Date().toISOString(),
        }),
      );
      setLoginSuccess(true);
      window.setTimeout(() => router.push(safeDestination), 850);
    } catch (error) {
      setError("root.authentication", {
        type: "manual",
        message: error instanceof Error ? error.message : "Login gagal. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_86%_8%,rgba(247,217,140,0.3),transparent_25rem),radial-gradient(circle_at_12%_86%,rgba(4,120,87,0.13),transparent_28rem)]"
      />

      <header className="relative z-30 flex items-center justify-between px-4 py-4 sm:px-6 lg:absolute lg:inset-x-0 lg:top-0 lg:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="Kembali ke beranda VillaKu">
          <span className="grid size-10 place-items-center rounded-full bg-emerald-700 text-sm font-bold text-white shadow-[0_10px_28px_rgba(4,120,87,0.24)] transition-transform group-hover:rotate-6 group-hover:scale-105">
            V
          </span>
          <span>
            <span className="block font-serif text-xl font-semibold leading-none text-emerald-950 dark:text-white lg:text-emerald-950">
              Villaku
            </span>
            <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.24em] text-emerald-950/44 dark:text-white/44 lg:text-emerald-950/44">
              Guest circle
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/villas"
            className="hidden min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold text-emerald-950/58 transition-colors hover:bg-emerald-950/5 hover:text-emerald-950 dark:text-white/56 dark:hover:bg-white/8 dark:hover:text-white lg:flex lg:text-emerald-950/58 lg:hover:bg-emerald-950/5 lg:hover:text-emerald-950"
          >
            <ArrowLeft className="size-4" /> Jelajahi villa
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="grid size-10 place-items-center rounded-full border border-emerald-950/10 bg-white/68 text-emerald-950 shadow-sm backdrop-blur-xl transition-transform hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/8 dark:text-white lg:border-emerald-950/10 lg:bg-white/68 lg:text-emerald-950"
            aria-label="Ubah tema gelap atau terang"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      <div className="relative z-10 grid min-h-[calc(100vh-4.5rem)] lg:min-h-screen lg:grid-cols-[minmax(34rem,1.08fr)_minmax(0,0.92fr)]">
        <section className="flex items-center justify-center px-4 py-8 sm:px-8 sm:py-12 lg:px-12 lg:pb-12 lg:pt-24 xl:px-20">
          <div className="w-full max-w-xl">
            <AnimatePresence mode="wait">
              {loginSuccess ? (
                <LoginSuccess key="success" shouldReduceMotion={Boolean(shouldReduceMotion)} />
              ) : (
                <motion.div
                  key="form"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -14, filter: "blur(8px)" }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-950/10 bg-white/58 px-3 py-1.5 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-emerald-700 backdrop-blur-xl dark:border-white/10 dark:bg-white/6 dark:text-emerald-300">
                    {loginMode === "admin" ? <ShieldCheck className="size-3.5" /> : <Sparkles className="size-3.5" />}
                    {loginMode === "admin" ? "VillaKu Admin Console" : "VillaKu Guest Circle"}
                  </span>
                  <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                    Selamat datang kembali
                  </p>
                  <h1 className="mt-3 font-serif text-4xl font-semibold leading-none tracking-[-0.045em] text-emerald-950 dark:text-white sm:text-5xl">
                    {loginMode === "admin" ? "Masuk untuk mengelola operasional." : "Masuk untuk melanjutkan perjalanan."}
                  </h1>
                  <p className="mt-4 text-sm leading-6 text-emerald-950/52 dark:text-white/50 sm:text-base">
                    {loginMode === "admin" ? "Gunakan akun staf yang memiliki role Admin atau Super Admin." : "Belum memiliki akun?"}{" "}
                    {loginMode === "user" ? (
                      <Link
                        href="/register"
                        className="font-semibold text-emerald-700 underline decoration-emerald-700/20 underline-offset-4 transition-colors hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200"
                      >
                        Daftar gratis
                      </Link>
                    ) : null}
                  </p>

                  <div className="mt-6 grid grid-cols-2 rounded-2xl border border-emerald-950/10 bg-white/48 p-1.5 dark:border-white/10 dark:bg-white/5">
                    <button
                      type="button"
                      onClick={() => selectLoginMode("user")}
                      className={cn(
                        "flex min-h-10 items-center justify-center rounded-xl text-xs font-bold transition-all",
                        loginMode === "user"
                          ? "bg-emerald-700 text-white shadow-md"
                          : "text-emerald-950/48 hover:bg-white dark:text-white/46 dark:hover:bg-white/7",
                      )}
                    >
                      Login User
                    </button>
                    <button
                      type="button"
                      onClick={() => selectLoginMode("admin")}
                      className={cn(
                        "flex min-h-10 items-center justify-center rounded-xl text-xs font-bold transition-all",
                        loginMode === "admin"
                          ? "bg-emerald-950 text-white shadow-md dark:bg-amber-300 dark:text-emerald-950"
                          : "text-emerald-950/48 hover:bg-white dark:text-white/46 dark:hover:bg-white/7",
                      )}
                    >
                      Login Admin
                    </button>
                  </div>

                  <div className="mt-4 rounded-[1.35rem] border border-amber-400/20 bg-amber-300/10 p-4 dark:bg-amber-200/6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-400/18 text-amber-700 dark:text-amber-200">
                          <KeyRound className="size-4" />
                        </span>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800 dark:text-amber-200">
                            Akun demo
                          </p>
                          <p className="mt-1 text-xs leading-5 text-emerald-950/52 dark:text-white/48">
                            {demoAccount.email} · {demoAccount.password}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={useDemoAccount}
                        className="rounded-full border border-amber-500/18 bg-white/58 px-3 py-2 text-[0.68rem] font-bold text-amber-800 transition-colors hover:bg-white dark:bg-white/7 dark:text-amber-200 dark:hover:bg-white/10"
                      >
                        Isi otomatis
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
                    <LoginField
                      id="email"
                      label="Alamat email"
                      type="email"
                      placeholder="nama@email.com"
                      autoComplete="email"
                      icon={Mail}
                      error={errors.email?.message}
                      valid={Boolean(touchedFields.email && !errors.email)}
                      inputProps={register("email")}
                    />

                    <LoginField
                      id="password"
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password"
                      autoComplete="current-password"
                      icon={LockKeyhole}
                      error={errors.password?.message}
                      valid={Boolean(touchedFields.password && !errors.password)}
                      inputProps={register("password")}
                      trailing={
                        <button
                          type="button"
                          onClick={() => setShowPassword((visible) => !visible)}
                          className="grid size-9 place-items-center rounded-full text-emerald-950/36 transition-colors hover:bg-emerald-950/5 hover:text-emerald-950 dark:text-white/34 dark:hover:bg-white/7 dark:hover:text-white"
                          aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      }
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-emerald-950/52 dark:text-white/50">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-emerald-950/20 accent-emerald-700"
                          {...register("rememberMe")}
                        />
                        Ingat saya di perangkat ini
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-sm font-semibold text-emerald-700 underline decoration-emerald-700/20 underline-offset-4 transition-colors hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200"
                      >
                        Lupa password?
                      </Link>
                    </div>

                    <AnimatePresence initial={false}>
                      {errors.root?.authentication ? (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          className="flex items-start gap-3 rounded-2xl border border-red-500/18 bg-red-500/8 p-4 text-sm text-red-700 dark:border-red-300/16 dark:bg-red-300/7 dark:text-red-200"
                          role="alert"
                        >
                          <CircleAlert className="mt-0.5 size-4 shrink-0" />
                          <div>
                            <p className="font-semibold">Tidak dapat masuk</p>
                            <p className="mt-1 text-xs leading-5 opacity-78">
                              {errors.root.authentication.message}
                            </p>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <Button type="submit" size="lg" variant="gold" className="w-full" disabled={isSubmitting || !isValid}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" /> Memeriksa akun…
                        </>
                      ) : (
                        <>
                          {loginMode === "admin" ? "Masuk ke panel admin" : "Masuk ke akun"} <ArrowRight />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="mt-7 flex items-center gap-3 text-[0.68rem] uppercase tracking-[0.14em] text-emerald-950/30 dark:text-white/28">
                    <span className="h-px flex-1 bg-emerald-950/8 dark:bg-white/8" />
                    Login aman
                    <span className="h-px flex-1 bg-emerald-950/8 dark:bg-white/8" />
                  </div>
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-950/8 bg-white/38 p-4 text-xs leading-5 text-emerald-950/42 dark:border-white/8 dark:bg-white/4 dark:text-white/40">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
                    <p>
                      Halaman ini menggunakan autentikasi tiruan untuk memvalidasi pengalaman login. Integrasi Auth.js akan ditambahkan pada tahap backend.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <section className="relative hidden min-h-screen overflow-hidden bg-emerald-950 text-white lg:block">
          <motion.img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=88"
            alt="Villa tropis premium di tengah pepohonan Ubud"
            className="absolute inset-0 h-full w-full object-cover"
            initial={shouldReduceMotion ? false : { scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,32,26,0.16),rgba(3,32,26,0.88)),linear-gradient(270deg,rgba(3,32,26,0.12),transparent)]" />
          <div aria-hidden className="absolute -bottom-24 -right-20 size-96 rounded-full bg-emerald-400/16 blur-3xl" />
          <div aria-hidden className="absolute left-8 top-32 size-52 rounded-full bg-amber-300/13 blur-3xl" />

          <motion.div
            initial={shouldReduceMotion ? false : "hidden"}
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
            className="relative flex min-h-screen flex-col justify-end p-10 xl:p-14"
          >
            <motion.div variants={reveal} className="inline-flex w-fit items-center gap-2 rounded-full border border-white/16 bg-white/9 px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-amber-200 backdrop-blur-xl">
              <Sparkles className="size-4" /> Your private escape
            </motion.div>
            <motion.blockquote variants={reveal} className="mt-7 max-w-2xl font-serif text-4xl font-semibold leading-[1.02] tracking-[-0.04em] xl:text-5xl">
              “Setiap detail perjalanan terasa tenang karena semuanya tersimpan rapi dalam satu akun.”
            </motion.blockquote>
            <motion.div variants={reveal} className="mt-7 flex items-center justify-between gap-4 border-t border-white/12 pt-7">
              <div>
                <p className="text-sm font-semibold">Maya Putri</p>
                <p className="mt-1 text-xs text-white/48">Emerald Member · Jakarta</p>
              </div>
              <div className="flex items-center gap-1 text-amber-300" aria-label="Rating 5 dari 5">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} className="size-4 fill-current" />
                ))}
              </div>
            </motion.div>

            <motion.div variants={reveal} className="mt-8 grid grid-cols-3 gap-3">
              <TrustMetric value="38+" label="Premium villas" />
              <TrustMetric value="4.9/5" label="Guest rating" />
              <TrustMetric value="24/7" label="Concierge" />
            </motion.div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}

type LoginFieldProps = {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  autoComplete: string;
  icon: typeof Mail;
  error?: string;
  valid?: boolean;
  inputProps: ReturnType<ReturnType<typeof useForm<LoginFormValues>>["register"]>;
  trailing?: React.ReactNode;
};

function LoginField({
  id,
  label,
  type,
  placeholder,
  autoComplete,
  icon: Icon,
  error,
  valid,
  inputProps,
  trailing,
}: LoginFieldProps) {
  return (
    <label htmlFor={id} className="grid gap-2 text-xs font-semibold text-emerald-950/62 dark:text-white/60">
      {label}
      <span
        className={cn(
          "flex h-13 items-center gap-3 rounded-2xl border bg-white/54 px-4 shadow-sm transition-[border-color,box-shadow,background-color] focus-within:ring-4 dark:bg-white/5",
          error
            ? "border-red-500/45 focus-within:border-red-500/60 focus-within:ring-red-500/8 dark:border-red-300/40"
            : "border-emerald-950/10 focus-within:border-emerald-600/32 focus-within:ring-emerald-500/8 dark:border-white/10 dark:focus-within:border-emerald-300/30",
        )}
      >
        <Icon className={cn("size-[1.05rem] shrink-0", error ? "text-red-500 dark:text-red-300" : "text-emerald-700/64 dark:text-emerald-300/62")} />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-normal text-emerald-950 outline-none placeholder:text-emerald-950/28 dark:text-white dark:placeholder:text-white/26"
          {...inputProps}
        />
        {trailing ?? (valid ? <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-300" /> : null)}
      </span>
      <AnimatePresence initial={false}>
        {error ? (
          <motion.span
            id={`${id}-error`}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-300"
            role="alert"
          >
            <span className="size-1.5 rounded-full bg-current" /> {error}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </label>
  );
}

function TrustMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur-xl">
      <p className="font-serif text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white/42">{label}</p>
    </div>
  );
}

function LoginSuccess({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      className="rounded-[2rem] border border-emerald-950/10 bg-white/58 p-7 text-center shadow-[0_24px_80px_rgba(4,34,28,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:p-10"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { scale: 0, rotate: -16 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 16, stiffness: 210, delay: 0.12 }}
        className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-700 text-white shadow-[0_18px_48px_rgba(4,120,87,0.28)] ring-8 ring-emerald-600/8"
      >
        <Check className="size-9" strokeWidth={2.4} />
      </motion.div>
      <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
        Login berhasil
      </p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] text-emerald-950 dark:text-white sm:text-5xl">
        Selamat datang, Maya.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-emerald-950/52 dark:text-white/50">
        Akun Anda sudah diverifikasi. Kami sedang membuka dashboard dan menyiapkan perjalanan berikutnya.
      </p>
      <div className="mx-auto mt-7 flex w-fit items-center gap-2 rounded-full bg-emerald-700/8 px-4 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-300/8 dark:text-emerald-300">
        <Loader2 className="size-4 animate-spin" /> Mengarahkan ke dashboard…
      </div>
    </motion.div>
  );
}
