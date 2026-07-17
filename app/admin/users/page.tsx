"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  Loader2,
  Mail,
  MoreHorizontal,
  Plus,
  Phone,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { AdminMetricSummary } from "@/components/admin-metric-summary";
import { AdminPageShell } from "@/components/admin-page-shell";
import { AdminUserFilter } from "@/components/admin-user-filter";
import { useAppNotifications } from "@/components/notification-root";
import { useAdminSession } from "@/components/use-admin-session";
import { cn } from "@/lib/utils";

type UserStatus = "ACTIVE" | "INVITED" | "SUSPENDED";
type AdminUser = {
  id: number | string;
  name: string;
  email: string;
  initials: string;
  role: string;
  department: string;
  status: UserStatus;
  lastActive: string;
};

const initialUsers: AdminUser[] = [
  {
    id: 1,
    name: "Ayu Prameswari",
    email: "ayu@villaku.id",
    initials: "AP",
    role: "Super Admin",
    department: "Management",
    status: "ACTIVE",
    lastActive: "Online sekarang",
  },
  {
    id: 2,
    name: "Dimas Wicaksono",
    email: "dimas@villaku.id",
    initials: "DW",
    role: "Admin",
    department: "Operations",
    status: "ACTIVE",
    lastActive: "12 menit lalu",
  },
  {
    id: 3,
    name: "Nadia Kusuma",
    email: "nadia@villaku.id",
    initials: "NK",
    role: "Marketing",
    department: "Growth",
    status: "ACTIVE",
    lastActive: "1 jam lalu",
  },
  {
    id: 4,
    name: "Made Surya",
    email: "made@villaku.id",
    initials: "MS",
    role: "Receptionist",
    department: "Guest Experience",
    status: "ACTIVE",
    lastActive: "Kemarin, 21.30",
  },
  {
    id: 5,
    name: "Citra Maharani",
    email: "citra@villaku.id",
    initials: "CM",
    role: "Finance",
    department: "Finance",
    status: "INVITED",
    lastActive: "Undangan 14 Jul 2026",
  },
  {
    id: 6,
    name: "Bagus Ardi",
    email: "bagus@villaku.id",
    initials: "BA",
    role: "Admin",
    department: "Operations",
    status: "SUSPENDED",
    lastActive: "8 Jul 2026",
  },
];

const statusMeta = {
  ACTIVE: {
    label: "Aktif",
    icon: CheckCircle2,
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200",
  },
  INVITED: {
    label: "Diundang",
    icon: Clock3,
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200",
  },
  SUSPENDED: {
    label: "Ditangguhkan",
    icon: UserRoundX,
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-300/10 dark:text-rose-200",
  },
} satisfies Record<
  UserStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
>;

const avatarColors = [
  "from-emerald-700 to-teal-500",
  "from-sky-700 to-cyan-500",
  "from-violet-700 to-fuchsia-500",
  "from-amber-600 to-orange-500",
  "from-rose-700 to-pink-500",
];

const roleLabels = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  RECEPTIONIST: "Receptionist",
  FINANCE: "Finance",
  MARKETING: "Marketing",
  CUSTOMER: "Customer",
} as const;

type NewUserInput = {
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "RECEPTIONIST" | "FINANCE" | "MARKETING";
  department: string;
};

type ApiAdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: keyof typeof roleLabels;
  status: UserStatus | "DEACTIVATED";
  department: string | null;
  lastLoginAt: string | null;
  invitedAt: string | null;
};

export default function UsersPage() {
  const reduceMotion = useReducedMotion();
  const { notify } = useAppNotifications();
  const { canAccess } = useAdminSession();
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/admin/users?limit=100&sort=newest", {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as {
          users?: ApiAdminUser[];
          message?: string;
        } | null;
        if (!response.ok || !payload?.users) {
          throw new Error(payload?.message || "Pengguna belum dapat dimuat.");
        }
        setUsers(payload.users.map(toAdminUser));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        // Data awal tetap ditampilkan ketika layanan pengguna sedang tidak tersedia.
      });

    return () => controller.abort();
  }, []);

  const addUser = async (input: NewUserInput) => {
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      user?: {
        id: string;
        name: string | null;
        email: string;
        role: keyof typeof roleLabels;
        department: string | null;
      };
    } | null;
    if (!response.ok || !payload?.user) {
      throw new Error(payload?.message || "Pengguna belum dapat ditambahkan.");
    }
    const created: AdminUser = {
      id: payload.user.id,
      name: payload.user.name || input.name,
      email: payload.user.email,
      initials: getInitials(payload.user.name || input.name),
      role: roleLabels[payload.user.role],
      department: payload.user.department || input.department,
      status: "INVITED",
      lastActive: "Undangan baru saja",
    };
    setUsers((current) => [created, ...current]);
    setAddOpen(false);
    notify({
      title: "Pengguna berhasil ditambahkan",
      description: `${created.name} ditambahkan sebagai ${created.role} dan siap diundang.`,
      variant: "success",
    });
  };

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter(
      (user) =>
        (!normalized ||
          `${user.name} ${user.email} ${user.department}`
            .toLowerCase()
            .includes(normalized)) &&
        (role === "ALL" || user.role === role) &&
        (status === "ALL" || user.status === status),
    );
  }, [query, role, status]);

  return (
    <AdminPageShell
      title="Pengguna"
      subtitle="Kelola tim operasional dan hak akses admin"
      active="Pengguna"
    >
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
              <ShieldCheck className="size-3.5" /> Access control
            </span>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Tim Villaku
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 opacity-48">
              Pantau anggota tim, peran, status akun, dan aktivitas terakhir
              dari satu halaman.
            </p>
          </motion.div>
          <div className="flex flex-wrap gap-2">
            {canAccess("/admin/users/roles") ? (
              <Link
                href="/admin/users/roles"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-emerald-950/10 bg-white/72 px-4 text-sm font-bold dark:border-white/10 dark:bg-white/6"
              >
                <ShieldCheck className="size-4" /> Kelola role
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white"
            >
              <Plus className="size-4" /> Tambah pengguna
            </button>
          </div>
        </div>

        <AdminMetricSummary
          className="mt-7"
          metrics={[
            {
              label: "Total pengguna",
              value: String(users.length),
              icon: Users,
              tone: "emerald",
            },
            {
              label: "Akun aktif",
              value: String(
                users.filter((item) => item.status === "ACTIVE").length,
              ),
              icon: UserRoundCheck,
              tone: "sky",
            },
            {
              label: "Menunggu undangan",
              value: String(
                users.filter((item) => item.status === "INVITED").length,
              ),
              icon: Clock3,
              tone: "amber",
            },
            {
              label: "Ditangguhkan",
              value: String(
                users.filter((item) => item.status === "SUSPENDED").length,
              ),
              icon: UserRoundX,
              tone: "rose",
            },
          ]}
        />

        <section className="mt-5 overflow-hidden rounded-[1.7rem] border border-emerald-950/8 bg-white/68 dark:border-white/8 dark:bg-white/[0.045]">
          <AdminUserFilter
            query={query}
            role={role}
            status={status}
            roles={Array.from(new Set(users.map((item) => item.role)))}
            statuses={Object.entries(statusMeta).map(([value, meta]) => ({
              value,
              label: meta.label,
            }))}
            resultCount={visible.length}
            onQueryChange={setQuery}
            onRoleChange={setRole}
            onStatusChange={setStatus}
            onReset={() => {
              setQuery("");
              setRole("ALL");
              setStatus("ALL");
            }}
          />

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-emerald-950/[0.025] text-left text-[0.62rem] font-bold uppercase tracking-[0.13em] opacity-42">
                  <th className="px-5 py-3.5">Pengguna</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Aktivitas terakhir</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((user, index) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    index={index}
                    reduceMotion={Boolean(reduceMotion)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-emerald-950/7 md:hidden dark:divide-white/7">
            {visible.map((user, index) => (
              <UserCard key={user.id} user={user} index={index} />
            ))}
          </div>
          {!visible.length ? (
            <div className="grid min-h-56 place-items-center p-6 text-center">
              <p className="font-semibold">Pengguna tidak ditemukan</p>
            </div>
          ) : null}
        </section>
        <AnimatePresence>
          {addOpen ? (
            <AddUserDialog
              reduceMotion={Boolean(reduceMotion)}
              onClose={() => setAddOpen(false)}
              onSubmit={addUser}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </AdminPageShell>
  );
}

function AddUserDialog({
  reduceMotion,
  onClose,
  onSubmit,
}: {
  reduceMotion: boolean;
  onClose: () => void;
  onSubmit: (input: NewUserInput) => Promise<void>;
}) {
  const [form, setForm] = useState<NewUserInput>({
    name: "",
    email: "",
    phone: null,
    role: "RECEPTIONIST",
    department: "Guest Experience",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone?.trim() || null,
        department: form.department.trim(),
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Pengguna belum dapat ditambahkan.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-emerald-950/62 p-0 backdrop-blur-lg sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-title"
        initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: 18, scale: 0.98 }}
        className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#fffdf8] shadow-2xl dark:bg-[#0c1c18] sm:rounded-[2rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-emerald-950/8 p-5 dark:border-white/8 sm:p-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
              <UserRoundCheck className="size-3.5" /> Undang anggota tim
            </span>
            <h2
              id="add-user-title"
              className="mt-3 font-serif text-3xl font-semibold"
            >
              Tambah pengguna
            </h2>
            <p className="mt-2 text-sm leading-6 opacity-48">
              Akun dibuat dengan status Diundang. Akses mengikuti role yang Anda
              pilih.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-950/5 transition hover:rotate-90 dark:bg-white/7"
            aria-label="Tutup form tambah pengguna"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <UserFormField
              label="Nama lengkap"
              icon={UserRoundCheck}
              value={form.name}
              placeholder="Contoh: Sinta Maharani"
              autoComplete="name"
              onChange={(value) =>
                setForm((current) => ({ ...current, name: value }))
              }
            />
            <UserFormField
              label="Email kerja"
              icon={Mail}
              value={form.email}
              type="email"
              placeholder="nama@villaku.id"
              autoComplete="email"
              onChange={(value) =>
                setForm((current) => ({ ...current, email: value }))
              }
            />
            <UserFormField
              label="Departemen"
              icon={Building2}
              value={form.department}
              placeholder="Operations"
              onChange={(value) =>
                setForm((current) => ({ ...current, department: value }))
              }
            />
            <UserFormField
              label="Nomor telepon (opsional)"
              icon={Phone}
              value={form.phone ?? ""}
              type="tel"
              placeholder="+62 812 0000 0000"
              autoComplete="tel"
              required={false}
              onChange={(value) =>
                setForm((current) => ({ ...current, phone: value }))
              }
            />
          </div>

          <label className="grid gap-2 text-xs font-bold">
            Role pengguna
            <select
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  role: event.target.value as NewUserInput["role"],
                }))
              }
              className="h-12 rounded-2xl border border-emerald-950/10 bg-white/72 px-4 text-sm outline-none focus:border-emerald-600/40 focus:ring-4 focus:ring-emerald-500/8 dark:border-white/10 dark:bg-white/5"
            >
              <option value="ADMIN">Admin — operasional harian</option>
              <option value="RECEPTIONIST">
                Receptionist — booking & tamu
              </option>
              <option value="FINANCE">Finance — pembayaran & laporan</option>
              <option value="MARKETING">
                Marketing — konten, promo & ulasan
              </option>
            </select>
            <span className="font-normal leading-5 opacity-40">
              Super Admin hanya dapat ditambahkan oleh Super Admin lain melalui
              kontrol keamanan khusus.
            </span>
          </label>

          {error ? (
            <div
              role="alert"
              className="rounded-2xl border border-rose-500/16 bg-rose-500/8 p-4 text-sm font-semibold text-rose-700 dark:text-rose-200"
            >
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-emerald-950/8 pt-5 dark:border-white/8 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="min-h-11 rounded-full border border-emerald-950/10 px-5 text-sm font-bold disabled:opacity-50 dark:border-white/10"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(4,120,87,0.2)] disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Menyimpan…
                </>
              ) : (
                <>
                  <Plus className="size-4" /> Tambah & siapkan undangan
                </>
              )}
            </button>
          </div>
        </form>
      </motion.section>
    </motion.div>
  );
}

function UserFormField({
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  required = true,
}: {
  label: string;
  icon: typeof Mail;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-xs font-bold">
      {label}
      <span className="flex h-12 items-center gap-3 rounded-2xl border border-emerald-950/10 bg-white/72 px-4 focus-within:border-emerald-600/40 focus-within:ring-4 focus-within:ring-emerald-500/8 dark:border-white/10 dark:bg-white/5">
        <Icon className="size-4 shrink-0 text-emerald-700/60 dark:text-emerald-300/60" />
        <input
          type={type}
          value={value}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-normal outline-none placeholder:opacity-30"
        />
      </span>
    </label>
  );
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function toAdminUser(user: ApiAdminUser): AdminUser {
  const name = user.name || user.email.split("@")[0] || "Pengguna";
  return {
    id: user.id,
    name,
    email: user.email,
    initials: getInitials(name),
    role: roleLabels[user.role],
    department: user.department || "Belum ditentukan",
    status: user.status === "DEACTIVATED" ? "SUSPENDED" : user.status,
    lastActive: formatActivity(user),
  };
}

function formatActivity(user: ApiAdminUser) {
  if (user.status === "SUSPENDED" || user.status === "DEACTIVATED") {
    return "Akun tidak aktif";
  }
  const timestamp = user.lastLoginAt || user.invitedAt;
  if (!timestamp)
    return user.status === "INVITED"
      ? "Menunggu undangan"
      : "Belum pernah login";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Aktivitas belum tersedia";
  return `${user.status === "INVITED" ? "Diundang" : "Login"} ${new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date)}`;
}

function UserRow({
  user,
  index,
  reduceMotion,
}: {
  user: AdminUser;
  index: number;
  reduceMotion: boolean;
}) {
  const meta = statusMeta[user.status];
  const StatusIcon = meta.icon;
  return (
    <motion.tr
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035 }}
      className="border-t border-emerald-950/7 dark:border-white/7"
    >
      <td className="px-5 py-4">
        <UserIdentity user={user} index={index} />
      </td>
      <td className="px-4 py-4">
        <p className="text-sm font-bold">{user.role}</p>
        <p className="mt-1 text-xs opacity-38">{user.department}</p>
      </td>
      <td className="px-4 py-4">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[0.58rem] font-bold uppercase",
            meta.className,
          )}
        >
          <StatusIcon className="size-3" /> {meta.label}
        </span>
      </td>
      <td className="px-4 py-4 text-xs opacity-45">{user.lastActive}</td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-1">
          <Action
            icon={Eye}
            label={`Lihat ${user.name}`}
            href={`/admin/users/${user.id}`}
          />
          <Action icon={MoreHorizontal} label={`Aksi ${user.name}`} />
        </div>
      </td>
    </motion.tr>
  );
}

function UserCard({ user, index }: { user: AdminUser; index: number }) {
  const meta = statusMeta[user.status];
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <UserIdentity user={user} index={index} />
        <span
          className={cn(
            "rounded-full px-2 py-1 text-[0.55rem] font-bold",
            meta.className,
          )}
        >
          {meta.label}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-950/[0.035] p-3 text-xs dark:bg-white/5">
        <span>
          <strong>{user.role}</strong>
          <span className="ml-1 opacity-40">· {user.department}</span>
        </span>
        <span className="opacity-40">{user.lastActive}</span>
      </div>
    </div>
  );
}

function UserIdentity({ user, index }: { user: AdminUser; index: number }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-xs font-bold text-white",
          avatarColors[index % avatarColors.length],
        )}
      >
        {user.initials}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{user.name}</span>
        <span className="mt-1 block truncate text-xs opacity-38">
          {user.email}
        </span>
      </span>
    </div>
  );
}

function Action({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof Edit3;
  label: string;
  href?: string;
}) {
  if (href) {
    return (
      <Link
        href={href}
        className="grid size-9 place-items-center rounded-xl hover:bg-emerald-950/5 dark:hover:bg-white/6"
        aria-label={label}
      >
        <Icon className="size-4 opacity-45" />
      </Link>
    );
  }
  return (
    <button
      type="button"
      className="grid size-9 place-items-center rounded-xl hover:bg-emerald-950/5 dark:hover:bg-white/6"
      aria-label={label}
    >
      <Icon className="size-4 opacity-45" />
    </button>
  );
}
