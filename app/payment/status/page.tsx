"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  FileCheck2,
  Home,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { InvoiceDownloadButton } from "@/components/invoice-download-button";
import { PaymentStatusBadge, type PaymentStatusTone } from "@/components/payment-status-badge";
import { Button } from "@/components/ui/button";
import {
  bookingDraftStorageKey,
  manualPaymentConfirmationStorageKey,
  paymentDraftStorageKey,
  type BookingDraft,
  type ManualPaymentConfirmation,
  type PaymentDraft,
} from "@/lib/booking-draft";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/villa-data";

export default function PaymentStatusPage() {
  const [bookingDraft, setBookingDraft] = useState<BookingDraft | null>(null);
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft | null>(null);
  const [manualConfirmation, setManualConfirmation] =
    useState<ManualPaymentConfirmation | null>(null);
  const [loaded, setLoaded] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    try {
      const rawBooking = window.sessionStorage.getItem(bookingDraftStorageKey);
      const rawPayment = window.sessionStorage.getItem(paymentDraftStorageKey);
      const rawManual = window.sessionStorage.getItem(manualPaymentConfirmationStorageKey);
      setBookingDraft(rawBooking ? (JSON.parse(rawBooking) as BookingDraft) : null);
      setPaymentDraft(rawPayment ? (JSON.parse(rawPayment) as PaymentDraft) : null);
      setManualConfirmation(
        rawManual ? (JSON.parse(rawManual) as ManualPaymentConfirmation) : null,
      );
    } catch {
      setBookingDraft(null);
      setPaymentDraft(null);
      setManualConfirmation(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  const status = useMemo(() => {
    if (manualConfirmation) {
      return {
        title: "Menunggu verifikasi admin",
        description: "Bukti transfer manual sudah diterima sebagai mock dan siap ditinjau.",
        tone: "waiting" as const,
        amount: manualConfirmation.amount,
      };
    }

    if (paymentDraft) {
      return {
        title: "Metode pembayaran dipilih",
        description: "Sesi pembayaran gateway/mock sudah dibuat, lanjutkan proses gateway berikutnya.",
        tone: "active" as const,
        amount: paymentDraft.amount,
      };
    }

    if (bookingDraft) {
      return {
        title: "Menunggu metode pembayaran",
        description: "Booking draft sudah ada, tetapi metode pembayaran belum dipilih.",
        tone: "draft" as const,
        amount: bookingDraft.pricing.deposit,
      };
    }

    return null;
  }, [bookingDraft, manualConfirmation, paymentDraft]);

  if (!loaded) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
        <div className="w-full max-w-4xl animate-pulse space-y-4 rounded-[2rem] border border-emerald-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
          <div className="h-8 w-56 rounded-full bg-emerald-900/10 dark:bg-white/10" />
          <div className="h-48 rounded-[1.5rem] bg-emerald-900/10 dark:bg-white/10" />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="h-24 rounded-[1.25rem] bg-emerald-900/10 dark:bg-white/10" />
            <div className="h-24 rounded-[1.25rem] bg-emerald-900/10 dark:bg-white/10" />
            <div className="h-24 rounded-[1.25rem] bg-emerald-900/10 dark:bg-white/10" />
          </div>
        </div>
      </main>
    );
  }

  if (!bookingDraft || !status) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
        <div className="max-w-lg rounded-[2rem] border border-emerald-900/10 bg-white/76 p-8 text-center shadow-[0_24px_80px_rgba(4,34,28,0.1)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-900/5 text-emerald-700 dark:bg-white/10 dark:text-amber-200">
            <ReceiptText className="size-6" />
          </div>
          <h1 className="mt-5 font-serif text-3xl text-emerald-950 dark:text-white">
            Status belum tersedia
          </h1>
          <p className="mt-3 text-sm leading-6 text-emerald-950/62 dark:text-white/58">
            Buat booking dan pilih metode pembayaran untuk melihat status.
          </p>
          <Button asChild className="mt-6">
            <Link href="/villas">Pilih villa</Link>
          </Button>
        </div>
      </main>
    );
  }

  const steps = [
    {
      label: "Booking dibuat",
      description: bookingDraft.id,
      complete: true,
      icon: ReceiptText,
    },
    {
      label: "Metode pembayaran",
      description: paymentDraft?.method.title ?? "Belum dipilih",
      complete: Boolean(paymentDraft),
      icon: CreditCard,
    },
    {
      label: "Bukti/redirect",
      description: manualConfirmation
        ? manualConfirmation.proofFile?.name ?? "Bukti transfer tersimpan"
        : paymentDraft
          ? "Gateway mock disiapkan"
          : "Menunggu",
      complete: Boolean(manualConfirmation || paymentDraft),
      icon: FileCheck2,
    },
    {
      label: "Review pembayaran",
      description: manualConfirmation ? "Menunggu admin" : "Belum dimulai",
      complete: Boolean(manualConfirmation),
      icon: ShieldCheck,
    },
  ];
  const badgeStatus: PaymentStatusTone = manualConfirmation
    ? "waiting-review"
    : paymentDraft
      ? "method-selected"
      : "draft";

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative px-4 pb-16 pt-5 sm:px-6 lg:px-8">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(247,217,140,0.34),transparent_28rem),radial-gradient(circle_at_86%_12%,rgba(4,120,87,0.18),transparent_32rem)]"
        />
        <div className="container relative z-10 mx-auto max-w-7xl">
          <header className="flex items-center justify-between rounded-full border border-emerald-900/10 bg-white/62 px-4 py-3 shadow-[0_18px_70px_rgba(4,34,28,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/6">
            <Button asChild variant="ghost">
              <Link href="/payment">
                <ArrowLeft />
                Pembayaran
              </Link>
            </Button>
            <PaymentStatusBadge status={badgeStatus} />
          </header>

          <motion.div
            className="grid gap-10 pb-8 pt-14 lg:grid-cols-[1fr_25rem] lg:items-start"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.68, ease: "easeOut" }}
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/62 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-950/60 backdrop-blur-xl dark:border-white/10 dark:bg-white/8 dark:text-white/62">
                <Wallet className="size-4 text-amber-600 dark:text-amber-200" />
                Status pembayaran
              </div>
              <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight text-emerald-950 dark:text-white sm:text-6xl">
                {status.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-950/62 dark:text-white/58">
                {status.description}
              </p>

              <div className="mt-8 rounded-[2rem] border border-emerald-900/10 bg-white/70 p-5 shadow-[0_24px_80px_rgba(4,34,28,0.1)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
                <div className="grid gap-4 md:grid-cols-2">
                  {steps.map((step, index) => {
                    const StepIcon = step.icon;

                    return (
                      <div
                        key={step.label}
                        className={cn(
                          "rounded-[1.5rem] border p-4",
                          step.complete
                            ? "border-emerald-600/20 bg-emerald-600/10"
                            : "border-emerald-900/10 bg-white/56 dark:border-white/10 dark:bg-white/6",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "grid size-10 shrink-0 place-items-center rounded-full",
                              step.complete
                                ? "bg-emerald-700 text-white"
                                : "bg-emerald-900/5 text-emerald-950/42 dark:bg-white/10 dark:text-white/42",
                            )}
                          >
                            <StepIcon className="size-5" />
                          </span>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-950/42 dark:text-white/38">
                              Step {index + 1}
                            </p>
                            <h2 className="mt-1 font-semibold text-emerald-950 dark:text-white">
                              {step.label}
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-emerald-950/56 dark:text-white/50">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-emerald-900/10 bg-white/76 p-5 shadow-[0_24px_80px_rgba(4,34,28,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-950/42 dark:text-white/38">
                Payment summary
              </p>
              <h3 className="mt-2 font-serif text-3xl text-emerald-950 dark:text-white">
                {formatRupiah(status.amount)}
              </h3>
              <div className="mt-5 space-y-1 rounded-[1.5rem] bg-emerald-900/5 p-4 dark:bg-white/8">
                <SummaryRow label="Booking" value={bookingDraft.id} />
                <SummaryRow label="Villa" value={bookingDraft.villa.name} />
                <SummaryRow label="Tanggal" value={`${formatDate(bookingDraft.stay.checkIn)} - ${formatDate(bookingDraft.stay.checkOut)}`} />
                <SummaryRow label="Metode" value={paymentDraft?.method.title ?? "Belum dipilih"} />
                {manualConfirmation ? (
                  <SummaryRow label="Konfirmasi" value={manualConfirmation.id} />
                ) : null}
              </div>

              <div className="mt-5 grid gap-3">
                <InvoiceDownloadButton
                  booking={bookingDraft}
                  payment={paymentDraft}
                  manualConfirmation={manualConfirmation}
                />
                {paymentDraft ? (
                  <Button asChild variant="outline">
                    <Link href={manualConfirmation ? "/payment/manual" : "/payment"}>
                      {manualConfirmation ? "Lihat konfirmasi" : "Ubah metode"}
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="gold">
                    <Link href="/payment">Pilih metode pembayaran</Link>
                  </Button>
                )}
                <Button asChild variant="ghost">
                  <Link href="/">
                    <Home />
                    Kembali ke beranda
                  </Link>
                </Button>
              </div>
            </aside>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm text-emerald-950/62 dark:text-white/58">
      <span>{label}</span>
      <strong className="max-w-44 text-right font-semibold text-emerald-950 dark:text-white">
        {value}
      </strong>
    </div>
  );
}

function formatDate(value: string) {
  const date = parseDateOnly(value);
  if (!date) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}
