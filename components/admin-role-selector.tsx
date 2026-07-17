"use client";

import { ChevronDown, Save, ShieldCheck } from "lucide-react";
import { useState } from "react";

const roles = [
  {
    value: "Super Admin",
    label: "Super Admin",
    description: "Akses penuh ke semua modul dan pengaturan.",
  },
  {
    value: "Admin",
    label: "Admin",
    description: "Kelola operasional villa, booking, dan customer.",
  },
  {
    value: "Receptionist",
    label: "Receptionist",
    description: "Kelola booking, check-in, dan kebutuhan tamu.",
  },
  {
    value: "Finance",
    label: "Finance",
    description: "Akses pembayaran, refund, invoice, dan laporan.",
  },
  {
    value: "Marketing",
    label: "Marketing",
    description: "Kelola promo, konten, ulasan, dan laporan pemasaran.",
  },
];

export function AdminRoleSelector({
  currentRole,
  userName,
  onSave,
}: {
  currentRole: string;
  userName: string;
  onSave: (role: string) => void;
}) {
  const [selected, setSelected] = useState(currentRole);
  const selectedRole =
    roles.find((role) => role.value === selected) ?? roles[1];
  const changed = selected !== currentRole;

  return (
    <form
      className="mt-5 rounded-2xl bg-white/6 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (changed) onSave(selected);
      }}
    >
      <label>
        <span className="mb-2 flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white/45">
          <ShieldCheck className="size-3.5" /> Peran {userName}
        </span>
        <span className="relative block">
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#173a31] px-3 pr-10 text-xs font-bold text-white outline-none"
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
        </span>
      </label>
      <p className="mt-2 min-h-10 text-[0.62rem] leading-5 text-white/42">
        {selectedRole.description}
      </p>
      <button
        type="submit"
        disabled={!changed}
        className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-xs font-bold text-emerald-950 disabled:opacity-35"
      >
        <Save className="size-3.5" /> Simpan perubahan role
      </button>
    </form>
  );
}
