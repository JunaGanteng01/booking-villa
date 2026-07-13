"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Check,
  ChevronDown,
  Eye,
  ImagePlus,
  MapPin,
  Moon,
  Save,
  Sparkles,
  Sun,
  UploadCloud,
  Users,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAppNotifications } from "@/components/notification-root";
import { VillaGalleryManager } from "@/components/villa-gallery-manager";
import { VillaAvailabilityCalendar } from "@/components/villa-availability-calendar";
import { cn } from "@/lib/utils";

const villaFormSchema = z.object({
  name: z.string().trim().min(4, "Nama villa minimal 4 karakter").max(90, "Nama terlalu panjang"),
  slug: z
    .string()
    .trim()
    .min(3, "Slug wajib diisi")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Gunakan huruf kecil, angka, dan tanda hubung"),
  category: z.string().min(1, "Pilih kategori villa"),
  location: z.string().min(1, "Pilih lokasi villa"),
  address: z.string().trim().min(12, "Alamat perlu lebih lengkap").max(220),
  shortDescription: z.string().trim().min(30, "Ringkasan minimal 30 karakter").max(180),
  description: z.string().trim().min(80, "Deskripsi minimal 80 karakter").max(1600),
  imageUrl: z.string().url("Masukkan URL gambar yang valid"),
  price: z.number().min(500000, "Harga minimal Rp500.000").max(100000000),
  weekendPrice: z.number().min(500000, "Harga akhir pekan minimal Rp500.000").max(100000000),
  capacity: z.number().int().min(1, "Minimal 1 tamu").max(30),
  bedrooms: z.number().int().min(1, "Minimal 1 kamar").max(20),
  bathrooms: z.number().int().min(1, "Minimal 1 kamar mandi").max(20),
  sizeSqm: z.number().int().min(20, "Luas minimal 20 m²").max(10000),
  status: z.enum(["DRAFT", "PUBLISHED", "MAINTENANCE"]),
  featured: z.boolean(),
  amenities: z.array(z.string()).min(3, "Pilih minimal 3 fasilitas"),
});

export type VillaFormValues = z.infer<typeof villaFormSchema>;

const createDefaults: VillaFormValues = {
  name: "",
  slug: "",
  category: "",
  location: "",
  address: "",
  shortDescription: "",
  description: "",
  imageUrl: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=84",
  price: 3500000,
  weekendPrice: 3850000,
  capacity: 4,
  bedrooms: 2,
  bathrooms: 2,
  sizeSqm: 280,
  status: "DRAFT",
  featured: false,
  amenities: ["Private Pool", "WiFi", "Breakfast"],
};

export const arunaEditDefaults: VillaFormValues = {
  name: "Villa Aruna Cliffside",
  slug: "aruna-cliffside",
  category: "Cliffside",
  location: "Uluwatu",
  address: "Jl. Pantai Suluban No. 18, Pecatu, Uluwatu, Bali",
  shortDescription: "Tebing privat dengan panorama sunset Samudra Hindia dan layanan personal sepanjang hari.",
  description:
    "Villa Aruna Cliffside menghadirkan pengalaman menginap privat di atas tebing Uluwatu. Setiap ruang dirancang menghadap Samudra Hindia, dilengkapi infinity pool, sunset deck, ruang keluarga terbuka, serta layanan private chef dan concierge untuk perjalanan yang terasa personal.",
  imageUrl: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=85",
  price: 4800000,
  weekendPrice: 5350000,
  capacity: 8,
  bedrooms: 4,
  bathrooms: 4,
  sizeSqm: 520,
  status: "PUBLISHED",
  featured: true,
  amenities: ["Private Pool", "WiFi", "Ocean View", "Private Chef", "Airport Transfer", "Butler"],
};

const amenityOptions = [
  "Private Pool",
  "WiFi",
  "Breakfast",
  "Ocean View",
  "Jungle View",
  "Private Chef",
  "Airport Transfer",
  "Butler",
  "Spa Room",
  "Kids Room",
  "Beach Access",
  "Yoga Deck",
];

const numberFormat = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function AdminVillaForm({
  mode,
  initialValues,
}: {
  mode: "create" | "edit";
  initialValues?: VillaFormValues;
}) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("basic");
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty, isSubmitting, isSubmitSuccessful },
  } = useForm<VillaFormValues>({
    resolver: zodResolver(villaFormSchema),
    defaultValues: initialValues ?? createDefaults,
    mode: "onBlur",
  });

  const values = watch();
  const completion = useMemo(() => {
    const checks = [
      values.name.length >= 4,
      Boolean(values.category),
      Boolean(values.location),
      values.address.length >= 12,
      values.shortDescription.length >= 30,
      values.description.length >= 80,
      values.price >= 500000,
      values.capacity >= 1,
      values.amenities.length >= 3,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [values]);

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

  const generateSlug = () => {
    const slug = values.name
      .toLocaleLowerCase("id-ID")
      .normalize("NFKD")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setValue("slug", slug, { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = async (data: VillaFormValues) => {
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    notify({
      title: mode === "create" ? "Villa baru siap ditinjau" : "Perubahan villa tersimpan",
      description: `${data.name} disimpan sebagai ${data.status.toLocaleLowerCase("id-ID")}.`,
      variant: "success",
    });
  };

  const onInvalid = () => {
    notify({
      title: "Form belum lengkap",
      description: "Periksa kolom yang ditandai sebelum menyimpan villa.",
      variant: "warning",
    });
  };

  const toggleAmenity = (amenity: string) => {
    const next = values.amenities.includes(amenity)
      ? values.amenities.filter((item) => item !== amenity)
      : [...values.amenities, amenity];
    setValue("amenities", next, { shouldDirty: true, shouldValidate: true });
  };

  const sections = [
    { id: "basic", label: "Informasi utama", complete: values.name.length >= 4 && Boolean(values.category) },
    { id: "gallery", label: "Galeri foto", complete: Boolean(values.imageUrl) },
    { id: "location", label: "Lokasi & deskripsi", complete: values.address.length >= 12 && values.description.length >= 80 },
    { id: "capacity", label: "Kapasitas & harga", complete: values.price >= 500000 && values.capacity >= 1 },
    { id: "availability", label: "Ketersediaan", complete: true },
    { id: "amenities", label: "Fasilitas", complete: values.amenities.length >= 3 },
    { id: "publish", label: "Publikasi", complete: Boolean(values.status) },
  ];

  return (
    <main className="min-h-screen bg-[#f2f4f0] text-foreground dark:bg-[#06100e]">
      <header className="sticky top-0 z-40 border-b border-emerald-950/8 bg-[#f2f4f0]/86 px-4 py-3 backdrop-blur-2xl dark:border-white/8 dark:bg-[#06100e]/88 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/admin/villas" className="grid size-10 shrink-0 place-items-center rounded-xl border border-emerald-950/10 bg-white/70 transition-all hover:-translate-x-0.5 dark:border-white/10 dark:bg-white/6" aria-label="Kembali ke daftar villa"><ArrowLeft className="size-4" /></Link>
            <div className="min-w-0">
              <p className="truncate font-serif text-lg font-semibold leading-none sm:text-xl">{mode === "create" ? "Tambah villa" : "Edit villa"}</p>
              <p className="mt-1 hidden text-xs text-emerald-950/42 dark:text-white/40 sm:block">{isDirty ? "Ada perubahan yang belum disimpan" : mode === "create" ? "Buat listing properti baru" : "Semua perubahan tersimpan"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleTheme} className="grid size-10 place-items-center rounded-full border border-emerald-950/10 bg-white/70 dark:border-white/10 dark:bg-white/6" aria-label="Ubah tema gelap atau terang">{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</button>
            <button type="button" onClick={() => setPreviewOpen(true)} className="hidden min-h-10 items-center gap-2 rounded-full border border-emerald-950/10 bg-white/70 px-4 text-sm font-semibold text-emerald-900 dark:border-white/10 dark:bg-white/6 dark:text-white sm:inline-flex"><Eye className="size-4" /> Preview</button>
            <button type="submit" form="villa-editor" disabled={isSubmitting} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-700 px-4 text-sm font-bold text-white shadow-[0_10px_26px_rgba(4,120,87,0.2)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-65"><Save className={cn("size-4", isSubmitting && "animate-pulse")} />{isSubmitting ? "Menyimpan..." : "Simpan"}</button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 pb-20 pt-6 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)_20rem] lg:px-8 lg:pt-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-emerald-950/8 bg-white/62 p-3 dark:border-white/8 dark:bg-white/[0.045]">
            <div className="p-2">
              <div className="flex items-center justify-between text-xs"><span className="font-semibold text-emerald-950/48 dark:text-white/46">Kelengkapan</span><span className="font-bold text-emerald-700 dark:text-emerald-300">{completion}%</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-950/7 dark:bg-white/7"><motion.div className="h-full rounded-full bg-[linear-gradient(90deg,#047857,#d6a84f)]" animate={{ width: `${completion}%` }} /></div>
            </div>
            <nav className="mt-3 space-y-1" aria-label="Bagian formulir villa">{sections.map((section, index) => <button type="button" key={section.id} onClick={() => { setActiveSection(section.id); document.getElementById(section.id)?.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "start" }); }} className={cn("flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition", activeSection === section.id ? "bg-emerald-700 text-white" : "text-emerald-950/48 hover:bg-emerald-950/5 dark:text-white/46 dark:hover:bg-white/6")}><span className={cn("grid size-5 place-items-center rounded-full text-[0.6rem]", activeSection === section.id ? "bg-white/15" : section.complete ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200" : "bg-emerald-950/5 dark:bg-white/7")}>{section.complete ? <Check className="size-3" /> : index + 1}</span>{section.label}</button>)}</nav>
          </div>
        </aside>

        <form id="villa-editor" onSubmit={handleSubmit(onSubmit, onInvalid)} className="min-w-0 space-y-5" noValidate>
          <FormSection id="basic" eyebrow="Properti" title="Informasi utama" description="Nama, identitas URL, kategori, dan visual utama villa.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama villa" error={errors.name?.message} className="sm:col-span-2"><input {...register("name")} onBlur={(event) => { register("name").onBlur(event); if (mode === "create" && !values.slug) generateSlug(); }} placeholder="Contoh: Villa Akasa Sky" className={inputClass(Boolean(errors.name))} /></Field>
              <Field label="Slug URL" error={errors.slug?.message} helper="villaku.id/villas/slug"><div className="relative"><input {...register("slug")} placeholder="villa-akasa-sky" className={cn(inputClass(Boolean(errors.slug)), "pr-10")} /><button type="button" onClick={generateSlug} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-emerald-700 hover:bg-emerald-100 dark:text-emerald-200 dark:hover:bg-emerald-300/10" aria-label="Buat slug dari nama"><WandSparkles className="size-4" /></button></div></Field>
              <Field label="Kategori" error={errors.category?.message}><SelectField {...register("category")} invalid={Boolean(errors.category)}><option value="">Pilih kategori</option><option>Beachfront</option><option>Cliffside</option><option>Jungle</option><option>Family</option><option>Honeymoon</option></SelectField></Field>
              <Field label="URL gambar utama" error={errors.imageUrl?.message} className="sm:col-span-2"><div className="flex gap-2"><input {...register("imageUrl")} className={inputClass(Boolean(errors.imageUrl))} /><button type="button" onClick={() => notify({ title: "Upload Cloudinary disiapkan", description: "Pada fase frontend, gunakan URL gambar untuk pratinjau.", variant: "info" })} className="grid size-11 shrink-0 place-items-center rounded-xl border border-emerald-950/10 bg-white text-emerald-700 dark:border-white/10 dark:bg-white/6 dark:text-emerald-200" aria-label="Upload gambar"><UploadCloud className="size-4" /></button></div></Field>
            </div>
          </FormSection>

          <FormSection id="gallery" eyebrow="Visual" title="Galeri foto villa" description="Atur cover, urutan, dan teks alternatif foto. Semua perubahan masih berupa preview lokal.">
            <VillaGalleryManager
              coverUrl={values.imageUrl}
              onCoverChange={(url) => setValue("imageUrl", url, { shouldDirty: true, shouldValidate: true })}
            />
          </FormSection>

          <FormSection id="location" eyebrow="Cerita & lokasi" title="Buat tamu membayangkan stay-nya" description="Informasi ini tampil pada halaman detail dan hasil pencarian.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Lokasi" error={errors.location?.message}><SelectField {...register("location")} invalid={Boolean(errors.location)}><option value="">Pilih lokasi</option><option>Uluwatu</option><option>Ubud</option><option>Canggu</option><option>Nusa Dua</option><option>Seminyak</option></SelectField></Field>
              <Field label="Alamat lengkap" error={errors.address?.message}><input {...register("address")} placeholder="Jalan, nomor, kawasan" className={inputClass(Boolean(errors.address))} /></Field>
              <Field label="Ringkasan" error={errors.shortDescription?.message} helper={`${values.shortDescription.length}/180 karakter`} className="sm:col-span-2"><textarea {...register("shortDescription")} rows={3} placeholder="Satu kalimat kuat untuk kartu villa..." className={cn(inputClass(Boolean(errors.shortDescription)), "h-auto resize-none py-3")} /></Field>
              <Field label="Deskripsi lengkap" error={errors.description?.message} helper={`${values.description.length}/1600 karakter`} className="sm:col-span-2"><textarea {...register("description")} rows={7} placeholder="Ceritakan pengalaman, ruang, suasana, dan layanan villa..." className={cn(inputClass(Boolean(errors.description)), "h-auto resize-y py-3")} /></Field>
            </div>
          </FormSection>

          <FormSection id="capacity" eyebrow="Operasional" title="Kapasitas dan harga" description="Gunakan angka bulat; harga ditampilkan dalam Rupiah per malam.">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Harga weekday" error={errors.price?.message} className="sm:col-span-2"><NumberInput prefix="Rp" inputProps={register("price", { valueAsNumber: true })} invalid={Boolean(errors.price)} /></Field>
              <Field label="Harga weekend" error={errors.weekendPrice?.message} className="sm:col-span-2"><NumberInput prefix="Rp" inputProps={register("weekendPrice", { valueAsNumber: true })} invalid={Boolean(errors.weekendPrice)} /></Field>
              <Field label="Kapasitas tamu" error={errors.capacity?.message}><NumberInput inputProps={register("capacity", { valueAsNumber: true })} invalid={Boolean(errors.capacity)} /></Field>
              <Field label="Kamar tidur" error={errors.bedrooms?.message}><NumberInput inputProps={register("bedrooms", { valueAsNumber: true })} invalid={Boolean(errors.bedrooms)} /></Field>
              <Field label="Kamar mandi" error={errors.bathrooms?.message}><NumberInput inputProps={register("bathrooms", { valueAsNumber: true })} invalid={Boolean(errors.bathrooms)} /></Field>
              <Field label="Luas bangunan" error={errors.sizeSqm?.message}><NumberInput suffix="m²" inputProps={register("sizeSqm", { valueAsNumber: true })} invalid={Boolean(errors.sizeSqm)} /></Field>
            </div>
          </FormSection>

          <FormSection id="availability" eyebrow="Kalender" title="Ketersediaan villa" description="Pantau booking dan ubah status tanggal untuk blok operasional atau maintenance.">
            <VillaAvailabilityCalendar />
          </FormSection>

          <FormSection id="amenities" eyebrow="Fasilitas" title="Detail yang membuat stay istimewa" description="Pilih minimal tiga fasilitas yang tersedia dan siap digunakan tamu.">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{amenityOptions.map((amenity) => { const selected = values.amenities.includes(amenity); return <button type="button" key={amenity} onClick={() => toggleAmenity(amenity)} className={cn("flex min-h-12 items-center gap-2 rounded-xl border px-3 text-left text-xs font-semibold transition-all", selected ? "border-emerald-600/25 bg-emerald-100 text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100" : "border-emerald-950/8 bg-white/52 text-emerald-950/46 hover:border-emerald-600/20 dark:border-white/8 dark:bg-white/[0.03] dark:text-white/44")} aria-pressed={selected}><span className={cn("grid size-5 shrink-0 place-items-center rounded-md", selected ? "bg-emerald-700 text-white" : "bg-emerald-950/5 dark:bg-white/7")}>{selected ? <Check className="size-3" /> : null}</span>{amenity}</button>; })}</div>{errors.amenities ? <p className="mt-3 text-xs font-medium text-rose-600 dark:text-rose-300">{errors.amenities.message}</p> : null}
          </FormSection>

          <FormSection id="publish" eyebrow="Visibilitas" title="Status publikasi" description="Draft aman untuk dilanjutkan nanti. Published langsung tampil di katalog setelah backend aktif.">
            <div className="grid gap-3 sm:grid-cols-3">{(["DRAFT", "PUBLISHED", "MAINTENANCE"] as const).map((status) => <label key={status} className={cn("cursor-pointer rounded-xl border p-4 transition-all", values.status === status ? "border-emerald-600/28 bg-emerald-100/70 ring-4 ring-emerald-500/7 dark:border-emerald-300/20 dark:bg-emerald-300/8" : "border-emerald-950/8 bg-white/45 dark:border-white/8 dark:bg-white/[0.03]")}><input type="radio" value={status} {...register("status")} className="sr-only" /><span className="flex items-center justify-between"><span className="text-sm font-bold">{status === "DRAFT" ? "Draft" : status === "PUBLISHED" ? "Published" : "Maintenance"}</span>{values.status === status ? <Check className="size-4 text-emerald-700 dark:text-emerald-200" /> : null}</span><span className="mt-2 block text-xs leading-5 text-emerald-950/42 dark:text-white/40">{status === "DRAFT" ? "Hanya terlihat oleh tim admin." : status === "PUBLISHED" ? "Tampil dan dapat dipesan tamu." : "Tersembunyi selama perawatan."}</span></label>)}</div>
            <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl border border-amber-600/12 bg-amber-50/60 p-4 dark:border-amber-200/10 dark:bg-amber-200/[0.04]"><span><span className="block text-sm font-semibold">Tampilkan sebagai featured villa</span><span className="mt-1 block text-xs text-emerald-950/42 dark:text-white/40">Villa mendapat prioritas di landing page dan katalog.</span></span><input type="checkbox" {...register("featured")} className="size-5 accent-emerald-700" /></label>
          </FormSection>

          <div className="flex flex-col gap-3 rounded-2xl bg-emerald-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between"><div><p className="font-serif text-xl font-semibold">{isSubmitSuccessful ? "Perubahan tersimpan" : "Siap menyimpan villa?"}</p><p className="mt-1 text-xs text-white/46">Validasi dummy berjalan di browser; belum mengirim data ke server.</p></div><div className="flex gap-2"><button type="button" onClick={() => router.push("/admin/villas")} className="min-h-10 rounded-full border border-white/12 px-4 text-sm font-semibold text-white/70">Batal</button><button type="submit" disabled={isSubmitting} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-amber-300 px-5 text-sm font-bold text-emerald-950 disabled:opacity-60"><Save className="size-4" /> {isSubmitting ? "Menyimpan..." : mode === "create" ? "Simpan villa" : "Simpan perubahan"}</button></div></div>
        </form>

        <aside className="hidden xl:block"><div className="sticky top-24"><p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-emerald-950/36 dark:text-white/34">Live preview</p><VillaPreview values={values} /><button type="button" onClick={() => setPreviewOpen(true)} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-emerald-950/10 bg-white/60 text-xs font-bold text-emerald-800 dark:border-white/10 dark:bg-white/5 dark:text-white"><Eye className="size-4" /> Buka preview besar</button></div></aside>
      </div>

      <AnimatePresence>{previewOpen ? <motion.div className="fixed inset-0 z-50 grid place-items-center bg-emerald-950/64 p-4 backdrop-blur-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewOpen(false)}><motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.97 }} className="w-full max-w-md" onClick={(event) => event.stopPropagation()}><VillaPreview values={values} large /><button type="button" onClick={() => setPreviewOpen(false)} className="mt-3 min-h-11 w-full rounded-full bg-white text-sm font-bold text-emerald-950">Tutup preview</button></motion.div></motion.div> : null}</AnimatePresence>
    </main>
  );
}

function FormSection({ id, eyebrow, title, description, children }: { id: string; eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <motion.section id={id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} className="scroll-mt-24 rounded-[1.6rem] border border-emerald-950/8 bg-white/66 p-5 shadow-[0_16px_50px_rgba(4,34,28,0.045)] dark:border-white/8 dark:bg-white/[0.045] sm:p-6"><p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">{eyebrow}</p><h2 className="mt-2 font-serif text-2xl font-semibold">{title}</h2><p className="mt-1.5 text-xs leading-5 text-emerald-950/42 dark:text-white/40">{description}</p><div className="mt-5">{children}</div></motion.section>;
}

function Field({ label, error, helper, className, children }: { label: string; error?: string; helper?: string; className?: string; children: React.ReactNode }) {
  return <label className={cn("block", className)}><span className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold"><span>{label}</span>{helper ? <span className="font-normal text-emerald-950/34 dark:text-white/32">{helper}</span> : null}</span>{children}{error ? <span className="mt-1.5 block text-xs font-medium text-rose-600 dark:text-rose-300">{error}</span> : null}</label>;
}

function SelectField({ invalid, className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return <div className="relative"><select {...props} className={cn(inputClass(invalid), "appearance-none pr-10", className)}>{children}</select><ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-emerald-950/34 dark:text-white/32" /></div>;
}

function NumberInput({ prefix, suffix, inputProps, invalid }: { prefix?: string; suffix?: string; inputProps: ReturnType<ReturnType<typeof useForm<VillaFormValues>>["register"]>; invalid?: boolean }) {
  return <div className="relative">{prefix ? <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-950/36 dark:text-white/34">{prefix}</span> : null}<input type="number" min={0} {...inputProps} className={cn(inputClass(invalid), prefix && "pl-10", suffix && "pr-10")} />{suffix ? <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-950/36 dark:text-white/34">{suffix}</span> : null}</div>;
}

function VillaPreview({ values, large = false }: { values: VillaFormValues; large?: boolean }) {
  return <div className={cn("overflow-hidden rounded-[1.7rem] border border-emerald-950/10 bg-[#fffdf8] shadow-[0_24px_80px_rgba(4,34,28,0.16)] dark:border-white/10 dark:bg-[#0c1c18]", large && "rounded-[2rem]")}><div className={cn("relative overflow-hidden bg-emerald-950", large ? "aspect-[16/10]" : "aspect-[4/3]")}><img src={values.imageUrl || createDefaults.imageUrl} alt="Preview villa" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-emerald-950/65 via-transparent to-transparent" /><span className="absolute left-4 top-4 rounded-full bg-white/88 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-emerald-800 backdrop-blur">{values.status === "PUBLISHED" ? "Available" : values.status}</span>{values.featured ? <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-300 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-emerald-950"><Sparkles className="size-3" /> Featured</span> : null}<div className="absolute inset-x-4 bottom-4 text-white"><p className="text-xs text-white/55">{values.category || "Kategori villa"}</p><p className="mt-1 font-serif text-2xl font-semibold">{values.name || "Nama villa Anda"}</p></div></div><div className="p-4"><div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-xs text-emerald-950/44 dark:text-white/42"><MapPin className="size-3.5" /> {values.location || "Lokasi"}</span><span className="font-serif text-lg font-semibold text-emerald-800 dark:text-emerald-200">{numberFormat.format(values.price || 0)}</span></div><p className="mt-3 line-clamp-2 text-xs leading-5 text-emerald-950/46 dark:text-white/42">{values.shortDescription || "Ringkasan pengalaman villa akan tampil di sini."}</p><div className="mt-4 flex items-center gap-4 border-t border-emerald-950/7 pt-3 text-[0.65rem] text-emerald-950/40 dark:border-white/7 dark:text-white/38"><span className="flex items-center gap-1"><Users className="size-3.5" /> {values.capacity} tamu</span><span className="flex items-center gap-1"><BedDouble className="size-3.5" /> {values.bedrooms} kamar</span><span className="flex items-center gap-1"><Bath className="size-3.5" /> {values.bathrooms}</span></div></div></div>;
}

function inputClass(invalid?: boolean) {
  return cn("h-11 w-full rounded-xl border bg-white/72 px-3.5 text-sm text-emerald-950 outline-none transition placeholder:text-emerald-950/28 focus:ring-4 dark:bg-white/6 dark:text-white dark:placeholder:text-white/24", invalid ? "border-rose-400 focus:border-rose-500 focus:ring-rose-400/10 dark:border-rose-400/60" : "border-emerald-950/10 focus:border-emerald-600/35 focus:ring-emerald-500/10 dark:border-white/10");
}
