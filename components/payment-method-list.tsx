import { Banknote, CheckCircle2, CreditCard, Landmark, Smartphone } from "lucide-react";
import type { ComponentType } from "react";
import type { PaymentMethod } from "@/lib/booking-draft";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/villa-data";

const methodIcons: Record<string, ComponentType<{ className?: string }>> = {
  "bank-transfer": Landmark,
  "virtual-account": Banknote,
  "credit-card": CreditCard,
  "e-wallet": Smartphone,
};

export function PaymentMethodList({
  methods,
  selectedMethodId,
  onSelect,
}: {
  methods: PaymentMethod[];
  selectedMethodId: string;
  onSelect: (methodId: string) => void;
}) {
  return (
    <section className="space-y-4">
      {methods.map((method) => {
        const Icon = methodIcons[method.id] ?? CreditCard;
        const selected = selectedMethodId === method.id;

        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.id)}
            className={cn(
              "group w-full rounded-[2rem] border p-5 text-left shadow-[0_18px_70px_rgba(4,34,28,0.07)] backdrop-blur-xl transition-all duration-300",
              selected
                ? "border-emerald-600/35 bg-emerald-600/10 ring-4 ring-emerald-600/10"
                : "border-emerald-900/10 bg-white/68 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/6 dark:hover:bg-white/10",
            )}
            aria-pressed={selected}
          >
            <div className="flex items-start gap-4">
              <span
                className={cn(
                  "grid size-12 shrink-0 place-items-center rounded-full transition-all",
                  selected
                    ? "bg-emerald-700 text-white"
                    : "bg-emerald-900/5 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white dark:bg-white/10 dark:text-amber-200",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-2xl text-emerald-950 dark:text-white">
                    {method.title}
                  </span>
                  <span className="rounded-full bg-amber-200/60 px-3 py-1 text-xs font-bold text-emerald-950 dark:bg-amber-200/18 dark:text-amber-100">
                    {method.badge}
                  </span>
                </span>
                <span className="mt-2 block text-sm leading-6 text-emerald-950/58 dark:text-white/52">
                  {method.description}
                </span>
                <span className="mt-4 grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-950/45 dark:text-white/42 sm:grid-cols-2">
                  <span>Estimasi: {method.eta}</span>
                  <span>Fee: {method.fee > 0 ? formatRupiah(method.fee) : "Gratis"}</span>
                </span>
              </span>
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border transition-all",
                  selected
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-emerald-900/15 text-transparent dark:border-white/15",
                )}
              >
                <CheckCircle2 className="size-4" />
              </span>
            </div>
          </button>
        );
      })}
    </section>
  );
}
