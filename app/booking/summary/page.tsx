"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  CreditCard,
  Gift,
  Landmark,
  Loader2,
  LockKeyhole,
  MapPin,
  Minus,
  MoonStar,
  Phone,
  Plus,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type ComponentType,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  bookingDraftStorageKey,
  paymentMethods,
  type BookingDraft,
} from "@/lib/booking-draft";
import {
  calculateCouponDiscount,
  circlePointBalance,
  circlePointRedemption,
  circlePointValue,
} from "@/lib/booking-pricing";
import type { BookingStoreRecord } from "@/lib/booking-store";
import { cn } from "@/lib/utils";
import { formatRupiah, getVillaById } from "@/lib/villa-data";

type FormErrors = Partial<
  Record<
    | "bookerName"
    | "bookerEmail"
    | "bookerPhone"
    | "bookerCity"
    | "guestName"
    | "guestPhone"
    | "paymentMethod"
    | "terms"
    | "cancellation",
    string
  >
>;

const specialRequestOptions = [
  {
    id: "early-check-in",
    label: "Early Check-in",
    description: "Sebelum pukul 14.00",
    priceLabel: "Sesuai ketersediaan",
    icon: Clock3,
  },
  {
    id: "late-check-out",
    label: "Late Check-out",
    description: "Setelah pukul 12.00",
    priceLabel: "Sesuai ketersediaan",
    icon: MoonStar,
  },
  {
    id: "private-chef",
    label: "Private Chef",
    description: "Set menu makan malam",
    priceLabel: formatRupiah(1_250_000),
    price: 1_250_000,
    icon: Sparkles,
  },
  {
    id: "airport-pickup",
    label: "Airport Pickup",
    description: "Mobil privat dari bandara",
    priceLabel: formatRupiah(450_000),
    price: 450_000,
    icon: MapPin,
  },
  {
    id: "honeymoon-decoration",
    label: "Dekorasi Honeymoon",
    description: "Bunga dan turndown romantis",
    priceLabel: "Konfirmasi concierge",
    icon: Gift,
  },
  {
    id: "floating-breakfast",
    label: "Floating Breakfast",
    description: "Sarapan premium di kolam",
    priceLabel: formatRupiah(350_000),
    price: 350_000,
    icon: Sparkles,
  },
] as const;

const paymentIcons: Record<string, ComponentType<{ className?: string }>> = {
  "bank-transfer": Landmark,
  "virtual-account": ReceiptText,
  "credit-card": CreditCard,
  qris: QrCode,
  "e-wallet": WalletCards,
};

const circlePointsDiscount = circlePointRedemption * circlePointValue;

export default function BookingCheckoutPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [bookerName, setBookerName] = useState("");
  const [bookerEmail, setBookerEmail] = useState("");
  const [bookerPhone, setBookerPhone] = useState("");
  const [bookerCity, setBookerCity] = useState("");
  const [guestSameAsBooker, setGuestSameAsBooker] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestNote, setGuestNote] = useState("");
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [additionalNote, setAdditionalNote] = useState("");
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState("");
  const [voucherMessage, setVoucherMessage] = useState<{
    tone: "success" | "error" | "neutral";
    text: string;
  } | null>(null);
  const [useCirclePoints, setUseCirclePoints] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeCancellation, setAgreeCancellation] = useState(false);

  useEffect(() => {
    try {
      const rawDraft = window.sessionStorage.getItem(bookingDraftStorageKey);
      const storedDraft = rawDraft ? (JSON.parse(rawDraft) as BookingDraft) : null;
      setDraft(storedDraft);

      if (storedDraft) {
        setBookerName(storedDraft.guest.name);
        setBookerEmail(storedDraft.guest.email);
        setBookerPhone(storedDraft.guest.phone);
        setBookerCity(storedDraft.checkout?.bookerCity ?? "");
        setGuestSameAsBooker(storedDraft.checkout?.guestSameAsBooker ?? true);
        setGuestName(storedDraft.checkout?.guestName ?? "");
        setGuestPhone(storedDraft.checkout?.guestPhone ?? "");
        setAdditionalNote(storedDraft.checkout?.additionalNote ?? "");
        setSelectedRequests(
          storedDraft.checkout?.specialRequests ??
            storedDraft.addOns.map((addOn) => addOn.id),
        );
        setVoucherInput(storedDraft.promo.code);
        setAppliedVoucher(
          storedDraft.promo.status === "applied" ? storedDraft.promo.code : "",
        );
        setUseCirclePoints(storedDraft.checkout?.useCirclePoints ?? false);
        setPaymentMethodId(storedDraft.checkout?.paymentMethodId ?? "");
      }
    } catch {
      setDraft(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  const villa = useMemo(() => (draft ? getVillaById(draft.villa.id) : null), [draft]);

  const selectedPaidRequests = useMemo(
    () =>
      specialRequestOptions.filter(
        (item) => selectedRequests.includes(item.id) && "price" in item && item.price,
      ),
    [selectedRequests],
  );

  const pricing = useMemo(() => {
    if (!draft) {
      return {
        addOnsTotal: 0,
        voucherDiscount: 0,
        pointsDiscount: 0,
        taxableAmount: 0,
        service: 0,
        tax: 0,
        total: 0,
        deposit: 0,
      };
    }

    const addOnsTotal = selectedPaidRequests.reduce(
      (sum, item) => sum + ("price" in item ? item.price ?? 0 : 0),
      0,
    );
    const coupon = calculateCouponDiscount(
      appliedVoucher,
      draft.pricing.subtotal + draft.pricing.guestService,
      draft.stay.nights,
    );
    const beforePoints = Math.max(
      0,
      draft.pricing.subtotal +
        draft.pricing.guestService +
        addOnsTotal -
        coupon.amount,
    );
    const pointsDiscount = useCirclePoints
      ? Math.min(beforePoints, circlePointsDiscount)
      : 0;
    const taxableAmount = Math.max(0, beforePoints - pointsDiscount);
    const service = Math.round(taxableAmount * 0.05);
    const tax = Math.round(taxableAmount * 0.11);
    const total = taxableAmount + service + tax;

    return {
      addOnsTotal,
      voucherDiscount: coupon.amount,
      pointsDiscount,
      taxableAmount,
      service,
      tax,
      total,
      deposit: Math.round(total * 0.3),
    };
  }, [appliedVoucher, draft, selectedPaidRequests, useCirclePoints]);

  const clearError = (field: keyof FormErrors) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleVoucher = () => {
    if (!draft) return;

    const normalizedCode = voucherInput.trim().toUpperCase();
    if (!normalizedCode) {
      setAppliedVoucher("");
      setVoucherMessage({
        tone: "neutral",
        text: "Masukkan kode voucher untuk mendapatkan potongan.",
      });
      return;
    }

    const result = calculateCouponDiscount(
      normalizedCode,
      draft.pricing.subtotal + draft.pricing.guestService,
      draft.stay.nights,
    );
    if (result.status !== "applied") {
      setAppliedVoucher("");
      setVoucherMessage({ tone: "error", text: result.description });
      return;
    }

    setVoucherInput(normalizedCode);
    setAppliedVoucher(normalizedCode);
    setVoucherMessage({
      tone: "success",
      text: `${result.description} Hemat ${formatRupiah(result.amount)}.`,
    });
  };

  const toggleRequest = (id: string) => {
    setSelectedRequests((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (bookerName.trim().length < 2) nextErrors.bookerName = "Masukkan nama lengkap.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookerEmail.trim())) {
      nextErrors.bookerEmail = "Masukkan alamat email yang valid.";
    }
    if (bookerPhone.replace(/\D/g, "").length < 9) {
      nextErrors.bookerPhone = "Nomor telepon minimal 9 digit.";
    }
    if (bookerCity.trim().length < 2) nextErrors.bookerCity = "Masukkan kota domisili.";
    if (!guestSameAsBooker) {
      if (guestName.trim().length < 2) nextErrors.guestName = "Masukkan nama tamu.";
      if (guestPhone.replace(/\D/g, "").length < 9) {
        nextErrors.guestPhone = "Nomor telepon tamu minimal 9 digit.";
      }
    }
    if (!paymentMethodId) nextErrors.paymentMethod = "Pilih satu metode pembayaran.";
    if (!agreeTerms) nextErrors.terms = "Persetujuan ini diperlukan.";
    if (!agreeCancellation) {
      nextErrors.cancellation = "Persetujuan ini diperlukan.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || submitting) return;

    if (!validate()) {
      setSubmitMessage({
        tone: "error",
        text: "Beberapa data belum lengkap. Periksa kolom yang ditandai.",
      });
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }

    const checkoutDetails = {
      bookerCity: bookerCity.trim(),
      guestSameAsBooker,
      guestName: guestSameAsBooker ? bookerName.trim() : guestName.trim(),
      guestPhone: guestSameAsBooker ? bookerPhone.trim() : guestPhone.trim(),
      specialRequests: selectedRequests,
      additionalNote: [guestNote.trim(), additionalNote.trim()].filter(Boolean).join(" — "),
      useCirclePoints,
      circlePointsUsed: useCirclePoints ? circlePointRedemption : 0,
      paymentMethodId,
    };

    const selectedAddOns = selectedPaidRequests.map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
      price: "price" in item ? item.price ?? 0 : 0,
    }));
    const selectedRequestLabels = specialRequestOptions
      .filter((item) => selectedRequests.includes(item.id))
      .map((item) => item.label);
    const specialRequest = [
      `Kota pemesan: ${bookerCity.trim()}`,
      selectedRequestLabels.length
        ? `Permintaan khusus: ${selectedRequestLabels.join(", ")}`
        : "",
      checkoutDetails.additionalNote
        ? `Catatan: ${checkoutDetails.additionalNote}`
        : "",
      useCirclePoints
        ? `Circle Points: ${circlePointRedemption.toLocaleString("id-ID")} poin`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const currentDraft: BookingDraft = {
      ...draft,
      guest: {
        name: bookerName.trim(),
        email: bookerEmail.trim().toLowerCase(),
        phone: bookerPhone.trim(),
      },
      addOns: selectedAddOns,
      promo: {
        code: appliedVoucher,
        label: appliedVoucher ? `Voucher ${appliedVoucher}` : "Tanpa voucher",
        status: appliedVoucher ? "applied" : "empty",
        discount: pricing.voucherDiscount,
      },
      pricing: {
        ...draft.pricing,
        addOnsTotal: pricing.addOnsTotal,
        discount: pricing.voucherDiscount,
        circlePointsDiscount: pricing.pointsDiscount,
        taxableAmount: pricing.taxableAmount,
        service: pricing.service,
        tax: pricing.tax,
        total: pricing.total,
        deposit: pricing.deposit,
        remaining: pricing.total - pricing.deposit,
      },
      checkout: checkoutDetails,
    };
    window.sessionStorage.setItem(bookingDraftStorageKey, JSON.stringify(currentDraft));
    setDraft(currentDraft);

    if (draft.status === "WAITING_PAYMENT") {
      setSubmitMessage({
        tone: "success",
        text: "Data checkout tersimpan. Membuka pembayaran aman...",
      });
      window.setTimeout(() => router.push("/payment"), 550);
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          villaId: draft.villa.id,
          checkIn: draft.stay.checkIn,
          checkOut: draft.stay.checkOut,
          guests: draft.stay.guests,
          guestName: checkoutDetails.guestName,
          guestEmail: bookerEmail.trim().toLowerCase(),
          guestPhone: checkoutDetails.guestPhone,
          promoCode: appliedVoucher,
          addOns: selectedAddOns.map((item) => item.id),
          useCirclePoints,
          specialRequest,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        data?: { booking?: BookingStoreRecord };
      } | null;

      if (response.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent("/booking/summary")}`);
        return;
      }

      const booking = payload?.data?.booking;
      if (!response.ok || !booking) {
        throw new Error(payload?.message || "Booking belum dapat dibuat.");
      }

      const persistedDraft: BookingDraft = {
        ...currentDraft,
        id: booking.bookingCode,
        status: booking.status,
        guest: booking.guest,
        pricing: {
          subtotal: booking.amounts.subtotal,
          guestService: booking.amounts.extraGuestFee,
          addOnsTotal: booking.amounts.addonTotal,
          discount: booking.coupon.amount,
          circlePointsDiscount: Math.max(
            0,
            booking.amounts.discountTotal - booking.coupon.amount,
          ),
          taxableAmount: Math.max(
            0,
            booking.amounts.subtotal +
              booking.amounts.extraGuestFee +
              booking.amounts.addonTotal -
              booking.amounts.discountTotal,
          ),
          service: booking.amounts.serviceFee,
          tax: booking.amounts.taxTotal,
          total: booking.amounts.totalAmount,
          deposit: booking.amounts.depositAmount,
          remaining: booking.amounts.remainingAmount,
        },
      };
      window.sessionStorage.setItem(bookingDraftStorageKey, JSON.stringify(persistedDraft));
      setDraft(persistedDraft);
      setSubmitMessage({
        tone: "success",
        text: "Booking berhasil diamankan. Mengalihkan ke pembayaran...",
      });
      window.setTimeout(() => router.push("/payment"), 700);
    } catch (error) {
      setSubmitMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Terjadi kendala. Silakan coba kembali.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!loaded) return <CheckoutLoading />;
  if (!draft) return <CheckoutEmpty />;

  return (
    <main className="dark min-h-screen bg-[#0B1512] text-[#F7F3E9]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_4%,rgba(212,170,91,0.12),transparent_25rem),radial-gradient(circle_at_82%_22%,rgba(16,185,129,0.11),transparent_30rem),linear-gradient(180deg,rgba(255,255,255,0.018),transparent_30rem)]"
      />

      <header className="relative z-20 border-b border-white/[0.07] bg-[#0B1512]/88 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-20 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <Link href="/" className="group inline-flex items-center gap-3" aria-label="VillaKu">
            <span className="grid size-10 place-items-center rounded-full border border-[#D4AA5B]/28 bg-[#D4AA5B]/10 font-serif text-lg text-[#F4D38B] transition group-hover:bg-[#D4AA5B]/16">
              V
            </span>
            <span>
              <strong className="block font-serif text-xl leading-none">VillaKu</strong>
              <small className="mt-1 block text-[0.58rem] font-bold uppercase tracking-[0.24em] text-white/38">
                Guest Circle
              </small>
            </span>
          </Link>

          <div className="hidden items-center gap-2 text-xs font-semibold text-white/42 sm:flex">
            <Step number="1" label="Pilih Villa" done />
            <span className="h-px w-7 bg-white/12" />
            <Step number="2" label="Checkout" active />
            <span className="h-px w-7 bg-white/12" />
            <Step number="3" label="Pembayaran" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/16 bg-emerald-400/[0.07] px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-emerald-200">
            <LockKeyhole className="size-3.5" />
            <span className="hidden sm:inline">Checkout aman</span>
            <span className="sm:hidden">Aman</span>
          </div>
        </div>
      </header>

      <form
        onSubmit={submitCheckout}
        className="relative z-10 mx-auto max-w-[1440px] px-4 pb-24 pt-8 sm:px-6 lg:px-10 lg:pt-12"
        noValidate
      >
        <div className="mb-8 flex flex-col justify-between gap-5 lg:mb-10 lg:flex-row lg:items-end">
          <div>
            <Link
              href={`/villas/${draft.villa.id}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/48 transition hover:text-[#F4D38B]"
            >
              <ArrowLeft className="size-4" />
              Kembali ke detail villa
            </Link>
            <p className="mt-7 text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#D4AA5B]">
              Satu langkah lagi
            </p>
            <h1 className="mt-3 font-serif text-4xl leading-none tracking-[-0.025em] sm:text-5xl lg:text-[3.5rem]">
              Selesaikan reservasi Anda
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
              Periksa detail menginap dan lengkapi data berikut. Reservasi Anda
              diamankan selama 30 menit setelah melanjutkan.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-sm text-white/52">
            <ShieldCheck className="size-5 text-emerald-300" />
            Data pribadi terenkripsi dan terlindungi
          </div>
        </div>

        <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0 space-y-6">
            <VillaSummaryCard draft={draft} villa={villa} />

            <CheckoutCard
              number="01"
              title="Detail Reservasi"
              subtitle="Pastikan tanggal dan jumlah tamu sudah sesuai."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetailTile
                  icon={CalendarDays}
                  label="Check-in"
                  value={formatDisplayDate(draft.stay.checkIn)}
                  helper="Mulai 14.00"
                />
                <DetailTile
                  icon={CalendarDays}
                  label="Check-out"
                  value={formatDisplayDate(draft.stay.checkOut)}
                  helper="Maks. 12.00"
                />
                <DetailTile
                  icon={MoonStar}
                  label="Durasi"
                  value={`${draft.stay.nights} malam`}
                  helper="Stay premium"
                />
                <DetailTile
                  icon={Users}
                  label="Jumlah tamu"
                  value={`${draft.stay.guests} tamu`}
                  helper={`Maks. ${villa?.guests ?? draft.stay.guests}`}
                />
              </div>
              <Button asChild variant="outline" className="mt-4 border-white/10 bg-white/[0.035] text-white hover:bg-white/[0.07]">
                <Link href={`/villas/${draft.villa.id}`}>
                  <CalendarDays />
                  Ubah tanggal atau tamu
                </Link>
              </Button>
            </CheckoutCard>

            <CheckoutCard
              number="02"
              title="Data Pemesan"
              subtitle="Konfirmasi booking dan invoice akan dikirim ke data ini."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Nama lengkap"
                  required
                  value={bookerName}
                  onChange={(event) => {
                    setBookerName(event.target.value);
                    clearError("bookerName");
                  }}
                  placeholder="Nama sesuai identitas"
                  error={errors.bookerName}
                  autoComplete="name"
                />
                <Field
                  label="Email"
                  required
                  type="email"
                  value={bookerEmail}
                  onChange={(event) => {
                    setBookerEmail(event.target.value);
                    clearError("bookerEmail");
                  }}
                  placeholder="nama@email.com"
                  error={errors.bookerEmail}
                  autoComplete="email"
                />
                <Field
                  label="Nomor telepon"
                  required
                  type="tel"
                  value={bookerPhone}
                  onChange={(event) => {
                    setBookerPhone(event.target.value);
                    clearError("bookerPhone");
                  }}
                  placeholder="+62 812 3456 7890"
                  error={errors.bookerPhone}
                  autoComplete="tel"
                />
                <Field
                  label="Kota domisili"
                  required
                  value={bookerCity}
                  onChange={(event) => {
                    setBookerCity(event.target.value);
                    clearError("bookerCity");
                  }}
                  placeholder="Contoh: Jakarta"
                  error={errors.bookerCity}
                  autoComplete="address-level2"
                />
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-400/12 bg-emerald-400/[0.055] p-4 transition hover:bg-emerald-400/[0.08]">
                <input
                  type="checkbox"
                  checked={guestSameAsBooker}
                  onChange={(event) => setGuestSameAsBooker(event.target.checked)}
                  className="peer sr-only"
                />
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-white/18 bg-white/[0.04] text-transparent transition peer-checked:border-emerald-400 peer-checked:bg-emerald-500 peer-checked:text-[#07110E]">
                  <Check className="size-3.5 stroke-[3]" />
                </span>
                <span>
                  <strong className="block text-sm text-white/88">
                    Data tamu sama dengan pemesan
                  </strong>
                  <span className="mt-1 block text-xs leading-5 text-white/42">
                    Nonaktifkan jika Anda memesan untuk orang lain.
                  </span>
                </span>
              </label>
            </CheckoutCard>

            <AnimatePresence initial={false}>
              {!guestSameAsBooker ? (
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, height: 0, y: -8 }}
                  className="overflow-hidden"
                >
                  <CheckoutCard
                    number="03"
                    title="Data Tamu"
                    subtitle="Opsional—lengkapi bila pemesan tidak ikut menginap."
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        label="Nama tamu"
                        required
                        value={guestName}
                        onChange={(event) => {
                          setGuestName(event.target.value);
                          clearError("guestName");
                        }}
                        placeholder="Nama tamu utama"
                        error={errors.guestName}
                      />
                      <Field
                        label="Nomor telepon tamu"
                        required
                        type="tel"
                        value={guestPhone}
                        onChange={(event) => {
                          setGuestPhone(event.target.value);
                          clearError("guestPhone");
                        }}
                        placeholder="+62 812 3456 7890"
                        error={errors.guestPhone}
                      />
                    </div>
                    <TextArea
                      className="mt-5"
                      label="Catatan untuk data tamu"
                      value={guestNote}
                      onChange={(event) => setGuestNote(event.target.value)}
                      placeholder="Preferensi kontak atau informasi lain yang perlu kami ketahui"
                    />
                  </CheckoutCard>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <CheckoutCard
              number={guestSameAsBooker ? "03" : "04"}
              title="Permintaan Khusus"
              subtitle="Pilih layanan yang membuat perjalanan Anda lebih personal."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {specialRequestOptions.map((item) => {
                  const Icon = item.icon;
                  const selected = selectedRequests.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleRequest(item.id)}
                      aria-pressed={selected}
                      className={cn(
                        "group relative min-h-36 rounded-[1.35rem] border p-4 text-left transition duration-200",
                        selected
                          ? "border-emerald-400/42 bg-emerald-400/[0.095] shadow-[inset_0_0_0_1px_rgba(52,211,153,0.08)]"
                          : "border-white/[0.075] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.045]",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 place-items-center rounded-full transition",
                          selected
                            ? "bg-emerald-400 text-[#07110E]"
                            : "bg-white/[0.06] text-[#E4C176] group-hover:text-emerald-300",
                        )}
                      >
                        {selected ? (
                          <Check className="size-4 stroke-[3]" />
                        ) : (
                          <Icon className="size-4" />
                        )}
                      </span>
                      <strong className="mt-4 block text-sm text-white/88">
                        {item.label}
                      </strong>
                      <span className="mt-1 block text-xs text-white/38">
                        {item.description}
                      </span>
                      <span className="mt-3 block text-[0.68rem] font-semibold text-[#DDBB75]">
                        {item.priceLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
              <TextArea
                className="mt-5"
                label="Catatan tambahan"
                value={additionalNote}
                onChange={(event) => setAdditionalNote(event.target.value)}
                placeholder="Alergi makanan, kebutuhan aksesibilitas, waktu kedatangan, atau permintaan lainnya"
                helper={`${additionalNote.length}/400 karakter`}
                maxLength={400}
              />
            </CheckoutCard>

            <CheckoutCard
              number={guestSameAsBooker ? "04" : "05"}
              title="Voucher & Circle Points"
              subtitle="Gunakan benefit member Anda sebelum pembayaran."
            >
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[1.4rem] border border-white/[0.075] bg-white/[0.025] p-4">
                  <label
                    htmlFor="voucher"
                    className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/42"
                  >
                    Kode voucher
                  </label>
                  <div className="mt-3 flex gap-2">
                    <input
                      id="voucher"
                      value={voucherInput}
                      onChange={(event) => {
                        setVoucherInput(event.target.value.toUpperCase());
                        setVoucherMessage(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleVoucher();
                        }
                      }}
                      placeholder="VILLAKU10"
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#08110F] px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white outline-none placeholder:text-white/24 focus:border-emerald-400/55 focus:ring-4 focus:ring-emerald-400/8"
                    />
                    <Button
                      type="button"
                      onClick={handleVoucher}
                      className="bg-emerald-500 px-5 text-[#06110E] shadow-none hover:bg-emerald-400"
                    >
                      Terapkan
                    </Button>
                  </div>
                  {voucherMessage ? (
                    <p
                      role="status"
                      className={cn(
                        "mt-3 flex items-start gap-2 text-xs leading-5",
                        voucherMessage.tone === "success" && "text-emerald-300",
                        voucherMessage.tone === "error" && "text-rose-300",
                        voucherMessage.tone === "neutral" && "text-white/42",
                      )}
                    >
                      {voucherMessage.tone === "success" ? (
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
                      ) : voucherMessage.tone === "error" ? (
                        <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
                      ) : null}
                      {voucherMessage.text}
                    </p>
                  ) : appliedVoucher ? (
                    <p className="mt-3 flex items-center gap-2 text-xs text-emerald-300">
                      <CheckCircle2 className="size-3.5" />
                      Voucher {appliedVoucher} aktif.
                    </p>
                  ) : null}
                </div>

                <label
                  className={cn(
                    "relative cursor-pointer overflow-hidden rounded-[1.4rem] border p-4 transition",
                    useCirclePoints
                      ? "border-[#D4AA5B]/40 bg-[#D4AA5B]/10"
                      : "border-white/[0.075] bg-white/[0.025] hover:border-white/15",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={useCirclePoints}
                    onChange={(event) => setUseCirclePoints(event.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-[#D4AA5B]/14 text-[#E6C47D]">
                      <Sparkles className="size-4" />
                    </span>
                    <span className="relative h-6 w-11 rounded-full bg-white/10 transition peer-checked:bg-emerald-500">
                      <span
                        className={cn(
                          "absolute left-1 top-1 size-4 rounded-full bg-white transition",
                          useCirclePoints && "translate-x-5 bg-[#07110E]",
                        )}
                      />
                    </span>
                  </div>
                  <strong className="mt-4 block text-sm">Gunakan Circle Points</strong>
                  <span className="mt-1 block text-xs leading-5 text-white/42">
                    Anda memiliki{" "}
                    <b className="text-[#E4C176]">
                      {circlePointBalance.toLocaleString("id-ID")} poin
                    </b>
                    . Tukarkan {circlePointRedemption.toLocaleString("id-ID")} poin
                    untuk hemat {formatRupiah(circlePointsDiscount)}.
                  </span>
                </label>
              </div>
            </CheckoutCard>

            <CheckoutCard
              number={guestSameAsBooker ? "05" : "06"}
              title="Metode Pembayaran"
              subtitle="Pilih sekarang, selesaikan pembayaran di langkah berikutnya."
            >
              <div
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                aria-invalid={Boolean(errors.paymentMethod)}
              >
                {paymentMethods.map((method) => {
                  const Icon = paymentIcons[method.id] ?? CreditCard;
                  const selected = paymentMethodId === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethodId(method.id);
                        clearError("paymentMethod");
                      }}
                      className={cn(
                        "relative min-h-32 rounded-[1.35rem] border p-4 text-left transition",
                        selected
                          ? "border-emerald-400/42 bg-emerald-400/[0.095]"
                          : "border-white/[0.075] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.045]",
                      )}
                      aria-pressed={selected}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={cn(
                            "grid size-9 place-items-center rounded-full",
                            selected
                              ? "bg-emerald-400 text-[#07110E]"
                              : "bg-white/[0.06] text-[#E4C176]",
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span
                          className={cn(
                            "grid size-5 place-items-center rounded-full border",
                            selected
                              ? "border-emerald-400 bg-emerald-400 text-[#07110E]"
                              : "border-white/18 text-transparent",
                          )}
                        >
                          <Check className="size-3 stroke-[3]" />
                        </span>
                      </div>
                      <strong className="mt-4 block text-sm text-white/88">
                        {method.title}
                      </strong>
                      <span className="mt-1 block text-[0.68rem] text-white/38">
                        {method.eta} {method.fee ? `· Fee ${formatRupiah(method.fee)}` : "· Tanpa fee"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <FieldError message={errors.paymentMethod} />
            </CheckoutCard>

            <CheckoutCard
              number={guestSameAsBooker ? "06" : "07"}
              title="Persetujuan"
              subtitle="Baca dan setujui kebijakan sebelum melanjutkan."
            >
              <div className="space-y-3">
                <Agreement
                  checked={agreeTerms}
                  onChange={(event) => {
                    setAgreeTerms(event.target.checked);
                    clearError("terms");
                  }}
                  error={errors.terms}
                >
                  Saya menyetujui{" "}
                  <Link href="/#terms" className="font-semibold text-[#E4C176] underline decoration-[#E4C176]/35 underline-offset-4">
                    Syarat & Ketentuan
                  </Link>{" "}
                  VillaKu.
                </Agreement>
                <Agreement
                  checked={agreeCancellation}
                  onChange={(event) => {
                    setAgreeCancellation(event.target.checked);
                    clearError("cancellation");
                  }}
                  error={errors.cancellation}
                >
                  Saya telah membaca dan menyetujui{" "}
                  <Link href="/#cancellation" className="font-semibold text-[#E4C176] underline decoration-[#E4C176]/35 underline-offset-4">
                    Kebijakan Pembatalan
                  </Link>
                  .
                </Agreement>
              </div>
            </CheckoutCard>
          </div>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <PaymentSummary
              draft={draft}
              pricing={pricing}
              paymentMethodId={paymentMethodId}
              submitting={submitting}
              message={submitMessage}
            />
          </aside>
        </div>
      </form>
    </main>
  );
}

function Step({
  number,
  label,
  active = false,
  done = false,
}: {
  number: string;
  label: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2",
        active ? "text-white/82" : done ? "text-emerald-300/70" : "text-white/30",
      )}
    >
      <span
        className={cn(
          "grid size-6 place-items-center rounded-full border text-[0.65rem]",
          active && "border-[#D4AA5B]/45 bg-[#D4AA5B]/12 text-[#E4C176]",
          done && "border-emerald-400/25 bg-emerald-400/10",
          !active && !done && "border-white/10",
        )}
      >
        {done ? <Check className="size-3" /> : number}
      </span>
      {label}
    </span>
  );
}

function VillaSummaryCard({
  draft,
  villa,
}: {
  draft: BookingDraft;
  villa: ReturnType<typeof getVillaById>;
}) {
  return (
    <section className="overflow-hidden rounded-[1.8rem] border border-white/[0.075] bg-white/[0.035] shadow-[0_30px_100px_rgba(0,0,0,0.18)]">
      <div className="grid sm:grid-cols-[260px_1fr]">
        <div className="relative min-h-56 overflow-hidden sm:min-h-full">
          <img
            src={draft.villa.image}
            alt={`Foto utama ${draft.villa.name}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#091310]/55 via-transparent to-transparent" />
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/14 bg-[#08110F]/72 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.13em] text-white/78 backdrop-blur-xl">
            <Sparkles className="size-3 text-[#E4C176]" />
            Circle favorite
          </span>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#D4AA5B]">
                Villa pilihan Anda
              </p>
              <h2 className="mt-2 font-serif text-3xl leading-tight">{draft.villa.name}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-white/46">
                <MapPin className="size-4 text-emerald-300" />
                {villa?.address ?? `${draft.villa.location}, Bali`}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#D4AA5B]/12 px-3 py-2 text-sm font-semibold text-[#F0D18D]">
              <Star className="size-4 fill-current" />
              {villa?.rating.toFixed(2) ?? "4.90"}
              <span className="text-white/30">({villa?.reviews ?? 0})</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2">
            <VillaSpec icon={Users} value={`${draft.stay.guests} tamu`} />
            <VillaSpec icon={BedDouble} value={`${villa?.bedrooms ?? "—"} kamar`} />
            <VillaSpec icon={Bath} value={`${villa?.bathrooms ?? "—"} kamar mandi`} />
          </div>
        </div>
      </div>
    </section>
  );
}

function VillaSpec({
  icon: Icon,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.065] bg-white/[0.025] px-2 py-3 text-center">
      <Icon className="mx-auto size-4 text-[#DDBB75]" />
      <p className="mt-2 text-[0.68rem] font-semibold text-white/58 sm:text-xs">{value}</p>
    </div>
  );
}

function CheckoutCard({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.8rem] border border-white/[0.075] bg-white/[0.035] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.12)] sm:p-6 lg:p-7">
      <div className="mb-6 flex items-start gap-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#D4AA5B]/25 bg-[#D4AA5B]/9 font-serif text-sm text-[#E4C176]">
          {number}
        </span>
        <div>
          <h2 className="font-serif text-2xl leading-none sm:text-[1.7rem]">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-white/42">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function DetailTile({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-white/[0.075] bg-white/[0.025] p-4">
      <Icon className="size-4 text-[#DDBB75]" />
      <p className="mt-4 text-[0.62rem] font-bold uppercase tracking-[0.17em] text-white/34">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white/86">{value}</p>
      <p className="mt-1 text-[0.68rem] text-white/30">{helper}</p>
    </div>
  );
}

function Field({
  label,
  error,
  required,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  required?: boolean;
}) {
  const id = props.id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label htmlFor={id} className="block">
      <span className="text-xs font-semibold text-white/58">
        {label}
        {required ? <span className="ml-1 text-[#DDBB75]">*</span> : null}
      </span>
      <input
        {...props}
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "mt-2.5 w-full rounded-xl border bg-[#08110F]/72 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/22 focus:ring-4",
          error
            ? "border-rose-400/60 focus:border-rose-400 focus:ring-rose-400/8"
            : "border-white/10 focus:border-emerald-400/55 focus:ring-emerald-400/8",
          props.className,
        )}
      />
      <FieldError id={`${id}-error`} message={error} />
    </label>
  );
}

function TextArea({
  label,
  helper,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  helper?: string;
}) {
  const id = props.id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label htmlFor={id} className={cn("block", className)}>
      <span className="flex items-center justify-between gap-3 text-xs font-semibold text-white/58">
        {label}
        {helper ? <span className="font-normal text-white/28">{helper}</span> : null}
      </span>
      <textarea
        {...props}
        id={id}
        rows={4}
        className="mt-2.5 w-full resize-none rounded-xl border border-white/10 bg-[#08110F]/72 px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-white/22 focus:border-emerald-400/55 focus:ring-4 focus:ring-emerald-400/8"
      />
    </label>
  );
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  return message ? (
    <p id={id} className="mt-2 flex items-center gap-1.5 text-xs text-rose-300">
      <CircleAlert className="size-3.5 shrink-0" />
      {message}
    </p>
  ) : null;
}

function Agreement({
  checked,
  onChange,
  error,
  children,
}: {
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition",
        error
          ? "border-rose-400/35 bg-rose-400/[0.055]"
          : "border-white/[0.075] bg-white/[0.025] hover:bg-white/[0.04]",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        className="peer sr-only"
      />
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-white/18 bg-white/[0.04] text-transparent transition peer-focus:ring-4 peer-focus:ring-emerald-400/12 peer-checked:border-emerald-400 peer-checked:bg-emerald-500 peer-checked:text-[#07110E]">
        <Check className="size-3.5 stroke-[3]" />
      </span>
      <span className="text-sm leading-6 text-white/56">
        {children}
        {error ? <span className="mt-1 block text-xs text-rose-300">{error}</span> : null}
      </span>
    </label>
  );
}

function PaymentSummary({
  draft,
  pricing,
  paymentMethodId,
  submitting,
  message,
}: {
  draft: BookingDraft;
  pricing: {
    addOnsTotal: number;
    voucherDiscount: number;
    pointsDiscount: number;
    taxableAmount: number;
    service: number;
    tax: number;
    total: number;
    deposit: number;
  };
  paymentMethodId: string;
  submitting: boolean;
  message: { tone: "success" | "error"; text: string } | null;
}) {
  const selectedMethod = paymentMethods.find((method) => method.id === paymentMethodId);

  return (
    <div className="overflow-hidden rounded-[1.9rem] border border-[#D4AA5B]/22 bg-[#10211C] shadow-[0_36px_120px_rgba(0,0,0,0.32)]">
      <div className="border-b border-white/[0.075] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#D4AA5B]">
              Ringkasan Pembayaran
            </p>
            <h2 className="mt-2 font-serif text-2xl">Detail harga</h2>
          </div>
          <span className="rounded-full border border-emerald-400/16 bg-emerald-400/[0.07] px-3 py-1.5 text-[0.65rem] font-semibold text-emerald-200">
            IDR
          </span>
        </div>

        <div className="mt-5 flex gap-3 rounded-2xl bg-black/12 p-3">
          <img
            src={draft.villa.image}
            alt=""
            className="size-16 rounded-xl object-cover"
          />
          <div className="min-w-0">
            <p className="truncate font-serif text-lg">{draft.villa.name}</p>
            <p className="mt-1 text-xs text-white/38">
              {formatDisplayDateShort(draft.stay.checkIn)}–{formatDisplayDateShort(draft.stay.checkOut)}
            </p>
            <p className="mt-1 text-xs text-white/38">
              {draft.stay.guests} tamu · {draft.stay.nights} malam
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="space-y-3">
          <PriceLine
            label={`${formatRupiah(draft.villa.price)} × ${draft.stay.nights} malam`}
            value={formatRupiah(draft.pricing.subtotal)}
          />
          {draft.pricing.guestService > 0 ? (
            <PriceLine
              label="Tamu tambahan"
              value={formatRupiah(draft.pricing.guestService)}
            />
          ) : null}
          <PriceLine label="Layanan tambahan" value={formatRupiah(pricing.addOnsTotal)} />
          <PriceLine
            label="Pajak & biaya layanan"
            value={formatRupiah(pricing.service + pricing.tax)}
          />
          <PriceLine
            label="Diskon voucher"
            value={pricing.voucherDiscount ? `-${formatRupiah(pricing.voucherDiscount)}` : "—"}
            discount={pricing.voucherDiscount > 0}
          />
          <PriceLine
            label="Potongan Circle Points"
            value={pricing.pointsDiscount ? `-${formatRupiah(pricing.pointsDiscount)}` : "—"}
            discount={pricing.pointsDiscount > 0}
          />
        </div>

        <div className="my-5 border-t border-dashed border-white/12" />

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-white/48">Total pembayaran</p>
            <p className="mt-1 text-[0.68rem] text-white/28">Termasuk pajak</p>
          </div>
          <motion.strong
            key={pricing.total}
            initial={shouldAnimate() ? { opacity: 0, y: 5 } : false}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-3xl text-[#F0D18D]"
          >
            {formatRupiah(pricing.total)}
          </motion.strong>
        </div>

        <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/10 p-4">
          <PriceLine label="Dibayar sekarang (deposit 30%)" value={formatRupiah(pricing.deposit)} />
          <PriceLine
            label="Sisa saat check-in"
            value={formatRupiah(pricing.total - pricing.deposit)}
          />
        </div>

        {selectedMethod ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-400/13 bg-emerald-400/[0.055] p-3">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-300" />
            <p className="text-xs leading-5 text-white/52">
              Metode: <strong className="text-white/80">{selectedMethod.title}</strong>
            </p>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#D4AA5B]/14 bg-[#D4AA5B]/[0.055] p-3">
            <CircleAlert className="size-4 shrink-0 text-[#E4C176]" />
            <p className="text-xs leading-5 text-white/48">
              Pilih metode pembayaran di formulir.
            </p>
          </div>
        )}

        {message ? (
          <div
            role="status"
            className={cn(
              "mt-4 flex items-start gap-3 rounded-2xl border p-3 text-xs leading-5",
              message.tone === "success"
                ? "border-emerald-400/18 bg-emerald-400/[0.07] text-emerald-100"
                : "border-rose-400/22 bg-rose-400/[0.07] text-rose-100",
            )}
          >
            {message.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            ) : (
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
            )}
            {message.text}
          </div>
        ) : null}

        <Button
          type="submit"
          variant="gold"
          size="lg"
          disabled={submitting}
          className="mt-5 h-14 w-full rounded-2xl bg-[#D9B160] text-[#0A1713] shadow-[0_15px_40px_rgba(212,170,91,0.18)] hover:bg-[#E6C47D]"
        >
          {submitting ? <Loader2 className="animate-spin" /> : <LockKeyhole />}
          {submitting ? "Mengamankan reservasi..." : "Lanjut ke Pembayaran"}
          {!submitting ? <ArrowRight /> : null}
        </Button>
        <p className="mt-3 text-center text-[0.68rem] leading-5 text-white/30">
          Anda belum dikenakan biaya pada tahap ini.
        </p>

        <div className="mt-5 flex items-center justify-center gap-4 border-t border-white/[0.06] pt-5 text-[0.62rem] font-semibold uppercase tracking-[0.13em] text-white/26">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" />
            Secure
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Phone className="size-3.5" />
            24/7 Concierge
          </span>
        </div>
      </div>
    </div>
  );
}

function PriceLine({
  label,
  value,
  discount = false,
}: {
  label: string;
  value: string;
  discount?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs leading-5 text-white/45">
      <span>{label}</span>
      <strong className={cn("shrink-0 font-semibold text-white/72", discount && "text-emerald-300")}>
        {value}
      </strong>
    </div>
  );
}

function CheckoutLoading() {
  return (
    <main className="dark min-h-screen bg-[#0B1512] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-[1360px] animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-11 w-36 rounded-full bg-white/[0.06]" />
          <div className="h-9 w-28 rounded-full bg-white/[0.05]" />
        </div>
        <div className="mt-14 h-12 w-96 max-w-full rounded-2xl bg-white/[0.06]" />
        <div className="mt-4 h-5 w-[34rem] max-w-full rounded-full bg-white/[0.04]" />
        <div className="mt-10 grid gap-7 xl:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <div className="h-64 rounded-[1.8rem] bg-white/[0.05]" />
            <div className="h-72 rounded-[1.8rem] bg-white/[0.045]" />
            <div className="h-96 rounded-[1.8rem] bg-white/[0.045]" />
          </div>
          <div className="h-[36rem] rounded-[1.9rem] bg-white/[0.055]" />
        </div>
      </div>
    </main>
  );
}

function CheckoutEmpty() {
  return (
    <main className="dark grid min-h-screen place-items-center bg-[#0B1512] px-4 text-white">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/[0.08] bg-white/[0.04] p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.28)]">
        <span className="mx-auto grid size-14 place-items-center rounded-full border border-[#D4AA5B]/22 bg-[#D4AA5B]/10 text-[#E4C176]">
          <ReceiptText className="size-6" />
        </span>
        <p className="mt-6 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#D4AA5B]">
          Checkout kosong
        </p>
        <h1 className="mt-3 font-serif text-4xl">Belum ada villa dipilih</h1>
        <p className="mt-4 text-sm leading-7 text-white/45">
          Pilih villa dan tanggal menginap terlebih dahulu. Detail reservasi Anda
          akan muncul otomatis di halaman ini.
        </p>
        <Button asChild variant="gold" size="lg" className="mt-7">
          <Link href="/villas">
            Jelajahi Villa
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </main>
  );
}

function formatDisplayDate(value: string) {
  const date = parseDateOnly(value);
  if (!date) return value;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDisplayDateShort(value: string) {
  const date = parseDateOnly(value);
  if (!date) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function shouldAnimate() {
  return typeof window !== "undefined" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
