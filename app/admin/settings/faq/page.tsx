"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  HelpCircle,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAppNotifications } from "@/components/notification-root";
import { cn } from "@/lib/utils";

type FaqItem = {
  id: number;
  question: string;
  answer: string;
  category: string;
  active: boolean;
};

const initialFaqs: FaqItem[] = [
  {
    id: 1,
    question: "Bagaimana cara memastikan villa tersedia?",
    answer:
      "Pilih tanggal check-in dan check-out pada halaman villa. Kalender kami diperbarui untuk menampilkan ketersediaan terbaru.",
    category: "Booking",
    active: true,
  },
  {
    id: 2,
    question: "Metode pembayaran apa saja yang diterima?",
    answer:
      "Villaku menerima transfer bank, virtual account, kartu kredit, dan metode pembayaran yang tersedia melalui mitra gateway kami.",
    category: "Pembayaran",
    active: true,
  },
  {
    id: 3,
    question: "Apakah booking dapat dibatalkan?",
    answer:
      "Pembatalan mengikuti kebijakan pada setiap villa. Detail batas waktu dan refund selalu ditampilkan sebelum konfirmasi booking.",
    category: "Booking",
    active: true,
  },
  {
    id: 4,
    question: "Bisakah meminta layanan airport transfer?",
    answer:
      "Ya. Tim concierge dapat mengatur penjemputan bandara, kendaraan harian, private chef, dan pengalaman khusus lainnya.",
    category: "Layanan",
    active: true,
  },
  {
    id: 5,
    question: "Kapan deposit kerusakan dikembalikan?",
    answer:
      "Deposit akan diproses kembali maksimal 3 hari kerja setelah check-out dan pemeriksaan properti selesai.",
    category: "Pembayaran",
    active: false,
  },
];

export default function FaqManagementPage() {
  const reduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const [faqs, setFaqs] = useState(initialFaqs);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [editing, setEditing] = useState<FaqItem | "NEW" | null>(null);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return faqs.filter(
      (item) =>
        (!normalized ||
          `${item.question} ${item.answer}`
            .toLowerCase()
            .includes(normalized)) &&
        (category === "ALL" || item.category === category),
    );
  }, [category, faqs, query]);

  const move = (id: number, direction: -1 | 1) => {
    setFaqs((current) => {
      const index = current.findIndex((item) => item.id === id);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= current.length)
        return current;
      const copy = [...current];
      [copy[index], copy[destination]] = [copy[destination], copy[index]];
      return copy;
    });
  };

  const save = (item: FaqItem) => {
    setFaqs((current) =>
      current.some((faq) => faq.id === item.id)
        ? current.map((faq) => (faq.id === item.id ? item : faq))
        : [...current, item],
    );
    setEditing(null);
    notify({
      title: "FAQ berhasil disimpan",
      description: item.question,
      variant: "success",
    });
  };

  return (
    <AdminPageShell
      title="Pertanyaan umum"
      subtitle="Kelola jawaban cepat untuk calon tamu"
      active="Pengaturan"
    >
      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
              <HelpCircle className="size-3.5" /> Help center
            </span>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Kelola FAQ
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 opacity-48">
              Susun pertanyaan, atur urutan, dan tentukan jawaban yang tampil di
              website.
            </p>
          </motion.div>
          <button
            type="button"
            onClick={() => setEditing("NEW")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white"
          >
            <Plus className="size-4" /> Tambah FAQ
          </button>
        </div>

        <section className="mt-7 overflow-hidden rounded-[1.7rem] border border-emerald-950/8 bg-white/68 dark:border-white/8 dark:bg-white/[0.045]">
          <div className="flex flex-col gap-3 border-b border-emerald-950/8 p-4 dark:border-white/8 sm:flex-row sm:p-5">
            <label className="relative flex-1">
              <span className="sr-only">Cari FAQ</span>
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 opacity-35" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari pertanyaan atau jawaban..."
                className="h-11 w-full rounded-xl border border-emerald-950/10 bg-white/72 pl-10 pr-4 text-sm outline-none dark:border-white/10 dark:bg-white/6"
              />
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-11 rounded-xl border border-emerald-950/10 bg-white/72 px-3 text-sm font-bold outline-none dark:border-white/10 dark:bg-[#10231e]"
            >
              <option value="ALL">Semua kategori</option>
              {Array.from(new Set(faqs.map((item) => item.category))).map(
                (item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="divide-y divide-emerald-950/7 dark:divide-white/7">
            {visible.map((item, index) => (
              <motion.article
                key={item.id}
                initial={reduceMotion ? false : { opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.035 }}
                className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center"
              >
                <div className="flex gap-1">
                  <OrderButton
                    label="Naikkan urutan"
                    icon={ArrowUp}
                    disabled={faqs[0]?.id === item.id}
                    onClick={() => move(item.id, -1)}
                  />
                  <OrderButton
                    label="Turunkan urutan"
                    icon={ArrowDown}
                    disabled={faqs.at(-1)?.id === item.id}
                    onClick={() => move(item.id, 1)}
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.58rem] font-bold uppercase text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
                      {item.category}
                    </span>
                    <span
                      className={cn(
                        "text-[0.62rem] font-bold",
                        item.active
                          ? "text-emerald-600"
                          : "text-amber-600 dark:text-amber-300",
                      )}
                    >
                      {item.active ? "Tampil" : "Disembunyikan"}
                    </span>
                  </div>
                  <h2 className="mt-2 text-sm font-bold sm:text-base">
                    {item.question}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 opacity-45">
                    {item.answer}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.active}
                    aria-label={`Ubah status ${item.question}`}
                    onClick={() =>
                      setFaqs((current) =>
                        current.map((faq) =>
                          faq.id === item.id
                            ? { ...faq, active: !faq.active }
                            : faq,
                        ),
                      )
                    }
                    className={cn(
                      "relative h-7 w-12 rounded-full transition",
                      item.active
                        ? "bg-emerald-600"
                        : "bg-emerald-950/14 dark:bg-white/14",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 size-5 rounded-full bg-white shadow transition",
                        item.active ? "left-6" : "left-1",
                      )}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(item)}
                    className="grid size-9 place-items-center rounded-xl border border-emerald-950/8 text-emerald-700 dark:border-white/8 dark:text-emerald-300"
                    aria-label={`Edit ${item.question}`}
                  >
                    <Edit3 className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFaqs((current) =>
                        current.filter((faq) => faq.id !== item.id),
                      );
                      notify({
                        title: "FAQ dihapus",
                        description: item.question,
                        variant: "success",
                      });
                    }}
                    className="grid size-9 place-items-center rounded-xl border border-rose-200 text-rose-600 dark:border-rose-300/15 dark:text-rose-300"
                    aria-label={`Hapus ${item.question}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      </div>
      <AnimatePresence>
        {editing ? (
          <FaqEditor
            item={editing === "NEW" ? null : editing}
            nextId={Math.max(0, ...faqs.map((faq) => faq.id)) + 1}
            reduceMotion={Boolean(reduceMotion)}
            onClose={() => setEditing(null)}
            onSave={save}
          />
        ) : null}
      </AnimatePresence>
    </AdminPageShell>
  );
}

function FaqEditor({
  item,
  nextId,
  reduceMotion,
  onClose,
  onSave,
}: {
  item: FaqItem | null;
  nextId: number;
  reduceMotion: boolean;
  onClose: () => void;
  onSave: (item: FaqItem) => void;
}) {
  const [form, setForm] = useState<FaqItem>(
    item ?? {
      id: nextId,
      question: "",
      answer: "",
      category: "Booking",
      active: true,
    },
  );
  const valid =
    form.question.trim().length >= 10 && form.answer.trim().length >= 20;
  return (
    <motion.div
      className="fixed inset-0 z-[80] grid place-items-center bg-emerald-950/60 p-4 backdrop-blur-lg"
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
        className="w-full max-w-xl rounded-[1.8rem] bg-[#fffdf8] p-5 shadow-2xl dark:bg-[#0c1c18] sm:p-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
              Help center
            </p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">
              {item ? "Edit FAQ" : "FAQ baru"}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup">
            <X className="size-5 opacity-45" />
          </button>
        </div>
        <div className="mt-6 space-y-4">
          <label>
            <span className="mb-2 block text-xs font-bold opacity-45">
              Pertanyaan
            </span>
            <input
              value={form.question}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  question: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-emerald-950/10 bg-white/70 px-3 text-sm outline-none dark:border-white/10 dark:bg-white/6"
            />
          </label>
          <label>
            <span className="mb-2 block text-xs font-bold opacity-45">
              Jawaban
            </span>
            <textarea
              value={form.answer}
              rows={5}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  answer: event.target.value,
                }))
              }
              className="w-full resize-none rounded-xl border border-emerald-950/10 bg-white/70 p-3 text-sm leading-6 outline-none dark:border-white/10 dark:bg-white/6"
            />
          </label>
          <label>
            <span className="mb-2 block text-xs font-bold opacity-45">
              Kategori
            </span>
            <input
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-emerald-950/10 bg-white/70 px-3 text-sm outline-none dark:border-white/10 dark:bg-white/6"
            />
          </label>
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
            Simpan FAQ
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function OrderButton({
  label,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: typeof ArrowUp;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-lg bg-emerald-950/5 disabled:opacity-20 dark:bg-white/6"
      aria-label={label}
    >
      <Icon className="size-3.5" />
    </button>
  );
}
