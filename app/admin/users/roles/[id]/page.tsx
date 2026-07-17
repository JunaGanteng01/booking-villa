"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  AdminPermissionMatrix,
  permissionActions,
} from "@/components/admin-permission-matrix";
import { AdminPageShell } from "@/components/admin-page-shell";

const roleProfiles: Record<
  string,
  { name: string; description: string; system: boolean; members: string[] }
> = {
  "super-admin": {
    name: "Super Admin",
    description:
      "Kontrol penuh atas sistem, pengguna, keamanan, dan konfigurasi.",
    system: true,
    members: ["Ayu Prameswari"],
  },
  admin: {
    name: "Admin",
    description: "Menjalankan operasional harian villa dan pengalaman tamu.",
    system: false,
    members: ["Dimas Wicaksono", "Bagus Ardi"],
  },
  receptionist: {
    name: "Receptionist",
    description:
      "Fokus pada reservasi, check-in, check-out, dan kebutuhan tamu.",
    system: false,
    members: ["Made Surya", "Laras Dewi", "Wayan Putra"],
  },
  finance: {
    name: "Finance",
    description: "Memverifikasi pembayaran dan menyusun laporan keuangan.",
    system: false,
    members: ["Citra Maharani", "Aditya Pratama"],
  },
  marketing: {
    name: "Marketing",
    description: "Mengelola konten, promo, ulasan, dan insight pemasaran.",
    system: false,
    members: ["Nadia Kusuma", "Made Surya"],
  },
  customer: {
    name: "Customer",
    description:
      "Akses standar tamu ke profil, booking, pembayaran, dan ulasan.",
    system: true,
    members: ["428 customer aktif"],
  },
};

const modulePermissions = [
  { module: "Overview", allowed: [true, false, false, false, true] },
  { module: "Villa", allowed: [true, true, true, false, true] },
  { module: "Booking", allowed: [true, true, true, true, true] },
  { module: "Pembayaran", allowed: [true, false, false, false, false] },
  { module: "Customer", allowed: [true, true, true, false, true] },
  { module: "Ulasan", allowed: [true, false, true, true, false] },
  { module: "Notifikasi", allowed: [true, true, true, true, false] },
  { module: "Laporan", allowed: [true, false, false, false, true] },
  { module: "Pengguna", allowed: [true, false, false, false, false] },
  { module: "Pengaturan", allowed: [false, false, false, false, false] },
];

export default function RoleDetailPage() {
  const params = useParams<{ id: string }>();
  const reduceMotion = useReducedMotion();
  const role = roleProfiles[params.id] ?? roleProfiles.admin;
  const isSuperAdmin = params.id === "super-admin";
  const isCustomerRole = params.id === "customer";
  const isLockedRole = isSuperAdmin || isCustomerRole;
  const [permissions, setPermissions] = useState(() =>
    modulePermissions.map((item) => ({
      ...item,
      allowed: isSuperAdmin ? permissionActions.map(() => true) : item.allowed,
    })),
  );
  const permissionCount = permissions.reduce(
    (sum, item) => sum + item.allowed.filter(Boolean).length,
    0,
  );

  return (
    <AdminPageShell
      title="Detail role"
      subtitle="Tinjau cakupan izin dan anggota peran"
      active="Pengguna"
    >
      <div className="mx-auto max-w-[1300px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <Link
          href="/admin/users/roles"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300"
        >
          <ArrowLeft className="size-4" /> Kembali ke daftar role
        </Link>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex flex-col gap-5 rounded-[1.8rem] bg-emerald-950 p-5 text-white sm:p-7 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-xl">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-emerald-300">
                  Role profile
                </span>
                {role.system ? (
                  <span className="rounded-full bg-white/8 px-2 py-1 text-[0.55rem] font-bold uppercase text-white/60">
                    System role
                  </span>
                ) : null}
                {isCustomerRole ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/12 px-2 py-1 text-[0.55rem] font-bold uppercase text-amber-200">
                    <LockKeyhole className="size-3" /> Bawaan · tidak bisa
                    diedit
                  </span>
                ) : null}
              </div>
              <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
                {role.name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/48">
                {role.description}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Stat
              label="Anggota"
              value={String(role.members.length)}
              icon={Users}
            />
            <Stat
              label="Izin aktif"
              value={String(permissionCount)}
              icon={KeyRound}
            />
          </div>
        </motion.div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="overflow-hidden rounded-[1.7rem] border border-emerald-950/8 bg-white/68 dark:border-white/8 dark:bg-white/[0.045]">
            <div className="border-b border-emerald-950/8 p-5 dark:border-white/8">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                Permission matrix
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold">
                Izin akses modul
              </h2>
              <p className="mt-2 text-xs leading-5 opacity-42">
                Daftar kewenangan role untuk setiap area operasional Villaku.
              </p>
            </div>
            <AdminPermissionMatrix
              permissions={permissions}
              onChange={setPermissions}
              readOnly={isLockedRole}
            />
          </section>

          <aside className="self-start rounded-[1.7rem] border border-emerald-950/8 bg-white/68 p-5 dark:border-white/8 dark:bg-white/[0.045] xl:sticky xl:top-24">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                  Role members
                </p>
                <h2 className="mt-2 font-serif text-xl font-semibold">
                  Anggota
                </h2>
              </div>
              <Users className="size-5 opacity-35" />
            </div>
            <div className="mt-5 space-y-2">
              {role.members.map((member, index) => (
                <div
                  key={member}
                  className="flex items-center gap-3 rounded-xl bg-emerald-950/[0.035] p-3 dark:bg-white/5"
                >
                  <span className="grid size-8 place-items-center rounded-lg bg-emerald-700 text-[0.6rem] font-bold text-white">
                    {member
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{member}</p>
                    <p className="mt-1 text-[0.6rem] opacity-35">
                      {index ? "Aktif" : "Pemilik role"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-800 dark:bg-amber-300/7 dark:text-amber-200">
              <div className="flex gap-2">
                <LockKeyhole className="mt-0.5 size-4 shrink-0" />
                <p>
                  Perubahan izin akan berlaku pada semua anggota role setelah
                  disimpan.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AdminPageShell>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Users;
}) {
  return (
    <div className="min-w-24 rounded-2xl bg-white/7 p-3">
      <div className="flex items-center gap-1.5 text-[0.58rem] text-white/42">
        <Icon className="size-3" /> {label}
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
