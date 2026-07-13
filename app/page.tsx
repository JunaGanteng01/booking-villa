"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowUp,
  ArrowUpRight,
  Bath,
  BedDouble,
  Bell,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Heart,
  MapPin,
  Menu,
  Moon,
  Play,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Users,
  Utensils,
  Waves,
  Wifi,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Icon = ComponentType<{ className?: string }>;

const navItems = [
  { id: "home", label: "Home" },
  { id: "about", label: "Experience" },
  { id: "villas", label: "Villas" },
  { id: "gallery", label: "Gallery" },
  { id: "reviews", label: "Reviews" },
  { id: "faq", label: "FAQ" },
];

const heroMetrics = [
  { label: "Premium Villas", value: 38, suffix: "+" },
  { label: "Average Rating", value: 4.9, suffix: "/5", decimal: true },
  { label: "Guest Nights", value: 12800, suffix: "+" },
];

const features: Array<{
  title: string;
  description: string;
  icon: Icon;
}> = [
  {
    title: "Booking real-time",
    description:
      "Cari tanggal, jumlah tamu, dan estimasi harga tanpa menunggu respon manual.",
    icon: CalendarDays,
  },
  {
    title: "Pembayaran aman",
    description:
      "Dirancang untuk Midtrans, Stripe, transfer manual, invoice, dan bukti bayar.",
    icon: CreditCard,
  },
  {
    title: "Operasional rapi",
    description:
      "Siap dikembangkan menjadi dashboard admin, kalender, laporan, dan notifikasi.",
    icon: ShieldCheck,
  },
];

const villas = [
  {
    name: "Villa Aruna Cliffside",
    location: "Uluwatu, Bali",
    price: "Rp4.800.000",
    rating: "4.96",
    guests: "8 tamu",
    beds: "4 kamar",
    baths: "4 bath",
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=85",
    tags: ["Infinity Pool", "Sunset Deck", "Private Chef"],
  },
  {
    name: "Nara Jungle Residence",
    location: "Ubud, Bali",
    price: "Rp3.650.000",
    rating: "4.92",
    guests: "6 tamu",
    beds: "3 kamar",
    baths: "3 bath",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85",
    tags: ["Forest View", "Spa Room", "Breakfast"],
  },
  {
    name: "Sagara Beach House",
    location: "Canggu, Bali",
    price: "Rp5.250.000",
    rating: "4.98",
    guests: "10 tamu",
    beds: "5 kamar",
    baths: "5 bath",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85",
    tags: ["Beach Access", "Media Room", "Concierge"],
  },
];

const gallery = [
  {
    title: "Private infinity pool",
    className: "md:col-span-2 md:row-span-2",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Warm tropical bedroom",
    className: "",
    image:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Dining under palm trees",
    className: "",
    image:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Soft sunrise lounge",
    className: "md:col-span-2",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
  },
];

const amenities: Array<{ label: string; icon: Icon }> = [
  { label: "High-speed WiFi", icon: Wifi },
  { label: "Private pool", icon: Waves },
  { label: "Airport pickup", icon: Car },
  { label: "Private chef", icon: Utensils },
];

const reviews = [
  {
    quote:
      "Pengalaman booking terasa seperti concierge hotel bintang lima. Cepat, tenang, dan detailnya jelas.",
    name: "Maya Putri",
    role: "Family Trip, Jakarta",
  },
  {
    quote:
      "Visual villanya premium, form pencariannya enak dipakai, dan proses checkout terasa meyakinkan.",
    name: "Raka Aditya",
    role: "Founder Retreat",
  },
  {
    quote:
      "Kami bisa membandingkan villa, kapasitas, dan fasilitas tanpa bolak-balik chat. Sangat efisien.",
    name: "Sofia Tan",
    role: "Honeymoon Guest",
  },
];

const faqs = [
  {
    question: "Apakah website ini sudah siap untuk integrasi pembayaran?",
    answer:
      "Frontend ini sudah menyiapkan alur, komponen, dan copy untuk Midtrans, Stripe, transfer manual, invoice, dan bukti pembayaran. Integrasi backend dapat ditambahkan pada fase berikutnya.",
  },
  {
    question: "Bagaimana mode gelap dan terang bekerja?",
    answer:
      "Pengunjung dapat mengganti tema secara manual. Pilihan disimpan di browser dan desain menjaga kontras emerald, gold, beige, dan soft gray agar tetap elegan di kedua mode.",
  },
  {
    question: "Apakah animasi aman untuk mobile?",
    answer:
      "Animasi memakai transform dan opacity, mendukung prefers-reduced-motion, serta memakai lazy image loading agar tetap ringan pada perangkat mobile.",
  },
  {
    question: "Apakah dashboard admin sudah termasuk?",
    answer:
      "PRD sudah dipetakan ke arah dashboard admin, kalender, role, laporan, dan notifikasi. Versi ini fokus pada frontend publik premium sebagai fondasi pengalaman booking.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 34, filter: "blur(14px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export default function Home() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("home");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showLoader, setShowLoader] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll();
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const skyY = useTransform(heroProgress, [0, 1], ["0%", "18%"]);
  const mountainY = useTransform(heroProgress, [0, 1], ["0%", "34%"]);
  const treeY = useTransform(heroProgress, [0, 1], ["0%", "54%"]);
  const heroScale = useTransform(heroProgress, [0, 1], [1, 1.14]);
  const heroOpacity = useTransform(heroProgress, [0, 0.72], [1, 0.2]);
  const floatingRotate = useTransform(heroProgress, [0, 1], [0, -8]);

  const navMap = useMemo(() => navItems, []);

  useEffect(() => {
    const savedTheme =
      typeof window !== "undefined"
        ? window.localStorage.getItem("villaku-theme")
        : null;
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light";

    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  useEffect(() => {
    const loaderTimer = window.setTimeout(() => setShowLoader(false), 820);
    return () => window.clearTimeout(loaderTimer);
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry?.target.id) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      { rootMargin: "-42% 0px -50% 0px", threshold: 0.01 },
    );

    navMap.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [navMap]);

  useEffect(() => {
    if (shouldReduceMotion) return;

    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".gsap-reveal").forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 52, filter: "blur(16px)" },
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.95,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 86%",
            },
          },
        );
      });

      gsap.to(".gallery-parallax", {
        y: -78,
        scale: 1.035,
        ease: "none",
        scrollTrigger: {
          trigger: "#gallery",
          start: "top bottom",
          end: "bottom top",
          scrub: 0.7,
        },
      });

      gsap.to(".cta-orb", {
        y: -92,
        rotate: 22,
        scale: 1.08,
        ease: "none",
        scrollTrigger: {
          trigger: "#cta",
          start: "top bottom",
          end: "bottom top",
          scrub: 0.8,
        },
      });

      gsap.to(".about-floating-card", {
        y: -44,
        rotate: -2,
        ease: "none",
        scrollTrigger: {
          trigger: "#about",
          start: "top bottom",
          end: "bottom top",
          scrub: 0.9,
        },
      });
    }, rootRef);

    return () => context.revert();
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("villaku-theme", next);
      return next;
    });
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: shouldReduceMotion ? "auto" : "smooth",
      block: "start",
    });
    setIsDrawerOpen(false);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams({
      location: String(formData.get("location") ?? "Semua Lokasi"),
      guests: String(formData.get("guests") ?? "2"),
      checkIn: String(formData.get("checkIn") ?? ""),
      checkOut: String(formData.get("checkOut") ?? ""),
      available: "true",
    });

    setToast("Kriteria pencarian diterapkan. Membuka katalog villa terbaik.");
    router.push(`/villas?${params.toString()}`);
  };

  return (
    <div ref={rootRef} className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <motion.div
        aria-hidden
        className="fixed left-0 top-0 z-[80] h-1 w-full origin-left bg-[linear-gradient(90deg,#047857,#d6a84f,#f7d98c)]"
        style={{ scaleX: progressScale }}
      />

      <LuxuryLoader show={showLoader} />

      <Navbar
        activeSection={activeSection}
        isScrolled={isScrolled}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onScrollTo={scrollToSection}
        onToggleTheme={toggleTheme}
        theme={theme}
      />

      <MobileDrawer
        activeSection={activeSection}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onScrollTo={scrollToSection}
        onToggleTheme={toggleTheme}
        theme={theme}
      />

      <motion.main
        initial={shouldReduceMotion ? false : { opacity: 0, filter: "blur(14px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      >
        <section
          id="home"
          ref={heroRef}
          data-snap
          className="relative flex min-h-screen items-center overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:px-8"
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 hero-image"
            style={{ scale: shouldReduceMotion ? 1 : heroScale, opacity: heroOpacity }}
          />
          <motion.div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[45%] bg-[radial-gradient(circle_at_20%_15%,rgba(247,217,140,0.42),transparent_28%),linear-gradient(180deg,rgba(187,232,230,0.55),transparent)]"
            style={{ y: shouldReduceMotion ? 0 : skyY }}
          />
          <motion.div
            aria-hidden
            className="mountain-layer mountain-layer-back"
            style={{ y: shouldReduceMotion ? 0 : mountainY }}
          />
          <motion.div
            aria-hidden
            className="mountain-layer mountain-layer-front"
            style={{ y: shouldReduceMotion ? 0 : treeY }}
          />
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,34,28,0.92),rgba(4,34,28,0.58)_42%,rgba(4,34,28,0.18)),linear-gradient(0deg,rgba(245,240,232,1)_0%,rgba(245,240,232,0)_28%)] dark:bg-[linear-gradient(90deg,rgba(2,18,15,0.96),rgba(2,18,15,0.68)_42%,rgba(2,18,15,0.24)),linear-gradient(0deg,rgba(7,18,17,1)_0%,rgba(7,18,17,0)_28%)]" />

          <div className="container relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-3xl">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <SectionBadge icon={Sparkles}>Luxury villa booking experience</SectionBadge>
              </motion.div>

              <h1 className="mt-7 max-w-4xl font-serif text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-white sm:text-6xl md:text-7xl xl:text-[6.7rem]">
                <TextReveal text="Temukan villa premium untuk momen yang terasa privat." />
              </h1>

              <motion.p
                className="mt-7 max-w-2xl text-base leading-8 text-white/78 sm:text-lg"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.35, duration: 0.8, ease: "easeOut" }}
              >
                Villaku menghadirkan pencarian villa, ketersediaan, ringkasan harga, pembayaran,
                dan pengalaman tamu dalam satu alur elegan yang siap dikembangkan menjadi sistem
                full-stack booking.
              </motion.p>

              <motion.div
                className="mt-9 flex flex-col gap-3 sm:flex-row"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.5, duration: 0.75, ease: "easeOut" }}
              >
                <Button size="lg" variant="gold" type="button" onClick={() => scrollToSection("villas")}>
                  Jelajahi villa
                  <ArrowUpRight className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  type="button"
                  onClick={() => setTourOpen(true)}
                  className="border-white/25 bg-white/12 text-white hover:bg-white/20 dark:bg-white/10"
                >
                  <Play className="fill-current" />
                  Lihat konsep tour
                </Button>
              </motion.div>

              <motion.div
                className="mt-10 grid max-w-2xl grid-cols-3 gap-3"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.62 } },
                }}
              >
                {heroMetrics.map((metric) => (
                  <motion.div
                    key={metric.label}
                    variants={fadeUp}
                    className="rounded-3xl border border-white/12 bg-white/10 p-4 text-white shadow-2xl backdrop-blur-xl"
                  >
                    <div className="font-serif text-2xl font-semibold sm:text-3xl">
                      <Counter value={metric.value} suffix={metric.suffix} decimal={metric.decimal} />
                    </div>
                    <p className="mt-1 text-[0.68rem] uppercase tracking-[0.22em] text-white/58">
                      {metric.label}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div
              className="relative"
              initial={shouldReduceMotion ? false : { opacity: 0, x: 42, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.9, ease: "easeOut" }}
            >
              <BookingForm onSubmit={handleSearch} />
              <motion.div
                aria-hidden
                className="floating-badge hidden sm:block"
                animate={shouldReduceMotion ? undefined : { y: [0, -14, 0], rotate: [0, 2, 0] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
                style={{ rotate: shouldReduceMotion ? 0 : floatingRotate }}
              >
                <span className="text-xs uppercase tracking-[0.26em] text-emerald-950/50">
                  Verified stay
                </span>
                <strong className="mt-1 block font-serif text-2xl text-emerald-950">24/7</strong>
                <span className="text-sm text-emerald-950/65">Concierge support</span>
              </motion.div>
            </motion.div>
          </div>

          <motion.button
            type="button"
            aria-label="Scroll ke section berikutnya"
            onClick={() => scrollToSection("about")}
            className="absolute bottom-7 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs uppercase tracking-[0.28em] text-white/65 md:flex"
            animate={shouldReduceMotion ? undefined : { y: [0, 10, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            Scroll
            <span className="h-12 w-px overflow-hidden rounded-full bg-white/22">
              <span className="block h-5 w-px animate-scroll-indicator bg-amber-200" />
            </span>
          </motion.button>
        </section>

        <section id="about" data-snap className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
          <div aria-hidden className="gradient-movement absolute inset-0 opacity-70" />
          <div className="container relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="gsap-reveal relative">
              <div className="about-image-shell about-floating-card">
                <img
                  src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=85"
                  alt="Area resort tropis dengan kolam renang dan villa premium"
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/55 via-transparent to-white/5" />
              </div>
              <div className="absolute -bottom-8 -right-2 rounded-[2rem] border border-white/50 bg-white/82 p-5 shadow-[0_28px_80px_rgba(4,34,28,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 sm:right-8">
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-full bg-emerald-700 text-white">
                    <Bell className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-950 dark:text-white">
                      Real-time notification
                    </p>
                    <p className="text-xs text-emerald-950/58 dark:text-white/58">
                      Invoice, reminder, dan review flow
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="gsap-reveal">
              <SectionBadge icon={Waves}>Resort-grade product design</SectionBadge>
              <h2 className="mt-5 max-w-3xl font-serif text-4xl font-semibold tracking-[-0.045em] text-emerald-950 dark:text-white sm:text-5xl">
                Pengalaman booking yang terasa tenang, indah, dan sangat praktis.
              </h2>
              <p className="mt-5 max-w-2xl leading-8 text-emerald-950/66 dark:text-white/65">
                Layout dibuat clean dan mobile-first: hero fullscreen, pencarian cepat,
                rekomendasi villa, galeri visual, ulasan, FAQ, hingga fondasi informasi untuk
                checkout, admin, kalender, dan notifikasi.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {features.map((feature) => (
                  <FeatureCard key={feature.title} {...feature} />
                ))}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-4">
                {amenities.map((amenity) => (
                  <div
                    key={amenity.label}
                    className="card-lift rounded-3xl border border-emerald-900/10 bg-white/70 p-4 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
                  >
                    <amenity.icon className="mx-auto size-5 text-amber-600 dark:text-amber-300" />
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-950/60 dark:text-white/55">
                      {amenity.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="villas" data-snap className="relative px-4 py-24 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="gsap-reveal flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <SectionBadge icon={Heart}>Curated villa collection</SectionBadge>
                <h2 className="mt-5 max-w-3xl font-serif text-4xl font-semibold tracking-[-0.045em] text-emerald-950 dark:text-white sm:text-5xl">
                  Villa pilihan dengan detail yang mudah dibandingkan.
                </h2>
              </div>
              <Button asChild variant="outline">
                <Link href="/villas">
                  <Search />
                  Filter katalog
                </Link>
              </Button>
            </div>

            <motion.div
              className="mt-10 grid gap-6 lg:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.22 }}
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: 0.14 },
                },
              }}
            >
              {villas.map((villa) => (
                <VillaCard
                  key={villa.name}
                  villa={villa}
                  onReserve={() =>
                    setToast(`${villa.name} ditambahkan ke shortlist booking Anda.`)
                  }
                />
              ))}
            </motion.div>
          </div>
        </section>

        <section id="gallery" className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="gsap-reveal mx-auto max-w-3xl text-center">
              <SectionBadge icon={Sparkles}>Immersive visual gallery</SectionBadge>
              <h2 className="mt-5 font-serif text-4xl font-semibold tracking-[-0.045em] text-emerald-950 dark:text-white sm:text-5xl">
                Ruang, cahaya, dan tekstur dibuat berbicara.
              </h2>
              <p className="mt-5 leading-8 text-emerald-950/65 dark:text-white/62">
                Section galeri memakai hover zoom, parallax halus, dan lazy loading untuk menjaga
                nuansa premium tanpa mengorbankan performa.
              </p>
            </div>

            <div className="gallery-parallax mt-12 grid auto-rows-[260px] gap-4 md:grid-cols-4 md:auto-rows-[220px]">
              {gallery.map((item) => (
                <figure
                  key={item.title}
                  className={cn(
                    "image-hover group relative overflow-hidden rounded-[2rem] bg-emerald-950 shadow-[0_28px_80px_rgba(4,34,28,0.18)]",
                    item.className,
                  )}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-emerald-950/78 to-transparent p-6 text-white">
                    <p className="font-serif text-2xl font-semibold">{item.title}</p>
                    <span className="mt-2 inline-block text-xs uppercase tracking-[0.24em] text-white/60">
                      Parallax layer
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="reviews" className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
          <div aria-hidden className="testimonial-bg absolute inset-0" />
          <div className="container relative z-10 mx-auto max-w-7xl">
            <div className="gsap-reveal mx-auto max-w-3xl text-center">
              <SectionBadge icon={Quote}>Guest stories</SectionBadge>
              <h2 className="mt-5 font-serif text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">
                Kepercayaan dibangun dari pengalaman yang jelas.
              </h2>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {reviews.map((review, index) => (
                <motion.article
                  key={review.name}
                  className="card-lift rounded-[2rem] border border-white/12 bg-white/10 p-7 text-white shadow-2xl backdrop-blur-2xl"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 32, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: index * 0.09, duration: 0.65, ease: "easeOut" }}
                >
                  <div className="flex gap-1 text-amber-200">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star key={starIndex} className="size-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-6 text-lg leading-8 text-white/82">“{review.quote}”</p>
                  <div className="mt-7 border-t border-white/12 pt-5">
                    <p className="font-semibold">{review.name}</p>
                    <p className="text-sm text-white/55">{review.role}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="container mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="gsap-reveal">
              <SectionBadge icon={CheckCircle2}>Helpful details</SectionBadge>
              <h2 className="mt-5 font-serif text-4xl font-semibold tracking-[-0.045em] text-emerald-950 dark:text-white sm:text-5xl">
                Pertanyaan penting sebelum tamu menekan tombol booking.
              </h2>
              <p className="mt-5 leading-8 text-emerald-950/64 dark:text-white/62">
                FAQ memakai accordion shadcn/Radix-style dengan micro-interaction halus dan konten
                yang menyiapkan ekspektasi produk dari PRD.
              </p>
            </div>

            <AccordionPrimitive.Root type="single" collapsible className="gsap-reveal space-y-4">
              {faqs.map((faq, index) => (
                <AccordionPrimitive.Item
                  key={faq.question}
                  value={`faq-${index}`}
                  className="overflow-hidden rounded-[1.6rem] border border-emerald-900/10 bg-white/74 shadow-sm backdrop-blur-xl transition-colors data-[state=open]:border-amber-400/45 dark:border-white/10 dark:bg-white/5"
                >
                  <AccordionPrimitive.Header>
                    <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-5 px-6 py-5 text-left font-semibold text-emerald-950 outline-none transition-colors hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-amber-300 dark:text-white dark:hover:text-amber-100">
                      {faq.question}
                      <ChevronDown className="size-5 shrink-0 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
                  <AccordionPrimitive.Content className="accordion-content overflow-hidden px-6 text-emerald-950/66 dark:text-white/62">
                    <p className="pb-6 leading-8">{faq.answer}</p>
                  </AccordionPrimitive.Content>
                </AccordionPrimitive.Item>
              ))}
            </AccordionPrimitive.Root>
          </div>
        </section>

        <section id="cta" data-snap className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
          <div aria-hidden className="cta-orb absolute -left-24 top-10 size-72 rounded-full bg-amber-300/30 blur-3xl" />
          <div aria-hidden className="cta-orb absolute -right-28 bottom-0 size-96 rounded-full bg-emerald-500/25 blur-3xl" />
          <div className="container relative z-10 mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-emerald-950 px-6 py-14 text-white shadow-[0_35px_100px_rgba(4,34,28,0.28)] sm:px-10 lg:px-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(247,217,140,0.24),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent)]" />
            <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <SectionBadge icon={Sparkles} dark>
                  Premium booking system
                </SectionBadge>
                <h2 className="mt-6 font-serif text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                  Siap membawa brand villa ke pengalaman digital yang terasa mahal.
                </h2>
                <p className="mt-5 max-w-2xl leading-8 text-white/68">
                  Landing page ini sudah mengunci arah visual, animasi, struktur informasi, dan
                  interaksi utama untuk pengembangan booking, pembayaran, akun, dan admin.
                </p>
              </div>
              <div className="rounded-[2rem] border border-white/12 bg-white/10 p-5 backdrop-blur-xl">
                <div className="grid gap-3">
                  {["Search availability", "Review total price", "Secure checkout", "Admin calendar sync"].map(
                    (step, index) => (
                      <div key={step} className="flex items-center gap-3 rounded-2xl bg-white/8 p-4">
                        <span className="grid size-9 place-items-center rounded-full bg-amber-200 text-sm font-bold text-emerald-950">
                          {index + 1}
                        </span>
                        <span className="font-medium text-white/85">{step}</span>
                      </div>
                    ),
                  )}
                </div>
                <Button
                  className="mt-5 w-full"
                  variant="gold"
                  size="lg"
                  type="button"
                  onClick={() => scrollToSection("home")}
                >
                  Mulai cari villa
                  <ArrowUpRight />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </motion.main>

      <Footer onScrollTo={scrollToSection} />

      <BackToTop visible={isScrolled} onClick={() => scrollToSection("home")} />
      <Toast message={toast} />
      <TourDialog open={tourOpen} onOpenChange={setTourOpen} />
    </div>
  );
}

function Navbar({
  activeSection,
  isScrolled,
  onOpenDrawer,
  onScrollTo,
  onToggleTheme,
  theme,
}: {
  activeSection: string;
  isScrolled: boolean;
  onOpenDrawer: () => void;
  onScrollTo: (id: string) => void;
  onToggleTheme: () => void;
  theme: "light" | "dark";
}) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        isScrolled ? "py-3" : "py-5",
      )}
    >
      <div
        className={cn(
          "container mx-auto flex max-w-7xl items-center justify-between rounded-full px-4 transition-all duration-300 sm:px-5",
          isScrolled
            ? "border border-emerald-900/10 bg-white/78 shadow-[0_20px_80px_rgba(4,34,28,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-emerald-950/72"
            : "bg-white/8 text-white backdrop-blur-sm",
        )}
      >
        <button
          type="button"
          onClick={() => onScrollTo("home")}
          className="flex items-center gap-3 py-3 text-left"
          aria-label="Kembali ke home"
        >
          <span className="grid size-10 place-items-center rounded-full bg-emerald-700 text-sm font-bold text-white shadow-lg">
            V
          </span>
          <span>
            <span className={cn("block font-serif text-xl font-semibold", isScrolled ? "text-emerald-950 dark:text-white" : "text-white")}>
              Villaku
            </span>
            <span className={cn("block text-[0.62rem] uppercase tracking-[0.24em]", isScrolled ? "text-emerald-950/48 dark:text-white/45" : "text-white/58")}>
              Private Resorts
            </span>
          </span>
        </button>

        <nav className="hidden items-center rounded-full border border-current/10 bg-white/10 p-1 backdrop-blur-xl lg:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onScrollTo(item.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                activeSection === item.id
                  ? "bg-emerald-700 text-white shadow-lg"
                  : isScrolled
                    ? "text-emerald-950/62 hover:text-emerald-700 dark:text-white/68 dark:hover:text-white"
                    : "text-white/72 hover:text-white",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            aria-label="Toggle dark and light mode"
            className={cn(!isScrolled && "text-white hover:bg-white/12")}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
          <Button
            type="button"
            variant="gold"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => onScrollTo("home")}
          >
            Book now
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onOpenDrawer}
            aria-label="Buka menu"
            className={cn("lg:hidden", !isScrolled && "border-white/20 bg-white/12 text-white")}
          >
            <Menu />
          </Button>
        </div>
      </div>
    </header>
  );
}

function MobileDrawer({
  activeSection,
  open,
  onClose,
  onScrollTo,
  onToggleTheme,
  theme,
}: {
  activeSection: string;
  open: boolean;
  onClose: () => void;
  onScrollTo: (id: string) => void;
  onToggleTheme: () => void;
  theme: "light" | "dark";
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            aria-label="Tutup menu"
            className="absolute inset-0 bg-emerald-950/55 backdrop-blur-sm"
            type="button"
            onClick={onClose}
          />
          <motion.aside
            className="absolute right-3 top-3 h-[calc(100%-1.5rem)] w-[min(92vw,390px)] overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-[#fbf7ef] p-5 shadow-2xl dark:border-white/10 dark:bg-[#071211]"
            initial={{ x: 420, opacity: 0.7 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 250 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-serif text-2xl font-semibold text-emerald-950 dark:text-white">
                  Villaku
                </p>
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-950/45 dark:text-white/45">
                  Mobile menu
                </p>
              </div>
              <Button type="button" size="icon" variant="outline" onClick={onClose} aria-label="Tutup drawer">
                <X />
              </Button>
            </div>

            <div className="mt-8 grid gap-2">
              {navItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => onScrollTo(item.id)}
                  className={cn(
                    "flex items-center justify-between rounded-2xl px-4 py-4 text-left font-medium transition-all",
                    activeSection === item.id
                      ? "bg-emerald-700 text-white shadow-lg"
                      : "bg-white/55 text-emerald-950 hover:bg-white dark:bg-white/6 dark:text-white dark:hover:bg-white/10",
                  )}
                >
                  {item.label}
                  <ArrowUpRight className="size-4" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onToggleTheme}
              className="mt-5 flex w-full items-center justify-between rounded-2xl border border-emerald-900/10 bg-white/60 px-4 py-4 text-emerald-950 dark:border-white/10 dark:bg-white/6 dark:text-white"
            >
              {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <div className="mt-6 rounded-[1.5rem] bg-emerald-950 p-5 text-white">
              <p className="font-serif text-2xl">Book a private escape</p>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Cari villa, cek tanggal, lalu lanjutkan ke alur checkout premium.
              </p>
              <Button className="mt-4 w-full" variant="gold" type="button" onClick={() => onScrollTo("home")}>
                Start search
              </Button>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function BookingForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    setIsChecking(true);
    window.setTimeout(() => setIsChecking(false), 1100);
    onSubmit(event);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="booking-glass relative overflow-hidden rounded-[2.25rem] border border-white/20 p-4 shadow-[0_35px_100px_rgba(0,0,0,0.26)] backdrop-blur-2xl sm:p-6"
    >
      <div className="absolute -right-16 -top-16 size-44 rounded-full bg-amber-200/25 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/56">Search booking</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-white">
              Rancang stay Anda
            </h2>
          </div>
          <div className="rounded-2xl bg-white/12 px-3 py-2 text-right text-white">
            <p className="text-xs text-white/55">From</p>
            <p className="font-semibold">Rp3.6jt</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <label className="booking-field">
            <span>Lokasi</span>
            <select name="location" defaultValue="Semua Lokasi" aria-label="Pilih lokasi villa">
              <option value="Semua Lokasi">Bali - All destinations</option>
              <option value="Uluwatu">Uluwatu</option>
              <option value="Ubud">Ubud</option>
              <option value="Canggu">Canggu</option>
              <option value="Nusa Dua">Nusa Dua</option>
              <option value="Seminyak">Seminyak</option>
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="booking-field">
              <span>Check-in</span>
              <input name="checkIn" type="date" defaultValue="2026-08-14" aria-label="Tanggal check-in" />
            </label>
            <label className="booking-field">
              <span>Check-out</span>
              <input name="checkOut" type="date" defaultValue="2026-08-17" aria-label="Tanggal check-out" />
            </label>
          </div>

          <label className="booking-field">
            <span>Total tamu</span>
            <select name="guests" defaultValue="6" aria-label="Jumlah tamu">
              <option value="2">2 guests</option>
              <option value="4">4 guests</option>
              <option value="6">6 guests</option>
              <option value="8">8 guests</option>
              <option value="10">10+ guests</option>
            </select>
          </label>
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-white/12 bg-white/10 p-4">
          <div className="flex items-center justify-between gap-4 text-white">
            <span className="text-sm text-white/60">Estimasi total</span>
            {isChecking ? (
              <span className="skeleton-line h-7 w-32 rounded-full" />
            ) : (
              <strong className="font-serif text-2xl">Rp14.400.000</strong>
            )}
          </div>
          <div className="mt-4 grid gap-2 text-sm text-white/62">
            <span className="flex items-center justify-between">
              Villa subtotal <strong className="font-medium text-white/78">3 malam</strong>
            </span>
            <span className="flex items-center justify-between">
              Tax & service <strong className="font-medium text-white/78">Included</strong>
            </span>
          </div>
        </div>

        <Button className="mt-5 w-full" variant="gold" size="lg" type="submit">
          <Search />
          Cek ketersediaan
        </Button>
      </div>
    </form>
  );
}

function SectionBadge({
  children,
  dark = false,
  icon: IconComponent,
}: {
  children: React.ReactNode;
  dark?: boolean;
  icon: Icon;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] backdrop-blur-xl",
        dark
          ? "border-white/15 bg-white/10 text-white/72"
          : "border-emerald-900/10 bg-white/62 text-emerald-900/62 dark:border-white/10 dark:bg-white/8 dark:text-white/62",
      )}
    >
      <IconComponent className="size-4 text-amber-500 dark:text-amber-300" />
      {children}
    </span>
  );
}

function TextReveal({ text }: { text: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      {text.split(" ").map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className="inline-block pr-[0.18em]"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 28, rotateX: -18, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.08 + index * 0.045, duration: 0.72, ease: "easeOut" }}
        >
          {word}
        </motion.span>
      ))}
    </>
  );
}

function Counter({
  value,
  suffix,
  decimal = false,
}: {
  value: number;
  suffix: string;
  decimal?: boolean;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const shouldReduceMotion = useReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (shouldReduceMotion) {
      setCount(value);
      return;
    }

    const start = performance.now();
    const duration = 1450;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [decimal, inView, shouldReduceMotion, value]);

  return (
    <span ref={ref}>
      {decimal ? count.toFixed(1) : Math.round(count).toLocaleString("id-ID")}
      {suffix}
    </span>
  );
}

function FeatureCard({
  title,
  description,
  icon: IconComponent,
}: {
  title: string;
  description: string;
  icon: Icon;
}) {
  return (
    <article className="card-lift rounded-[1.75rem] border border-emerald-900/10 bg-white/74 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <div className="grid size-12 place-items-center rounded-2xl bg-emerald-700 text-white shadow-lg">
        <IconComponent className="size-5" />
      </div>
      <h3 className="mt-5 font-serif text-xl font-semibold text-emerald-950 dark:text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-emerald-950/62 dark:text-white/58">{description}</p>
    </article>
  );
}

function VillaCard({
  villa,
  onReserve,
}: {
  villa: (typeof villas)[number];
  onReserve: () => void;
}) {
  return (
    <motion.article
      variants={fadeUp}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="card-lift overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-white/78 shadow-[0_24px_70px_rgba(4,34,28,0.1)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
    >
      <div className="image-hover relative aspect-[1.16] overflow-hidden bg-emerald-950">
        <img src={villa.image} alt={villa.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/58 via-transparent to-transparent" />
        <button
          type="button"
          aria-label={`Tambahkan ${villa.name} ke wishlist`}
          className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/82 text-emerald-950 shadow-lg backdrop-blur-xl transition-transform duration-300 hover:scale-110"
        >
          <Heart className="size-5" />
        </button>
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/58">{villa.location}</p>
            <h3 className="mt-1 font-serif text-2xl font-semibold">{villa.name}</h3>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-white/14 px-3 py-2 text-sm backdrop-blur-xl">
            <Star className="size-4 fill-amber-200 text-amber-200" />
            {villa.rating}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          {villa.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-emerald-900/10 bg-emerald-900/5 px-3 py-1 text-xs font-medium text-emerald-950/62 dark:border-white/10 dark:bg-white/8 dark:text-white/62"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-sm text-emerald-950/58 dark:text-white/58">
          <span className="flex items-center gap-1.5"><Users className="size-4" /> {villa.guests}</span>
          <span className="flex items-center gap-1.5"><BedDouble className="size-4" /> {villa.beds}</span>
          <span className="flex items-center gap-1.5"><Bath className="size-4" /> {villa.baths}</span>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-950/42 dark:text-white/38">
              per malam
            </p>
            <p className="font-serif text-2xl font-semibold text-emerald-950 dark:text-white">
              {villa.price}
            </p>
          </div>
          <Button type="button" variant="default" onClick={onReserve}>
            Shortlist
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

function LuxuryLoader({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center bg-[#f5f0e8] text-emerald-950 dark:bg-[#071211] dark:text-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          aria-hidden
        >
          <motion.div
            className="relative grid place-items-center"
            animate={{ scale: [0.96, 1, 0.96], rotate: [0, 2, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="absolute size-28 rounded-full border border-amber-300/50" />
            <span className="absolute size-20 rounded-full border border-emerald-700/30" />
            <span className="font-serif text-3xl font-semibold">Villaku</span>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          className="fixed bottom-6 left-1/2 z-[90] w-[min(92vw,520px)] -translate-x-1/2 rounded-2xl border border-emerald-900/10 bg-white/90 p-4 text-emerald-950 shadow-[0_24px_80px_rgba(4,34,28,0.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-emerald-950/88 dark:text-white"
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
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function TourDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[75] bg-emerald-950/65 backdrop-blur-md data-[state=open]:animate-overlay-show" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[80] w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-white/15 bg-[#fbf7ef] p-0 shadow-2xl outline-none data-[state=open]:animate-content-show dark:bg-[#071211]">
          <div className="relative aspect-video overflow-hidden bg-emerald-950">
            <img
              src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=85"
              alt="Virtual tour villa modern dengan kolam renang"
              className="h-full w-full object-cover opacity-78"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 grid place-items-center bg-emerald-950/35">
              <div className="grid size-20 place-items-center rounded-full bg-white/18 text-white backdrop-blur-xl">
                <Play className="size-9 fill-current" />
              </div>
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <DialogPrimitive.Title className="font-serif text-3xl font-semibold tracking-[-0.03em] text-emerald-950 dark:text-white">
              Konsep virtual villa tour
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-3 leading-7 text-emerald-950/62 dark:text-white/62">
              Modal ini menunjukkan pola interaksi untuk preview video, gallery detail, atau
              langkah awal booking tanpa meninggalkan halaman utama.
            </DialogPrimitive.Description>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button variant="default" type="button" onClick={() => onOpenChange(false)}>
                Lanjut eksplor villa
              </Button>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Tutup preview
              </Button>
            </div>
          </div>
          <DialogPrimitive.Close asChild>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="absolute right-4 top-4 bg-white/75"
              aria-label="Tutup modal"
            >
              <X />
            </Button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function BackToTop({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          aria-label="Kembali ke atas"
          onClick={onClick}
          className="fixed bottom-6 right-5 z-50 grid size-12 place-items-center rounded-full bg-emerald-700 text-white shadow-[0_18px_50px_rgba(4,120,87,0.3)]"
          initial={{ opacity: 0, y: 18, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.9 }}
          whileHover={{ y: -3, scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowUp className="size-5" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}

function Footer({ onScrollTo }: { onScrollTo: (id: string) => void }) {
  return (
    <footer className="border-t border-emerald-900/10 px-4 py-10 dark:border-white/10 sm:px-6 lg:px-8">
      <div className="container mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-serif text-2xl font-semibold text-emerald-950 dark:text-white">Villaku</p>
          <p className="mt-1 text-sm text-emerald-950/52 dark:text-white/52">
            Luxury villa booking frontend crafted for premium hospitality.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onScrollTo(item.id)}
              className="rounded-full px-4 py-2 text-sm font-medium text-emerald-950/58 transition-colors hover:bg-emerald-900/5 hover:text-emerald-700 dark:text-white/58 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}
