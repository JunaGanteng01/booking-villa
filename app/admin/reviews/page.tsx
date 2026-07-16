"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  EyeOff,
  Flag,
  MessageSquareText,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAppNotifications } from "@/components/notification-root";
import { cn } from "@/lib/utils";

type ReviewStatus = "PENDING" | "PUBLISHED" | "HIDDEN" | "FLAGGED";
type Review = {
  id: string;
  guest: string;
  initials: string;
  villa: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  stay: string;
  status: ReviewStatus;
  featured: boolean;
  verified: boolean;
};
const initialReviews: Review[] = [
  {
    id: "RV-2018",
    guest: "Maya Putri",
    initials: "MP",
    villa: "Villa Aruna Cliffside",
    rating: 5,
    title: "Sunset terbaik dan pelayanan personal",
    comment:
      "Seluruh keluarga sangat menikmati stay kami. Villa bersih, panorama luar biasa, dan tim concierge sangat sigap membantu airport transfer serta private dinner.",
    date: "14 Jul 2026",
    stay: "23–26 Jun 2026",
    status: "PENDING",
    featured: false,
    verified: true,
  },
  {
    id: "RV-2011",
    guest: "Sofia Laurent",
    initials: "SL",
    villa: "Nara Jungle Residence",
    rating: 3,
    title: "Tempat indah, komunikasi perlu ditingkatkan",
    comment:
      "Villa sangat cantik, namun nomor pribadi staf sempat tertulis pada pesan check-in. Mohon informasi pribadi lebih diperhatikan.",
    date: "13 Jul 2026",
    stay: "4–8 Jul 2026",
    status: "FLAGGED",
    featured: false,
    verified: true,
  },
  {
    id: "RV-2004",
    guest: "Keiko Tanaka",
    initials: "KT",
    villa: "Sagara Beach House",
    rating: 5,
    title: "A private beachfront dream",
    comment:
      "Everything was thoughtfully prepared. The breakfast, ocean view, and attentive butler made this one of our most memorable Bali stays.",
    date: "12 Jul 2026",
    stay: "30 Jun–3 Jul 2026",
    status: "PUBLISHED",
    featured: true,
    verified: true,
  },
  {
    id: "RV-1997",
    guest: "Daniel Wijaya",
    initials: "DW",
    villa: "Luna Honeymoon Villa",
    rating: 5,
    title: "Privat dan romantis",
    comment:
      "Setup anniversary sangat cantik. Kolam privat dan sarapan terapung menjadi favorit kami.",
    date: "10 Jul 2026",
    stay: "2–5 Jul 2026",
    status: "PUBLISHED",
    featured: false,
    verified: true,
  },
  {
    id: "RV-1982",
    guest: "Anonymous Guest",
    initials: "AG",
    villa: "Maira Family Estate",
    rating: 1,
    title: "Tidak sesuai",
    comment:
      "Komentar ini mengandung konten yang tidak relevan dan tautan promosi pihak ketiga.",
    date: "8 Jul 2026",
    stay: "Tidak terverifikasi",
    status: "HIDDEN",
    featured: false,
    verified: false,
  },
];
const statusMeta: Record<ReviewStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Menunggu",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-300/12 dark:text-amber-200",
  },
  PUBLISHED: {
    label: "Dipublikasi",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/12 dark:text-emerald-200",
  },
  HIDDEN: {
    label: "Disembunyikan",
    className:
      "bg-slate-200/70 text-slate-600 dark:bg-white/8 dark:text-white/55",
  },
  FLAGGED: {
    label: "Ditandai",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-300/12 dark:text-rose-200",
  },
};

export default function ReviewModerationPage() {
  const reduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const [reviews, setReviews] = useState(initialReviews);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | ReviewStatus>("ALL");
  const [selected, setSelected] = useState<Review | null>(null);
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return reviews.filter(
      (item) =>
        (!normalized ||
          `${item.guest} ${item.villa} ${item.title} ${item.comment}`
            .toLowerCase()
            .includes(normalized)) &&
        (filter === "ALL" || item.status === filter),
    );
  }, [filter, query, reviews]);
  const updateReview = (
    review: Review,
    patch: Partial<Review>,
    message: string,
  ) => {
    const updated = { ...review, ...patch };
    setReviews((items) =>
      items.map((item) => (item.id === review.id ? updated : item)),
    );
    setSelected((current) => (current?.id === review.id ? updated : current));
    notify({
      title: message,
      description: `${review.id} · ${review.villa}`,
      variant: "success",
    });
  };
  const average = (
    reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
  ).toFixed(1);

  return (
    <AdminPageShell
      title="Moderasi ulasan"
      subtitle="Jaga kualitas testimoni dan reputasi properti"
      active="Ulasan"
    >
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-sky-700 dark:bg-sky-300/10 dark:text-sky-200">
            <MessageSquareText className="size-3.5" /> Reputation desk
          </span>
          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Ulasan tamu
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 opacity-48">
            Tinjau ulasan baru, tangani konten sensitif, dan pilih testimoni
            terbaik untuk halaman publik.
          </p>
        </motion.div>
        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric
            label="Rating rata-rata"
            value={average}
            helper="Dari 5 bintang"
            icon={Star}
            tone="amber"
          />
          <Metric
            label="Menunggu"
            value={String(
              reviews.filter((item) => item.status === "PENDING").length,
            )}
            helper="Perlu moderasi"
            icon={Sparkles}
            tone="sky"
          />
          <Metric
            label="Ditandai"
            value={String(
              reviews.filter((item) => item.status === "FLAGGED").length,
            )}
            helper="Perlu perhatian"
            icon={AlertTriangle}
            tone="rose"
          />
          <Metric
            label="Testimonial"
            value={String(reviews.filter((item) => item.featured).length)}
            helper="Featured review"
            icon={CheckCircle2}
            tone="emerald"
          />
        </div>
        <section className="mt-6 overflow-hidden rounded-[1.7rem] border border-emerald-950/8 bg-white/68 dark:border-white/8 dark:bg-white/[0.045]">
          <div className="flex flex-col gap-3 border-b border-emerald-950/8 p-4 dark:border-white/8 sm:flex-row sm:p-5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 opacity-35" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari tamu, villa, atau isi ulasan..."
                className="h-11 w-full rounded-xl border border-emerald-950/10 bg-white/70 pl-10 pr-4 text-sm outline-none dark:border-white/10 dark:bg-white/6"
              />
            </div>
            <label className="relative">
              <span className="sr-only">Filter status</span>
              <select
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as typeof filter)
                }
                className="h-11 appearance-none rounded-xl border border-emerald-950/10 bg-white/70 pl-3 pr-9 text-xs font-semibold outline-none dark:border-white/10 dark:bg-[#12231f]"
              >
                <option value="ALL">Semua status</option>
                {Object.entries(statusMeta).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 opacity-40" />
            </label>
          </div>
          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
            {visible.map((item, index) => (
              <ReviewCard
                key={item.id}
                item={item}
                delay={reduceMotion ? 0 : index * 0.04}
                onOpen={() => setSelected(item)}
                onPublish={() =>
                  updateReview(
                    item,
                    { status: "PUBLISHED" },
                    "Ulasan dipublikasikan",
                  )
                }
                onHide={() =>
                  updateReview(
                    item,
                    { status: "HIDDEN" },
                    "Ulasan disembunyikan",
                  )
                }
                onFeature={() =>
                  updateReview(
                    item,
                    { featured: !item.featured },
                    item.featured
                      ? "Testimonial dilepas"
                      : "Testimonial dipilih",
                  )
                }
              />
            ))}
            {!visible.length ? (
              <div className="col-span-full grid min-h-64 place-items-center">
                <p className="font-semibold">Ulasan tidak ditemukan</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
      <AnimatePresence>
        {selected ? (
          <ReviewModal
            item={selected}
            reduceMotion={Boolean(reduceMotion)}
            onClose={() => setSelected(null)}
            onPublish={() =>
              updateReview(
                selected,
                { status: "PUBLISHED" },
                "Ulasan dipublikasikan",
              )
            }
            onHide={() =>
              updateReview(
                selected,
                { status: "HIDDEN" },
                "Ulasan disembunyikan",
              )
            }
          />
        ) : null}
      </AnimatePresence>
    </AdminPageShell>
  );
}

function ReviewCard({
  item,
  delay,
  onOpen,
  onPublish,
  onHide,
  onFeature,
}: {
  item: Review;
  delay: number;
  onOpen: () => void;
  onPublish: () => void;
  onHide: () => void;
  onFeature: () => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        "rounded-2xl border p-5",
        item.status === "FLAGGED"
          ? "border-rose-500/20 bg-rose-50/45 dark:bg-rose-300/[0.035]"
          : "border-emerald-950/8 bg-white/50 dark:border-white/8 dark:bg-white/[0.025]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
            {item.initials}
          </span>
          <div>
            <p className="text-sm font-bold">
              {item.guest}
              {item.verified ? (
                <CheckCircle2 className="ml-1 inline size-3.5 text-emerald-600" />
              ) : null}
            </p>
            <p className="mt-1 text-[0.62rem] opacity-38">{item.villa}</p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[0.55rem] font-bold uppercase",
            statusMeta[item.status].className,
          )}
        >
          {statusMeta[item.status].label}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-1 text-amber-500">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={cn("size-3.5", index < item.rating && "fill-current")}
          />
        ))}
        <span className="ml-1 text-xs font-bold text-emerald-950 dark:text-white">
          {item.rating}.0
        </span>
      </div>
      <h2 className="mt-3 font-serif text-xl font-semibold">{item.title}</h2>
      <p className="mt-2 line-clamp-3 text-sm leading-6 opacity-48">
        {item.comment}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-950/7 pt-4 dark:border-white/7">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onPublish}
            className="grid size-8 place-items-center rounded-lg text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300"
            aria-label="Publikasikan"
          >
            <Check className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onHide}
            className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-white/50 dark:hover:bg-white/6"
            aria-label="Sembunyikan"
          >
            <EyeOff className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onFeature}
            className={cn(
              "grid size-8 place-items-center rounded-lg",
              item.featured
                ? "bg-amber-100 text-amber-600"
                : "text-amber-600 hover:bg-amber-50",
            )}
            aria-label="Pilih testimonial"
          >
            <Star className={cn("size-3.5", item.featured && "fill-current")} />
          </button>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="text-xs font-bold text-emerald-700 dark:text-emerald-300"
        >
          Lihat lengkap
        </button>
      </div>
    </motion.article>
  );
}
function ReviewModal({
  item,
  reduceMotion,
  onClose,
  onPublish,
  onHide,
}: {
  item: Review;
  reduceMotion: boolean;
  onClose: () => void;
  onPublish: () => void;
  onHide: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[70] grid place-items-center bg-emerald-950/60 p-4 backdrop-blur-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        className="w-full max-w-xl rounded-[1.8rem] bg-[#fffdf8] p-6 shadow-2xl dark:bg-[#0c1c18]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {item.id}
            </p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">
              {item.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-emerald-950/5 dark:bg-white/7"
            aria-label="Tutup"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-1 text-amber-500">
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              className={cn("size-4", index < item.rating && "fill-current")}
            />
          ))}
        </div>
        <p className="mt-5 text-sm leading-7 opacity-58">{item.comment}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-emerald-950/[0.035] p-4 text-xs dark:bg-white/[0.035]">
          <div>
            <p className="opacity-38">Tamu</p>
            <p className="mt-1 font-bold">{item.guest}</p>
          </div>
          <div>
            <p className="opacity-38">Periode stay</p>
            <p className="mt-1 font-bold">{item.stay}</p>
          </div>
          <div>
            <p className="opacity-38">Villa</p>
            <p className="mt-1 font-bold">{item.villa}</p>
          </div>
          <div>
            <p className="opacity-38">Dikirim</p>
            <p className="mt-1 font-bold">{item.date}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onHide}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-rose-500/20 text-sm font-bold text-rose-600 dark:text-rose-300"
          >
            <EyeOff className="size-4" /> Sembunyikan
          </button>
          <button
            type="button"
            onClick={onPublish}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 text-sm font-bold text-white"
          >
            <Check className="size-4" /> Publikasikan
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}
function Metric({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof Star;
  tone: "amber" | "sky" | "rose" | "emerald";
}) {
  const colors = {
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-300/10 dark:text-sky-200",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-300/10 dark:text-rose-200",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200",
  };
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-emerald-950/8 bg-white/66 p-4 dark:border-white/8 dark:bg-white/[0.045] sm:p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold opacity-42">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-[0.65rem] opacity-35">{helper}</p>
        </div>
        <span
          className={cn(
            "grid size-10 place-items-center rounded-xl",
            colors[tone],
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
    </motion.div>
  );
}
