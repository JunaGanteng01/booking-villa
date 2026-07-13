"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BadgePercent,
  Check,
  ChevronDown,
  CircleDollarSign,
  Copy,
  Grid2X2,
  Layers3,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppNotifications } from "@/components/notification-root";
import { cn } from "@/lib/utils";

type TabId = "categories" | "amenities" | "promos";

type CategoryItem = {
  id: string;
  name: string;
  description: string;
  villaCount: number;
  active: boolean;
  color: string;
};

type AmenityItem = {
  id: string;
  name: string;
  group: string;
  villaCount: number;
  active: boolean;
};

type PromoItem = {
  id: string;
  name: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  start: string;
  end: string;
  usage: number;
  limit: number;
  active: boolean;
};

type EditableItem = CategoryItem | AmenityItem | PromoItem;

const initialCategories: CategoryItem[] = [
  { id: "cliffside", name: "Cliffside", description: "Villa privat dengan panorama tebing dan laut.", villaCount: 4, active: true, color: "emerald" },
  { id: "beachfront", name: "Beachfront", description: "Akses langsung ke pantai atau berada di garis pantai.", villaCount: 6, active: true, color: "sky" },
  { id: "jungle", name: "Jungle Retreat", description: "Retreat tenang di tengah lanskap tropis.", villaCount: 5, active: true, color: "lime" },
  { id: "family", name: "Family Estate", description: "Properti luas dengan fasilitas untuk keluarga.", villaCount: 7, active: true, color: "amber" },
  { id: "honeymoon", name: "Honeymoon", description: "Villa romantis dan privat untuk dua tamu.", villaCount: 3, active: true, color: "rose" },
  { id: "heritage", name: "Heritage", description: "Arsitektur lokal dengan cerita budaya Bali.", villaCount: 0, active: false, color: "violet" },
];

const initialAmenities: AmenityItem[] = [
  { id: "private-pool", name: "Private Pool", group: "Rekreasi", villaCount: 22, active: true },
  { id: "wifi", name: "High-speed WiFi", group: "Konektivitas", villaCount: 25, active: true },
  { id: "breakfast", name: "Daily Breakfast", group: "Kuliner", villaCount: 18, active: true },
  { id: "chef", name: "Private Chef", group: "Layanan", villaCount: 11, active: true },
  { id: "transfer", name: "Airport Transfer", group: "Transportasi", villaCount: 15, active: true },
  { id: "butler", name: "Dedicated Butler", group: "Layanan", villaCount: 9, active: true },
  { id: "spa", name: "In-villa Spa", group: "Wellness", villaCount: 8, active: true },
  { id: "kids-room", name: "Kids Room", group: "Keluarga", villaCount: 4, active: true },
  { id: "ev-charger", name: "EV Charger", group: "Transportasi", villaCount: 0, active: false },
];

const initialPromos: PromoItem[] = [
  { id: "escape20", name: "Private Escape", code: "ESCAPE20", type: "PERCENT", value: 20, start: "2026-07-01", end: "2026-08-31", usage: 48, limit: 100, active: true },
  { id: "staylong", name: "Stay Longer", code: "STAYLONG", type: "PERCENT", value: 15, start: "2026-07-01", end: "2026-12-20", usage: 31, limit: 150, active: true },
  { id: "gold500", name: "Gold Circle Reward", code: "GOLD500", type: "FIXED", value: 500000, start: "2026-01-01", end: "2026-12-31", usage: 72, limit: 250, active: true },
  { id: "ubudweek", name: "Ubud Wellness Week", code: "UBUDWEEK", type: "PERCENT", value: 12, start: "2026-09-01", end: "2026-09-30", usage: 0, limit: 80, active: false },
];

const tabs = [
  { id: "categories" as const, label: "Kategori", icon: Layers3 },
  { id: "amenities" as const, label: "Fasilitas", icon: Sparkles },
  { id: "promos" as const, label: "Promo", icon: BadgePercent },
];

const money = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default function VillaCatalogManagementPage() {
  const shouldReduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeTab, setActiveTab] = useState<TabId>("categories");
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState(initialCategories);
  const [amenities, setAmenities] = useState(initialAmenities);
  const [promos, setPromos] = useState(initialPromos);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EditableItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EditableItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formValue, setFormValue] = useState("");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("villaku-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
  const visibleCategories = useMemo(() => categories.filter((item) => !normalizedQuery || `${item.name} ${item.description}`.toLocaleLowerCase("id-ID").includes(normalizedQuery)), [categories, normalizedQuery]);
  const visibleAmenities = useMemo(() => amenities.filter((item) => !normalizedQuery || `${item.name} ${item.group}`.toLocaleLowerCase("id-ID").includes(normalizedQuery)), [amenities, normalizedQuery]);
  const visiblePromos = useMemo(() => promos.filter((item) => !normalizedQuery || `${item.name} ${item.code}`.toLocaleLowerCase("id-ID").includes(normalizedQuery)), [normalizedQuery, promos]);

  const currentCount = activeTab === "categories" ? categories.length : activeTab === "amenities" ? amenities.length : promos.length;
  const activeCount = activeTab === "categories" ? categories.filter((item) => item.active).length : activeTab === "amenities" ? amenities.filter((item) => item.active).length : promos.filter((item) => item.active).length;

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("villaku-theme", next);
      return next;
    });
  };

  const openEditor = (item?: EditableItem) => {
    setEditingItem(item ?? null);
    setFormName(item?.name ?? "");
    setFormDescription("description" in (item ?? {}) ? (item as CategoryItem).description : "");
    setFormCode("code" in (item ?? {}) ? (item as PromoItem).code : "");
    setFormValue("value" in (item ?? {}) ? String((item as PromoItem).value) : "");
    setEditorOpen(true);
  };

  const saveItem = () => {
    if (formName.trim().length < 3) {
      notify({ title: "Nama belum valid", description: "Gunakan minimal 3 karakter.", variant: "warning" });
      return;
    }
    const id = editingItem?.id ?? `${activeTab}-${Date.now()}`;
    if (activeTab === "categories") {
      const next: CategoryItem = { id, name: formName.trim(), description: formDescription.trim() || "Deskripsi kategori belum ditambahkan.", villaCount: editingItem && "villaCount" in editingItem ? editingItem.villaCount : 0, active: editingItem?.active ?? true, color: editingItem && "color" in editingItem ? editingItem.color : "emerald" };
      setCategories((items) => editingItem ? items.map((item) => item.id === id ? next : item) : [next, ...items]);
    } else if (activeTab === "amenities") {
      const next: AmenityItem = { id, name: formName.trim(), group: formDescription.trim() || "Lainnya", villaCount: editingItem && "villaCount" in editingItem ? editingItem.villaCount : 0, active: editingItem?.active ?? true };
      setAmenities((items) => editingItem ? items.map((item) => item.id === id ? next : item) : [next, ...items]);
    } else {
      if (formCode.trim().length < 4 || Number(formValue) <= 0) {
        notify({ title: "Detail promo belum valid", description: "Kode minimal 4 karakter dan nilai promo harus lebih dari nol.", variant: "warning" });
        return;
      }
      const existing = editingItem && "code" in editingItem ? editingItem : null;
      const next: PromoItem = { id, name: formName.trim(), code: formCode.trim().toUpperCase(), type: existing?.type ?? "PERCENT", value: Number(formValue), start: existing?.start ?? "2026-08-01", end: existing?.end ?? "2026-12-31", usage: existing?.usage ?? 0, limit: existing?.limit ?? 100, active: existing?.active ?? false };
      setPromos((items) => editingItem ? items.map((item) => item.id === id ? next : item) : [next, ...items]);
    }
    notify({ title: editingItem ? "Perubahan tersimpan" : "Data baru ditambahkan", description: `${formName.trim()} diperbarui pada data tiruan.`, variant: "success" });
    setEditorOpen(false);
  };

  const toggleActive = (id: string) => {
    if (activeTab === "categories") setCategories((items) => items.map((item) => item.id === id ? { ...item, active: !item.active } : item));
    else if (activeTab === "amenities") setAmenities((items) => items.map((item) => item.id === id ? { ...item, active: !item.active } : item));
    else setPromos((items) => items.map((item) => item.id === id ? { ...item, active: !item.active } : item));
  };

  const deleteItem = () => {
    if (!deleteTarget) return;
    if (activeTab === "categories") setCategories((items) => items.filter((item) => item.id !== deleteTarget.id));
    else if (activeTab === "amenities") setAmenities((items) => items.filter((item) => item.id !== deleteTarget.id));
    else setPromos((items) => items.filter((item) => item.id !== deleteTarget.id));
    notify({ title: `${deleteTarget.name} dihapus`, description: "Perubahan hanya berlaku pada data tiruan browser.", variant: "success" });
    setDeleteTarget(null);
  };

  const copyPromo = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      notify({ title: "Kode promo disalin", description: code, variant: "success" });
    } catch {
      notify({ title: "Kode promo", description: code, variant: "info" });
    }
  };

  return (
    <main className="min-h-screen bg-[#f2f4f0] text-foreground dark:bg-[#06100e]">
      <header className="sticky top-0 z-40 border-b border-emerald-950/8 bg-[#f2f4f0]/86 px-4 py-3 backdrop-blur-2xl dark:border-white/8 dark:bg-[#06100e]/88 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/admin/villas" className="grid size-10 shrink-0 place-items-center rounded-xl border border-emerald-950/10 bg-white/70 transition hover:-translate-x-0.5 dark:border-white/10 dark:bg-white/6" aria-label="Kembali ke daftar villa"><ArrowLeft className="size-4" /></Link>
            <div><p className="font-serif text-lg font-semibold leading-none sm:text-xl">Master data villa</p><p className="mt-1 hidden text-xs text-emerald-950/42 dark:text-white/40 sm:block">Kategori, fasilitas, dan kampanye promo</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleTheme} className="grid size-10 place-items-center rounded-full border border-emerald-950/10 bg-white/70 dark:border-white/10 dark:bg-white/6" aria-label="Ubah tema">{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</button>
            <button type="button" onClick={() => openEditor()} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-700 px-4 text-sm font-bold text-white shadow-[0_10px_26px_rgba(4,120,87,0.2)] transition hover:-translate-y-0.5"><Plus className="size-4" /><span className="hidden sm:inline">Tambah {activeTab === "categories" ? "kategori" : activeTab === "amenities" ? "fasilitas" : "promo"}</span><span className="sm:hidden">Tambah</span></button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-11">
        <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200"><SlidersHorizontal className="size-3.5" /> Catalog control</span>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Kelola detail yang membentuk pengalaman Villaku.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-950/48 dark:text-white/46">Susun kategori, standarkan fasilitas, dan aktifkan promo yang akan digunakan seluruh properti.</p>
        </motion.div>

        <div className="mt-7 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
          {tabs.map((tab) => { const Icon = tab.icon; const active = activeTab === tab.id; const count = tab.id === "categories" ? categories.length : tab.id === "amenities" ? amenities.length : promos.length; return <button type="button" key={tab.id} onClick={() => { setActiveTab(tab.id); setQuery(""); }} className={cn("relative flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-bold transition-all sm:text-sm", active ? "border-emerald-700 bg-emerald-700 text-white shadow-[0_12px_28px_rgba(4,120,87,0.2)]" : "border-emerald-950/8 bg-white/60 text-emerald-950/48 hover:bg-white dark:border-white/8 dark:bg-white/[0.04] dark:text-white/46 dark:hover:bg-white/[0.07]")}><Icon className="size-4" />{tab.label}<span className={cn("rounded-full px-1.5 py-0.5 text-[0.58rem]", active ? "bg-white/15" : "bg-emerald-950/5 dark:bg-white/7")}>{count}</span></button>; })}
        </div>

        <section className="mt-5 overflow-hidden rounded-[1.7rem] border border-emerald-950/8 bg-white/66 shadow-[0_20px_70px_rgba(4,34,28,0.055)] dark:border-white/8 dark:bg-white/[0.045]">
          <div className="flex flex-col gap-4 border-b border-emerald-950/8 p-4 dark:border-white/8 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="relative w-full sm:max-w-sm"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-emerald-950/34 dark:text-white/32" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Cari ${activeTab === "categories" ? "kategori" : activeTab === "amenities" ? "fasilitas" : "promo"}...`} className="h-11 w-full rounded-xl border border-emerald-950/10 bg-white/72 pl-10 pr-4 text-sm outline-none focus:border-emerald-500/35 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/6" /></div>
            <div className="flex items-center gap-5 text-xs"><div><span className="block font-bold text-emerald-800 dark:text-emerald-200">{currentCount}</span><span className="text-emerald-950/36 dark:text-white/34">Total data</span></div><div className="h-8 w-px bg-emerald-950/8 dark:bg-white/8" /><div><span className="block font-bold text-emerald-800 dark:text-emerald-200">{activeCount}</span><span className="text-emerald-950/36 dark:text-white/34">Aktif</span></div></div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "categories" ? <motion.div key="categories" initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">{visibleCategories.map((item, index) => <CategoryCard key={item.id} item={item} delay={index * 0.035} onEdit={() => openEditor(item)} onToggle={() => toggleActive(item.id)} onDelete={() => setDeleteTarget(item)} />)}</motion.div> : null}
            {activeTab === "amenities" ? <motion.div key="amenities" initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="divide-y divide-emerald-950/7 dark:divide-white/7">{visibleAmenities.map((item, index) => <AmenityRow key={item.id} item={item} delay={index * 0.03} onEdit={() => openEditor(item)} onToggle={() => toggleActive(item.id)} onDelete={() => setDeleteTarget(item)} />)}</motion.div> : null}
            {activeTab === "promos" ? <motion.div key="promos" initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">{visiblePromos.map((item, index) => <PromoCard key={item.id} item={item} delay={index * 0.04} onEdit={() => openEditor(item)} onToggle={() => toggleActive(item.id)} onDelete={() => setDeleteTarget(item)} onCopy={() => void copyPromo(item.code)} />)}</motion.div> : null}
          </AnimatePresence>

          {((activeTab === "categories" && !visibleCategories.length) || (activeTab === "amenities" && !visibleAmenities.length) || (activeTab === "promos" && !visiblePromos.length)) ? <div className="grid min-h-64 place-items-center border-t border-emerald-950/8 p-5 text-center dark:border-white/8"><div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200"><Search className="size-5" /></span><p className="mt-3 font-serif text-xl font-semibold">Data tidak ditemukan</p><button type="button" onClick={() => setQuery("")} className="mt-3 text-xs font-bold text-emerald-700 dark:text-emerald-300">Hapus pencarian</button></div></div> : null}
        </section>
      </div>

      <AnimatePresence>{editorOpen ? <EditorModal tab={activeTab} editing={Boolean(editingItem)} name={formName} description={formDescription} code={formCode} value={formValue} onName={setFormName} onDescription={setFormDescription} onCode={setFormCode} onValue={setFormValue} onClose={() => setEditorOpen(false)} onSave={saveItem} reduceMotion={Boolean(shouldReduceMotion)} /> : null}</AnimatePresence>
      <AnimatePresence>{deleteTarget ? <ConfirmDelete item={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={deleteItem} reduceMotion={Boolean(shouldReduceMotion)} /> : null}</AnimatePresence>
    </main>
  );
}

function CategoryCard({ item, delay, onEdit, onToggle, onDelete }: { item: CategoryItem; delay: number; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  const tones: Record<string, string> = { emerald: "from-emerald-500/18", sky: "from-sky-500/18", lime: "from-lime-500/18", amber: "from-amber-500/18", rose: "from-rose-500/18", violet: "from-violet-500/18" };
  return <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className={cn("rounded-2xl border border-emerald-950/8 bg-gradient-to-br to-white/45 p-4 dark:border-white/8 dark:to-white/[0.015]", tones[item.color])}><div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-xl bg-white/70 text-emerald-700 shadow-sm dark:bg-white/7 dark:text-emerald-200"><Grid2X2 className="size-4" /></span><StatusToggle active={item.active} onClick={onToggle} /></div><h2 className="mt-4 font-serif text-xl font-semibold">{item.name}</h2><p className="mt-1.5 min-h-10 text-xs leading-5 text-emerald-950/44 dark:text-white/40">{item.description}</p><div className="mt-4 flex items-center justify-between border-t border-emerald-950/7 pt-3 dark:border-white/7"><span className="text-xs"><strong>{item.villaCount}</strong> <span className="text-emerald-950/38 dark:text-white/36">villa</span></span><ItemActions onEdit={onEdit} onDelete={onDelete} /></div></motion.article>;
}

function AmenityRow({ item, delay, onEdit, onToggle, onDelete }: { item: AmenityItem; delay: number; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  return <motion.article initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 transition hover:bg-emerald-950/[0.02] dark:hover:bg-white/[0.02] sm:px-5"><span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200"><Sparkles className="size-4" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-emerald-950/36 dark:text-white/34">{item.group} · dipakai {item.villaCount} villa</p></div><div className="flex items-center gap-2"><StatusToggle active={item.active} onClick={onToggle} /><ItemActions onEdit={onEdit} onDelete={onDelete} /></div></motion.article>;
}

function PromoCard({ item, delay, onEdit, onToggle, onDelete, onCopy }: { item: PromoItem; delay: number; onEdit: () => void; onToggle: () => void; onDelete: () => void; onCopy: () => void }) {
  const progress = Math.min(100, Math.round((item.usage / item.limit) * 100));
  return <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className={cn("relative overflow-hidden rounded-2xl border p-5", item.active ? "border-amber-500/18 bg-[radial-gradient(circle_at_100%_0%,rgba(247,217,140,0.28),transparent_13rem),rgba(255,255,255,0.55)] dark:bg-[radial-gradient(circle_at_100%_0%,rgba(247,217,140,0.1),transparent_13rem),rgba(255,255,255,0.035)]" : "border-emerald-950/8 bg-white/42 opacity-72 dark:border-white/8 dark:bg-white/[0.025]")}><div className="flex items-start justify-between gap-3"><div><span className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-200">{item.type === "PERCENT" ? `${item.value}% OFF` : `${money.format(item.value)} OFF`}</span><h2 className="mt-1.5 font-serif text-xl font-semibold">{item.name}</h2></div><StatusToggle active={item.active} onClick={onToggle} /></div><button type="button" onClick={onCopy} className="mt-4 flex min-h-11 w-full items-center justify-between rounded-xl border border-dashed border-emerald-950/16 bg-white/60 px-3.5 text-left dark:border-white/14 dark:bg-white/5"><span className="font-mono text-sm font-bold tracking-[0.12em]">{item.code}</span><Copy className="size-4 text-emerald-700 dark:text-emerald-200" /></button><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><p className="text-emerald-950/34 dark:text-white/32">Periode</p><p className="mt-1 font-semibold">{item.start.slice(5).replace("-", "/")} – {item.end.slice(5).replace("-", "/")}</p></div><div className="text-right"><p className="text-emerald-950/34 dark:text-white/32">Penggunaan</p><p className="mt-1 font-semibold">{item.usage} / {item.limit}</p></div></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-950/7 dark:bg-white/7"><div className="h-full rounded-full bg-[linear-gradient(90deg,#047857,#d6a84f)]" style={{ width: `${progress}%` }} /></div><div className="mt-4 flex justify-end"><ItemActions onEdit={onEdit} onDelete={onDelete} /></div></motion.article>;
}

function StatusToggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("relative h-6 w-11 rounded-full transition-colors", active ? "bg-emerald-600" : "bg-emerald-950/12 dark:bg-white/14")} aria-label={active ? "Nonaktifkan" : "Aktifkan"} aria-pressed={active}><motion.span animate={{ x: active ? 21 : 3 }} className="absolute left-0 top-1/2 size-[1.12rem] -translate-y-1/2 rounded-full bg-white shadow" /></button>;
}

function ItemActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="flex gap-1"><button type="button" onClick={onEdit} className="grid size-8 place-items-center rounded-lg text-emerald-950/38 hover:bg-emerald-950/5 hover:text-emerald-700 dark:text-white/36 dark:hover:bg-white/6" aria-label="Edit"><Pencil className="size-3.5" /></button><button type="button" onClick={onDelete} className="grid size-8 place-items-center rounded-lg text-emerald-950/38 hover:bg-rose-100 hover:text-rose-600 dark:text-white/36 dark:hover:bg-rose-300/10" aria-label="Hapus"><Trash2 className="size-3.5" /></button></div>;
}

function EditorModal({ tab, editing, name, description, code, value, onName, onDescription, onCode, onValue, onClose, onSave, reduceMotion }: { tab: TabId; editing: boolean; name: string; description: string; code: string; value: string; onName: (value: string) => void; onDescription: (value: string) => void; onCode: (value: string) => void; onValue: (value: string) => void; onClose: () => void; onSave: () => void; reduceMotion: boolean }) {
  const label = tab === "categories" ? "kategori" : tab === "amenities" ? "fasilitas" : "promo";
  return <motion.div className="fixed inset-0 z-50 grid place-items-center bg-emerald-950/58 p-4 backdrop-blur-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}><motion.div initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.97 }} className="w-full max-w-lg rounded-[1.7rem] border border-white/10 bg-[#fffdf8] p-5 shadow-2xl dark:bg-[#0c1c18] sm:p-6" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Data tiruan</p><h2 className="mt-1.5 font-serif text-2xl font-semibold">{editing ? "Edit" : "Tambah"} {label}</h2></div><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full bg-emerald-950/5 dark:bg-white/7" aria-label="Tutup"><X className="size-4" /></button></div><div className="mt-5 space-y-4"><ModalField label={`Nama ${label}`}><input value={name} onChange={(event) => onName(event.target.value)} autoFocus className={modalInput} placeholder={`Nama ${label}`} /></ModalField>{tab === "categories" ? <ModalField label="Deskripsi"><textarea value={description} onChange={(event) => onDescription(event.target.value)} rows={4} className={cn(modalInput, "h-auto resize-none py-3")} placeholder="Jelaskan karakter kategori..." /></ModalField> : null}{tab === "amenities" ? <ModalField label="Kelompok fasilitas"><div className="relative"><select value={description} onChange={(event) => onDescription(event.target.value)} className={cn(modalInput, "appearance-none pr-10")}><option value="">Pilih kelompok</option><option>Rekreasi</option><option>Konektivitas</option><option>Kuliner</option><option>Layanan</option><option>Transportasi</option><option>Wellness</option><option>Keluarga</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-950/34 dark:text-white/32" /></div></ModalField> : null}{tab === "promos" ? <div className="grid gap-4 sm:grid-cols-2"><ModalField label="Kode promo"><input value={code} onChange={(event) => onCode(event.target.value.toUpperCase())} className={modalInput} placeholder="ESCAPE20" /></ModalField><ModalField label="Nilai diskon"><input type="number" value={value} onChange={(event) => onValue(event.target.value)} className={modalInput} placeholder="20" /></ModalField></div> : null}</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="min-h-10 rounded-full border border-emerald-950/10 px-4 text-sm font-semibold dark:border-white/10">Batal</button><button type="button" onClick={onSave} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white"><Check className="size-4" /> Simpan {label}</button></div></motion.div></motion.div>;
}

function ConfirmDelete({ item, onCancel, onConfirm, reduceMotion }: { item: EditableItem; onCancel: () => void; onConfirm: () => void; reduceMotion: boolean }) {
  return <motion.div className="fixed inset-0 z-[60] grid place-items-center bg-emerald-950/62 p-4 backdrop-blur-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}><motion.div initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-sm rounded-[1.6rem] bg-[#fffdf8] p-6 text-center shadow-2xl dark:bg-[#0c1c18]" onClick={(event) => event.stopPropagation()}><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-300/10 dark:text-rose-200"><Trash2 className="size-5" /></span><h2 className="mt-4 font-serif text-2xl font-semibold">Hapus {item.name}?</h2><p className="mt-2 text-sm leading-6 text-emerald-950/46 dark:text-white/42">Data akan dihapus dari pratinjau ini. Tidak ada perubahan ke database.</p><div className="mt-6 grid grid-cols-2 gap-2"><button type="button" onClick={onCancel} className="min-h-11 rounded-full border border-emerald-950/10 text-sm font-semibold dark:border-white/10">Batal</button><button type="button" onClick={onConfirm} className="min-h-11 rounded-full bg-rose-600 text-sm font-bold text-white">Hapus</button></div></motion.div></motion.div>;
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-semibold">{label}</span>{children}</label>;
}

const modalInput = "h-11 w-full rounded-xl border border-emerald-950/10 bg-white/72 px-3.5 text-sm outline-none focus:border-emerald-500/35 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/6";
