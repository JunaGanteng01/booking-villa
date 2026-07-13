import { CalendarDays, CreditCard, Users } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import type { BookingDraft } from "@/lib/booking-draft";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/villa-data";

export function PaymentOrderSummary({
  booking,
  methodTitle,
  fee = 0,
  payableAmount,
  title = "Payment summary",
  badge = "Draft",
  children,
}: {
  booking: BookingDraft;
  methodTitle?: string;
  fee?: number;
  payableAmount?: number;
  title?: string;
  badge?: string;
  children?: ReactNode;
}) {
  const amountDue = payableAmount ?? booking.pricing.deposit + fee;

  return (
    <div className="rounded-[2rem] border border-emerald-900/10 bg-white/76 p-5 shadow-[0_24px_80px_rgba(4,34,28,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-950/42 dark:text-white/38">
            {title}
          </p>
          <h3 className="mt-2 font-serif text-3xl text-emerald-950 dark:text-white">
            {formatRupiah(amountDue)}
          </h3>
          <p className="mt-1 text-sm text-emerald-950/56 dark:text-white/50">
            Payable now
          </p>
        </div>
        <span className="rounded-full bg-amber-200/60 px-3 py-1 text-xs font-bold text-emerald-950 dark:bg-amber-200/18 dark:text-amber-100">
          {badge}
        </span>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-emerald-900/10 bg-white/58 p-4 dark:border-white/10 dark:bg-white/6">
        <p className="font-serif text-2xl text-emerald-950 dark:text-white">
          {booking.villa.name}
        </p>
        <div className="mt-4 grid gap-2 text-sm text-emerald-950/62 dark:text-white/58">
          <MiniLine icon={CalendarDays} label={`${formatDate(booking.stay.checkIn)} - ${formatDate(booking.stay.checkOut)}`} />
          <MiniLine icon={Users} label={`${booking.stay.guests} tamu · ${booking.stay.nights} malam`} />
          <MiniLine icon={CreditCard} label={methodTitle ?? "Metode belum dipilih"} />
        </div>
      </div>

      <div className="mt-5 space-y-1 rounded-[1.5rem] bg-emerald-900/5 p-4 dark:bg-white/8">
        <SummaryRow label="Subtotal villa" value={formatRupiah(booking.pricing.subtotal)} />
        {booking.pricing.guestService > 0 ? (
          <SummaryRow label="Tamu tambahan" value={formatRupiah(booking.pricing.guestService)} />
        ) : null}
        <SummaryRow label="Add-on layanan" value={formatRupiah(booking.pricing.addOnsTotal)} />
        <SummaryRow
          label="Diskon kupon"
          value={booking.pricing.discount > 0 ? `-${formatRupiah(booking.pricing.discount)}` : "-"}
          tone={booking.pricing.discount > 0 ? "discount" : "muted"}
        />
        <div className="my-2 border-t border-emerald-900/10 dark:border-white/10" />
        <SummaryRow label="Dasar pajak" value={formatRupiah(booking.pricing.taxableAmount)} />
        <SummaryRow label="Service 5%" value={formatRupiah(booking.pricing.service)} />
        <SummaryRow label="Pajak 11%" value={formatRupiah(booking.pricing.tax)} />
        <div className="my-2 border-t border-emerald-900/10 dark:border-white/10" />
        <SummaryRow label="Total booking" value={formatRupiah(booking.pricing.total)} strong />
        <SummaryRow label="Deposit 30%" value={formatRupiah(booking.pricing.deposit)} />
        {fee > 0 ? <SummaryRow label="Payment fee" value={formatRupiah(fee)} /> : null}
        <SummaryRow label="Total dibayar sekarang" value={formatRupiah(amountDue)} strong />
      </div>

      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

function MiniLine({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-amber-600 dark:text-amber-200" />
      <span>{label}</span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  tone = "default",
  strong = false,
}: {
  label: string;
  value: string;
  tone?: "default" | "discount" | "muted";
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm text-emerald-950/62 dark:text-white/58">
      <span>{label}</span>
      <strong
        className={cn(
          "max-w-44 text-right font-semibold",
          tone === "discount"
            ? "text-emerald-700 dark:text-emerald-200"
            : tone === "muted"
              ? "text-emerald-950/52 dark:text-white/48"
              : "text-emerald-950 dark:text-white",
          strong && "font-serif text-base",
        )}
      >
        {value}
      </strong>
    </div>
  );
}

function formatDate(value: string) {
  const date = parseDateOnly(value);
  if (!date) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}
