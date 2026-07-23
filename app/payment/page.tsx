"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  MapPin,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PaymentContinueButton } from "@/components/payment-continue-button";
import { PaymentGatewayRedirect } from "@/components/payment-gateway-redirect";
import { PaymentMethodList } from "@/components/payment-method-list";
import { PaymentOrderSummary } from "@/components/payment-order-summary";
import { Button } from "@/components/ui/button";
import {
  bookingDraftStorageKey,
  paymentDraftStorageKey,
  paymentMethods,
  type BookingDraft,
} from "@/lib/booking-draft";

export default function PaymentMethodPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState(paymentMethods[0]?.id ?? "");
  const [gatewayMethodId, setGatewayMethodId] = useState("");
  const [toast, setToast] = useState("");
  const [savingMethod, setSavingMethod] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    try {
      const rawDraft = window.sessionStorage.getItem(bookingDraftStorageKey);
      const storedDraft = rawDraft ? (JSON.parse(rawDraft) as BookingDraft) : null;
      setDraft(storedDraft);
      const preferredMethod = storedDraft?.checkout?.paymentMethodId;
      if (preferredMethod && paymentMethods.some((method) => method.id === preferredMethod)) {
        setSelectedMethodId(preferredMethod);
      }
    } catch {
      setDraft(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  const selectedMethod = useMemo(
    () => paymentMethods.find((method) => method.id === selectedMethodId) ?? paymentMethods[0],
    [selectedMethodId],
  );
  const gatewayMethod = useMemo(
    () => paymentMethods.find((method) => method.id === gatewayMethodId) ?? null,
    [gatewayMethodId],
  );
  const paymentSummary = useMemo(() => {
    const deposit = draft?.pricing.deposit ?? 0;
    const fee = selectedMethod?.fee ?? 0;

    return {
      deposit,
      fee,
      total: deposit + fee,
    };
  }, [draft, selectedMethod]);

  const showToast = (message: string, duration = 2800) => {
    setToast(message);
    window.setTimeout(() => setToast(""), duration);
  };

  const savePaymentMethod = async () => {
    if (!draft || !selectedMethod || savingMethod) return;

    setSavingMethod(true);
    try {
      const response = await fetch(
        `/api/bookings/${encodeURIComponent(draft.id)}/payment-method`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ methodId: selectedMethod.id }),
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;
      if (!response.ok) {
        showToast(payload?.message || "Metode pembayaran gagal disimpan.", 3400);
        return;
      }

      window.sessionStorage.setItem(
        paymentDraftStorageKey,
        JSON.stringify({
          bookingId: draft.id,
          method: selectedMethod,
          amount: paymentSummary.total,
          deposit: paymentSummary.deposit,
          fee: paymentSummary.fee,
          status: "method-selected",
          createdAt: new Date().toISOString(),
        }),
      );
      if (selectedMethod.id === "bank-transfer") {
        showToast("Metode transfer manual dipilih. Membuka halaman konfirmasi...", 2600);
        window.setTimeout(() => router.push("/payment/manual"), 520);
        return;
      }

      setGatewayMethodId(selectedMethod.id);
    } finally {
      setSavingMethod(false);
    }
  };

  if (!loaded) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
        <div className="w-full max-w-5xl animate-pulse rounded-[2rem] border border-emerald-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
          <div className="h-8 w-56 rounded-full bg-emerald-900/10 dark:bg-white/10" />
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_22rem]">
            <div className="grid gap-3">
              <div className="h-28 rounded-[1.5rem] bg-emerald-900/10 dark:bg-white/10" />
              <div className="h-28 rounded-[1.5rem] bg-emerald-900/10 dark:bg-white/10" />
              <div className="h-28 rounded-[1.5rem] bg-emerald-900/10 dark:bg-white/10" />
            </div>
            <div className="h-80 rounded-[1.5rem] bg-emerald-900/10 dark:bg-white/10" />
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
            <Wallet className="size-6" />
          </div>
          <h1 className="mt-5 font-serif text-3xl text-emerald-950 dark:text-white">
            Belum ada pesanan
          </h1>
          <p className="mt-3 text-sm leading-6 text-emerald-950/62 dark:text-white/58">
            Pilih villa dan buat ringkasan pesanan terlebih dulu sebelum memilih metode pembayaran.
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
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(247,217,140,0.34),transparent_28rem),radial-gradient(circle_at_86%_12%,rgba(4,120,87,0.18),transparent_32rem)]"
        />
        <div className="container relative z-10 mx-auto max-w-7xl">
          <header className="flex items-center justify-between rounded-full border border-emerald-900/10 bg-white/62 px-4 py-3 shadow-[0_18px_70px_rgba(4,34,28,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/6">
            <Button asChild variant="ghost">
              <Link href="/booking/summary">
                <ArrowLeft />
                Ringkasan
              </Link>
            </Button>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white">
              <ShieldCheck className="size-4" />
              Secure mock
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
                <CreditCard className="size-4 text-amber-600 dark:text-amber-200" />
                Pembayaran online
              </div>
              <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight text-emerald-950 dark:text-white sm:text-6xl">
                Pilih metode pembayaran deposit.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-950/62 dark:text-white/58">
                Pilihan pembayaran masih menggunakan data tiruan, tetapi alurnya sudah siap disambungkan ke gateway seperti Midtrans, Stripe, atau transfer manual.
              </p>
            </div>

            <div className="rounded-[2rem] border border-emerald-900/10 bg-white/72 p-5 shadow-[0_24px_80px_rgba(4,34,28,0.1)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-950/42 dark:text-white/38">
                Pesanan
              </p>
              <h2 className="mt-2 font-serif text-3xl text-emerald-950 dark:text-white">
                {draft.villa.name}
              </h2>
              <div className="mt-4 grid gap-3 text-sm text-emerald-950/62 dark:text-white/58 sm:grid-cols-3">
                <MiniInfo icon={MapPin} label={draft.villa.area} />
                <MiniInfo icon={CalendarDays} label={`${draft.stay.nights} malam`} />
                <MiniInfo icon={Users} label={`${draft.stay.guests} tamu`} />
              </div>
            </div>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[1fr_25rem]">
            <PaymentMethodList
              methods={paymentMethods}
              selectedMethodId={selectedMethodId}
              onSelect={setSelectedMethodId}
            />

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <PaymentOrderSummary
                booking={draft}
                methodTitle={selectedMethod?.title}
                fee={paymentSummary.fee}
                payableAmount={paymentSummary.total}
                title="Payable now"
                badge="Payment"
              >
                <div className="mt-4 rounded-[1.4rem] border border-amber-300/35 bg-amber-100/45 p-4 text-sm leading-6 text-emerald-950/70 dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-white/68">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-200" />
                    <p>
                      Metode ini belum memproses uang sungguhan. Integrasi gateway akan dikerjakan pada task backend/payment berikutnya.
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <PaymentContinueButton
                    method={selectedMethod}
                    amount={paymentSummary.total}
                    onContinue={() => void savePaymentMethod()}
                  />
                  {savingMethod ? (
                    <p className="mt-2 text-center text-xs text-emerald-700 dark:text-emerald-300">
                      Menyimpan metode pembayaran...
                    </p>
                  ) : null}
                </div>
                <Button asChild className="mt-3 w-full" variant="outline">
                  <Link href="/booking/summary">Kembali ke ringkasan</Link>
                </Button>
              </PaymentOrderSummary>
            </aside>
          </div>
        </div>
      </section>

      <PaymentGatewayRedirect
        open={Boolean(gatewayMethod)}
        method={gatewayMethod}
        amount={paymentSummary.total}
        onCancel={() => setGatewayMethodId("")}
        onDone={() => {
          setGatewayMethodId("");
          showToast("Simulasi gateway selesai. Membuka status pembayaran...", 2400);
          window.setTimeout(() => router.push("/payment/status"), 520);
        }}
      />
      <Toast message={toast} />
    </main>
  );
}

function MiniInfo({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-emerald-900/5 p-3 dark:bg-white/8">
      <Icon className="size-4 text-amber-600 dark:text-amber-200" />
      <span>{label}</span>
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2 rounded-2xl border border-emerald-900/10 bg-white/90 p-4 text-emerald-950 shadow-[0_24px_80px_rgba(4,34,28,0.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-emerald-950/88 dark:text-white"
          initial={{ opacity: 0, y: 26, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          role="status"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-700 text-white">
              <CheckCircle2 className="size-5" />
            </span>
            <p className="text-sm leading-6">{message}</p>
            <X className="ml-auto size-4 opacity-50" />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
