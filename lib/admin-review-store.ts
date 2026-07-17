export type AdminReviewStatus = "PENDING" | "PUBLISHED" | "HIDDEN" | "FLAGGED";

export type AdminReviewRecord = {
  id: string;
  userId: string;
  villaId: string;
  rating: number;
  title: string | null;
  comment: string;
  status: AdminReviewStatus;
  isFeatured: boolean;
  isVerified: boolean;
  moderationNote: string | null;
  moderatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: { name: string | null; email: string };
  villa: { name: string };
};

const globalForReviews = globalThis as typeof globalThis & {
  villakuAdminReviewStore?: Map<string, AdminReviewRecord>;
};

const reviewStore =
  globalForReviews.villakuAdminReviewStore ?? createSeedReviews();
if (process.env.NODE_ENV !== "production")
  globalForReviews.villakuAdminReviewStore = reviewStore;

export function listAdminReviewRecords() {
  return Array.from(reviewStore.values()).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function getAdminReviewRecord(id: string) {
  return reviewStore.get(id) ?? null;
}

export function updateAdminReviewRecord(
  id: string,
  patch: Partial<
    Pick<AdminReviewRecord, "status" | "isFeatured" | "moderationNote">
  >,
) {
  const current = reviewStore.get(id);
  if (!current) return null;
  const now = new Date().toISOString();
  const updated = {
    ...current,
    ...patch,
    moderatedAt: now,
    updatedAt: now,
  };
  reviewStore.set(id, updated);
  return updated;
}

export function deleteAdminReviewRecord(id: string) {
  const current = reviewStore.get(id);
  if (!current) return null;
  reviewStore.delete(id);
  return current;
}

function createSeedReviews() {
  const records: AdminReviewRecord[] = [
    {
      id: "RV-2018",
      userId: "customer-maya",
      villaId: "villa-aruna",
      rating: 5,
      title: "Sunset terbaik dan pelayanan personal",
      comment:
        "Seluruh keluarga sangat menikmati stay kami. Villa bersih dan tim concierge sangat sigap.",
      status: "PENDING",
      isFeatured: false,
      isVerified: true,
      moderationNote: null,
      moderatedAt: null,
      createdAt: "2026-07-14T09:42:00.000Z",
      updatedAt: "2026-07-14T09:42:00.000Z",
      user: { name: "Maya Putri", email: "maya@villaku.test" },
      villa: { name: "Villa Aruna Cliffside" },
    },
    {
      id: "RV-2011",
      userId: "customer-sofia",
      villaId: "villa-nara",
      rating: 3,
      title: "Tempat indah, komunikasi perlu ditingkatkan",
      comment:
        "Villa sangat cantik, namun informasi check-in perlu dibuat lebih jelas.",
      status: "FLAGGED",
      isFeatured: false,
      isVerified: true,
      moderationNote: "Perlu ditinjau oleh tim operasional.",
      moderatedAt: null,
      createdAt: "2026-07-13T13:20:00.000Z",
      updatedAt: "2026-07-13T13:20:00.000Z",
      user: { name: "Sofia Laurent", email: "sofia@example.com" },
      villa: { name: "Nara Jungle Residence" },
    },
  ];
  return new Map(records.map((record) => [record.id, record]));
}
