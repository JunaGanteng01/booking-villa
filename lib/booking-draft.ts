export const bookingDraftStorageKey = "villaku.bookingDraft";
export const paymentDraftStorageKey = "villaku.paymentDraft";
export const manualPaymentConfirmationStorageKey = "villaku.manualPaymentConfirmation";

export type BookingDraft = {
  id: string;
  createdAt: string;
  status: string;
  villa: {
    id: string;
    name: string;
    location: string;
    area: string;
    image: string;
    price: number;
  };
  stay: {
    checkIn: string;
    checkOut: string;
    nights: number;
    guests: number;
  };
  guest: {
    name: string;
    email: string;
    phone: string;
  };
  addOns: Array<{
    id: string;
    label: string;
    description: string;
    price: number;
  }>;
  promo: {
    code: string;
    label: string;
    status: "empty" | "applied" | "invalid" | "ineligible";
    discount: number;
  };
  pricing: {
    subtotal: number;
    guestService: number;
    addOnsTotal: number;
    discount: number;
    taxableAmount: number;
    service: number;
    tax: number;
    total: number;
    deposit: number;
    remaining: number;
  };
};

export type PaymentMethod = {
  id: string;
  title: string;
  description: string;
  badge: string;
  eta: string;
  fee: number;
  accent: "emerald" | "gold" | "slate";
};

export type PaymentDraft = {
  bookingId: string;
  method: PaymentMethod;
  amount: number;
  deposit: number;
  fee: number;
  status: "method-selected";
  createdAt: string;
};

export type ManualPaymentConfirmation = {
  id: string;
  bookingId: string;
  method: PaymentMethod;
  amount: number;
  senderName: string;
  senderBank: string;
  transferDate: string;
  proofFile: {
    name: string;
    size: number;
    type: string;
  } | null;
  note: string;
  status: "waiting-review";
  createdAt: string;
};

export const paymentMethods: PaymentMethod[] = [
  {
    id: "bank-transfer",
    title: "Bank Transfer Manual",
    description: "Transfer ke rekening VillaKu dan unggah bukti pembayaran pada tahap berikutnya.",
    badge: "Paling fleksibel",
    eta: "Verifikasi 10-30 menit",
    fee: 0,
    accent: "emerald",
  },
  {
    id: "virtual-account",
    title: "Virtual Account",
    description: "Nomor VA otomatis untuk BCA, Mandiri, BNI, BRI, dan Permata.",
    badge: "Otomatis",
    eta: "Konfirmasi instan",
    fee: 4500,
    accent: "gold",
  },
  {
    id: "credit-card",
    title: "Kartu Kredit / Debit",
    description: "Bayar deposit dengan kartu Visa, Mastercard, atau JCB melalui gateway mock.",
    badge: "Global",
    eta: "Konfirmasi instan",
    fee: 25000,
    accent: "slate",
  },
  {
    id: "e-wallet",
    title: "E-Wallet",
    description: "Dukung GoPay, OVO, DANA, dan ShopeePay untuk pembayaran cepat.",
    badge: "Mobile friendly",
    eta: "Konfirmasi instan",
    fee: 6500,
    accent: "emerald",
  },
];

export const manualTransferAccounts = [
  {
    bank: "BCA",
    accountNumber: "8899 0012 3456",
    accountName: "PT VillaKu Luxury Stay",
    branch: "KCP Seminyak",
  },
  {
    bank: "Mandiri",
    accountNumber: "142 00 7891234 5",
    accountName: "PT VillaKu Luxury Stay",
    branch: "KCP Ubud",
  },
];
