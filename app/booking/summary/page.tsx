"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Gift,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { bookingDraftStorageKey, type BookingDraft } from "@/lib/booking-draft";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/villa-data";

export default function BookingSummaryPage() {
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    try {
      const rawDraft = window.sessionStorage.getItem(bookingDraftStorageKey);
      setDraft(rawDraft ? (JSON.parse(rawDraft) as BookingDraft) : null);
    } catch {
      setDraft(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  const stayLabel = useMemo(() => {
    if (!draft) return "";
    return `${formatDisplayDate(draft.stay.checkIn)} - ${formatDisplayDate(draft.stay.checkOut)}`;
  }, [draft]);

  if (!loaded) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
        <div className="w-full max-w-4xl animate-pulse space-y-4 rounded-[2rem] border border-emerald-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
          <div className="h-8 w-48 rounded-full bg-emerald-900/10 dark:bg-white/10" />
          <div className="h-44 rounded-[1.5rem] bg-emerald-900/10 dark:bg-white/10" />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="h-24 rounded-[1.25rem] bg-emerald-900/10 dark:bg-white/10" />
            <div className="h-24 rounded-[1.25rem] bg-emerald-900/10 dark:bg-white/10" />
            <div className="h-24 rounded-[1.25rem] bg-emerald-900/10 dark:bg-white/10" />
          </div>
        </div>
      </main>
    );
  }

  if (!draft) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
        <div className="max-w-lg rounded-[2rem] border border-emerald-900/10 bg-white/76 p-8 text-center shadow-[0_24px_80px_rgba(4,34,28,0.1)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-900/5 text-emerald-700 dark:bg-white/10 dark:text-amber-200">
            <ReceiptText className="size-6" />
          </div>
          <h1 className="mt-5 font-serif text-3xl text-emerald-950 dark:text-white">
            Ringkasan belum tersedia
          </h1>
          <p className="mt-3 text-sm leading-6 text-emerald-950/62 dark:text-white/58">
            Isi form booking dari halaman detail villa dulu, lalu ringkasan pesanan akan muncul di sini.
          </p>
          <Button asChild className="mt-6">
            <Link href="/villas">Pilih villa</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative px-4 pb-16 pt-5 sm:px-6 lg:px-8">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(247,217,140,0.34),transparent_28rem),radial-gradient(circle_at_88%_8%,rgba(4,120,87,0.18),transparent_32rem),linear-gradient(140deg,transparent,rgba(245,239,227,0.65),transparent)]"
        />
        <div className="container relative z-10 mx-auto max-w-7xl">
          <header className="flex items-center justify-between rounded-full border border-emerald-900/10 bg-white/62 px-4 py-3 shadow-[0_18px_70px_rgba(4,34,28,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/6">
            <Button asChild variant="ghost">
              <Link href={`/villas/${draft.villa.id}`}>
                <ArrowLeft />
                Edit booking
              </Link>
            </Button>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white">
              <CheckCircle2 className="size-4" />
              Draft siap
            </span>
          </header>

          <motion.div
            className="grid gap-10 pb-8 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-end"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.68, ease: "easeOut" }}
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/62 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-950/60 backdrop-blur-xl dark:border-white/10 dark:bg-white/8 dark:text-white/62">
                <ReceiptText className="size-4 text-amber-600 dark:text-amber-200" />
                Ringkasan pesanan
              </div>
              <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight text-emerald-950 dark:text-white sm:text-6xl">
                Review detail booking sebelum checkout.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-950/62 dark:text-white/58">
                Semua data diambil dari state form terakhir: tanggal, jumlah tamu, data pemesan, add-on, kupon, dan estimasi harga.
              </p>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-white/12 bg-emerald-950 text-white shadow-[0_28px_100px_rgba(4,34,28,0.24)]">
              <div className="relative h-72">
                <img
                  src={draft.villa.image}
                  alt={draft.villa.name}
                  className="h-full w-full object-cover opacity-80"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-100/80">
                    {draft.id}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl">{draft.villa.name}</h2>
                  <p className="mt-2 flex items-center gap-2 text-sm text-white/72">
                    <MapPin className="size-4 text-amber-200" />
                    {draft.villa.location} · {draft.villa.area}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[1fr_25rem]">
            <div className="space-y-6">
              <section className="grid gap-3 sm:grid-cols-3">
                <SummaryStat icon={CalendarDays} label="Tanggal" value={stayLabel} />
                <SummaryStat icon={Users} label="Tamu" value={`${draft.stay.guests} tamu`} />
                <SummaryStat icon={Sparkles} label="Durasi" value={`${draft.stay.nights} malam`} />
              </section>

              <section className="grid gap-6 md:grid-cols-2">
                <SummaryCard title="Data pemesan" icon={UserRound}>
                  <InfoLine icon={UserRound} label="Nama" value={draft.guest.name || "Belum diisi"} />
                  <InfoLine icon={Mail} label="Email" value={draft.guest.email || "Belum diisi"} />
                  <InfoLine icon={Phone} label="WhatsApp" value={draft.guest.phone || "Belum diisi"} />
                </SummaryCard>

                <SummaryCard title="Detail menginap" icon={CalendarDays}>
                  <InfoLine icon={CalendarDays} label="Check-in" value={formatDisplayDate(draft.stay.checkIn)} />
                  <InfoLine icon={CalendarDays} label="Check-out" value={formatDisplayDate(draft.stay.checkOut)} />
                  <InfoLine icon={Users} label="Kapasitas dipilih" value={`${draft.stay.guests} tamu`} />
                </SummaryCard>
              </section>

              <SummaryCard title="Add-on layanan" icon={Sparkles}>
                {draft.addOns.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {draft.addOns.map((addOn) => (
                      <div
                        key={addOn.id}
                        className="rounded-[1.25rem] border border-emerald-900/10 bg-white/56 p-4 dark:border-white/10 dark:bg-white/6"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-emerald-950 dark:text-white">{addOn.label}</p>
                            <p className="mt-1 text-xs leading-5 text-emerald-950/52 dark:text-white/48">
                              {addOn.description}
                            </p>
                          </div>
                          <strong className="shrink-0 text-sm text-emerald-950 dark:text-white">
                            {formatRupiah(addOn.price)}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-emerald-950/58 dark:text-white/52">
                    Tidak ada add-on yang dipilih.
                  </p>
                )}
              </SummaryCard>

              <SummaryCard title="Kupon" icon={Gift}>
                <div
                  className={cn(
                    "rounded-[1.25rem] border p-4",
                    draft.promo.status === "applied"
                      ? "border-emerald-600/20 bg-emerald-600/10"
                      : "border-emerald-900/10 bg-white/56 dark:border-white/10 dark:bg-white/6",
                  )}
                >
                  <p className="font-semibold text-emerald-950 dark:text-white">
                    {draft.promo.code || "Tanpa kupon"}
                  </p>
                  <p className="mt-1 text-sm text-emerald-950/58 dark:text-white/52">
                    {draft.promo.status === "applied"
                      ? `${draft.promo.label} berhasil diterapkan.`
                      : "Belum ada diskon aktif untuk draft ini."}
                  </p>
                </div>
              </SummaryCard>
            </div>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-[2rem] border border-emerald-900/10 bg-white/72 p-5 shadow-[0_24px_80px_rgba(4,34,28,0.1)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-950/42 dark:text-white/38">
                      Estimasi final
                    </p>
                    <h3 className="mt-2 font-serif text-3xl text-emerald-950 dark:text-white">
                      {formatRupiah(draft.pricing.total)}
                    </h3>
                  </div>
                  <div className="grid size-12 place-items-center rounded-full bg-amber-200/55 text-emerald-950 dark:bg-amber-200/18 dark:text-amber-100">
                    <CreditCard className="size-5" />
                  </div>
                </div>

                <div className="mt-5 space-y-1 rounded-[1.5rem] bg-emerald-900/5 p-4 dark:bg-white/8">
                  <SummaryRow label="Subtotal villa" value={formatRupiah(draft.pricing.subtotal)} />
                  {draft.pricing.guestService > 0 ? (
                    <SummaryRow label="Tamu tambahan" value={formatRupiah(draft.pricing.guestService)} />
                  ) : null}
                  <SummaryRow label="Add-on layanan" value={formatRupiah(draft.pricing.addOnsTotal)} />
                  <SummaryRow
                    label="Diskon kupon"
                    value={draft.pricing.discount > 0 ? `-${formatRupiah(draft.pricing.discount)}` : "-"}
                    tone={draft.pricing.discount > 0 ? "discount" : "muted"}
                  />
                  <div className="my-2 border-t border-emerald-900/10 dark:border-white/10" />
                  <SummaryRow label="Dasar pajak" value={formatRupiah(draft.pricing.taxableAmount)} />
                  <SummaryRow label="Service 5%" value={formatRupiah(draft.pricing.service)} />
                  <SummaryRow label="Pajak 11%" value={formatRupiah(draft.pricing.tax)} />
                </div>

                <div className="mt-4 rounded-[1.5rem] border border-emerald-900/10 bg-white/64 p-4 dark:border-white/10 dark:bg-white/8">
                  <SummaryRow label="Deposit 30%" value={formatRupiah(draft.pricing.deposit)} />
                  <SummaryRow label="Sisa saat check-in" value={formatRupiah(draft.pricing.remaining)} />
                </div>

                <div className="mt-4 rounded-[1.4rem] border border-amber-300/35 bg-amber-100/45 p-4 text-sm leading-6 text-emerald-950/70 dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-white/68">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-200" />
                    <p>
                      Ini masih ringkasan frontend mock. Konfirmasi booking, invoice, dan pembayaran akan disambungkan di task berikutnya.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <Button asChild className="w-full" variant="gold" size="lg">
                    <Link href="/payment">
                      <CreditCard />
                      Pilih metode pembayaran
                    </Link>
                  </Button>
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/villas/${draft.villa.id}`}>Ubah detail booking</Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function SummaryCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-emerald-900/10 bg-white/68 p-5 shadow-[0_18px_70px_rgba(4,34,28,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-emerald-900/5 text-emerald-700 dark:bg-white/10 dark:text-amber-200">
          <Icon className="size-5" />
        </span>
        <h2 className="font-serif text-2xl text-emerald-950 dark:text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-emerald-900/10 bg-white/68 p-4 shadow-[0_18px_60px_rgba(4,34,28,0.07)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
      <Icon className="size-5 text-amber-600 dark:text-amber-200" />
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-emerald-950/42 dark:text-white/38">
        {label}
      </p>
      <p className="mt-1 font-semibold text-emerald-950 dark:text-white">{value}</p>
    </div>
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-emerald-900/8 py-3 last:border-0 dark:border-white/10">
      <Icon className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-amber-200" />
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-emerald-950/42 dark:text-white/38">{label}</p>
        <p className="mt-1 text-sm font-semibold text-emerald-950 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "discount" | "muted";
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm text-emerald-950/62 dark:text-white/58">
      <span>{label}</span>
      <strong
        className={cn(
          "text-right font-semibold",
          tone === "discount"
            ? "text-emerald-700 dark:text-emerald-200"
            : tone === "muted"
              ? "text-emerald-950/52 dark:text-white/48"
              : "text-emerald-950 dark:text-white",
        )}
      >
        {value}
      </strong>
    </div>
  );
}

function formatDisplayDate(value: string) {
  const date = parseDateOnly(value);
  if (!date) return value || "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}
