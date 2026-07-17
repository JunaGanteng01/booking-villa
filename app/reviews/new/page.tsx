"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Loader2,
  MapPin,
  Moon,
  Quote,
  ShieldCheck,
  Sparkles,
  Sun,
  ThumbsUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { RatingStars } from "@/components/rating-stars";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/components/use-auth-session";
import { cn } from "@/lib/utils";

const reviewSchema = z.object({
  overallRating: z.number().min(1, "Pilih rating keseluruhan."),
  cleanliness: z.number().min(1, "Beri rating kebersihan."),
  comfort: z.number().min(1, "Beri rating kenyamanan."),
  location: z.number().min(1, "Beri rating lokasi."),
  service: z.number().min(1, "Beri rating layanan."),
  title: z
    .string()
    .trim()
    .min(5, "Judul ulasan minimal 5 karakter.")
    .max(80, "Judul ulasan maksimal 80 karakter."),
  comment: z
    .string()
    .trim()
    .min(30, "Ceritakan pengalaman Anda minimal 30 karakter.")
    .max(1000, "Ulasan maksimal 1.000 karakter."),
  privateFeedback: z.string().max(500, "Catatan privat maksimal 500 karakter."),
  recommend: z.boolean(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;
type RatingField = "overallRating" | "cleanliness" | "comfort" | "location" | "service";

const categoryRatings: Array<{ field: RatingField; label: string; helper: string }> = [
  { field: "cleanliness", label: "Kebersihan", helper: "Kamar, linen, dan area bersama" },
  { field: "comfort", label: "Kenyamanan", helper: "Tempat tidur, privasi, dan suasana" },
  { field: "location", label: "Lokasi", helper: "Akses, lingkungan, dan pemandangan" },
  { field: "service", label: "Layanan", helper: "Respons tim, check-in, dan concierge" },
];

const ratingLabels = ["", "Kurang", "Cukup", "Baik", "Sangat baik", "Istimewa"];

export default function WriteReviewPage() {
  const shouldReduceMotion = useReducedMotion();
  const { profile } = useAuthSession();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    mode: "onChange",
    defaultValues: {
      overallRating: 0,
      cleanliness: 0,
      comfort: 0,
      location: 0,
      service: 0,
      title: "",
      comment: "",
      privateFeedback: "",
      recommend: true,
    },
  });

  const values = watch();
  const commentLength = values.comment?.length ?? 0;

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("villaku-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light";
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

  const setRating = async (field: RatingField, value: number) => {
    setValue(field, value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    await trigger(field);
  };

  const onSubmit = async (formValues: ReviewFormValues) => {
    setIsSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 950));
    window.localStorage.setItem(
      "villaku-review-preview",
      JSON.stringify({
        ...formValues,
        bookingId: "VLK-260214-1038",
        villaId: "nara-jungle",
        author: profile?.name ?? "Pengguna VillaKu",
        createdAt: new Date().toISOString(),
      }),
    );
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_7%,rgba(247,217,140,0.28),transparent_27rem),radial-gradient(circle_at_88%_18%,rgba(4,120,87,0.14),transparent_30rem)]" />

      <header className="sticky top-0 z-40 border-b border-emerald-950/8 bg-[#f5f0e8]/78 px-4 py-3 backdrop-blur-2xl dark:border-white/8 dark:bg-[#071211]/78 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3" aria-label="Kembali ke beranda VillaKu">
            <span className="grid size-10 place-items-center rounded-full bg-emerald-700 text-sm font-bold text-white shadow-[0_10px_28px_rgba(4,120,87,0.24)] transition-transform group-hover:rotate-6 group-hover:scale-105">V</span>
            <span>
              <span className="block font-serif text-xl font-semibold leading-none text-emerald-950 dark:text-white">Villaku</span>
              <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.24em] text-emerald-950/44 dark:text-white/44">Guest story</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="hidden min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold text-emerald-950/58 transition-colors hover:bg-emerald-950/5 hover:text-emerald-950 dark:text-white/56 dark:hover:bg-white/8 dark:hover:text-white sm:flex">
              <ArrowLeft className="size-4" /> Dashboard
            </Link>
            <button type="button" onClick={toggleTheme} className="grid size-10 place-items-center rounded-full border border-emerald-950/10 bg-white/68 shadow-sm backdrop-blur-xl transition-transform hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/8" aria-label="Ubah tema gelap atau terang">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <AnimatePresence mode="wait">
          {submitted ? (
            <ReviewSubmitted key="submitted" shouldReduceMotion={Boolean(shouldReduceMotion)} />
          ) : (
            <motion.div key="form" initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="grid gap-7 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
                <aside className="lg:sticky lg:top-24">
                  <article className="overflow-hidden rounded-[1.8rem] border border-emerald-950/10 bg-white/60 shadow-[0_20px_70px_rgba(4,34,28,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=86" alt="Nara Jungle Residence di Ubud" className="h-full w-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 via-transparent to-transparent" />
                      <span className="absolute bottom-4 left-4 rounded-full bg-emerald-300/90 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-emerald-950">Stay selesai</span>
                    </div>
                    <div className="p-5">
                      <p className="text-[0.64rem] font-bold uppercase tracking-[0.17em] text-emerald-700 dark:text-emerald-300">VLK-260214-1038</p>
                      <h2 className="mt-2 font-serif text-2xl font-semibold">Nara Jungle Residence</h2>
                      <p className="mt-2 flex items-center gap-2 text-xs text-emerald-950/46 dark:text-white/44"><MapPin className="size-3.5 text-amber-600 dark:text-amber-300" /> Ubud, Bali</p>
                      <div className="mt-5 space-y-3 border-t border-emerald-950/8 pt-5 dark:border-white/8">
                        <StayDetail icon={CalendarDays} label="14–17 Februari 2026" />
                        <StayDetail icon={Users} label="4 tamu · 3 malam" />
                        <StayDetail icon={ShieldCheck} label="Verified stay" />
                      </div>
                    </div>
                  </article>
                  <div className="mt-4 rounded-2xl border border-amber-400/16 bg-amber-300/10 p-4 text-xs leading-5 text-emerald-950/48 dark:text-white/46">
                    <div className="flex gap-3">
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-200" />
                      <p>Ulasan membantu tamu lain memilih villa yang tepat dan membantu host meningkatkan layanan.</p>
                    </div>
                  </div>
                </aside>

                <section>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">Bagikan pengalaman</p>
                  <h1 className="mt-3 font-serif text-4xl font-semibold leading-none tracking-[-0.045em] text-emerald-950 dark:text-white sm:text-5xl">Bagaimana pengalaman menginap Anda?</h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-950/52 dark:text-white/50 sm:text-base">Ceritakan dengan jujur dan spesifik. Nama yang tampil untuk publik adalah <span className="font-semibold text-emerald-950 dark:text-white">Maya P.</span></p>

                  <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-5">
                    <ReviewCard>
                      <div className="text-center">
                        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-emerald-950/42 dark:text-white/40">Rating keseluruhan</p>
                        <h2 className="mt-2 font-serif text-2xl font-semibold">Nilai stay Anda</h2>
                        <div className="mt-4 flex justify-center">
                          <RatingStars value={values.overallRating} onChange={(value) => setRating("overallRating", value)} size="lg" label="Rating keseluruhan" />
                        </div>
                        <p className="mt-3 min-h-5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{ratingLabels[values.overallRating] || "Pilih 1–5 bintang"}</p>
                        {errors.overallRating ? <p className="mt-1 text-xs text-red-600 dark:text-red-300" role="alert">{errors.overallRating.message}</p> : null}
                      </div>
                    </ReviewCard>

                    <ReviewCard>
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Detail pengalaman</p>
                      <h2 className="mt-2 font-serif text-2xl font-semibold">Beri nilai setiap aspek</h2>
                      <div className="mt-5 divide-y divide-emerald-950/8 dark:divide-white/8">
                        {categoryRatings.map((item) => (
                          <div key={item.field} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold">{item.label}</p>
                              <p className="mt-1 text-xs text-emerald-950/40 dark:text-white/38">{item.helper}</p>
                            </div>
                            <div className="shrink-0">
                              <RatingStars value={values[item.field]} onChange={(value) => setRating(item.field, value)} label={`Rating ${item.label}`} />
                              {errors[item.field] ? <p className="mt-1 text-right text-[0.65rem] text-red-600 dark:text-red-300">Wajib diisi</p> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ReviewCard>

                    <ReviewCard>
                      <label className="grid gap-2 text-xs font-semibold text-emerald-950/62 dark:text-white/60">
                        Judul ulasan
                        <input
                          type="text"
                          placeholder="Ringkas pengalaman Anda"
                          maxLength={80}
                          className={cn("h-13 rounded-2xl border bg-white/52 px-4 text-sm font-normal text-emerald-950 outline-none transition-shadow focus:ring-4 dark:bg-white/5 dark:text-white", errors.title ? "border-red-500/42 focus:ring-red-500/8" : "border-emerald-950/10 focus:border-emerald-600/30 focus:ring-emerald-500/8 dark:border-white/10")}
                          {...register("title")}
                        />
                        {errors.title ? <span className="text-xs text-red-600 dark:text-red-300" role="alert">{errors.title.message}</span> : null}
                      </label>

                      <label className="mt-5 grid gap-2 text-xs font-semibold text-emerald-950/62 dark:text-white/60">
                        Ceritakan pengalaman Anda
                        <textarea
                          rows={7}
                          placeholder="Apa yang paling berkesan? Bagaimana kondisi villa dan pelayanan tim?"
                          maxLength={1000}
                          className={cn("resize-none rounded-2xl border bg-white/52 px-4 py-3 text-sm font-normal leading-6 text-emerald-950 outline-none transition-shadow focus:ring-4 dark:bg-white/5 dark:text-white", errors.comment ? "border-red-500/42 focus:ring-red-500/8" : "border-emerald-950/10 focus:border-emerald-600/30 focus:ring-emerald-500/8 dark:border-white/10")}
                          {...register("comment")}
                        />
                        <span className="flex items-center justify-between gap-3">
                          <span className="text-red-600 dark:text-red-300">{errors.comment?.message}</span>
                          <span className="ml-auto text-emerald-950/32 dark:text-white/30">{commentLength}/1.000</span>
                        </span>
                      </label>

                      <label className="mt-5 grid gap-2 text-xs font-semibold text-emerald-950/62 dark:text-white/60">
                        Catatan privat untuk VillaKu <span className="font-normal text-emerald-950/34 dark:text-white/32">(opsional, tidak dipublikasikan)</span>
                        <textarea rows={3} placeholder="Saran khusus untuk host atau tim VillaKu" maxLength={500} className="resize-none rounded-2xl border border-emerald-950/10 bg-white/52 px-4 py-3 text-sm font-normal leading-6 text-emerald-950 outline-none focus:border-emerald-600/30 focus:ring-4 focus:ring-emerald-500/8 dark:border-white/10 dark:bg-white/5 dark:text-white" {...register("privateFeedback")} />
                      </label>
                    </ReviewCard>

                    <ReviewCard>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-700/9 text-emerald-700 dark:bg-emerald-300/9 dark:text-emerald-300"><ThumbsUp className="size-4" /></span>
                          <div>
                            <p className="text-sm font-semibold">Rekomendasikan villa ini?</p>
                            <p className="mt-1 text-xs text-emerald-950/40 dark:text-white/38">Pilihan Anda akan tampil bersama ulasan.</p>
                          </div>
                        </div>
                        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-emerald-950/10 bg-white/48 px-4 py-2.5 text-sm font-semibold dark:border-white/10 dark:bg-white/5">
                          <input type="checkbox" className="size-4 accent-emerald-700" {...register("recommend")} />
                          Ya, saya rekomendasikan
                        </label>
                      </div>
                    </ReviewCard>

                    <Button type="submit" variant="gold" size="lg" className="w-full" disabled={isSubmitting || !isValid}>
                      {isSubmitting ? <><Loader2 className="animate-spin" /> Mengirim ulasan…</> : <><Quote /> Publikasikan ulasan</>}
                    </Button>
                    <p className="text-center text-xs leading-5 text-emerald-950/36 dark:text-white/34">Dengan mengirim ulasan, Anda menyatakan pengalaman ini jujur dan berdasarkan stay yang telah terverifikasi.</p>
                  </form>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function ReviewCard({ children }: { children: React.ReactNode }) {
  return <section className="rounded-[1.6rem] border border-emerald-950/10 bg-white/58 p-5 shadow-[0_14px_46px_rgba(4,34,28,0.04)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-6">{children}</section>;
}


function StayDetail({ icon: Icon, label }: { icon: typeof CalendarDays; label: string }) {
  return <div className="flex items-center gap-2.5 text-xs text-emerald-950/50 dark:text-white/48"><Icon className="size-4 text-emerald-700 dark:text-emerald-300" /> {label}</div>;
}

function ReviewSubmitted({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  return (
    <motion.div initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} className="mx-auto max-w-2xl rounded-[2.2rem] border border-emerald-950/10 bg-white/64 p-7 text-center shadow-[0_34px_120px_rgba(4,34,28,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:p-12">
      <motion.span initial={shouldReduceMotion ? false : { scale: 0, rotate: -14 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 16, stiffness: 210, delay: 0.1 }} className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-700 text-white shadow-[0_18px_48px_rgba(4,120,87,0.28)] ring-8 ring-emerald-600/8">
        <CheckCircle2 className="size-9" />
      </motion.span>
      <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">Ulasan berhasil dikirim</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] text-emerald-950 dark:text-white sm:text-5xl">Terima kasih telah berbagi, Maya.</h1>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-emerald-950/50 dark:text-white/48">Ulasan Anda tersimpan sebagai data tiruan dan siap ditampilkan setelah proses moderasi backend tersedia.</p>
      <div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-amber-300/12 px-4 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200"><Sparkles className="size-4" /> +120 Circle points</div>
      <div className="mx-auto mt-8 grid max-w-md gap-3 sm:grid-cols-2">
        <Button asChild variant="gold" size="lg"><Link href="/dashboard">Kembali ke dashboard <ArrowRight /></Link></Button>
        <Button asChild variant="outline" size="lg"><Link href="/villas/nara-jungle">Lihat villa</Link></Button>
      </div>
    </motion.div>
  );
}
