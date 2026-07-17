"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRoundX,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { AdminPageShell } from "@/components/admin-page-shell";
import { AdminAccountStatusDialog } from "@/components/admin-account-status-dialog";
import { AdminRoleSelector } from "@/components/admin-role-selector";
import { useAppNotifications } from "@/components/notification-root";
import { cn } from "@/lib/utils";

const profiles = [
  {
    id: "1",
    name: "Ayu Prameswari",
    initials: "AP",
    email: "ayu@villaku.id",
    phone: "+62 811 2018 4401",
    role: "Super Admin",
    department: "Management",
    location: "Canggu HQ, Bali",
    joined: "12 Januari 2024",
    status: "ACTIVE",
    lastActive: "Online sekarang",
    access: ["Semua villa", "Finance", "Pengguna & role", "Pengaturan"],
  },
  {
    id: "2",
    name: "Dimas Wicaksono",
    initials: "DW",
    email: "dimas@villaku.id",
    phone: "+62 812 4438 1022",
    role: "Admin",
    department: "Operations",
    location: "Seminyak Office, Bali",
    joined: "3 Maret 2025",
    status: "ACTIVE",
    lastActive: "12 menit lalu",
    access: ["Villa", "Booking", "Customer", "Ulasan"],
  },
  {
    id: "3",
    name: "Nadia Kusuma",
    initials: "NK",
    email: "nadia@villaku.id",
    phone: "+62 813 9002 1764",
    role: "Marketing",
    department: "Growth",
    location: "Remote · Denpasar",
    joined: "18 Agustus 2025",
    status: "ACTIVE",
    lastActive: "1 jam lalu",
    access: ["Promo", "Blog", "FAQ", "Laporan pemasaran"],
  },
];

const activities = [
  {
    title: "Login berhasil",
    detail: "Chrome · Windows · Bali, Indonesia",
    time: "Hari ini, 09.42",
  },
  {
    title: "Memperbarui status booking",
    detail: "VLK-260823-1482 menjadi Dikonfirmasi",
    time: "Kemarin, 18.20",
  },
  {
    title: "Mengekspor laporan",
    detail: "Laporan pendapatan bulan Juli 2026",
    time: "14 Jul 2026, 15.08",
  },
  {
    title: "Password diperbarui",
    detail: "Perubahan keamanan akun berhasil",
    time: "7 Jul 2026, 10.15",
  },
];
const roleAccess: Record<string, string[]> = {
  "Super Admin": ["Semua villa", "Finance", "Pengguna & role", "Pengaturan"],
  Admin: ["Villa", "Booking", "Customer", "Ulasan"],
  Receptionist: ["Booking", "Check-in", "Customer", "Kalender"],
  Finance: ["Pembayaran", "Refund", "Invoice", "Laporan"],
  Marketing: ["Promo", "Blog", "FAQ", "Laporan pemasaran"],
};

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const reduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const profile = profiles.find((item) => item.id === params.id) ?? profiles[0];
  const [active, setActive] = useState(profile.status === "ACTIVE");
  const [role, setRole] = useState(profile.role);
  const [confirmStatus, setConfirmStatus] = useState(false);

  const toggleAccount = () => {
    setActive((current) => !current);
    setConfirmStatus(false);
    notify({
      title: active ? "Akun ditangguhkan" : "Akun diaktifkan kembali",
      description: profile.name,
      variant: "success",
    });
  };

  return (
    <AdminPageShell
      title="Detail pengguna"
      subtitle="Profil, akses, dan aktivitas anggota tim"
      active="Pengguna"
    >
      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300"
        >
          <ArrowLeft className="size-4" /> Kembali ke pengguna
        </Link>

        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 overflow-hidden rounded-[1.8rem] border border-emerald-950/8 bg-white/68 dark:border-white/8 dark:bg-white/[0.045]"
        >
          <div className="relative overflow-hidden bg-emerald-950 px-5 py-8 text-white sm:px-8">
            <div className="absolute -right-10 -top-20 size-64 rounded-full bg-emerald-400/15 blur-3xl" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="grid size-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 text-xl font-bold shadow-2xl">
                  {profile.initials}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[0.58rem] font-bold uppercase",
                        active
                          ? "bg-emerald-300/15 text-emerald-200"
                          : "bg-rose-300/15 text-rose-200",
                      )}
                    >
                      {active ? "Aktif" : "Ditangguhkan"}
                    </span>
                    <span className="text-xs text-white/45">
                      {profile.lastActive}
                    </span>
                  </div>
                  <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
                    {profile.name}
                  </h1>
                  <p className="mt-1 text-sm text-white/50">
                    {role} · {profile.department}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmStatus(true)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white/8 px-4 text-xs font-bold ring-1 ring-white/10"
                >
                  <UserRoundX className="size-4" />
                  {active ? "Tangguhkan" : "Aktifkan"}
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-emerald-950"
                >
                  <Edit3 className="size-4" /> Edit profil
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                Informasi akun
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info icon={Mail} label="Email" value={profile.email} />
                <Info icon={Phone} label="Telepon" value={profile.phone} />
                <Info
                  icon={Building2}
                  label="Departemen"
                  value={profile.department}
                />
                <Info icon={MapPin} label="Lokasi" value={profile.location} />
                <Info
                  icon={CalendarDays}
                  label="Bergabung"
                  value={profile.joined}
                />
                <Info icon={ShieldCheck} label="Role" value={role} />
              </div>

              <div className="mt-7">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                  Aktivitas terbaru
                </p>
                <div className="mt-4 space-y-1">
                  {activities.map((item, index) => (
                    <div
                      key={item.title}
                      className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 rounded-2xl p-3 hover:bg-emerald-950/[0.035] dark:hover:bg-white/5"
                    >
                      <span className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
                        {index ? (
                          <Activity className="size-4" />
                        ) : (
                          <CheckCircle2 className="size-4" />
                        )}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-bold">{item.title}</p>
                          <p className="text-[0.62rem] opacity-35">
                            {item.time}
                          </p>
                        </div>
                        <p className="mt-1 text-xs opacity-42">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="self-start rounded-2xl bg-emerald-950 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-200">
                    Access summary
                  </p>
                  <h2 className="mt-2 font-serif text-xl font-semibold">
                    Cakupan akses
                  </h2>
                </div>
                <KeyRound className="size-5 text-white/40" />
              </div>
              <AdminRoleSelector
                currentRole={role}
                userName={profile.name}
                onSave={(nextRole) => {
                  setRole(nextRole);
                  notify({
                    title: "Role pengguna diperbarui",
                    description: `${profile.name} kini memiliki role ${nextRole}.`,
                    variant: "success",
                  });
                }}
              />
              <div className="mt-5 space-y-2">
                {(roleAccess[role] ?? profile.access).map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-xl bg-white/6 px-3 py-2.5 text-xs"
                  >
                    <CheckCircle2 className="size-3.5 text-emerald-300" />{" "}
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-white/8 pt-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/42">2FA</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-300">
                    <CheckCircle2 className="size-3.5" /> Aktif
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-white/42">Sesi aktif</span>
                  <span className="font-bold">2 perangkat</span>
                </div>
              </div>
            </aside>
          </div>
        </motion.section>
      </div>
      <AdminAccountStatusDialog
        open={confirmStatus}
        active={active}
        userName={profile.name}
        onClose={() => setConfirmStatus(false)}
        onConfirm={toggleAccount}
      />
    </AdminPageShell>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-emerald-950/7 p-3 dark:border-white/7">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.62rem] opacity-38">{label}</p>
        <p className="mt-1 truncate text-xs font-bold">{value}</p>
      </div>
    </div>
  );
}
