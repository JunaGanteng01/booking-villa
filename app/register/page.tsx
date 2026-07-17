"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const registrationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama lengkap minimal 2 karakter.")
      .max(80, "Nama lengkap maksimal 80 karakter.")
      .regex(
        /^[\p{L}\p{M}.' -]+$/u,
        "Nama hanya boleh berisi huruf dan tanda baca nama.",
      ),
    email: z
      .string()
      .trim()
      .min(1, "Email wajib diisi.")
      .email("Masukkan alamat email yang valid."),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter.")
      .regex(/[A-Z]/, "Tambahkan minimal satu huruf kapital.")
      .regex(/[0-9]/, "Tambahkan minimal satu angka."),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
    acceptTerms: z.boolean().refine((value) => value, {
      message: "Setujui syarat dan kebijakan privasi untuk melanjutkan.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password belum sama.",
    path: ["confirmPassword"],
  });

type RegistrationFormValues = z.infer<typeof registrationSchema>;

const benefits = [
  "Simpan villa favorit dalam satu wishlist pribadi.",
  "Pantau booking, status pembayaran, dan invoice.",
  "Nikmati penawaran khusus anggota Guest Circle.",
];

const reveal = {
  hidden: { opacity: 0, y: 24, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export default function RegisterPage() {
  const shouldReduceMotion = useReducedMotion();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredAccount, setRegisteredAccount] = useState<{
    name: string;
    email: string;
    verificationRequired: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors, isValid, touchedFields },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const password = watch("password");
  const passwordStrength = useMemo(
    () => getPasswordStrength(password ?? ""),
    [password],
  );

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("villaku-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const nextTheme =
      savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light";

    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("villaku-theme", next);
      return next;
    });
  };

  const onSubmit = async (values: RegistrationFormValues) => {
    setIsSubmitting(true);
    clearErrors("root.server");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        verificationRequired?: boolean;
        user?: { name?: string | null; email: string; role: string };
      } | null;

      if (!response.ok || !payload?.user) {
        if (response.status === 409) {
          setError("email", {
            type: "server",
            message: "Email ini sudah terdaftar. Silakan masuk ke akun Anda.",
          });
          return;
        }
        throw new Error(payload?.message || "Akun belum dapat dibuat.");
      }

      setRegisteredAccount({
        name: payload.user.name || values.name.trim(),
        email: payload.user.email,
        verificationRequired: Boolean(payload.verificationRequired),
      });
    } catch (error) {
      setError("root.server", {
        type: "server",
        message:
          error instanceof Error
            ? error.message
            : "Akun belum dapat dibuat. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(247,217,140,0.3),transparent_26rem),radial-gradient(circle_at_88%_18%,rgba(4,120,87,0.16),transparent_30rem)]"
      />

      <header className="relative z-30 flex items-center justify-between px-4 py-4 sm:px-6 lg:absolute lg:inset-x-0 lg:top-0 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-3"
          aria-label="Kembali ke beranda VillaKu"
        >
          <span className="grid size-10 place-items-center rounded-full bg-emerald-700 text-sm font-bold text-white shadow-[0_10px_28px_rgba(4,120,87,0.24)] transition-transform group-hover:rotate-6 group-hover:scale-105">
            V
          </span>
          <span>
            <span className="block font-serif text-xl font-semibold leading-none text-emerald-950 dark:text-white lg:text-white">
              Villaku
            </span>
            <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.24em] text-emerald-950/44 dark:text-white/44 lg:text-white/52">
              Guest circle
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/villas"
            className="hidden min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold text-emerald-950/58 transition-colors hover:bg-emerald-950/5 hover:text-emerald-950 dark:text-white/56 dark:hover:bg-white/8 dark:hover:text-white lg:flex lg:text-white/68 lg:hover:bg-white/10 lg:hover:text-white"
          >
            <ArrowLeft className="size-4" /> Jelajahi villa
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="grid size-10 place-items-center rounded-full border border-emerald-950/10 bg-white/68 text-emerald-950 shadow-sm backdrop-blur-xl transition-transform hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/8 dark:text-white lg:border-white/18 lg:bg-white/12 lg:text-white"
            aria-label="Ubah tema gelap atau terang"
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </button>
        </div>
      </header>

      <div className="relative z-10 grid min-h-[calc(100vh-4.5rem)] lg:min-h-screen lg:grid-cols-[minmax(0,0.9fr)_minmax(34rem,1.1fr)]">
        <section className="relative hidden min-h-screen overflow-hidden bg-emerald-950 text-white lg:block">
          <motion.img
            src="https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1800&q=88"
            alt="Interior lounge villa tropis dengan pemandangan hijau"
            className="absolute inset-0 h-full w-full object-cover"
            initial={shouldReduceMotion ? false : { scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,32,26,0.25),rgba(3,32,26,0.9)),linear-gradient(90deg,rgba(3,32,26,0.18),transparent)]" />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-20 size-96 rounded-full bg-emerald-400/16 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute right-8 top-32 size-52 rounded-full bg-amber-300/13 blur-3xl"
          />

          <motion.div
            initial={shouldReduceMotion ? false : "hidden"}
            animate="visible"
            variants={{
              visible: {
                transition: { staggerChildren: 0.1, delayChildren: 0.2 },
              },
            }}
            className="relative flex min-h-screen flex-col justify-end p-10 xl:p-14"
          >
            <motion.div
              variants={reveal}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/16 bg-white/9 px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-amber-200 backdrop-blur-xl"
            >
              <Sparkles className="size-4" /> VillaKu Guest Circle
            </motion.div>
            <motion.h1
              variants={reveal}
              className="mt-7 max-w-2xl font-serif text-5xl font-semibold leading-[0.96] tracking-[-0.045em] xl:text-6xl"
            >
              Perjalanan terbaik dimulai dari ruang milik Anda.
            </motion.h1>
            <motion.p
              variants={reveal}
              className="mt-5 max-w-xl text-base leading-7 text-white/62"
            >
              Buat akun gratis untuk menyimpan inspirasi, mengelola reservasi,
              dan menikmati pengalaman menginap yang terasa lebih personal.
            </motion.p>
            <motion.ul variants={reveal} className="mt-8 grid gap-3">
              {benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-center gap-3 text-sm text-white/76"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-300/16 text-emerald-200 ring-1 ring-emerald-200/18">
                    <Check className="size-3.5" />
                  </span>
                  {benefit}
                </li>
              ))}
            </motion.ul>
            <motion.div
              variants={reveal}
              className="mt-10 flex items-center gap-4 border-t border-white/12 pt-7"
            >
              <div className="flex -space-x-2">
                {[
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
                ].map((image) => (
                  <img
                    key={image}
                    src={image}
                    alt=""
                    className="size-9 rounded-full border-2 border-emerald-950 object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-amber-300">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={index} className="size-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-1 text-xs text-white/48">
                  Dipercaya 12.800+ guest nights
                </p>
              </div>
            </motion.div>
          </motion.div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-8 sm:py-12 lg:px-12 lg:pb-12 lg:pt-24 xl:px-20">
          <div className="w-full max-w-xl">
            <AnimatePresence mode="wait">
              {registeredAccount ? (
                <RegistrationSuccess
                  key="success"
                  account={registeredAccount}
                  shouldReduceMotion={Boolean(shouldReduceMotion)}
                />
              ) : (
                <motion.div
                  key="form"
                  initial={
                    shouldReduceMotion
                      ? false
                      : { opacity: 0, y: 18, filter: "blur(8px)" }
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={
                    shouldReduceMotion
                      ? undefined
                      : { opacity: 0, y: -14, filter: "blur(8px)" }
                  }
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <div className="lg:hidden">
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-950/10 bg-white/58 px-3 py-1.5 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-emerald-700 backdrop-blur-xl dark:border-white/10 dark:bg-white/6 dark:text-emerald-300">
                      <Sparkles className="size-3.5" /> VillaKu Guest Circle
                    </span>
                  </div>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300 lg:mt-0">
                    Buat akun baru
                  </p>
                  <h1 className="mt-3 font-serif text-4xl font-semibold leading-none tracking-[-0.045em] text-emerald-950 dark:text-white sm:text-5xl">
                    Mulai perjalanan Anda.
                  </h1>
                  <p className="mt-4 text-sm leading-6 text-emerald-950/52 dark:text-white/50 sm:text-base">
                    Sudah menjadi anggota?{" "}
                    <Link
                      href="/login"
                      className="font-semibold text-emerald-700 underline decoration-emerald-700/20 underline-offset-4 transition-colors hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200"
                    >
                      Masuk di sini
                    </Link>
                  </p>

                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                    className="mt-8 space-y-5"
                  >
                    <FormField
                      id="name"
                      label="Nama lengkap"
                      placeholder="Contoh: Maya Putri"
                      autoComplete="name"
                      icon={UserRound}
                      error={errors.name?.message}
                      valid={Boolean(touchedFields.name && !errors.name)}
                      registration={register("name")}
                    />
                    <FormField
                      id="email"
                      label="Alamat email"
                      type="email"
                      placeholder="nama@email.com"
                      autoComplete="email"
                      icon={Mail}
                      error={errors.email?.message}
                      valid={Boolean(touchedFields.email && !errors.email)}
                      registration={register("email")}
                    />
                    <div>
                      <FormField
                        id="password"
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 8 karakter"
                        autoComplete="new-password"
                        icon={LockKeyhole}
                        error={errors.password?.message}
                        valid={Boolean(
                          touchedFields.password && !errors.password,
                        )}
                        registration={register("password")}
                        trailing={
                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword((visible) => !visible)
                            }
                            className="grid size-9 place-items-center rounded-full text-emerald-950/36 transition-colors hover:bg-emerald-950/5 hover:text-emerald-950 dark:text-white/34 dark:hover:bg-white/7 dark:hover:text-white"
                            aria-label={
                              showPassword
                                ? "Sembunyikan password"
                                : "Tampilkan password"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        }
                      />
                      <PasswordMeter
                        password={password ?? ""}
                        strength={passwordStrength}
                      />
                    </div>
                    <FormField
                      id="confirmPassword"
                      label="Konfirmasi password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Ulangi password"
                      autoComplete="new-password"
                      icon={ShieldCheck}
                      error={errors.confirmPassword?.message}
                      valid={Boolean(
                        touchedFields.confirmPassword &&
                        !errors.confirmPassword,
                      )}
                      registration={register("confirmPassword")}
                      trailing={
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((visible) => !visible)
                          }
                          className="grid size-9 place-items-center rounded-full text-emerald-950/36 transition-colors hover:bg-emerald-950/5 hover:text-emerald-950 dark:text-white/34 dark:hover:bg-white/7 dark:hover:text-white"
                          aria-label={
                            showConfirmPassword
                              ? "Sembunyikan konfirmasi password"
                              : "Tampilkan konfirmasi password"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      }
                    />

                    <div>
                      <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-emerald-950/54 dark:text-white/52">
                        <input
                          type="checkbox"
                          className="mt-1 size-4 shrink-0 rounded border-emerald-950/20 accent-emerald-700"
                          aria-invalid={Boolean(errors.acceptTerms)}
                          aria-describedby={
                            errors.acceptTerms ? "acceptTerms-error" : undefined
                          }
                          {...register("acceptTerms")}
                        />
                        <span>
                          Saya menyetujui{" "}
                          <button
                            type="button"
                            className="font-semibold text-emerald-700 underline decoration-emerald-700/20 underline-offset-4 dark:text-emerald-300"
                          >
                            Syarat Layanan
                          </button>{" "}
                          dan{" "}
                          <button
                            type="button"
                            className="font-semibold text-emerald-700 underline decoration-emerald-700/20 underline-offset-4 dark:text-emerald-300"
                          >
                            Kebijakan Privasi
                          </button>
                          .
                        </span>
                      </label>
                      <AnimatePresence>
                        {errors.acceptTerms ? (
                          <motion.p
                            id="acceptTerms-error"
                            initial={{ opacity: 0, y: -3 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-300"
                            role="alert"
                          >
                            <span className="size-1.5 rounded-full bg-current" />{" "}
                            {errors.acceptTerms.message}
                          </motion.p>
                        ) : null}
                      </AnimatePresence>
                    </div>

                    <AnimatePresence initial={false}>
                      {errors.root?.server ? (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          className="flex items-start gap-3 rounded-2xl border border-red-500/18 bg-red-500/8 p-4 text-sm text-red-700 dark:border-red-300/16 dark:bg-red-300/7 dark:text-red-200"
                          role="alert"
                        >
                          <CircleAlert className="mt-0.5 size-4 shrink-0" />
                          <div>
                            <p className="font-semibold">Registrasi gagal</p>
                            <p className="mt-1 text-xs leading-5 opacity-78">
                              {errors.root.server.message}
                            </p>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <Button
                      type="submit"
                      size="lg"
                      variant="gold"
                      className="w-full"
                      disabled={isSubmitting || !isValid}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" /> Menyiapkan akun…
                        </>
                      ) : (
                        <>
                          Buat akun gratis <ArrowRight />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="mt-7 flex items-center gap-3 text-[0.68rem] uppercase tracking-[0.14em] text-emerald-950/30 dark:text-white/28">
                    <span className="h-px flex-1 bg-emerald-950/8 dark:bg-white/8" />
                    Data Anda terlindungi
                    <span className="h-px flex-1 bg-emerald-950/8 dark:bg-white/8" />
                  </div>
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-950/8 bg-white/38 p-4 text-xs leading-5 text-emerald-950/42 dark:border-white/8 dark:bg-white/4 dark:text-white/40">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
                    <p>
                      Registrasi selalu membuat role User. Role operasional
                      hanya dapat diberikan oleh administrator.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </main>
  );
}

type FormFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  icon: typeof UserRound;
  type?: string;
  error?: string;
  valid?: boolean;
  registration: ReturnType<
    ReturnType<typeof useForm<RegistrationFormValues>>["register"]
  >;
  trailing?: React.ReactNode;
};

function FormField({
  id,
  label,
  placeholder,
  autoComplete,
  icon: Icon,
  type = "text",
  error,
  valid,
  registration,
  trailing,
}: FormFieldProps) {
  return (
    <label
      htmlFor={id}
      className="grid gap-2 text-xs font-semibold text-emerald-950/62 dark:text-white/60"
    >
      {label}
      <span
        className={cn(
          "flex h-13 items-center gap-3 rounded-2xl border bg-white/54 px-4 shadow-sm transition-[border-color,box-shadow,background-color] focus-within:ring-4 dark:bg-white/5",
          error
            ? "border-red-500/45 focus-within:border-red-500/60 focus-within:ring-red-500/8 dark:border-red-300/40"
            : "border-emerald-950/10 focus-within:border-emerald-600/32 focus-within:ring-emerald-500/8 dark:border-white/10 dark:focus-within:border-emerald-300/30",
        )}
      >
        <Icon
          className={cn(
            "size-[1.05rem] shrink-0",
            error
              ? "text-red-500 dark:text-red-300"
              : "text-emerald-700/64 dark:text-emerald-300/62",
          )}
        />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-normal text-emerald-950 outline-none placeholder:text-emerald-950/28 dark:text-white dark:placeholder:text-white/26"
          {...registration}
        />
        {trailing ??
          (valid ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
          ) : null)}
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

function PasswordMeter({
  password,
  strength,
}: {
  password: string;
  strength: ReturnType<typeof getPasswordStrength>;
}) {
  const checks = [
    { label: "8+ karakter", valid: password.length >= 8 },
    { label: "Huruf kapital", valid: /[A-Z]/.test(password) },
    { label: "Angka", valid: /[0-9]/.test(password) },
  ];

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden>
          {Array.from({ length: 4 }, (_, index) => (
            <span
              key={index}
              className={cn(
                "h-1 rounded-full transition-colors",
                index < strength.score
                  ? strength.barClass
                  : "bg-emerald-950/8 dark:bg-white/8",
              )}
            />
          ))}
        </div>
        <span
          className={cn(
            "w-16 text-right text-[0.66rem] font-bold",
            strength.textClass,
          )}
        >
          {password ? strength.label : "Belum ada"}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
        {checks.map((check) => (
          <span
            key={check.label}
            className={cn(
              "flex items-center gap-1 text-[0.65rem]",
              check.valid
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-emerald-950/34 dark:text-white/32",
            )}
          >
            <Check
              className={cn(
                "size-3",
                check.valid ? "opacity-100" : "opacity-35",
              )}
            />{" "}
            {check.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function RegistrationSuccess({
  account,
  shouldReduceMotion,
}: {
  account: { name: string; email: string; verificationRequired: boolean };
  shouldReduceMotion: boolean;
}) {
  const firstName = account.name.trim().split(/\s+/)[0] || "Tamu";
  return (
    <motion.div
      initial={
        shouldReduceMotion
          ? false
          : { opacity: 0, scale: 0.96, filter: "blur(10px)" }
      }
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      className="rounded-[2rem] border border-emerald-950/10 bg-white/58 p-6 text-center shadow-[0_24px_80px_rgba(4,34,28,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:p-10"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { scale: 0, rotate: -16 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          damping: 16,
          stiffness: 210,
          delay: 0.12,
        }}
        className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-700 text-white shadow-[0_18px_48px_rgba(4,120,87,0.28)] ring-8 ring-emerald-600/8"
      >
        <Check className="size-9" strokeWidth={2.4} />
      </motion.div>
      <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
        Akun berhasil dibuat
      </p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] text-emerald-950 dark:text-white sm:text-5xl">
        Selamat datang, {firstName}.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-emerald-950/52 dark:text-white/50">
        {account.verificationRequired
          ? `Tautan verifikasi telah disiapkan untuk ${account.email}. Verifikasi email sebelum masuk.`
          : `Akun User ${account.email} sudah aktif dan dapat digunakan untuk login.`}
      </p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <Button asChild size="lg" variant="gold">
          <Link href="/login">
            Masuk sekarang <ArrowRight />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/villas">Cari villa</Link>
        </Button>
      </div>
      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-emerald-950/38 dark:text-white/36">
        <ShieldCheck className="size-4 text-emerald-700 dark:text-emerald-300" />{" "}
        Role akun: User
      </p>
    </motion.div>
  );
}

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password) && password.length >= 10) score += 1;

  if (score <= 1) {
    return {
      score,
      label: "Lemah",
      barClass: "bg-red-500",
      textClass: "text-red-600 dark:text-red-300",
    };
  }
  if (score === 2) {
    return {
      score,
      label: "Cukup",
      barClass: "bg-amber-400",
      textClass: "text-amber-700 dark:text-amber-200",
    };
  }
  if (score === 3) {
    return {
      score,
      label: "Kuat",
      barClass: "bg-emerald-500",
      textClass: "text-emerald-700 dark:text-emerald-300",
    };
  }
  return {
    score,
    label: "Sangat kuat",
    barClass: "bg-emerald-600",
    textClass: "text-emerald-700 dark:text-emerald-300",
  };
}
