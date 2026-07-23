"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  BedDouble,
  CalendarClock,
  CheckCircle2,
  Clock3,
  DoorOpen,
  History,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAppNotifications } from "@/components/notification-root";
import { useAdminSession } from "@/components/use-admin-session";

type CheckoutStatus = "ACTIVE" | "CHECKOUT_REQUESTED" | "CHECKED_OUT" | null;
type CheckoutBooking = {
  bookingId: string;
  bookingCode: string;
  bookingStatus: string;
  paymentStatus: string;
  guest: { id: string | null; name: string; email: string; phone: string };
  villa: { id: string; name: string; location: string; image: string | null };
  stay: { checkIn: string; checkOut: string; nights: number; guests: number };
  totalAmount: number;
  checkout: {
    id: string | null;
    status: CheckoutStatus;
    statusLabel: string;
    channel: "WEBSITE" | "RECEPTION_DESK" | null;
    requestedAt: string | null;
    checkedOutAt: string | null;
    notes: string | null;
    processedBy: { id: string; name: string | null; email: string } | null;
    canConfirm: boolean;
    paymentReady: boolean;
    history: Array<{
      id: string;
      eventType: string;
      fromStatus: CheckoutStatus;
      toStatus: Exclude<CheckoutStatus, null>;
      notes: string | null;
      actor: { id: string; name: string | null; email: string } | null;
      createdAt: string;
    }>;
  };
};

type Filter = "ACTIVE" | "CHECKOUT_REQUESTED" | "CHECKED_OUT";

export default function ReceptionCheckoutPage() {
  const { profile } = useAdminSession();
  const { notify } = useAppNotifications();
  const reduceMotion = useReducedMotion();
  const [items, setItems] = useState<CheckoutBooking[]>([]);
  const [filter, setFilter] = useState<Filter>("ACTIVE");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CheckoutBooking | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch("/api/admin/checkouts", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json()) as {
        data?: { bookings?: CheckoutBooking[] };
        message?: string;
      };
      if (!response.ok) throw new Error(payload.message || "Daftar checkout gagal dimuat.");
      setItems(payload.data?.bookings ?? []);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Daftar checkout gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(true), 10_000);
    const onFocus = () => void load(true);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const totals = useMemo(
    () => ({
      ACTIVE: items.filter((item) => item.checkout.status === "ACTIVE").length,
      CHECKOUT_REQUESTED: items.filter((item) => item.checkout.status === "CHECKOUT_REQUESTED").length,
      CHECKED_OUT: items.filter((item) => item.checkout.status === "CHECKED_OUT").length,
    }),
    [items],
  );
  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return items.filter((item) => {
      if (item.checkout.status !== filter) return false;
      if (!search) return true;
      return [item.bookingCode, item.guest.name, item.guest.email, item.villa.name]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [filter, items, query]);

  return (
    <AdminPageShell
      title="Operasional checkout"
      subtitle="Kelola tamu menginap, permintaan website, dan riwayat checkout"
      active="Checkout"
      actions={
        <button
          type="button"
          onClick={() => void load()}
          className="hidden min-h-10 items-center gap-2 rounded-full border border-emerald-950/10 bg-white/72 px-4 text-xs font-semibold transition hover:-translate-y-0.5 sm:inline-flex dark:border-white/10 dark:bg-white/6"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Sinkronkan
        </button>
      }
    >
      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-700/9 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300">
              <DoorOpen className="size-3.5" /> Front office
            </span>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Checkout tamu
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 opacity-52">
              Hanya Receptionist yang dapat menyelesaikan checkout. Konfirmasi akan menutup reservasi, membebaskan kamar, dan membuat audit trail.
            </p>
          </div>
          {profile.role !== "RECEPTIONIST" ? (
            <div className="max-w-sm rounded-2xl border border-amber-400/20 bg-amber-300/10 px-4 py-3 text-xs leading-5 text-amber-800 dark:text-amber-200">
              Mode lihat saja. Masuk sebagai Receptionist untuk memproses checkout.
            </div>
          ) : null}
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <Metric icon={BedDouble} label="Sedang menginap" value={totals.ACTIVE} tone="emerald" />
          <Metric icon={Clock3} label="Menunggu persetujuan" value={totals.CHECKOUT_REQUESTED} tone="amber" />
          <Metric icon={History} label="Riwayat checkout" value={totals.CHECKED_OUT} tone="slate" />
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.8rem] border border-emerald-950/9 bg-white/64 shadow-[0_18px_60px_rgba(4,34,28,0.05)] backdrop-blur-xl dark:border-white/9 dark:bg-white/5">
          <div className="flex flex-col gap-4 border-b border-emerald-950/8 p-4 dark:border-white/8 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 opacity-38" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari booking, tamu, email, atau villa..."
                className="h-12 w-full rounded-2xl border border-emerald-950/10 bg-white/65 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-600/40 focus:ring-4 focus:ring-emerald-500/8 dark:border-white/10 dark:bg-white/6"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto" role="tablist">
              {([
                ["ACTIVE", "Sedang menginap"],
                ["CHECKOUT_REQUESTED", "Permintaan website"],
                ["CHECKED_OUT", "Riwayat"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={filter === value}
                  onClick={() => setFilter(value)}
                  className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold transition ${
                    filter === value
                      ? "bg-emerald-700 text-white shadow-lg"
                      : "bg-emerald-950/5 opacity-55 hover:opacity-100 dark:bg-white/7"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <div className="m-5 rounded-2xl border border-rose-400/20 bg-rose-400/8 p-4 text-sm text-rose-700 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="divide-y divide-emerald-950/7 dark:divide-white/7">
            {loading && items.length === 0 ? (
              <div className="grid min-h-64 place-items-center text-sm opacity-45">
                <span className="inline-flex items-center gap-2"><LoaderCircle className="size-4 animate-spin" /> Memuat data PostgreSQL...</span>
              </div>
            ) : visible.length === 0 ? (
              <div className="grid min-h-64 place-items-center px-6 text-center">
                <div>
                  <DoorOpen className="mx-auto size-9 opacity-24" />
                  <p className="mt-3 font-semibold">Tidak ada data pada status ini</p>
                  <p className="mt-1 text-xs opacity-42">Daftar diperbarui otomatis setiap 10 detik.</p>
                </div>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {visible.map((item) => (
                  <motion.article
                    key={item.bookingId}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(13rem,.8fr)_auto] lg:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-emerald-950/7 dark:bg-white/7">
                        {item.villa.image ? <img src={item.villa.image} alt="" className="h-full w-full object-cover" loading="lazy" /> : <BedDouble className="m-5 size-6 opacity-30" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-serif text-xl font-semibold">{item.guest.name}</p>
                          <StatusPill status={item.checkout.status} />
                        </div>
                        <p className="mt-1 truncate text-xs opacity-46">{item.bookingCode} · {item.guest.email}</p>
                        <p className="mt-2 truncate text-sm font-semibold text-emerald-800 dark:text-emerald-200">{item.villa.name}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <Detail label="Periode" value={`${formatDate(item.stay.checkIn)} – ${formatDate(item.stay.checkOut)}`} />
                      <Detail label="Pembayaran" value={item.checkout.paymentReady ? "Lunas" : "Belum lunas"} alert={!item.checkout.paymentReady} />
                      <Detail label="Tamu" value={`${item.stay.guests} orang`} />
                      <Detail label="Kanal" value={item.checkout.channel === "WEBSITE" ? "Website" : item.checkout.channel === "RECEPTION_DESK" ? "Resepsionis" : "Belum dipilih"} />
                    </div>
                    <div className="flex gap-2 lg:justify-end">
                      {item.checkout.status === "CHECKED_OUT" ? (
                        <button type="button" onClick={() => setSelected(item)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-950/10 px-4 text-xs font-semibold dark:border-white/10">
                          <History className="size-3.5" /> Lihat riwayat
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelected(item)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-700 px-4 text-xs font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
                        >
                          <DoorOpen className="size-3.5" /> {item.checkout.status === "CHECKOUT_REQUESTED" ? "Tinjau permintaan" : "Proses langsung"}
                        </button>
                      )}
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selected ? (
          <CheckoutDialog
            item={selected}
            canConfirm={profile.role === "RECEPTIONIST"}
            onClose={() => setSelected(null)}
            onConfirmed={(updated) => {
              setItems((current) => current.map((item) => item.bookingId === updated.bookingId ? updated : item));
              setSelected(null);
              setFilter("CHECKED_OUT");
              notify({ title: "Checkout berhasil", description: `${updated.guest.name} sudah checkout dan kamar kembali tersedia.`, variant: "success" });
            }}
          />
        ) : null}
      </AnimatePresence>
    </AdminPageShell>
  );
}

function CheckoutDialog({ item, canConfirm, onClose, onConfirmed }: { item: CheckoutBooking; canConfirm: boolean; onClose: () => void; onConfirmed: (item: CheckoutBooking) => void }) {
  const [guestVerified, setGuestVerified] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [checkedOutAt, setCheckedOutAt] = useState(toLocalDateTimeInput(new Date()));
  const [notes, setNotes] = useState(item.checkout.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const historyOnly = item.checkout.status === "CHECKED_OUT";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const confirm = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/checkouts/${encodeURIComponent(item.bookingId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          guestVerified,
          paymentVerified,
          checkedOutAt: new Date(checkedOutAt).toISOString(),
          notes,
          channel: item.checkout.status === "CHECKOUT_REQUESTED" ? "WEBSITE" : "RECEPTION_DESK",
        }),
      });
      const payload = (await response.json()) as { data?: CheckoutBooking; message?: string };
      if (!response.ok || !payload.data) throw new Error(payload.message || "Checkout gagal dikonfirmasi.");
      onConfirmed(payload.data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Checkout gagal dikonfirmasi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[80] grid place-items-center overflow-hidden bg-emerald-950/65 p-0 backdrop-blur-md sm:p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.div role="dialog" aria-modal="true" aria-label="Proses checkout" initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} onMouseDown={(event) => event.stopPropagation()} className="flex h-[100dvh] min-h-0 w-full max-w-2xl flex-col overflow-hidden rounded-none bg-[#fffdf8] text-emerald-950 shadow-2xl dark:bg-[#0c1d19] dark:text-white sm:h-auto sm:max-h-[92dvh] sm:rounded-[2rem]">
        <div className="flex shrink-0 items-start justify-between border-b border-emerald-950/8 p-4 dark:border-white/8 sm:p-6">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">{historyOnly ? "Riwayat checkout" : "Verifikasi checkout"}</p>
            <h2 className="mt-2 break-words font-serif text-2xl font-semibold sm:text-3xl">{item.guest.name}</h2>
            <p className="mt-1 break-words text-xs opacity-48">{item.bookingCode} · {item.villa.name}</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-950/6 dark:bg-white/7" aria-label="Tutup"><X className="size-4" /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailCard icon={UserCheck} label="Data tamu" value={`${item.guest.email} · ${item.guest.phone}`} />
            <DetailCard icon={CalendarClock} label="Masa inap" value={`${formatDate(item.stay.checkIn)} – ${formatDate(item.stay.checkOut)}`} />
            <DetailCard icon={BadgeCheck} label="Pembayaran" value={item.checkout.paymentReady ? "Lunas dan siap diverifikasi" : "Belum lunas — hubungi Finance"} alert={!item.checkout.paymentReady} />
            <DetailCard icon={ShieldCheck} label="Kanal checkout" value={item.checkout.channel === "WEBSITE" ? "Permintaan melalui website" : "Diproses langsung di resepsionis"} />
          </div>

          {historyOnly ? (
            <div className="rounded-2xl border border-emerald-950/9 p-4 dark:border-white/9">
              <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-46">Audit trail</p>
              <div className="mt-4 space-y-4">
                {item.checkout.history.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-sm font-semibold">{event.toStatus === "CHECKED_OUT" ? "Checkout dikonfirmasi" : "Checkout diminta"}</p>
                      <p className="mt-1 text-xs opacity-48">{event.actor?.name || event.actor?.email || "Sistem"} · {formatDateTime(event.createdAt)}</p>
                      {event.notes ? <p className="mt-1 text-xs opacity-60">{event.notes}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <label className="flex items-start gap-3 rounded-2xl border border-emerald-950/9 p-4 dark:border-white/9">
                <input type="checkbox" checked={guestVerified} onChange={(event) => setGuestVerified(event.target.checked)} className="mt-0.5 size-4 accent-emerald-700" />
                <span><span className="block text-sm font-semibold">Data tamu sudah diverifikasi</span><span className="mt-1 block text-xs opacity-48">Nama, booking, villa, dan jumlah tamu sesuai.</span></span>
              </label>
              <label className={`flex items-start gap-3 rounded-2xl border p-4 ${item.checkout.paymentReady ? "border-emerald-950/9 dark:border-white/9" : "border-rose-400/22 bg-rose-400/7"}`}>
                <input type="checkbox" disabled={!item.checkout.paymentReady} checked={paymentVerified} onChange={(event) => setPaymentVerified(event.target.checked)} className="mt-0.5 size-4 accent-emerald-700" />
                <span><span className="block text-sm font-semibold">Pembayaran sudah lunas</span><span className="mt-1 block text-xs opacity-48">Status dari database: {item.paymentStatus}. Checkout terkunci jika belum PAID.</span></span>
              </label>
              <label className="block">
                <span className="text-xs font-semibold opacity-55">Waktu checkout</span>
                <input type="datetime-local" value={checkedOutAt} max={toLocalDateTimeInput(new Date())} onChange={(event) => setCheckedOutAt(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-emerald-950/10 bg-transparent px-4 text-sm outline-none focus:border-emerald-600/50 dark:border-white/10" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold opacity-55">Catatan operasional (opsional)</span>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={2000} placeholder="Kondisi kamar, barang tertinggal, atau catatan tamu..." className="mt-2 w-full resize-none rounded-2xl border border-emerald-950/10 bg-transparent p-4 text-sm outline-none focus:border-emerald-600/50 dark:border-white/10" />
              </label>
              {error ? <p className="rounded-2xl border border-rose-400/20 bg-rose-400/8 p-3 text-sm text-rose-700 dark:text-rose-200">{error}</p> : null}
            </>
          )}
        </div>

        <div className="grid shrink-0 grid-cols-1 gap-2 border-t border-emerald-950/8 p-3 dark:border-white/8 sm:flex sm:flex-wrap sm:justify-end sm:p-5">
          <button type="button" onClick={onClose} className="min-h-11 w-full rounded-full border border-emerald-950/10 px-5 text-sm font-semibold dark:border-white/10 sm:w-auto">Tutup</button>
          {!historyOnly && canConfirm ? (
            <button type="button" disabled={saving || !guestVerified || !paymentVerified || !item.checkout.paymentReady} onClick={() => void confirm()} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">
              {saving ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Konfirmasi Checkout
            </button>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof DoorOpen; label: string; value: number; tone: "emerald" | "amber" | "slate" }) {
  const tones = { emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", amber: "bg-amber-400/14 text-amber-700 dark:text-amber-200", slate: "bg-slate-500/10 text-slate-600 dark:text-slate-300" };
  return <article className="rounded-[1.5rem] border border-emerald-950/9 bg-white/64 p-5 dark:border-white/9 dark:bg-white/5"><div className="flex items-start justify-between"><div><p className="text-xs opacity-46">{label}</p><p className="mt-3 font-serif text-4xl font-semibold">{value}</p></div><span className={`grid size-11 place-items-center rounded-2xl ${tones[tone]}`}><Icon className="size-5" /></span></div></article>;
}

function StatusPill({ status }: { status: CheckoutStatus }) {
  const meta = status === "CHECKOUT_REQUESTED" ? ["Checkout Requested", "bg-amber-300/16 text-amber-700 dark:text-amber-200"] : status === "CHECKED_OUT" ? ["Checked Out", "bg-slate-500/10 text-slate-600 dark:text-slate-300"] : ["Active", "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"];
  return <span className={`rounded-full px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.12em] ${meta[1]}`}>{meta[0]}</span>;
}

function Detail({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return <div><p className="opacity-38">{label}</p><p className={`mt-1 font-semibold ${alert ? "text-rose-600 dark:text-rose-300" : ""}`}>{value}</p></div>;
}

function DetailCard({ icon: Icon, label, value, alert = false }: { icon: typeof UserCheck; label: string; value: string; alert?: boolean }) {
  return <div className="rounded-2xl bg-emerald-950/4 p-4 dark:bg-white/5"><span className={`grid size-9 place-items-center rounded-xl ${alert ? "bg-rose-400/12 text-rose-600 dark:text-rose-300" : "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300"}`}><Icon className="size-4" /></span><p className="mt-3 text-[0.65rem] font-bold uppercase tracking-[0.14em] opacity-40">{label}</p><p className={`mt-1 text-sm font-semibold ${alert ? "text-rose-600 dark:text-rose-300" : ""}`}>{value}</p></div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function toLocalDateTimeInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
