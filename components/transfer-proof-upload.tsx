"use client";

import { CheckCircle2, FileText, FileUp, ImageIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type TransferProofFile = {
  name: string;
  size: number;
  type: string;
};

const maxFileSize = 5 * 1024 * 1024;
const acceptedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function TransferProofUpload({
  value,
  onChange,
}: {
  value: TransferProofFile | null;
  onChange: (file: TransferProofFile | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const processFile = (file: File | undefined) => {
    if (!file) return;

    if (!acceptedMimeTypes.includes(file.type)) {
      setError("Format harus JPG, PNG, WEBP, atau PDF.");
      onChange(null);
      return;
    }

    if (file.size > maxFileSize) {
      setError("Ukuran maksimal bukti transfer adalah 5MB.");
      onChange(null);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setError("");
    setPreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : "");
    onChange({
      name: file.name,
      size: file.size,
      type: file.type,
    });
  };

  const removeFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setError("");
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          processFile(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative flex min-h-52 w-full flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed p-5 text-center transition-all duration-300",
          dragActive
            ? "border-emerald-600 bg-emerald-600/10"
            : value
              ? "border-emerald-600/35 bg-emerald-600/10"
              : "border-emerald-900/15 bg-white/58 hover:-translate-y-0.5 hover:bg-white dark:border-white/15 dark:bg-white/6 dark:hover:bg-white/10",
        )}
        aria-label="Upload bukti transfer"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview bukti transfer"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        {previewUrl ? <span className="absolute inset-0 bg-emerald-950/55" /> : null}
        <span className="relative z-10 grid size-14 place-items-center rounded-full bg-emerald-700 text-white shadow-[0_18px_50px_rgba(4,120,87,0.28)]">
          {value ? (
            value.type === "application/pdf" ? (
              <FileText className="size-6" />
            ) : (
              <ImageIcon className="size-6" />
            )
          ) : (
            <FileUp className="size-6" />
          )}
        </span>
        <span className="relative z-10 mt-4 max-w-sm">
          <span className={cn("block font-semibold", previewUrl ? "text-white" : "text-emerald-950 dark:text-white")}>
            {value ? value.name : "Upload bukti transfer"}
          </span>
          <span className={cn("mt-2 block text-sm leading-6", previewUrl ? "text-white/76" : "text-emerald-950/58 dark:text-white/52")}>
            {value
              ? `${formatFileSize(value.size)} · ${value.type === "application/pdf" ? "PDF" : "Image"}`
              : "Klik atau drag file JPG, PNG, WEBP, atau PDF maksimal 5MB."}
          </span>
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only"
        onChange={(event) => processFile(event.target.files?.[0])}
      />

      <div className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-900/5 px-4 py-3 text-sm dark:bg-white/8">
        <span className="flex items-center gap-2 text-emerald-950/62 dark:text-white/58">
          <CheckCircle2 className={cn("size-4", value ? "text-emerald-700 dark:text-emerald-200" : "opacity-35")} />
          {value ? "File siap dikirim sebagai bukti mock." : "Belum ada file dipilih."}
        </span>
        {value ? (
          <button
            type="button"
            onClick={removeFile}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:text-rose-200 dark:hover:bg-rose-300/10"
          >
            <X className="size-3.5" />
            Hapus
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-2xl border border-amber-300/35 bg-amber-100/45 p-3 text-sm leading-6 text-emerald-950/70 dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-white/68">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024)).toLocaleString("id-ID")} KB`;
}
