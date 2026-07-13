"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Gift,
  Heart,
  Home,
  Mail,
  Minus,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Users,
  Waves,
  Wifi,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { bookingDraftStorageKey } from "@/lib/booking-draft";
import { cn } from "@/lib/utils";
import { formatRupiah, getVillaById } from "@/lib/villa-data";

type CalendarStatus = "available" | "booked" | "pending" | "maintenance";

type CalendarCell =
  | { type: "blank"; id: string }
  | {
      type: "day";
      date: string;
      day: number;
      status: CalendarStatus;
      price: number | null;
      note?: string;
    };

const availabilityByVilla: Record<
  string,
  Record<number, { status: CalendarStatus; note?: string }>
> = {
  "aruna-cliffside": {
    21: { status: "booked", note: "Confirmed booking" },
    22: { status: "booked", note: "Confirmed booking" },
    29: { status: "pending", note: "Awaiting payment" },
  },
  "sagara-beach": {
    24: { status: "booked" },
    25: { status: "booked" },
    30: { status: "available", note: "Weekend premium" },
  },
  "maira-family-estate": {
    14: { status: "booked" },
    15: { status: "booked" },
    16: { status: "booked" },
    17: { status: "maintenance", note: "Pool maintenance" },
  },
  "kayumanis-garden": {
    16: { status: "booked" },
    17: { status: "booked" },
    18: { status: "pending" },
  },
};

const facilityDetails = [
  { label: "Private pool", icon: Waves },
  { label: "High-speed WiFi", icon: Wifi },
  { label: "Verified stay", icon: ShieldCheck },
  { label: "Daily concierge", icon: Sparkles },
];

const bookingAddOns = [
  {
    id: "airport-pickup",
    label: "Airport pickup",
    description: "Private car dari/ke bandara",
    price: 450000,
  },
  {
    id: "floating-breakfast",
    label: "Floating breakfast",
    description: "Sarapan premium di pool",
    price: 350000,
  },
  {
    id: "private-chef",
    label: "Private chef dinner",
    description: "Set menu makan malam untuk tamu",
    price: 1250000,
  },
];

type PromoRule = {
  code: string;
  label: string;
  description: string;
  type: "percent" | "fixed";
  value: number;
  maxDiscount?: number;
  minNights?: number;
  minSubtotal?: number;
};

const promoCatalog: PromoRule[] = [
  {
    code: "VILLAKU10",
    label: "Signature Escape",
    description: "Diskon 10% tarif menginap, maksimal Rp1jt.",
    type: "percent",
    value: 10,
    maxDiscount: 1_000_000,
    minNights: 2,
  },
  {
    code: "EARLYBIRD",
    label: "Early Bird",
    description: "Diskon 15% untuk booking minimal 3 malam.",
    type: "percent",
    value: 15,
    maxDiscount: 1_500_000,
    minNights: 3,
  },
  {
    code: "STAY4",
    label: "Long Stay Bonus",
    description: "Potongan flat Rp750rb untuk 4 malam atau lebih.",
    type: "fixed",
    value: 750_000,
    minNights: 4,
  },
];

export default function VillaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const villa = id ? getVillaById(id) : undefined;
  const shouldReduceMotion = useReducedMotion();
  const [selectedImage, setSelectedImage] = useState(0);
  const [checkIn, setCheckIn] = useState("2026-08-16");
  const [checkOut, setCheckOut] = useState("2026-08-19");
  const [guests, setGuests] = useState(() => (villa ? Math.min(2, villa.guests) : 1));
  const [guestName, setGuestName] = useState("Maya Putri");
  const [guestEmail, setGuestEmail] = useState("maya@example.com");
  const [guestPhone, setGuestPhone] = useState("+62 812 3456 7890");
  const [promoCode, setPromoCode] = useState("VILLAKU10");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(["airport-pickup"]);
  const [toast, setToast] = useState("");
  const guestCapacity = Math.max(1, villa?.guests ?? 1);
  const guestOptions = useMemo(
    () => Array.from({ length: guestCapacity }, (_, index) => index + 1),
    [guestCapacity],
  );
  const guestOccupancyPercent = Math.min(
    100,
    Math.round((Math.min(guests, guestCapacity) / guestCapacity) * 100),
  );

  const pricing = useMemo(() => {
    if (!villa) {
      return {
        nights: 0,
        subtotal: 0,
        includedGuests: 0,
        extraGuestCount: 0,
        extraGuestRate: 0,
        guestService: 0,
        addOnsTotal: 0,
        discountBase: 0,
        discount: 0,
        taxableAmount: 0,
        tax: 0,
        service: 0,
        total: 0,
        deposit: 0,
        remaining: 0,
        promo: resolvePromoDiscount("", 0, 0),
      };
    }

    const start = parseDateOnly(checkIn);
    const end = parseDateOnly(checkOut);
    const diff = start && end ? end.getTime() - start.getTime() : 0;
    const nights = diff > 0 ? Math.ceil(diff / 86_400_000) : 0;
    const activeGuests = Math.min(Math.max(guests, 1), villa.guests);
    const includedGuests = Math.min(villa.guests, 4);
    const extraGuestCount = Math.max(0, activeGuests - includedGuests);
    const extraGuestRate = Math.round(villa.price * 0.06);
    const guestService = nights * extraGuestCount * extraGuestRate;
    const subtotal = nights * villa.price;
    const addOnsTotal = bookingAddOns
      .filter((addOn) => selectedAddOns.includes(addOn.id))
      .reduce((sum, addOn) => sum + addOn.price, 0);
    const discountBase = subtotal + guestService;
    const promo = resolvePromoDiscount(promoCode, discountBase, nights);
    const discount = promo.amount;
    const taxableAmount = Math.max(0, subtotal + guestService + addOnsTotal - discount);
    const service = Math.round(taxableAmount * 0.05);
    const tax = Math.round(taxableAmount * 0.11);
    const total = taxableAmount + service + tax;
    const deposit = Math.round(total * 0.3);

    return {
      nights,
      subtotal,
      includedGuests,
      extraGuestCount,
      extraGuestRate,
      guestService,
      addOnsTotal,
      discountBase,
      discount,
      taxableAmount,
      tax,
      service,
      total,
      deposit,
      remaining: total - deposit,
      promo,
    };
  }, [checkIn, checkOut, guests, promoCode, selectedAddOns, villa]);

  const bookingCalendar = useMemo(
    () => (villa ? buildBookingCalendar(villa.id, villa.price) : []),
    [villa],
  );
  const calendarSummary = useMemo(() => getCalendarSummary(bookingCalendar), [bookingCalendar]);
  const hasRangeConflict = useMemo(
    () => rangeHasUnavailableDate(checkIn, checkOut, bookingCalendar),
    [bookingCalendar, checkIn, checkOut],
  );
  const bookingValidation = useMemo(() => {
    const hasPromoInput = promoCode.trim().length > 0;
    const phoneDigits = guestPhone.replace(/\D/g, "");
    const items = [
      {
        id: "dates",
        label: "Tanggal tersedia",
        valid: Boolean(checkIn && checkOut && pricing.nights > 0 && !hasRangeConflict),
        message: hasRangeConflict
          ? "Rentang menginap melewati tanggal yang tidak tersedia."
          : "Pilih check-in dan check-out yang valid.",
      },
      {
        id: "guests",
        label: "Jumlah tamu",
        valid: guests >= 1 && guests <= guestCapacity,
        message: `Jumlah tamu harus 1-${guestCapacity} orang.`,
      },
      {
        id: "name",
        label: "Nama lengkap",
        valid: guestName.trim().length >= 2,
        message: "Nama pemesan minimal 2 karakter.",
      },
      {
        id: "email",
        label: "Email valid",
        valid: isValidEmail(guestEmail),
        message: "Masukkan format email yang valid.",
      },
      {
        id: "phone",
        label: "WhatsApp valid",
        valid: phoneDigits.length >= 9,
        message: "Nomor WhatsApp minimal 9 digit.",
      },
      {
        id: "promo",
        label: "Kupon valid",
        valid: !hasPromoInput || pricing.promo.status === "applied",
        message: hasPromoInput ? pricing.promo.message : "Kupon opsional.",
      },
    ];
    const invalidItems = items.filter((item) => !item.valid);

    return {
      items,
      invalidItems,
      invalidIds: new Set(invalidItems.map((item) => item.id)),
      validCount: items.length - invalidItems.length,
      isValid: invalidItems.length === 0,
    };
  }, [
    checkIn,
    checkOut,
    guestCapacity,
    guestEmail,
    guestName,
    guestPhone,
    guests,
    hasRangeConflict,
    pricing.nights,
    pricing.promo.message,
    pricing.promo.status,
    promoCode,
  ]);
  const remainingGuestSlots = Math.max(0, guestCapacity - guests);
  const guestLimitReached = guests >= guestCapacity;

  if (!villa) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
        <div className="max-w-md rounded-[2rem] border border-emerald-900/10 bg-white/72 p-8 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-900/5 text-emerald-700 dark:bg-white/10 dark:text-amber-200">
            <Home className="size-6" />
          </div>
          <h1 className="mt-5 font-serif text-3xl font-semibold text-emerald-950 dark:text-white">
            Villa tidak ditemukan
          </h1>
          <p className="mt-3 leading-7 text-emerald-950/62 dark:text-white/58">
            Data detail masih mock. Silakan kembali ke katalog untuk memilih villa yang tersedia.
          </p>
          <Button asChild className="mt-6">
            <Link href="/villas">
              <ArrowLeft />
              Kembali ke katalog
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const showToast = (message: string, duration = 2800) => {
    setToast(message);
    window.setTimeout(() => setToast(""), duration);
  };

  const updateGuests = (nextGuests: number) => {
    const cappedGuests = Math.min(Math.max(nextGuests, 1), villa.guests);
    setGuests(cappedGuests);

    if (nextGuests > villa.guests) {
      showToast(`Kapasitas maksimal ${villa.guests} tamu untuk ${villa.name}.`, 2800);
      return;
    }

    if (nextGuests < 1) {
      showToast("Minimal 1 tamu untuk membuat booking.", 2400);
    }
  };

  const canSubmitBooking = bookingValidation.isValid;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmitBooking) {
      const firstInvalid = bookingValidation.invalidItems[0];
      showToast(firstInvalid?.message ?? "Lengkapi input booking sebelum lanjut.", 3200);
      return;
    }

    const selectedAddOnDetails = bookingAddOns.filter((addOn) => selectedAddOns.includes(addOn.id));
    const bookingDraft = {
      id: `VK-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      status: "draft",
      villa: {
        id: villa.id,
        name: villa.name,
        location: villa.location,
        area: villa.size,
        image: villa.image,
        price: villa.price,
      },
      stay: {
        checkIn,
        checkOut,
        nights: pricing.nights,
        guests,
      },
      guest: {
        name: guestName,
        email: guestEmail,
        phone: guestPhone,
      },
      addOns: selectedAddOnDetails,
      promo: {
        code: pricing.promo.code,
        label: pricing.promo.label,
        status: pricing.promo.status,
        discount: pricing.discount,
      },
      pricing: {
        subtotal: pricing.subtotal,
        guestService: pricing.guestService,
        addOnsTotal: pricing.addOnsTotal,
        discount: pricing.discount,
        taxableAmount: pricing.taxableAmount,
        service: pricing.service,
        tax: pricing.tax,
        total: pricing.total,
        deposit: pricing.deposit,
        remaining: pricing.remaining,
      },
    };

    window.sessionStorage.setItem(bookingDraftStorageKey, JSON.stringify(bookingDraft));
    showToast(
      `Booking draft untuk ${guestName || "tamu"} (${guests} tamu) tersimpan. Membuka ringkasan pesanan...`,
      3600,
    );
    window.setTimeout(() => router.push("/booking/summary"), 520);
  };

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const selectCalendarDate = (date: string) => {
    const selectedCell = bookingCalendar.find(
      (cell) => cell.type === "day" && cell.date === date,
    );

    if (!selectedCell || selectedCell.type !== "day" || selectedCell.status !== "available") {
      showToast("Tanggal ini belum tersedia untuk dipilih.", 2600);
      return;
    }

    if (!checkIn || checkOut || date <= checkIn) {
      setCheckIn(date);
      setCheckOut("");
      showToast("Check-in dipilih. Pilih tanggal check-out berikutnya.", 2600);
      return;
    }

    if (rangeHasUnavailableDate(checkIn, date, bookingCalendar)) {
      showToast("Rentang menginap melewati tanggal yang tidak tersedia. Pilih rentang lain.", 3200);
      return;
    }

    setCheckOut(date);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(247,217,140,0.32),transparent_28rem),radial-gradient(circle_at_86%_12%,rgba(4,120,87,0.16),transparent_30rem)]"
        />
        <div className="container relative z-10 mx-auto max-w-7xl">
          <header className="flex items-center justify-between rounded-full border border-emerald-900/10 bg-white/62 px-4 py-3 shadow-[0_18px_70px_rgba(4,34,28,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/6">
            <Button asChild variant="ghost">
              <Link href="/villas">
                <ArrowLeft />
                Katalog
              </Link>
            </Button>
            <Button type="button" variant="outline" size="icon" aria-label="Simpan ke wishlist">
              <Heart />
            </Button>
          </header>

          <motion.div
            className="grid gap-10 pb-6 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-end"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.72, ease: "easeOut" }}
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/62 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-950/60 backdrop-blur-xl dark:border-white/10 dark:bg-white/8 dark:text-white/62">
                <Sparkles className="size-4 text-amber-500" />
                Villa detail
              </div>
              <h1 className="mt-6 max-w-4xl font-serif text-5xl font-semibold leading-[0.96] tracking-[-0.055em] text-emerald-950 dark:text-white sm:text-6xl lg:text-7xl">
                {villa.name}
              </h1>
              <p className="mt-5 flex flex-wrap items-center gap-3 text-emerald-950/62 dark:text-white/58">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {villa.address}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/70 px-3 py-1.5 font-semibold text-emerald-950">
                  <Star className="size-4 fill-current" />
                  {villa.rating} ({villa.reviews} ulasan)
                </span>
              </p>
            </div>

            <div className="rounded-[2rem] border border-emerald-900/10 bg-emerald-950 p-5 text-white shadow-[0_28px_90px_rgba(4,34,28,0.18)] dark:border-white/10">
              <p className="text-sm leading-7 text-white/66">{villa.highlight}</p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <MiniSpec icon={Users} label={`${villa.guests} tamu`} />
                <MiniSpec icon={BedDouble} label={`${villa.bedrooms} kamar`} />
                <MiniSpec icon={Bath} label={`${villa.bathrooms} bath`} />
              </div>
            </div>
          </motion.div>

          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <motion.figure
              layout
              className="image-hover relative min-h-[360px] overflow-hidden rounded-[2.4rem] bg-emerald-950 shadow-[0_32px_100px_rgba(4,34,28,0.18)] md:min-h-[560px]"
            >
              <img
                src={villa.gallery[selectedImage] ?? villa.image}
                alt={`${villa.name} gallery ${selectedImage + 1}`}
                className="h-full w-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/54 via-transparent to-transparent" />
            </motion.figure>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
              {villa.gallery.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "image-hover relative min-h-40 overflow-hidden rounded-[1.6rem] border bg-emerald-950 shadow-sm transition-all",
                    selectedImage === index
                      ? "border-amber-300 ring-4 ring-amber-200/35"
                      : "border-white/10 hover:border-emerald-500/30",
                  )}
                  aria-label={`Tampilkan foto ${index + 1}`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="container mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_390px]">
          <div className="space-y-8">
            <article className="rounded-[2rem] border border-emerald-900/10 bg-white/74 p-6 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:p-8">
              <h2 className="font-serif text-4xl font-semibold tracking-[-0.04em] text-emerald-950 dark:text-white">
                Tentang villa
              </h2>
              <p className="mt-4 leading-8 text-emerald-950/64 dark:text-white/62">
                {villa.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {villa.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-emerald-900/10 bg-emerald-900/5 px-3 py-1.5 text-xs font-semibold text-emerald-950/62 dark:border-white/10 dark:bg-white/8 dark:text-white/62"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-emerald-900/10 bg-white/74 p-6 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:p-8">
              <h2 className="font-serif text-4xl font-semibold tracking-[-0.04em] text-emerald-950 dark:text-white">
                Fasilitas
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {facilityDetails.map((facility) => (
                  <div
                    key={facility.label}
                    className="card-lift flex items-center gap-4 rounded-[1.35rem] border border-emerald-900/10 bg-white/64 p-4 dark:border-white/10 dark:bg-white/6"
                  >
                    <span className="grid size-11 place-items-center rounded-full bg-emerald-700 text-white">
                      <facility.icon className="size-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-emerald-950 dark:text-white">{facility.label}</p>
                      <p className="text-sm text-emerald-950/52 dark:text-white/48">
                        Termasuk dalam paket menginap
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-emerald-900/10 bg-white/74 p-6 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:p-8">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <h2 className="font-serif text-4xl font-semibold tracking-[-0.04em] text-emerald-950 dark:text-white">
                    Pilih tanggal menginap
                  </h2>
                  <p className="mt-2 text-sm text-emerald-950/56 dark:text-white/52">
                    Kalender interaktif Agustus 2026. Tanggal booked, pending, dan maintenance
                    tidak dapat dipilih.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Legend color="bg-emerald-600" label="Available" />
                  <Legend color="bg-amber-400" label="Pending" />
                  <Legend color="bg-rose-400" label="Booked" />
                  <Legend color="bg-slate-400" label="Maintenance" />
                </div>
              </div>

              <div className="mt-6 grid gap-3 rounded-[1.5rem] border border-emerald-900/10 bg-emerald-900/5 p-4 dark:border-white/10 dark:bg-white/6 sm:grid-cols-3">
                <CalendarStat label="Available" value={calendarSummary.available} />
                <CalendarStat label="Unavailable" value={calendarSummary.unavailable} />
                <CalendarStat
                  label="Selected"
                  value={checkOut ? `${formatShortDate(checkIn)} - ${formatShortDate(checkOut)}` : formatShortDate(checkIn)}
                />
              </div>

              <div className="mt-6 grid grid-cols-7 gap-2">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                  <div
                    key={`${day}-${index}`}
                    className="py-2 text-center text-xs font-bold uppercase tracking-[0.18em] text-emerald-950/42 dark:text-white/38"
                  >
                    {day}
                  </div>
                ))}
                {bookingCalendar.map((item) => {
                  if (item.type === "blank") {
                    return <span key={item.id} aria-hidden className="aspect-square" />;
                  }

                  const disabled = item.status !== "available";
                  const isCheckIn = item.date === checkIn;
                  const isCheckOut = item.date === checkOut;
                  const isInRange =
                    Boolean(checkIn && checkOut) && item.date > checkIn && item.date < checkOut;

                  return (
                    <button
                      key={item.date}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectCalendarDate(item.date)}
                      className={cn(
                        "relative min-h-16 rounded-2xl border p-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300",
                        "hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:hover:translate-y-0",
                        item.status === "available" &&
                          "border-emerald-600/15 bg-emerald-600/10 text-emerald-900 hover:border-emerald-600/35 hover:bg-emerald-600/15 dark:text-emerald-50",
                        item.status === "pending" &&
                          "border-amber-400/20 bg-amber-300/24 text-amber-900 opacity-75 dark:text-amber-100",
                        item.status === "booked" &&
                          "border-rose-400/20 bg-rose-300/24 text-rose-900 opacity-70 dark:text-rose-100",
                        item.status === "maintenance" &&
                          "border-slate-400/20 bg-slate-300/24 text-slate-700 opacity-70 dark:text-slate-100",
                        isInRange && "ring-2 ring-emerald-500/25",
                        (isCheckIn || isCheckOut) &&
                          "border-emerald-700 bg-emerald-700 text-white shadow-lg ring-4 ring-emerald-500/18 dark:bg-emerald-600",
                      )}
                      aria-label={`Tanggal ${item.day} ${item.status}`}
                      title={item.note ?? item.status}
                    >
                      <span className="block text-sm font-bold">{item.day}</span>
                      <span className="mt-2 block text-[0.62rem] uppercase tracking-[0.14em] opacity-65">
                        {item.status}
                      </span>
                      {item.price ? (
                        <span className="mt-1 block truncate text-[0.66rem] font-semibold opacity-75">
                          {formatCompactRupiah(item.price)}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {hasRangeConflict ? (
                <p className="mt-4 rounded-2xl border border-rose-300/35 bg-rose-100/50 p-4 text-sm leading-6 text-rose-900 dark:border-rose-200/20 dark:bg-rose-300/10 dark:text-rose-100">
                  Rentang tanggal saat ini melewati tanggal yang tidak tersedia. Pilih ulang dari
                  kalender untuk mendapatkan estimasi yang valid.
                </p>
              ) : null}
            </article>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <form
              onSubmit={handleSubmit}
              className="overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-white/82 shadow-[0_28px_90px_rgba(4,34,28,0.14)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/6"
            >
              <div className="bg-emerald-950 p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/42">
                      Booking draft
                    </p>
                    <p className="mt-1 font-serif text-3xl font-semibold">
                      {formatRupiah(villa.price)}
                    </p>
                    <p className="text-sm text-white/48">per malam</p>
                  </div>
                  <span className="rounded-full bg-amber-200 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-950">
                    Mock
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  {["Tanggal", "Tamu", "Bayar"].map((step, index) => (
                    <div key={step} className="rounded-2xl bg-white/8 p-3">
                      <span className="mx-auto grid size-7 place-items-center rounded-full bg-white/12 text-xs font-bold">
                        {index + 1}
                      </span>
                      <p className="mt-2 text-[0.65rem] uppercase tracking-[0.16em] text-white/52">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-950/42 dark:text-white/38">
                    Detail menginap
                  </p>
                  <div className="mt-3 grid gap-3">
                    <label className="catalog-field">
                      <span>Check-in</span>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(event) => setCheckIn(event.target.value)}
                        aria-label="Tanggal check-in"
                        aria-invalid={bookingValidation.invalidIds.has("dates")}
                      />
                    </label>
                    <label className="catalog-field">
                      <span>Check-out</span>
                      <input
                        type="date"
                        value={checkOut}
                        min={checkIn || undefined}
                        onChange={(event) => setCheckOut(event.target.value)}
                        aria-label="Tanggal check-out"
                        aria-invalid={bookingValidation.invalidIds.has("dates")}
                      />
                    </label>
                    <div className="rounded-[1.45rem] border border-emerald-900/10 bg-white/58 p-4 shadow-[0_18px_50px_rgba(4,34,28,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-950/42 dark:text-white/38">
                            Jumlah tamu
                          </p>
                          <p className="mt-1 text-sm leading-6 text-emerald-950/58 dark:text-white/52">
                            Maksimal {villa.guests} tamu sesuai kapasitas villa.
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-200/55 px-3 py-1 text-xs font-bold text-emerald-950 dark:bg-amber-200/18 dark:text-amber-100">
                          {remainingGuestSlots > 0 ? `${remainingGuestSlots} slot tersisa` : "Kapasitas penuh"}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 rounded-full border border-emerald-900/10 bg-emerald-900/5 p-2 dark:border-white/10 dark:bg-white/8">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={guests <= 1}
                          onClick={() => updateGuests(guests - 1)}
                          aria-label="Kurangi jumlah tamu"
                        >
                          <Minus />
                        </Button>
                        <div className="min-w-0 text-center">
                          <AnimatePresence mode="wait">
                            <motion.strong
                              key={guests}
                              className="block font-serif text-3xl text-emerald-950 dark:text-white"
                              initial={shouldReduceMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.96 }}
                              transition={{ duration: 0.18 }}
                            >
                              {guests}
                            </motion.strong>
                          </AnimatePresence>
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-950/45 dark:text-white/42">
                            tamu
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={guestLimitReached}
                          onClick={() => updateGuests(guests + 1)}
                          aria-label="Tambah jumlah tamu"
                        >
                          <Plus />
                        </Button>
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                        {guestOptions.map((guest) => (
                          <button
                            key={guest}
                            type="button"
                            onClick={() => updateGuests(guest)}
                            aria-pressed={guests === guest}
                            className={cn(
                              "rounded-full border px-3 py-2 text-xs font-bold transition-all duration-300",
                              guests === guest
                                ? "border-emerald-700 bg-emerald-700 text-white shadow-[0_14px_35px_rgba(4,120,87,0.25)]"
                                : "border-emerald-900/10 bg-white/62 text-emerald-950/62 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/6 dark:text-white/58 dark:hover:bg-white/12",
                            )}
                          >
                            {guest}
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-900/8 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#047857,#d6a84f)] transition-[width] duration-500 ease-out"
                          style={{ width: `${guestOccupancyPercent}%` }}
                        />
                      </div>
                      <p className="mt-3 text-xs leading-5 text-emerald-950/54 dark:text-white/48">
                        {pricing.extraGuestCount > 0
                          ? `${pricing.extraGuestCount} tamu tambahan dikenakan ${formatRupiah(pricing.extraGuestRate)}/malam dan otomatis masuk estimasi.`
                          : `Harga villa mencakup ${pricing.includedGuests} tamu pertama. Estimasi diperbarui saat jumlah tamu berubah.`}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-950/42 dark:text-white/38">
                    Data pemesan
                  </p>
                  <div className="mt-3 grid gap-3">
                    <label className="catalog-field">
                      <span>Nama lengkap</span>
                      <div className="flex items-center gap-2">
                        <UserRound className="size-4 text-emerald-950/42 dark:text-white/42" />
                        <input
                          value={guestName}
                          onChange={(event) => setGuestName(event.target.value)}
                          placeholder="Nama pemesan"
                          aria-label="Nama pemesan"
                          aria-invalid={bookingValidation.invalidIds.has("name")}
                        />
                      </div>
                    </label>
                    <label className="catalog-field">
                      <span>Email</span>
                      <div className="flex items-center gap-2">
                        <Mail className="size-4 text-emerald-950/42 dark:text-white/42" />
                        <input
                          type="email"
                          value={guestEmail}
                          onChange={(event) => setGuestEmail(event.target.value)}
                          placeholder="email@example.com"
                          aria-label="Email pemesan"
                          aria-invalid={bookingValidation.invalidIds.has("email")}
                        />
                      </div>
                    </label>
                    <label className="catalog-field">
                      <span>No. WhatsApp</span>
                      <div className="flex items-center gap-2">
                        <Phone className="size-4 text-emerald-950/42 dark:text-white/42" />
                        <input
                          value={guestPhone}
                          onChange={(event) => setGuestPhone(event.target.value)}
                          placeholder="+62"
                          aria-label="Nomor WhatsApp pemesan"
                          aria-invalid={bookingValidation.invalidIds.has("phone")}
                        />
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-950/42 dark:text-white/38">
                    Add-on layanan
                  </p>
                  <div className="mt-3 space-y-2">
                    {bookingAddOns.map((addOn) => {
                      const checked = selectedAddOns.includes(addOn.id);

                      return (
                        <button
                          key={addOn.id}
                          type="button"
                          onClick={() => toggleAddOn(addOn.id)}
                          className={cn(
                            "flex w-full items-center justify-between gap-4 rounded-[1.25rem] border p-4 text-left transition-all",
                            checked
                              ? "border-emerald-600/35 bg-emerald-600/10"
                              : "border-emerald-900/10 bg-white/52 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
                          )}
                          aria-pressed={checked}
                        >
                          <span>
                            <span className="block font-semibold text-emerald-950 dark:text-white">
                              {addOn.label}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-emerald-950/52 dark:text-white/48">
                              {addOn.description}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-sm font-bold text-emerald-950 dark:text-white">
                              {formatRupiah(addOn.price)}
                            </span>
                            <span
                              className={cn(
                                "mt-1 inline-flex size-5 items-center justify-center rounded-full border text-xs",
                                checked
                                  ? "border-emerald-700 bg-emerald-700 text-white"
                                  : "border-emerald-900/20 text-transparent dark:border-white/20",
                              )}
                            >
                              ✓
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[1.45rem] border border-emerald-900/10 bg-white/58 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-950/42 dark:text-white/38">
                        Kupon & diskon
                      </p>
                      <p className="mt-1 text-sm text-emerald-950/56 dark:text-white/50">
                        Data promo mock, dihitung real-time.
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        pricing.promo.status === "applied"
                          ? "bg-emerald-700 text-white"
                          : pricing.promo.status === "invalid" || pricing.promo.status === "ineligible"
                            ? "bg-amber-200/65 text-emerald-950 dark:bg-amber-200/18 dark:text-amber-100"
                            : "bg-emerald-900/6 text-emerald-950/55 dark:bg-white/8 dark:text-white/50",
                      )}
                    >
                      {pricing.promo.status === "applied" ? "Aktif" : "Opsional"}
                    </span>
                  </div>

                  <label className="catalog-field mt-4">
                    <span>Promo code</span>
                    <div className="flex items-center gap-2">
                      <Gift className="size-4 text-emerald-950/42 dark:text-white/42" />
                      <input
                        value={promoCode}
                        onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
                        placeholder="VILLAKU10"
                        aria-label="Kode promo"
                      />
                    </div>
                  </label>

                  <div className="mt-3 grid gap-2">
                    {promoCatalog.map((promo) => (
                      <button
                        key={promo.code}
                        type="button"
                        onClick={() => setPromoCode(promo.code)}
                        className={cn(
                          "rounded-[1.1rem] border p-3 text-left transition-all duration-300",
                          promoCode.trim().toUpperCase() === promo.code
                            ? "border-emerald-600/35 bg-emerald-600/10"
                            : "border-emerald-900/10 bg-white/54 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
                        )}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-emerald-950 dark:text-white">
                            {promo.code}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200">
                            {promo.type === "percent" ? `${promo.value}%` : formatCompactRupiah(promo.value)}
                          </span>
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-emerald-950/52 dark:text-white/48">
                          {promo.description}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div
                    className={cn(
                      "mt-3 rounded-[1.1rem] border p-3 text-sm leading-6",
                      pricing.promo.status === "applied"
                        ? "border-emerald-600/20 bg-emerald-600/10 text-emerald-800 dark:text-emerald-100"
                        : pricing.promo.status === "invalid" || pricing.promo.status === "ineligible"
                          ? "border-amber-300/35 bg-amber-100/45 text-emerald-950/70 dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-white/68"
                          : "border-emerald-900/10 bg-emerald-900/5 text-emerald-950/58 dark:border-white/10 dark:bg-white/6 dark:text-white/52",
                    )}
                  >
                    <strong className="block text-emerald-950 dark:text-white">
                      {pricing.promo.label}
                    </strong>
                    <span>{pricing.promo.message}</span>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-emerald-900/10 bg-emerald-900/5 p-4 dark:border-white/10 dark:bg-white/6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-950/42 dark:text-white/38">
                        Rincian harga
                      </p>
                      <p className="mt-1 text-sm text-emerald-950/56 dark:text-white/50">
                        Update otomatis dari tanggal, tamu, add-on, dan kupon.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white">
                      Live
                    </span>
                  </div>

                  <div className="mt-4 space-y-1">
                    <PriceRow
                      label={`Subtotal ${pricing.nights} malam`}
                      helper={`${formatRupiah(villa.price)} / malam`}
                      value={formatRupiah(pricing.subtotal)}
                    />
                  {pricing.guestService > 0 ? (
                    <PriceRow
                      label={`${pricing.extraGuestCount} tamu tambahan`}
                      helper={`${formatRupiah(pricing.extraGuestRate)} / tamu / malam`}
                      value={formatRupiah(pricing.guestService)}
                    />
                  ) : null}
                    <PriceRow
                      label="Add-on layanan"
                      helper={`${selectedAddOns.length} layanan dipilih`}
                      value={formatRupiah(pricing.addOnsTotal)}
                    />
                    <PriceRow
                      label={pricing.promo.code ? `Kupon ${pricing.promo.code}` : "Kupon"}
                      helper={
                        pricing.promo.status === "applied"
                          ? pricing.promo.description
                          : pricing.promo.message
                      }
                      value={pricing.discount > 0 ? `-${formatRupiah(pricing.discount)}` : "-"}
                      tone={pricing.discount > 0 ? "discount" : "muted"}
                    />
                    <div className="my-2 border-t border-emerald-900/10 dark:border-white/10" />
                    <PriceRow
                      label="Dasar kena pajak"
                      helper="Setelah diskon kupon"
                      value={formatRupiah(pricing.taxableAmount)}
                    />
                    <PriceRow
                      label="Service fee"
                      helper="5% dari dasar kena pajak"
                      value={formatRupiah(pricing.service)}
                    />
                    <PriceRow
                      label="Pajak"
                      helper="PPN 11%"
                      value={formatRupiah(pricing.tax)}
                    />
                  </div>
                  <div className="mt-4 border-t border-emerald-900/10 pt-4 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-950 dark:text-white">
                        Total estimasi
                        <span className="mt-1 block text-xs font-medium text-emerald-950/45 dark:text-white/40">
                          Untuk {guests} tamu
                        </span>
                      </span>
                      <AnimatePresence mode="wait">
                        <motion.strong
                          key={pricing.total}
                          className="font-serif text-2xl text-emerald-950 dark:text-white"
                          initial={shouldReduceMotion ? false : { opacity: 0, y: 8, filter: "blur(6px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8, filter: "blur(6px)" }}
                          transition={{ duration: 0.18 }}
                        >
                          {formatRupiah(pricing.total)}
                        </motion.strong>
                      </AnimatePresence>
                    </div>
                    <div className="mt-3 rounded-2xl bg-white/64 p-3 text-sm dark:bg-white/8">
                      <PriceRow label="Deposit 30%" value={formatRupiah(pricing.deposit)} />
                      <PriceRow label="Sisa saat check-in" value={formatRupiah(pricing.remaining)} />
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-[1.4rem] border border-emerald-900/10 bg-white/58 p-4 dark:border-white/10 dark:bg-white/6"
                  aria-live="polite"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-950/42 dark:text-white/38">
                        Validasi booking
                      </p>
                      <p className="mt-1 text-sm text-emerald-950/56 dark:text-white/50">
                        {bookingValidation.validCount}/{bookingValidation.items.length} syarat terpenuhi.
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        canSubmitBooking
                          ? "bg-emerald-700 text-white"
                          : "bg-amber-200/65 text-emerald-950 dark:bg-amber-200/18 dark:text-amber-100",
                      )}
                    >
                      {canSubmitBooking ? "Siap" : "Perlu cek"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {bookingValidation.items.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start gap-2 rounded-2xl px-3 py-2 text-sm",
                          item.valid
                            ? "bg-emerald-600/10 text-emerald-800 dark:text-emerald-100"
                            : "bg-amber-100/55 text-emerald-950/70 dark:bg-amber-200/10 dark:text-white/68",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                            item.valid ? "bg-emerald-700 text-white" : "bg-amber-300 text-emerald-950",
                          )}
                        >
                          {item.valid ? <CheckCircle2 className="size-3.5" /> : <X className="size-3.5" />}
                        </span>
                        <span>
                          <strong className="block text-emerald-950 dark:text-white">{item.label}</strong>
                          {!item.valid ? (
                            <span className="mt-0.5 block text-xs leading-5">{item.message}</span>
                          ) : null}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.4rem] border border-amber-300/35 bg-amber-100/45 p-4 text-sm leading-6 text-emerald-950/70 dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-white/68">
                  <div className="flex items-start gap-3">
                    <CreditCard className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-200" />
                    <p>
                      Booking draft belum memotong pembayaran. Alur checkout, invoice, dan payment
                      gateway akan disambungkan di task berikutnya.
                    </p>
                  </div>
                </div>

                <Button className="w-full" variant="gold" size="lg" type="submit" disabled={!canSubmitBooking}>
                  <CalendarDays />
                  Pesan sekarang
                </Button>
                {!canSubmitBooking ? (
                  <p className="text-center text-xs leading-6 text-amber-700 dark:text-amber-200">
                    Perbaiki item validasi yang belum terpenuhi agar tombol aktif.
                  </p>
                ) : null}
                <p className="text-center text-xs leading-6 text-emerald-950/48 dark:text-white/42">
                  Form ini masih frontend mock; backend booking dan checkout menyusul.
                </p>
              </div>
            </form>
          </aside>
        </div>
      </section>

      <Toast message={toast} />
    </main>
  );
}

function MiniSpec({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/8 p-3">
      <Icon className="size-4 text-amber-200" />
      <p className="mt-2 text-sm font-semibold text-white/84">{label}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/5 px-3 py-1.5 text-emerald-950/58 dark:bg-white/8 dark:text-white/58">
      <span className={cn("size-2 rounded-full", color)} />
      {label}
    </span>
  );
}

function CalendarStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/64 p-3 dark:bg-white/8">
      <p className="font-serif text-2xl font-semibold text-emerald-950 dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-emerald-950/42 dark:text-white/38">
        {label}
      </p>
    </div>
  );
}

function PriceRow({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "discount" | "muted";
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm text-emerald-950/62 dark:text-white/58">
      <span>
        <span className="block">{label}</span>
        {helper ? (
          <span className="mt-0.5 block text-xs text-emerald-950/42 dark:text-white/38">
            {helper}
          </span>
        ) : null}
      </span>
      <AnimatePresence mode="wait">
        <motion.strong
          key={value}
          className={cn(
            "shrink-0 text-right font-semibold",
            tone === "discount"
              ? "text-emerald-700 dark:text-emerald-200"
              : tone === "muted"
                ? "text-emerald-950/56 dark:text-white/52"
                : "text-emerald-950 dark:text-white",
          )}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16 }}
        >
          {value}
        </motion.strong>
      </AnimatePresence>
    </div>
  );
}

function resolvePromoDiscount(rawCode: string, baseAmount: number, nights: number) {
  const code = rawCode.trim().toUpperCase();

  if (!code) {
    return {
      code: "",
      status: "empty" as const,
      label: "Kupon belum diterapkan",
      description: "Pilih kupon atau masukkan kode untuk melihat diskon real-time.",
      message: "Kupon opsional. Estimasi tetap dihitung otomatis tanpa kupon.",
      amount: 0,
      rule: null as PromoRule | null,
    };
  }

  const rule = promoCatalog.find((promo) => promo.code === code);

  if (!rule) {
    return {
      code,
      status: "invalid" as const,
      label: "Kupon tidak ditemukan",
      description: "Kode ini belum tersedia di data promo mock.",
      message: "Coba gunakan VILLAKU10, EARLYBIRD, atau STAY4.",
      amount: 0,
      rule: null as PromoRule | null,
    };
  }

  if (rule.minNights && nights < rule.minNights) {
    return {
      code,
      status: "ineligible" as const,
      label: rule.label,
      description: rule.description,
      message: `${rule.code} membutuhkan minimal ${rule.minNights} malam. Pilih tanggal lebih panjang untuk memakai kupon ini.`,
      amount: 0,
      rule,
    };
  }

  if (rule.minSubtotal && baseAmount < rule.minSubtotal) {
    return {
      code,
      status: "ineligible" as const,
      label: rule.label,
      description: rule.description,
      message: `${rule.code} membutuhkan subtotal minimal ${formatRupiah(rule.minSubtotal)}.`,
      amount: 0,
      rule,
    };
  }

  const rawDiscount =
    rule.type === "percent"
      ? Math.round(baseAmount * (rule.value / 100))
      : rule.value;
  const amount = Math.min(rawDiscount, rule.maxDiscount ?? rawDiscount, baseAmount);

  return {
    code,
    status: "applied" as const,
    label: rule.label,
    description: rule.description,
    message: `${rule.code} aktif. Kamu hemat ${formatRupiah(amount)} dari tarif menginap.`,
    amount,
    rule,
  };
}

function buildBookingCalendar(villaId: string, basePrice: number): CalendarCell[] {
  const year = 2026;
  const monthIndex = 7;
  const daysInMonth = 31;
  const firstDay = new Date(Date.UTC(year, monthIndex, 1));
  const mondayFirstOffset = (firstDay.getUTCDay() + 6) % 7;
  const overrides = availabilityByVilla[villaId] ?? {};
  const cells: CalendarCell[] = Array.from({ length: mondayFirstOffset }, (_, index) => ({
    type: "blank",
    id: `blank-${index}`,
  }));

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const override = overrides[day];
    const status = override?.status ?? "available";
    const parsedDate = parseDateOnly(date);
    const isWeekend = parsedDate ? [5, 6].includes(parsedDate.getUTCDay()) : false;
    const price = status === "available" ? (isWeekend ? Math.round(basePrice * 1.12) : basePrice) : null;

    cells.push({
      type: "day",
      date,
      day,
      status,
      price,
      note: override?.note,
    });
  }

  return cells;
}

function getCalendarSummary(cells: CalendarCell[]) {
  return cells.reduce(
    (summary, cell) => {
      if (cell.type !== "day") return summary;
      if (cell.status === "available") summary.available += 1;
      else summary.unavailable += 1;
      return summary;
    },
    { available: 0, unavailable: 0 },
  );
}

function rangeHasUnavailableDate(startDate: string, endDate: string, cells: CalendarCell[]) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end || end.getTime() <= start.getTime()) return false;

  return cells.some((cell) => {
    if (cell.type !== "day" || cell.status === "available") return false;
    return cell.date >= startDate && cell.date < endDate;
  });
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

function formatShortDate(value: string) {
  const date = parseDateOnly(value);
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatCompactRupiah(value: number) {
  if (value >= 1_000_000) {
    const compact = value / 1_000_000;
    return `Rp${compact.toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })}jt`;
  }

  return formatRupiah(value);
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
