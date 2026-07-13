import { CheckCircle2, Clock3, CreditCard, ReceiptText, XCircle } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export type PaymentStatusTone =
  | "draft"
  | "method-selected"
  | "waiting-review"
  | "paid"
  | "failed";

const statusConfig = {
  draft: {
    label: "Draft",
    icon: ReceiptText,
    className: "bg-emerald-900/8 text-emerald-950 dark:bg-white/10 dark:text-white",
  },
  "method-selected": {
    label: "Metode dipilih",
    icon: CreditCard,
    className: "bg-emerald-700 text-white",
  },
  "waiting-review": {
    label: "Waiting review",
    icon: Clock3,
    className: "bg-amber-200 text-emerald-950 dark:bg-amber-200 dark:text-emerald-950",
  },
  paid: {
    label: "Paid",
    icon: CheckCircle2,
    className: "bg-emerald-700 text-white",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-rose-100 text-rose-900 dark:bg-rose-300/20 dark:text-rose-100",
  },
} satisfies Record<
  PaymentStatusTone,
  {
    label: string;
    icon: ComponentType<{ className?: string }>;
    className: string;
  }
>;

export function PaymentStatusBadge({
  status,
  label,
  className,
}: {
  status: PaymentStatusTone;
  label?: string;
  className?: string;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]",
        config.className,
        className,
      )}
    >
      <Icon className="size-4" />
      {label ?? config.label}
    </span>
  );
}
