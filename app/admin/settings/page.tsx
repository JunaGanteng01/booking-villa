"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Building2,
  Check,
  Eye,
  Globe2,
  HelpCircle,
  ImageIcon,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAppNotifications } from "@/components/notification-root";
import { cn } from "@/lib/utils";

type WebsiteSettings = {
  siteName: string;
  tagline: string;
  supportEmail: string;
  phone: string;
  address: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  announcementEnabled: boolean;
  announcement: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  openGraphImage: string;
  searchIndexEnabled: boolean;
  mapsApiKey: string;
  mapLatitude: string;
  mapLongitude: string;
  mapZoom: string;
  mapStyle: string;
  mapEnabled: boolean;
};

const defaults: WebsiteSettings = {
  siteName: "Villaku Private Resorts",
  tagline: "Private stays, thoughtfully curated",
  supportEmail: "stay@villaku.id",
  phone: "+62 811 3888 2026",
  address: "Jl. Pantai Berawa No. 18, Canggu, Bali",
  heroEyebrow: "Luxury villa booking experience",
  heroTitle: "Temukan villa premium untuk momen yang terasa privat.",
  heroDescription:
    "Vila terkurasi dengan layanan personal, pengalaman autentik, dan kenyamanan tanpa kompromi.",
  heroImage:
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85",
  announcementEnabled: true,
  announcement: "Summer escape · Hemat hingga 15% untuk stay 4 malam",
  metaTitle: "Villaku | Luxury Private Villas in Bali",
  metaDescription:
    "Temukan villa privat premium di Bali dengan layanan personal, fasilitas lengkap, dan proses booking yang aman bersama Villaku.",
  metaKeywords: "villa bali, villa private, luxury resort, booking villa bali",
  canonicalUrl: "https://villaku.id",
  openGraphImage:
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
  searchIndexEnabled: true,
  mapsApiKey: "",
  mapLatitude: "-8.6478",
  mapLongitude: "115.1385",
  mapZoom: "13",
  mapStyle: "roadmap",
  mapEnabled: true,
};

const storageKey = "villaku-website-settings";

export default function WebsiteSettingsPage() {
  const reduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(defaults);
  const [activeSection, setActiveSection] = useState<
    "identity" | "content" | "seo" | "maps"
  >("identity");

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      const parsed = { ...defaults, ...JSON.parse(stored) } as WebsiteSettings;
      setSettings(parsed);
      setSaved(parsed);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);
  const update = <K extends keyof WebsiteSettings>(
    key: K,
    value: WebsiteSettings[K],
  ) => setSettings((current) => ({ ...current, [key]: value }));

  const save = () => {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
    setSaved(settings);
    notify({
      title: "Pengaturan website disimpan",
      description: "Identitas dan konten publik berhasil diperbarui.",
      variant: "success",
    });
  };

  const reset = () => {
    setSettings(saved);
    notify({
      title: "Perubahan dibatalkan",
      description: "Form dikembalikan ke versi terakhir yang tersimpan.",
    });
  };

  return (
    <AdminPageShell
      title="Pengaturan"
      subtitle="Kelola website, konten, dan preferensi operasional"
      active="Pengaturan"
      actions={
        dirty ? (
          <span className="hidden rounded-full bg-amber-100 px-3 py-1.5 text-[0.62rem] font-bold text-amber-700 sm:inline-flex dark:bg-amber-300/10 dark:text-amber-200">
            Perubahan belum disimpan
          </span>
        ) : null
      }
    >
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
              <Globe2 className="size-3.5" /> Website configuration
            </span>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Website & konten
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 opacity-48">
              Atur identitas brand, informasi kontak, dan pesan utama yang
              dilihat calon tamu.
            </p>
          </motion.div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={reset}
              disabled={!dirty}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-950/10 bg-white/72 px-4 text-sm font-bold disabled:opacity-40 dark:border-white/10 dark:bg-white/6"
            >
              <RotateCcw className="size-4" /> Batalkan
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!dirty}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white disabled:opacity-45"
            >
              {dirty ? (
                <Save className="size-4" />
              ) : (
                <Check className="size-4" />
              )}
              {dirty ? "Simpan perubahan" : "Tersimpan"}
            </button>
          </div>
        </div>

        <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="overflow-hidden rounded-[1.7rem] border border-emerald-950/8 bg-white/68 dark:border-white/8 dark:bg-white/[0.045]">
            <div className="flex gap-1 border-b border-emerald-950/8 p-3 dark:border-white/8">
              <TabButton
                active={activeSection === "identity"}
                onClick={() => setActiveSection("identity")}
                icon={Building2}
                label="Identitas website"
              />
              <TabButton
                active={activeSection === "content"}
                onClick={() => setActiveSection("content")}
                icon={Sparkles}
                label="Konten beranda"
              />
              <TabButton
                active={activeSection === "seo"}
                onClick={() => setActiveSection("seo")}
                icon={Search}
                label="SEO & meta"
              />
              <TabButton
                active={activeSection === "maps"}
                onClick={() => setActiveSection("maps")}
                icon={MapPin}
                label="Google Maps"
              />
            </div>

            <div className="p-5 sm:p-6">
              {activeSection === "identity" ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Nama website"
                    value={settings.siteName}
                    onChange={(value) => update("siteName", value)}
                  />
                  <Field
                    label="Tagline"
                    value={settings.tagline}
                    onChange={(value) => update("tagline", value)}
                  />
                  <Field
                    label="Email dukungan"
                    type="email"
                    value={settings.supportEmail}
                    icon={Mail}
                    onChange={(value) => update("supportEmail", value)}
                  />
                  <Field
                    label="Nomor WhatsApp / telepon"
                    type="tel"
                    value={settings.phone}
                    icon={Phone}
                    onChange={(value) => update("phone", value)}
                  />
                  <div className="md:col-span-2">
                    <Field
                      label="Alamat operasional"
                      value={settings.address}
                      icon={MapPin}
                      onChange={(value) => update("address", value)}
                    />
                  </div>
                </div>
              ) : activeSection === "content" ? (
                <div className="space-y-5">
                  <Field
                    label="Label hero"
                    value={settings.heroEyebrow}
                    onChange={(value) => update("heroEyebrow", value)}
                  />
                  <Field
                    label="Judul hero"
                    value={settings.heroTitle}
                    onChange={(value) => update("heroTitle", value)}
                  />
                  <TextArea
                    label="Deskripsi hero"
                    value={settings.heroDescription}
                    onChange={(value) => update("heroDescription", value)}
                  />
                  <Field
                    label="URL gambar hero"
                    value={settings.heroImage}
                    icon={ImageIcon}
                    onChange={(value) => update("heroImage", value)}
                  />
                  <div className="rounded-2xl border border-emerald-950/8 p-4 dark:border-white/8">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold">Banner pengumuman</p>
                        <p className="mt-1 text-xs opacity-42">
                          Tampilkan promo singkat di bagian atas website.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.announcementEnabled}
                        onClick={() =>
                          update(
                            "announcementEnabled",
                            !settings.announcementEnabled,
                          )
                        }
                        className={cn(
                          "relative h-7 w-12 rounded-full transition",
                          settings.announcementEnabled
                            ? "bg-emerald-600"
                            : "bg-emerald-950/14 dark:bg-white/14",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-1 size-5 rounded-full bg-white shadow transition",
                            settings.announcementEnabled ? "left-6" : "left-1",
                          )}
                        />
                      </button>
                    </div>
                    {settings.announcementEnabled ? (
                      <div className="mt-4">
                        <Field
                          label="Teks pengumuman"
                          value={settings.announcement}
                          onChange={(value) => update("announcement", value)}
                        />
                      </div>
                    ) : null}
                  </div>
                  <Link
                    href="/admin/settings/blog"
                    className="flex items-center justify-between rounded-2xl border border-emerald-950/8 p-4 transition hover:border-emerald-600/30 hover:bg-emerald-50 dark:border-white/8 dark:hover:bg-emerald-300/6"
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
                        <BookOpen className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-bold">
                          Artikel blog
                        </span>
                        <span className="mt-1 block text-xs opacity-42">
                          Tulis dan publikasikan Stories Villaku
                        </span>
                      </span>
                    </span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      Kelola
                    </span>
                  </Link>
                  <Link
                    href="/admin/settings/faq"
                    className="flex items-center justify-between rounded-2xl border border-emerald-950/8 p-4 transition hover:border-emerald-600/30 hover:bg-emerald-50 dark:border-white/8 dark:hover:bg-emerald-300/6"
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200">
                        <HelpCircle className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-bold">
                          Pertanyaan umum
                        </span>
                        <span className="mt-1 block text-xs opacity-42">
                          Kelola FAQ yang tampil di website
                        </span>
                      </span>
                    </span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      Kelola
                    </span>
                  </Link>
                </div>
              ) : activeSection === "seo" ? (
                <div className="space-y-5">
                  <div>
                    <Field
                      label="Meta title"
                      value={settings.metaTitle}
                      onChange={(value) => update("metaTitle", value)}
                    />
                    <CharacterCount
                      value={settings.metaTitle}
                      recommended={60}
                    />
                  </div>
                  <div>
                    <TextArea
                      label="Meta description"
                      value={settings.metaDescription}
                      onChange={(value) => update("metaDescription", value)}
                    />
                    <CharacterCount
                      value={settings.metaDescription}
                      recommended={160}
                    />
                  </div>
                  <Field
                    label="Kata kunci (pisahkan dengan koma)"
                    value={settings.metaKeywords}
                    onChange={(value) => update("metaKeywords", value)}
                  />
                  <Field
                    label="Canonical URL"
                    type="url"
                    value={settings.canonicalUrl}
                    icon={Globe2}
                    onChange={(value) => update("canonicalUrl", value)}
                  />
                  <Field
                    label="Open Graph image URL"
                    type="url"
                    value={settings.openGraphImage}
                    icon={ImageIcon}
                    onChange={(value) => update("openGraphImage", value)}
                  />
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-950/8 p-4 dark:border-white/8">
                    <div>
                      <p className="text-sm font-bold">Izinkan mesin pencari</p>
                      <p className="mt-1 text-xs leading-5 opacity-42">
                        Aktifkan index dan follow untuk halaman publik.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.searchIndexEnabled}
                      onClick={() =>
                        update(
                          "searchIndexEnabled",
                          !settings.searchIndexEnabled,
                        )
                      }
                      className={cn(
                        "relative h-7 w-12 shrink-0 rounded-full transition",
                        settings.searchIndexEnabled
                          ? "bg-emerald-600"
                          : "bg-emerald-950/14 dark:bg-white/14",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-1 size-5 rounded-full bg-white shadow transition",
                          settings.searchIndexEnabled ? "left-6" : "left-1",
                        )}
                      />
                    </button>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-4 text-xs leading-5 text-emerald-800 dark:bg-emerald-300/7 dark:text-emerald-200">
                    Robots meta:{" "}
                    <strong>
                      {settings.searchIndexEnabled
                        ? "index, follow"
                        : "noindex, nofollow"}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-800 dark:bg-amber-300/7 dark:text-amber-200">
                    Kunci API disimpan sebagai konfigurasi privat pada integrasi
                    backend. Preview koordinat tetap dapat digunakan tanpa
                    menampilkan kunci.
                  </div>
                  <Field
                    label="Google Maps API key"
                    type="password"
                    value={settings.mapsApiKey}
                    icon={KeyRound}
                    onChange={(value) => update("mapsApiKey", value)}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Latitude"
                      value={settings.mapLatitude}
                      onChange={(value) => update("mapLatitude", value)}
                    />
                    <Field
                      label="Longitude"
                      value={settings.mapLongitude}
                      onChange={(value) => update("mapLongitude", value)}
                    />
                    <Field
                      label="Zoom (1–20)"
                      type="number"
                      value={settings.mapZoom}
                      onChange={(value) => update("mapZoom", value)}
                    />
                    <label>
                      <span className="mb-2 block text-xs font-bold opacity-45">
                        Tipe peta
                      </span>
                      <select
                        value={settings.mapStyle}
                        onChange={(event) =>
                          update("mapStyle", event.target.value)
                        }
                        className="h-11 w-full rounded-xl border border-emerald-950/10 bg-white/72 px-3 text-sm outline-none dark:border-white/10 dark:bg-[#10231e]"
                      >
                        <option value="roadmap">Roadmap</option>
                        <option value="satellite">Satellite</option>
                        <option value="terrain">Terrain</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </label>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-950/8 p-4 dark:border-white/8">
                    <div>
                      <p className="text-sm font-bold">
                        Tampilkan peta di website
                      </p>
                      <p className="mt-1 text-xs leading-5 opacity-42">
                        Peta akan muncul pada bagian lokasi dan kontak.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.mapEnabled}
                      onClick={() => update("mapEnabled", !settings.mapEnabled)}
                      className={cn(
                        "relative h-7 w-12 shrink-0 rounded-full transition",
                        settings.mapEnabled
                          ? "bg-emerald-600"
                          : "bg-emerald-950/14 dark:bg-white/14",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-1 size-5 rounded-full bg-white shadow transition",
                          settings.mapEnabled ? "left-6" : "left-1",
                        )}
                      />
                    </button>
                  </div>
                  <a
                    href={
                      "https://www.google.com/maps?q=" +
                      encodeURIComponent(
                        settings.mapLatitude + "," + settings.mapLongitude,
                      )
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-emerald-950/10 px-4 text-sm font-bold text-emerald-700 dark:border-white/10 dark:text-emerald-300"
                  >
                    <MapPin className="size-4" /> Buka koordinat di Google Maps
                  </a>
                </div>
              )}
            </div>
          </section>

          <aside className="self-start rounded-[1.7rem] border border-emerald-950/8 bg-emerald-950 p-4 text-white dark:border-white/8 xl:sticky xl:top-24">
            <div className="flex items-center justify-between px-2 py-1">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-200">
                  Live preview
                </p>
                <p className="mt-1 text-xs text-white/45">Tampilan beranda</p>
              </div>
              <Eye className="size-4 text-white/45" />
            </div>
            {activeSection === "seo" ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-[1.3rem] bg-white p-5 text-[#202124]">
                  <p className="truncate text-xs">
                    {settings.canonicalUrl || "https://villaku.id"}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xl leading-6 text-[#1a0dab]">
                    {settings.metaTitle || "Judul halaman Villaku"}
                  </p>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#4d5156]">
                    {settings.metaDescription ||
                      "Deskripsi halaman akan tampil di hasil pencarian."}
                  </p>
                </div>
                <div className="overflow-hidden rounded-[1.3rem] bg-white/7">
                  {settings.openGraphImage ? (
                    <img
                      src={settings.openGraphImage}
                      alt="Preview Open Graph"
                      className="aspect-[1.91/1] w-full object-cover"
                    />
                  ) : (
                    <div className="grid aspect-[1.91/1] place-items-center bg-white/5">
                      <ImageIcon className="size-6 text-white/35" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-[0.6rem] uppercase tracking-[0.12em] text-white/38">
                      villaku.id
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm font-bold">
                      {settings.metaTitle}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/45">
                      {settings.metaDescription}
                    </p>
                  </div>
                </div>
              </div>
            ) : activeSection === "maps" ? (
              <div className="mt-4 space-y-4">
                <div className="overflow-hidden rounded-[1.3rem] bg-white/7">
                  {settings.mapEnabled ? (
                    <iframe
                      title="Preview lokasi Villaku"
                      loading="lazy"
                      src={
                        "https://www.google.com/maps?q=" +
                        encodeURIComponent(
                          settings.mapLatitude + "," + settings.mapLongitude,
                        ) +
                        "&z=" +
                        encodeURIComponent(settings.mapZoom) +
                        "&output=embed"
                      }
                      className="h-[420px] w-full border-0"
                    />
                  ) : (
                    <div className="grid h-[420px] place-items-center p-8 text-center">
                      <div>
                        <MapPin className="mx-auto size-8 text-white/35" />
                        <p className="mt-3 text-sm font-bold">
                          Peta dinonaktifkan
                        </p>
                        <p className="mt-2 text-xs leading-5 text-white/45">
                          Aktifkan peta untuk menampilkan preview lokasi.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/6 p-3">
                    <p className="text-[0.6rem] text-white/38">Latitude</p>
                    <p className="mt-1 text-xs font-bold">
                      {settings.mapLatitude}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/6 p-3">
                    <p className="text-[0.6rem] text-white/38">Longitude</p>
                    <p className="mt-1 text-xs font-bold">
                      {settings.mapLongitude}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="relative mt-4 min-h-[500px] overflow-hidden rounded-[1.3rem] bg-[#153c31]">
                  {settings.heroImage ? (
                    <img
                      src={settings.heroImage}
                      alt="Preview hero website"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-emerald-950/45 to-emerald-950/95" />
                  {settings.announcementEnabled ? (
                    <div className="relative bg-amber-300 px-4 py-2 text-center text-[0.6rem] font-bold text-emerald-950">
                      {settings.announcement || "Tulis pengumuman Anda"}
                    </div>
                  ) : null}
                  <div className="relative flex min-h-[460px] flex-col justify-end p-6">
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-amber-200">
                      {settings.heroEyebrow}
                    </p>
                    <h2 className="mt-3 font-serif text-3xl font-semibold leading-[1.05]">
                      {settings.heroTitle || "Judul hero website"}
                    </h2>
                    <p className="mt-4 text-xs leading-5 text-white/62">
                      {settings.heroDescription}
                    </p>
                    <button
                      type="button"
                      className="mt-5 min-h-10 self-start rounded-full bg-white px-4 text-xs font-bold text-emerald-950"
                    >
                      Jelajahi villa
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-white/6 px-4 py-3 text-xs">
                  <span className="text-white/42">Brand</span>
                  <strong>{settings.siteName}</strong>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </AdminPageShell>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Building2;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold transition",
        active
          ? "bg-emerald-700 text-white"
          : "text-emerald-950/48 hover:bg-emerald-950/5 dark:text-white/45 dark:hover:bg-white/6",
      )}
    >
      <Icon className="size-3.5" /> {label}
    </button>
  );
}

function Field({
  label,
  value,
  type = "text",
  icon: Icon,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  icon?: typeof Mail;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold opacity-45">{label}</span>
      <span className="relative block">
        {Icon ? (
          <Icon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 opacity-35" />
        ) : null}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "h-11 w-full rounded-xl border border-emerald-950/10 bg-white/72 px-3 text-sm outline-none transition focus:border-emerald-600 dark:border-white/10 dark:bg-[#10231e]",
            Icon && "pl-10",
          )}
        />
      </span>
    </label>
  );
}

function TextArea({
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
      <textarea
        value={value}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-none rounded-xl border border-emerald-950/10 bg-white/72 p-3 text-sm leading-6 outline-none transition focus:border-emerald-600 dark:border-white/10 dark:bg-[#10231e]"
      />
    </label>
  );
}

function CharacterCount({
  value,
  recommended,
}: {
  value: string;
  recommended: number;
}) {
  return (
    <p
      className={cn(
        "mt-1.5 text-right text-[0.62rem]",
        value.length > recommended
          ? "text-rose-600 dark:text-rose-300"
          : "opacity-38",
      )}
    >
      {value.length}/{recommended} karakter
    </p>
  );
}
