"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAppNotifications } from "@/components/notification-root";
import { cn } from "@/lib/utils";

type ArticleStatus = "PUBLISHED" | "DRAFT" | "SCHEDULED";
type Article = {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  status: ArticleStatus;
  date: string;
  views: number;
};

const initialArticles: Article[] = [
  {
    id: 1,
    title: "A Private Guide to Uluwatu's Most Serene Corners",
    excerpt:
      "Sudut tenang, pantai tersembunyi, dan pengalaman privat pilihan concierge Villaku.",
    category: "Destination",
    author: "Ayu Prameswari",
    status: "PUBLISHED",
    date: "12 Jul 2026",
    views: 1248,
  },
  {
    id: 2,
    title: "Merancang Honeymoon yang Terasa Personal di Bali",
    excerpt:
      "Panduan memilih villa, itinerary, dan pengalaman yang terasa intim tanpa terburu-buru.",
    category: "Experience",
    author: "Nadia Kusuma",
    status: "SCHEDULED",
    date: "21 Jul 2026",
    views: 0,
  },
  {
    id: 3,
    title: "Villa Etiquette: Hal Kecil yang Membuat Stay Lebih Nyaman",
    excerpt:
      "Catatan praktis untuk menikmati private villa bersama keluarga dan sahabat.",
    category: "Travel tips",
    author: "Ayu Prameswari",
    status: "DRAFT",
    date: "Diperbarui 14 Jul 2026",
    views: 0,
  },
  {
    id: 4,
    title: "From Farm to Table: Dining Experiences Around Ubud",
    excerpt:
      "Restoran lokal dan private dining dengan bahan terbaik dari kebun sekitar Ubud.",
    category: "Culinary",
    author: "Made Surya",
    status: "PUBLISHED",
    date: "4 Jul 2026",
    views: 876,
  },
];

const statusMeta = {
  PUBLISHED: {
    label: "Published",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200",
  },
  DRAFT: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-white/55",
  },
  SCHEDULED: {
    label: "Terjadwal",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200",
  },
} satisfies Record<ArticleStatus, { label: string; className: string }>;

export default function BlogManagementPage() {
  const reduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const [articles, setArticles] = useState(initialArticles);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | ArticleStatus>("ALL");
  const [editing, setEditing] = useState<Article | "NEW" | null>(null);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return articles.filter(
      (article) =>
        (!normalized ||
          `${article.title} ${article.category} ${article.author}`
            .toLowerCase()
            .includes(normalized)) &&
        (status === "ALL" || article.status === status),
    );
  }, [articles, query, status]);

  const remove = (article: Article) => {
    if (!window.confirm(`Hapus artikel “${article.title}”?`)) return;
    setArticles((current) => current.filter((item) => item.id !== article.id));
    notify({
      title: "Artikel dihapus",
      description: article.title,
      variant: "success",
    });
  };

  const save = (article: Article) => {
    setArticles((current) => {
      const exists = current.some((item) => item.id === article.id);
      return exists
        ? current.map((item) => (item.id === article.id ? article : item))
        : [article, ...current];
    });
    setEditing(null);
    notify({
      title: "Artikel berhasil disimpan",
      description: `${article.title} · ${statusMeta[article.status].label}`,
      variant: "success",
    });
  };

  return (
    <AdminPageShell
      title="Artikel blog"
      subtitle="Kelola editorial dan inspirasi perjalanan Villaku"
      active="Pengaturan"
    >
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
              <BookOpen className="size-3.5" /> Content studio
            </span>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Stories Villaku
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 opacity-48">
              Tulis, jadwalkan, dan publikasikan inspirasi perjalanan untuk
              calon tamu Villaku.
            </p>
          </motion.div>
          <button
            type="button"
            onClick={() => setEditing("NEW")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white"
          >
            <Plus className="size-4" /> Artikel baru
          </button>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-3">
          <Metric
            label="Published"
            value={
              articles.filter((item) => item.status === "PUBLISHED").length
            }
            icon={CheckCircle2}
          />
          <Metric
            label="Draft"
            value={articles.filter((item) => item.status === "DRAFT").length}
            icon={FileText}
          />
          <Metric
            label="Terjadwal"
            value={
              articles.filter((item) => item.status === "SCHEDULED").length
            }
            icon={CalendarClock}
          />
        </div>

        <section className="mt-5 overflow-hidden rounded-[1.7rem] border border-emerald-950/8 bg-white/68 dark:border-white/8 dark:bg-white/[0.045]">
          <div className="flex flex-col gap-3 border-b border-emerald-950/8 p-4 dark:border-white/8 sm:flex-row sm:p-5">
            <label className="relative flex-1">
              <span className="sr-only">Cari artikel</span>
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 opacity-35" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari judul, kategori, atau penulis..."
                className="h-11 w-full rounded-xl border border-emerald-950/10 bg-white/72 pl-10 pr-4 text-sm outline-none dark:border-white/10 dark:bg-white/6"
              />
            </label>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as typeof status)
              }
              className="h-11 rounded-xl border border-emerald-950/10 bg-white/72 px-3 text-sm font-bold outline-none dark:border-white/10 dark:bg-[#10231e]"
            >
              <option value="ALL">Semua status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Terjadwal</option>
            </select>
          </div>
          <div className="divide-y divide-emerald-950/7 dark:divide-white/7">
            {visible.map((article, index) => (
              <motion.article
                key={article.id}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.035 }}
                className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[110px_minmax(0,1fr)_auto] lg:items-center"
              >
                <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-[linear-gradient(135deg,#064e3b,#0f766e)] text-white">
                  <BookOpen className="size-6 opacity-70" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[0.58rem] font-bold uppercase",
                        statusMeta[article.status].className,
                      )}
                    >
                      {statusMeta[article.status].label}
                    </span>
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.12em] opacity-38">
                      {article.category}
                    </span>
                  </div>
                  <h2 className="mt-2 font-serif text-xl font-semibold">
                    {article.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 opacity-45">
                    {article.excerpt}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.62rem] opacity-38">
                    <span>{article.author}</span>
                    <span>{article.date}</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3" />{" "}
                      {article.views.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => setEditing(article)}
                    className="grid size-10 place-items-center rounded-xl border border-emerald-950/8 text-emerald-700 dark:border-white/8 dark:text-emerald-300"
                    aria-label={`Edit ${article.title}`}
                  >
                    <Edit3 className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(article)}
                    className="grid size-10 place-items-center rounded-xl border border-rose-200 text-rose-600 dark:border-rose-300/15 dark:text-rose-300"
                    aria-label={`Hapus ${article.title}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="grid size-10 place-items-center rounded-xl hover:bg-emerald-950/5 dark:hover:bg-white/6"
                    aria-label="Aksi lainnya"
                  >
                    <MoreHorizontal className="size-4 opacity-45" />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
          {!visible.length ? (
            <div className="grid min-h-56 place-items-center p-6 text-center">
              <p className="font-semibold">Artikel tidak ditemukan</p>
            </div>
          ) : null}
        </section>
      </div>
      <AnimatePresence>
        {editing ? (
          <ArticleEditor
            article={editing === "NEW" ? null : editing}
            nextId={Math.max(0, ...articles.map((item) => item.id)) + 1}
            reduceMotion={Boolean(reduceMotion)}
            onClose={() => setEditing(null)}
            onSave={save}
          />
        ) : null}
      </AnimatePresence>
    </AdminPageShell>
  );
}

function ArticleEditor({
  article,
  nextId,
  reduceMotion,
  onClose,
  onSave,
}: {
  article: Article | null;
  nextId: number;
  reduceMotion: boolean;
  onClose: () => void;
  onSave: (article: Article) => void;
}) {
  const [form, setForm] = useState<Article>(
    article ?? {
      id: nextId,
      title: "",
      excerpt: "",
      category: "Destination",
      author: "Ayu Prameswari",
      status: "DRAFT",
      date: "Baru saja",
      views: 0,
    },
  );
  const valid =
    form.title.trim().length >= 8 && form.excerpt.trim().length >= 20;
  const update = <K extends keyof Article>(key: K, value: Article[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <motion.div
      className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-emerald-950/60 p-4 backdrop-blur-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onSave(form);
        }}
        className="my-auto w-full max-w-2xl rounded-[1.8rem] bg-[#fffdf8] p-5 shadow-2xl dark:bg-[#0c1c18] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
              Editorial
            </p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">
              {article ? "Edit artikel" : "Artikel baru"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-emerald-950/5 dark:bg-white/7"
            aria-label="Tutup editor"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-6 space-y-4">
          <EditorField
            label="Judul artikel"
            value={form.title}
            onChange={(value) => update("title", value)}
          />
          <label>
            <span className="mb-2 block text-xs font-bold opacity-45">
              Ringkasan
            </span>
            <textarea
              value={form.excerpt}
              onChange={(event) => update("excerpt", event.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-emerald-950/10 bg-white/70 p-3 text-sm leading-6 outline-none dark:border-white/10 dark:bg-white/6"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <EditorField
              label="Kategori"
              value={form.category}
              onChange={(value) => update("category", value)}
            />
            <label>
              <span className="mb-2 block text-xs font-bold opacity-45">
                Status
              </span>
              <select
                value={form.status}
                onChange={(event) =>
                  update("status", event.target.value as ArticleStatus)
                }
                className="h-11 w-full rounded-xl border border-emerald-950/10 bg-white/70 px-3 text-sm outline-none dark:border-white/10 dark:bg-[#10231e]"
              >
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Terjadwal</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-full border border-emerald-950/10 px-4 text-sm font-bold dark:border-white/10"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!valid}
            className="min-h-11 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white disabled:opacity-40"
          >
            Simpan artikel
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function EditorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold opacity-45">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-emerald-950/10 bg-white/70 px-3 text-sm outline-none dark:border-white/10 dark:bg-white/6"
      />
    </label>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Clock3;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-emerald-950/8 bg-white/68 p-4 dark:border-white/8 dark:bg-white/[0.045]">
      <div>
        <p className="text-xs font-semibold opacity-42">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </div>
      <span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
        <Icon className="size-4" />
      </span>
    </div>
  );
}
