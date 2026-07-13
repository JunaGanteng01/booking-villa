"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  GripVertical,
  ImagePlus,
  Pencil,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { useAppNotifications } from "@/components/notification-root";
import { cn } from "@/lib/utils";

type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  isCover: boolean;
  uploading?: boolean;
};

const supportingImages = [
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1600607688960-e095ff83135c?auto=format&fit=crop&w=1000&q=82",
];

function createInitialImages(coverUrl: string): GalleryImage[] {
  return [
    { id: "cover", url: coverUrl, alt: "Tampilan utama villa", isCover: true },
    ...supportingImages.map((url, index) => ({
      id: `gallery-${index + 1}`,
      url,
      alt: ["Area kolam renang", "Ruang keluarga", "Kamar tidur utama", "Area bersantai"][index],
      isCover: false,
    })),
  ];
}

export function VillaGalleryManager({
  coverUrl,
  onCoverChange,
}: {
  coverUrl: string;
  onCoverChange: (url: string) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<GalleryImage[]>(() => createInitialImages(coverUrl));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const addFiles = async (files: File[]) => {
    const validFiles = files.filter((file) => file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024);
    if (!validFiles.length) {
      notify({
        title: "Foto tidak dapat ditambahkan",
        description: "Gunakan JPG, PNG, atau WebP dengan ukuran maksimal 10 MB.",
        variant: "warning",
      });
      return;
    }

    const availableSlots = Math.max(0, 10 - images.length);
    const selectedFiles = validFiles.slice(0, availableSlots);
    if (!selectedFiles.length) {
      notify({ title: "Galeri sudah penuh", description: "Maksimal 10 foto per villa.", variant: "warning" });
      return;
    }

    const uploaded = await Promise.all(
      selectedFiles.map(
        (file) =>
          new Promise<GalleryImage>((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                id: `upload-${Date.now()}-${file.name}`,
                url: String(reader.result),
                alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
                isCover: false,
                uploading: true,
              });
            reader.readAsDataURL(file);
          }),
      ),
    );

    setImages((items) => [...items, ...uploaded]);
    window.setTimeout(() => {
      setImages((items) => items.map((image) => ({ ...image, uploading: false })));
      notify({
        title: `${uploaded.length} foto ditambahkan`,
        description: "Preview lokal siap. Upload ke Cloudinary akan dilakukan oleh backend.",
        variant: "success",
      });
    }, 700);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    void addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleFileDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
    void addFiles(Array.from(event.dataTransfer.files));
  };

  const setCover = (id: string) => {
    const selected = images.find((image) => image.id === id);
    if (!selected) return;
    setImages((items) => items.map((image) => ({ ...image, isCover: image.id === id })));
    onCoverChange(selected.url);
    notify({ title: "Foto cover diperbarui", description: "Foto ini akan tampil pertama di katalog.", variant: "success" });
  };

  const removeImage = (id: string) => {
    const selected = images.find((image) => image.id === id);
    const remaining = images.filter((image) => image.id !== id);
    if (!remaining.length) return;

    if (selected?.isCover) {
      remaining[0] = { ...remaining[0], isCover: true };
      onCoverChange(remaining[0].url);
    }
    setImages(remaining);
    setEditingId(null);
  };

  const updateAlt = (id: string, alt: string) => {
    setImages((items) => items.map((image) => (image.id === id ? { ...image, alt } : image)));
  };

  const moveImage = (id: string, offset: -1 | 1) => {
    setImages((items) => {
      const currentIndex = items.findIndex((image) => image.id === id);
      const nextIndex = currentIndex + offset;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) return items;
      const next = [...items];
      [next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]];
      return next;
    });
  };

  const dropImage = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return setDraggingId(null);
    setImages((items) => {
      const from = items.findIndex((image) => image.id === draggingId);
      const to = items.findIndex((image) => image.id === targetId);
      if (from < 0 || to < 0) return items;
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggingId(null);
  };

  return (
    <div>
      <div
        onDragEnter={(event) => {
          if (event.dataTransfer.types.includes("Files")) setIsDraggingFile(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDraggingFile(false);
        }}
        onDrop={handleFileDrop}
        className={cn(
          "relative grid min-h-36 place-items-center overflow-hidden rounded-2xl border border-dashed px-5 py-6 text-center transition-all",
          isDraggingFile
            ? "border-emerald-500 bg-emerald-100/80 ring-4 ring-emerald-400/10 dark:bg-emerald-300/10"
            : "border-emerald-950/14 bg-emerald-50/45 hover:border-emerald-500/35 dark:border-white/12 dark:bg-white/[0.025]",
        )}
      >
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleInput} className="sr-only" />
        <div>
          <motion.span
            animate={isDraggingFile && !shouldReduceMotion ? { y: [0, -5, 0] } : undefined}
            transition={{ repeat: Infinity, duration: 1 }}
            className="mx-auto grid size-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200"
          >
            <UploadCloud className="size-5" />
          </motion.span>
          <p className="mt-3 text-sm font-semibold">Tarik foto ke sini atau pilih dari perangkat</p>
          <p className="mt-1 text-xs text-emerald-950/40 dark:text-white/38">JPG, PNG, WebP · maksimal 10 MB · hingga 10 foto</p>
          <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-full bg-emerald-700 px-4 text-xs font-bold text-white transition-transform hover:-translate-y-0.5">
            <ImagePlus className="size-3.5" /> Pilih foto
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Galeri villa</p>
          <p className="mt-0.5 text-xs text-emerald-950/38 dark:text-white/36">{images.length}/10 foto · tarik kartu untuk mengurutkan</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">Cover di urutan utama</span>
      </div>

      <motion.div layout className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <AnimatePresence initial={false}>
          {images.map((image, index) => (
            <motion.article
              layout
              key={image.id}
              draggable={!shouldReduceMotion}
              onDragStart={(event) => {
                const dragEvent = event as unknown as DragEvent<HTMLElement>;
                dragEvent.dataTransfer.effectAllowed = "move";
                setDraggingId(image.id);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                dropImage(image.id);
              }}
              onDragEnd={() => setDraggingId(null)}
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: draggingId === image.id ? 0.58 : 1, scale: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-emerald-950",
                image.isCover ? "border-amber-400 ring-2 ring-amber-300/25" : "border-emerald-950/8 dark:border-white/8",
              )}
            >
              <div className="relative aspect-[4/3]">
                <img src={image.url} alt={image.alt} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/82 via-emerald-950/5 to-emerald-950/16 opacity-85 transition-opacity group-hover:opacity-100" />
                {image.uploading ? (
                  <div className="absolute inset-0 grid place-items-center bg-emerald-950/55 backdrop-blur-sm">
                    <span className="text-center text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white"><UploadCloud className="mx-auto mb-2 size-5 animate-bounce" />Menyiapkan...</span>
                  </div>
                ) : null}
                <span className="absolute left-2.5 top-2.5 grid size-7 cursor-grab place-items-center rounded-lg bg-emerald-950/45 text-white/72 backdrop-blur active:cursor-grabbing"><GripVertical className="size-3.5" /></span>
                <span className="absolute right-2.5 top-2.5 rounded-full bg-emerald-950/45 px-2 py-1 text-[0.55rem] font-bold text-white/75 backdrop-blur">{index + 1}</span>
                {image.isCover ? <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-amber-300 px-2.5 py-1 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-emerald-950"><Star className="size-3 fill-current" /> Cover</span> : null}
                <div className="absolute bottom-2 right-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  {!image.isCover ? <button type="button" onClick={() => setCover(image.id)} className="grid size-8 place-items-center rounded-lg bg-white/92 text-amber-600 shadow-lg" aria-label={`Jadikan ${image.alt} sebagai cover`}><Star className="size-3.5" /></button> : null}
                  <button type="button" onClick={() => setEditingId((current) => (current === image.id ? null : image.id))} className="grid size-8 place-items-center rounded-lg bg-white/92 text-emerald-700 shadow-lg" aria-label={`Edit teks alternatif ${image.alt}`}><Pencil className="size-3.5" /></button>
                  {images.length > 1 ? <button type="button" onClick={() => removeImage(image.id)} className="grid size-8 place-items-center rounded-lg bg-white/92 text-rose-600 shadow-lg" aria-label={`Hapus ${image.alt}`}><Trash2 className="size-3.5" /></button> : null}
                </div>
              </div>

              <AnimatePresence>
                {editingId === image.id ? (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-[#fffdf8] dark:bg-[#10231e]">
                    <label className="block p-3"><span className="mb-1.5 flex items-center justify-between text-[0.62rem] font-bold text-emerald-950/48 dark:text-white/46"><span>Teks alternatif</span><button type="button" onClick={() => setEditingId(null)} aria-label="Tutup editor"><X className="size-3.5" /></button></span><input value={image.alt} onChange={(event) => updateAlt(image.id, event.target.value)} className="h-9 w-full rounded-lg border border-emerald-950/10 bg-white px-2.5 text-xs outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-white/6" /></label>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="flex items-center justify-between bg-[#fffdf8] px-2.5 py-2 dark:bg-[#10231e]">
                <p className="min-w-0 truncate text-[0.62rem] text-emerald-950/46 dark:text-white/44">{image.alt || "Tanpa teks alternatif"}</p>
                <div className="ml-2 flex shrink-0 gap-1">
                  <button type="button" disabled={index === 0} onClick={() => moveImage(image.id, -1)} className="grid size-6 place-items-center rounded-md text-emerald-950/38 hover:bg-emerald-950/5 disabled:opacity-20 dark:text-white/36 dark:hover:bg-white/6" aria-label={`Pindahkan ${image.alt} ke kiri`}><ArrowLeft className="size-3" /></button>
                  <button type="button" disabled={index === images.length - 1} onClick={() => moveImage(image.id, 1)} className="grid size-6 place-items-center rounded-md text-emerald-950/38 hover:bg-emerald-950/5 disabled:opacity-20 dark:text-white/36 dark:hover:bg-white/6" aria-label={`Pindahkan ${image.alt} ke kanan`}><ArrowRight className="size-3" /></button>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
