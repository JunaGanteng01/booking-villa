"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clipboard,
  FileUp,
  Landmark,
  ReceiptText,
  ShieldCheck,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { PaymentOrderSummary } from "@/components/payment-order-summary";
import { TransferProofUpload, type TransferProofFile } from "@/components/transfer-proof-upload";
import { Button } from "@/components/ui/button";
import {
  bookingDraftStorageKey,
  manualPaymentConfirmationStorageKey,
  manualTransferAccounts,
  paymentDraftStorageKey,
  paymentMethods,
  type BookingDraft,
  type ManualPaymentConfirmation,
  type PaymentDraft,
} from "@/lib/booking-draft";
import { formatRupiah } from "@/lib/villa-data";

export default function ManualPaymentConfirmationPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderBank, setSenderBank] = useState("");
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [proofFile, setProofFile] = useState<TransferProofFile | null>(null);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState("");
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    try {
      const rawDraft = window.sessionStorage.getItem(bookingDraftStorageKey);
      const rawPayment = window.sessionStorage.getItem(paymentDraftStorageKey);
      setDraft(rawDraft ? (JSON.parse(rawDraft) as BookingDraft) : null);
      setPaymentDraft(rawPayment ? (JSON.parse(rawPayment) as PaymentDraft) : null);
    } catch {
      setDraft(null);
      setPaymentDraft(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  const manualMethod = paymentMethods.find((method) => method.id === "bank-transfer") ?? paymentMethods[0];
  const payableAmount = paymentDraft?.amount ?? draft?.pricing.deposit ?? 0;
  const confirmationValid = useMemo(
    () =>
      senderName.trim().length >= 2 &&
      senderBank.trim().length >= 2 &&
      Boolean(transferDate) &&
      Boolean(proofFile),
    [proofFile, senderBank, senderName, transferDate],
  );

  const showToast = (message: string, duration = 2800) => {
    setToast(message);
    window.setTimeout(() => setToast(""), duration);
  };

  const copyAccount = async (accountNumber: string) => {
    try {
      await navigator.clipboard.writeText(accountNumber.replace(/\s/g, ""));
      showToast("Nomor rekening disalin.", 2200);
    } catch {
      showToast("Tidak bisa menyalin otomatis. Salin nomor rekening secara manual.", 2800);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft || !confirmationValid) {
      showToast("Lengkapi nama pengirim, bank asal, tanggal transfer, dan bukti pembayaran.", 3200);
      return;
    }

    const confirmation: ManualPaymentConfirmation = {
      id: `PAY-${Date.now().toString().slice(-6)}`,
      bookingId: draft.id,
      method: paymentDraft?.method ?? manualMethod,
      amount: payableAmount,
      senderName,
      senderBank,
      transferDate,
      proofFile,
      note,
      status: "waiting-review",
      createdAt: new Date().toISOString(),
    };

    window.sessionStorage.setItem(
      manualPaymentConfirmationStorageKey,
      JSON.stringify(confirmation),
    );
    showToast("Konfirmasi pembayaran manual tersimpan. Admin akan meninjau bukti mock ini.", 3600);
    window.setTimeout(() => router.push("/payment/status"), 620);
  };

  if (!loaded) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
        <div className="w-full max-w-5xl animate-pulse rounded-[2rem] border border-emerald-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
          <div className="h-8 w-56 rounded-full bg-emerald-900/10 dark:bg-white/10" />
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_22rem]">
            <div className="h-96 rounded-[1.5rem] bg-emerald-900/10 dark:bg-white/10" />
            <div className="h-96 rounded-[1.5rem] bg-emerald-900/10 dark:bg-white/10" />
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
            Konfirmasi belum bisa dibuat
          </h1>
          <p className="mt-3 text-sm leading-6 text-emerald-950/62 dark:text-white/58">
            Buat ringkasan pesanan dan pilih metode transfer manual terlebih dulu.
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
          className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(247,217,140,0.36),transparent_28rem),radial-gradient(circle_at_86%_12%,rgba(4,120,87,0.18),transparent_32rem)]"
        />
        <div className="container relative z-10 mx-auto max-w-7xl">
          <header className="flex items-center justify-between rounded-full border border-emerald-900/10 bg-white/62 px-4 py-3 shadow-[0_18px_70px_rgba(4,34,28,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/6">
            <Button asChild variant="ghost">
              <Link href="/payment">
                <ArrowLeft />
                Metode pembayaran
              </Link>
            </Button>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white">
              <Landmark className="size-4" />
              Manual transfer
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
                <Banknote className="size-4 text-amber-600 dark:text-amber-200" />
                Konfirmasi pembayaran
              </div>
              <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight text-emerald-950 dark:text-white sm:text-6xl">
                Upload bukti transfer manual.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-950/62 dark:text-white/58">
                Transfer deposit ke rekening VillaKu, lalu isi detail pengirim dan unggah bukti pembayaran. Semua masih tersimpan sebagai data tiruan frontend.
              </p>
            </div>

            <div className="rounded-[2rem] border border-emerald-900/10 bg-white/72 p-5 shadow-[0_24px_80px_rgba(4,34,28,0.1)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-950/42 dark:text-white/38">
                Amount to transfer
              </p>
              <h2 className="mt-2 font-serif text-4xl text-emerald-950 dark:text-white">
                {formatRupiah(payableAmount)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-emerald-950/58 dark:text-white/52">
                Booking {draft.id} · {draft.villa.name}
              </p>
            </div>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[1fr_25rem]">
            <div className="space-y-6">
              <section className="rounded-[2rem] border border-emerald-900/10 bg-white/68 p-5 shadow-[0_18px_70px_rgba(4,34,28,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-emerald-900/5 text-emerald-700 dark:bg-white/10 dark:text-amber-200">
                    <Landmark className="size-5" />
                  </span>
                  <h2 className="font-serif text-2xl text-emerald-950 dark:text-white">
                    Rekening tujuan
                  </h2>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {manualTransferAccounts.map((account) => (
                    <div
                      key={account.accountNumber}
                      className="rounded-[1.5rem] border border-emerald-900/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/6"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">
                            {account.bank}
                          </p>
                          <p className="mt-2 font-serif text-2xl text-emerald-950 dark:text-white">
                            {account.accountNumber}
                          </p>
                          <p className="mt-2 text-sm text-emerald-950/58 dark:text-white/52">
                            {account.accountName} · {account.branch}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label={`Salin nomor rekening ${account.bank}`}
                          onClick={() => copyAccount(account.accountNumber)}
                        >
                          <Clipboard />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <form
                onSubmit={handleSubmit}
                className="rounded-[2rem] border border-emerald-900/10 bg-white/72 p-5 shadow-[0_18px_70px_rgba(4,34,28,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-emerald-900/5 text-emerald-700 dark:bg-white/10 dark:text-amber-200">
                    <FileUp className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-serif text-2xl text-emerald-950 dark:text-white">
                      Detail transfer
                    </h2>
                    <p className="mt-1 text-sm text-emerald-950/56 dark:text-white/50">
                      Form mock untuk menyiapkan alur upload bukti pembayaran.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <label className="catalog-field">
                    <span>Nama pengirim</span>
                    <div className="flex items-center gap-2">
                      <UserRound className="size-4 text-emerald-950/42 dark:text-white/42" />
                      <input
                        value={senderName}
                        onChange={(event) => setSenderName(event.target.value)}
                        placeholder="Nama sesuai rekening"
                        aria-label="Nama pengirim"
                        aria-invalid={senderName.trim().length > 0 && senderName.trim().length < 2}
                      />
                    </div>
                  </label>
                  <label className="catalog-field">
                    <span>Bank asal</span>
                    <input
                      value={senderBank}
                      onChange={(event) => setSenderBank(event.target.value)}
                      placeholder="BCA / Mandiri / dll"
                      aria-label="Bank asal"
                      aria-invalid={senderBank.trim().length > 0 && senderBank.trim().length < 2}
                    />
                  </label>
                  <label className="catalog-field">
                    <span>Tanggal transfer</span>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-4 text-emerald-950/42 dark:text-white/42" />
                      <input
                        type="date"
                        value={transferDate}
                        onChange={(event) => setTransferDate(event.target.value)}
                        aria-label="Tanggal transfer"
                        aria-invalid={!transferDate}
                      />
                    </div>
                  </label>
                  <div className="md:col-span-2">
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-emerald-950/42 dark:text-white/38">
                      Bukti transfer
                    </p>
                    <TransferProofUpload value={proofFile} onChange={setProofFile} />
                  </div>
                </div>

                <label className="catalog-field mt-3">
                  <span>Catatan opsional</span>
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Contoh: transfer dari rekening pasangan"
                    aria-label="Catatan pembayaran"
                  />
                </label>

                <div className="mt-5 rounded-[1.4rem] border border-amber-300/35 bg-amber-100/45 p-4 text-sm leading-6 text-emerald-950/70 dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-white/68">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-200" />
                    <p>
                      File tidak benar-benar di-upload pada tahap frontend ini. Nama file disimpan sebagai simulasi untuk nanti disambungkan ke storage.
                    </p>
                  </div>
                </div>

                <Button className="mt-5 w-full" variant="gold" size="lg" type="submit" disabled={!confirmationValid}>
                  <CheckCircle2 />
                  Kirim konfirmasi mock
                </Button>
              </form>
            </div>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <PaymentOrderSummary
                booking={draft}
                methodTitle={paymentDraft?.method.title ?? manualMethod.title}
                fee={paymentDraft?.fee ?? 0}
                payableAmount={payableAmount}
                title="Status pembayaran"
                badge="Waiting review"
              >
                <Button asChild className="mt-5 w-full" variant="outline">
                  <Link href="/payment">Ubah metode pembayaran</Link>
                </Button>
              </PaymentOrderSummary>
            </aside>
          </div>
        </div>
      </section>

      <Toast message={toast} />
    </main>
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
