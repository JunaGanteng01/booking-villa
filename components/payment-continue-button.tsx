import { ArrowRight, CreditCard, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaymentMethod } from "@/lib/booking-draft";
import { formatRupiah } from "@/lib/villa-data";

export function PaymentContinueButton({
  method,
  amount,
  onContinue,
}: {
  method: PaymentMethod | undefined;
  amount: number;
  onContinue: () => void;
}) {
  const isManual = method?.id === "bank-transfer";
  const label = isManual
    ? "Lanjut konfirmasi manual"
    : method
      ? `Lanjut ke ${method.title}`
      : "Pilih metode pembayaran";
  const helper = isManual
    ? "Kamu akan diarahkan ke form upload bukti transfer."
    : "Kamu akan melihat simulasi redirect gateway pembayaran.";
  const Icon = isManual ? Landmark : CreditCard;

  return (
    <div>
      <Button className="w-full" variant="gold" size="lg" type="button" onClick={onContinue} disabled={!method}>
        <Icon />
        {label}
        <ArrowRight />
      </Button>
      <p className="mt-2 text-center text-xs leading-6 text-emerald-950/48 dark:text-white/42">
        {helper} Payable now {formatRupiah(amount)}.
      </p>
    </div>
  );
}
