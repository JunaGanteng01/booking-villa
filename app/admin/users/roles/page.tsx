"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarCheck2,
  Check,
  CircleDollarSign,
  Edit3,
  Eye,
  Info,
  KeyRound,
  LockKeyhole,
  Megaphone,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin-page-shell";

const roles = [
  {
    id: "super-admin",
    name: "Super Admin",
    description:
      "Kontrol penuh atas sistem, pengguna, keamanan, dan konfigurasi.",
    users: 1,
    icon: ShieldCheck,
    tone: "from-emerald-700 to-teal-500",
    permissions: ["Semua modul", "Kelola role", "Pengaturan", "Audit log"],
    responsibilities: [
      "Menentukan struktur role dan izin akses",
      "Mengelola akun administrator dan keamanan sistem",
      "Mengubah konfigurasi inti serta integrasi website",
    ],
    limitation:
      "Gunakan hanya untuk pemilik atau penanggung jawab utama sistem.",
    bestFor: "Owner / Head of Operations",
    system: true,
  },
  {
    id: "admin",
    name: "Admin",
    description: "Menjalankan operasional harian villa dan pengalaman tamu.",
    users: 2,
    icon: Settings2,
    tone: "from-sky-700 to-cyan-500",
    permissions: ["Villa", "Booking", "Customer", "Ulasan"],
    responsibilities: [
      "Mengelola villa, booking, customer, dan ulasan",
      "Memantau dashboard operasional harian",
      "Mengoordinasikan aktivitas tim lintas departemen",
    ],
    limitation: "Tidak dapat mengubah izin bawaan Super Admin.",
    bestFor: "Operations Manager",
    system: false,
  },
  {
    id: "receptionist",
    name: "Receptionist",
    description:
      "Fokus pada reservasi, check-in, check-out, dan kebutuhan tamu.",
    users: 3,
    icon: CalendarCheck2,
    tone: "from-violet-700 to-fuchsia-500",
    permissions: ["Booking", "Kalender", "Customer", "Notifikasi"],
    responsibilities: [
      "Memproses reservasi, check-in, dan check-out",
      "Memperbarui kalender serta kebutuhan tamu",
      "Menindaklanjuti komunikasi sebelum kedatangan",
    ],
    limitation: "Tidak memiliki akses pengaturan, refund, atau manajemen role.",
    bestFor: "Front Office / Guest Relations",
    system: false,
  },
  {
    id: "finance",
    name: "Finance",
    description: "Memverifikasi pembayaran dan menyusun laporan keuangan.",
    users: 2,
    icon: CircleDollarSign,
    tone: "from-amber-600 to-orange-500",
    permissions: ["Pembayaran", "Refund", "Invoice", "Laporan"],
    responsibilities: [
      "Memverifikasi bukti pembayaran manual",
      "Memproses refund dan meninjau transaksi",
      "Menyusun laporan pendapatan serta invoice",
    ],
    limitation: "Tidak dapat mengubah villa, konten, pengguna, atau role.",
    bestFor: "Finance & Accounting",
    system: false,
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Mengelola konten, promo, ulasan, dan insight pemasaran.",
    users: 2,
    icon: Megaphone,
    tone: "from-rose-700 to-pink-500",
    permissions: ["Promo", "Blog", "FAQ", "Laporan marketing"],
    responsibilities: [
      "Mengelola artikel, FAQ, promo, dan ulasan",
      "Memantau insight customer dan performa kampanye",
      "Menjaga konsistensi konten publik VillaKu",
    ],
    limitation: "Tidak dapat mengelola pembayaran atau status booking.",
    bestFor: "Content & Growth Team",
    system: false,
  },
  {
    id: "customer",
    name: "Customer",
    description:
      "Akses standar tamu ke profil, booking, pembayaran, dan ulasan.",
    users: 428,
    icon: UserRound,
    tone: "from-slate-700 to-slate-500",
    permissions: ["Profil sendiri", "Booking sendiri", "Wishlist", "Ulasan"],
    responsibilities: [
      "Mengelola profil, wishlist, dan reservasi pribadi",
      "Menyelesaikan pembayaran booking sendiri",
      "Memberikan ulasan setelah masa menginap",
    ],
    limitation: "Hanya dapat melihat dan mengubah data miliknya sendiri.",
    bestFor: "Tamu VillaKu",
    system: true,
  },
];

export default function RolesPage() {
  const reduceMotion = useReducedMotion();
  return (
    <AdminPageShell
      title="Role & akses"
      subtitle="Atur peran dan cakupan kewenangan pengguna"
      active="Pengguna"
    >
      <div className="mx-auto max-w-[1300px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300"
        >
          <ArrowLeft className="size-4" /> Kembali ke pengguna
        </Link>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
              <KeyRound className="size-3.5" /> Role based access
            </span>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Peran pengguna
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 opacity-48">
              Tentukan kewenangan setiap tim berdasarkan tanggung jawab mereka.
            </p>
          </motion.div>
          <a
            href="#role-guide"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white"
          >
            <Info className="size-4" /> Lihat panduan role
          </a>
        </div>

        <section
          id="role-guide"
          className="mt-7 grid gap-4 rounded-[1.7rem] border border-emerald-950/8 bg-emerald-950 p-5 text-white dark:border-white/8 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
              Cara memilih role
            </p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">
              Berikan akses minimum sesuai pekerjaan pengguna.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              Role menentukan menu yang terlihat dan tindakan yang boleh
              dilakukan. Hindari memberikan Admin atau Super Admin jika tugas
              pengguna cukup ditangani role khusus.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white/80">
            <ShieldCheck className="size-4 text-amber-200" /> Prinsip least
            privilege
          </span>
        </section>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <motion.article
                key={role.id}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.045 }}
                whileHover={reduceMotion ? undefined : { y: -3 }}
                className="rounded-[1.7rem] border border-emerald-950/8 bg-white/68 p-5 dark:border-white/8 dark:bg-white/[0.045] sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${role.tone} text-white shadow-lg`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="flex items-center gap-2">
                    {role.system ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.55rem] font-bold uppercase text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
                        System role
                      </span>
                    ) : null}
                    {role.id === "customer" ? (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[0.55rem] font-bold uppercase text-amber-700 dark:bg-amber-300/10 dark:text-amber-200">
                          <LockKeyhole className="size-3" /> Bawaan · terkunci
                        </span>
                        <Link
                          href={`/admin/users/roles/${role.id}`}
                          className="grid size-9 place-items-center rounded-xl border border-emerald-950/8 text-emerald-700 dark:border-white/8 dark:text-emerald-300"
                          aria-label={`Lihat ${role.name}`}
                        >
                          <Eye className="size-4" />
                        </Link>
                      </>
                    ) : (
                      <Link
                        href={`/admin/users/roles/${role.id}`}
                        className="grid size-9 place-items-center rounded-xl border border-emerald-950/8 text-emerald-700 dark:border-white/8 dark:text-emerald-300"
                        aria-label={`Edit ${role.name}`}
                      >
                        <Edit3 className="size-4" />
                      </Link>
                    )}
                  </div>
                </div>
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold">
                      {role.name}
                    </h2>
                    <p className="mt-2 max-w-md text-xs leading-5 opacity-45">
                      {role.description}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-950/5 px-2.5 py-1.5 text-xs font-bold dark:bg-white/6">
                    <Users className="size-3.5 opacity-40" /> {role.users}
                  </span>
                </div>
                <div className="mt-5 border-t border-emerald-950/7 pt-4 dark:border-white/7">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] opacity-35">
                    Cakupan utama
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {role.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[0.62rem] font-semibold text-emerald-800 dark:bg-emerald-300/7 dark:text-emerald-200"
                      >
                        <Check className="size-3" /> {permission}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-5 grid gap-3 rounded-2xl bg-emerald-950/[0.035] p-4 dark:bg-white/[0.035] sm:grid-cols-2">
                  <div>
                    <p className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                      <BriefcaseBusiness className="size-3.5" /> Fungsi utama
                    </p>
                    <ul className="mt-3 space-y-2 text-xs leading-5 opacity-60">
                      {role.responsibilities.map((responsibility) => (
                        <li key={responsibility} className="flex gap-2">
                          <Check className="mt-1 size-3 shrink-0 text-emerald-600" />
                          {responsibility}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-emerald-950/7 pt-3 dark:border-white/7 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] opacity-35">
                      Cocok untuk
                    </p>
                    <p className="mt-2 text-xs font-bold">{role.bestFor}</p>
                    <p className="mt-4 text-[0.6rem] font-bold uppercase tracking-[0.12em] opacity-35">
                      Batasan
                    </p>
                    <p className="mt-2 text-xs leading-5 text-amber-700 dark:text-amber-200">
                      {role.limitation}
                    </p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </AdminPageShell>
  );
}
