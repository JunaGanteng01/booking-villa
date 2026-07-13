import { villas } from "@/lib/villa-data";

type SortKey = "recommended" | "rating" | "price-low" | "price-high";

type QueryResult =
  | {
      ok: true;
      status: 200;
      body: {
        data: Array<{
          id: string;
          slug: string;
          name: string;
          location: string;
          category: string;
          image: string;
          pricePerNight: number;
          rating: number;
          reviewCount: number;
          guests: number;
          bedrooms: number;
          bathrooms: number;
          size: string;
          badges: string[];
          amenities: string[];
          available: boolean;
          highlight: string;
        }>;
        meta: {
          source: "mock";
          total: number;
          page: number;
          pageSize: number;
          pageCount: number;
          hasNextPage: boolean;
          hasPreviousPage: boolean;
          filters: {
            location: string | null;
            category: string | null;
            q: string | null;
            checkIn: string | null;
            checkOut: string | null;
            guests: number;
            sort: SortKey;
            availableOnly: boolean;
            minPrice: number | null;
            maxPrice: number | null;
          };
        };
      };
    }
  | {
      ok: false;
      status: 400;
      body: {
        error: string;
        message: string;
      };
    };

const blockedDatesByVilla: Record<string, string[]> = {
  "aruna-cliffside": ["2026-08-21", "2026-08-22"],
  "maira-family-estate": ["2026-08-14", "2026-08-15", "2026-08-16", "2026-08-17"],
  "kayumanis-garden": ["2026-08-16", "2026-08-17", "2026-08-18"],
  "sagara-beach": ["2026-08-24", "2026-08-25"],
};

export function queryVillas(searchParams: URLSearchParams): QueryResult {
  const location = normalizeOptional(searchParams.get("location"));
  const category = normalizeOptional(searchParams.get("category"));
  const q = normalizeOptional(searchParams.get("q"));
  const checkIn = normalizeOptional(searchParams.get("checkIn"));
  const checkOut = normalizeOptional(searchParams.get("checkOut"));
  const guests = parsePositiveInt(searchParams.get("guests"), 1);
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = Math.min(parsePositiveInt(searchParams.get("pageSize"), 6), 24);
  const sort = parseSort(searchParams.get("sort"));
  const availableOnly = parseBoolean(searchParams.get("available"));
  const minPrice = parseOptionalPositiveInt(searchParams.get("minPrice"));
  const maxPrice = parseOptionalPositiveInt(searchParams.get("maxPrice"));

  if (minPrice !== null && maxPrice !== null && maxPrice < minPrice) {
    return {
      ok: false,
      status: 400,
      body: {
        error: "INVALID_PRICE_RANGE",
        message: "maxPrice harus lebih besar atau sama dengan minPrice.",
      },
    };
  }

  const dateValidation = validateDateRange(checkIn, checkOut);
  if (!dateValidation.ok) {
    return {
      ok: false,
      status: 400,
      body: {
        error: "INVALID_DATE_RANGE",
        message: dateValidation.message,
      },
    };
  }

  const requestedDates =
    checkIn && checkOut ? getStayDates(checkIn, checkOut) : [];

  const filtered = villas
    .filter((villa) => {
      const matchesLocation =
        !location ||
        location === "semua lokasi" ||
        location === "bali" ||
        villa.location.toLowerCase() === location;

      const matchesCategory =
        !category ||
        category === "semua tipe" ||
        villa.category.toLowerCase() === category;

      const matchesQuery =
        !q ||
        villa.name.toLowerCase().includes(q) ||
        villa.location.toLowerCase().includes(q) ||
        villa.category.toLowerCase().includes(q) ||
        villa.badges.join(" ").toLowerCase().includes(q) ||
        villa.amenities.join(" ").toLowerCase().includes(q);

      const matchesGuests = villa.guests >= guests;
      const matchesPrice =
        (minPrice === null || villa.price >= minPrice) &&
        (maxPrice === null || villa.price <= maxPrice);
      const matchesAvailableFlag = !availableOnly || villa.available;
      const matchesDates =
        requestedDates.length === 0 ||
        (villa.available &&
          requestedDates.every(
            (date) => !blockedDatesByVilla[villa.id]?.includes(date),
          ));

      return (
        matchesLocation &&
        matchesCategory &&
        matchesQuery &&
        matchesGuests &&
        matchesPrice &&
        matchesAvailableFlag &&
        matchesDates
      );
    })
    .sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      return b.rating * 100 + b.reviews - (a.rating * 100 + a.reviews);
    });

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const data = filtered
    .slice((safePage - 1) * pageSize, safePage * pageSize)
    .map((villa) => ({
      id: villa.id,
      slug: villa.id,
      name: villa.name,
      location: villa.location,
      category: villa.category,
      image: villa.image,
      pricePerNight: villa.price,
      rating: villa.rating,
      reviewCount: villa.reviews,
      guests: villa.guests,
      bedrooms: villa.bedrooms,
      bathrooms: villa.bathrooms,
      size: villa.size,
      badges: villa.badges,
      amenities: villa.amenities,
      available: villa.available,
      highlight: villa.highlight,
    }));

  return {
    ok: true,
    status: 200,
    body: {
      data,
      meta: {
        source: "mock",
        total,
        page: safePage,
        pageSize,
        pageCount,
        hasNextPage: safePage < pageCount,
        hasPreviousPage: safePage > 1,
        filters: {
          location,
          category,
          q,
          checkIn,
          checkOut,
          guests,
          sort,
          availableOnly,
          minPrice,
          maxPrice,
        },
      },
    },
  };
}

function normalizeOptional(value: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

function parseOptionalPositiveInt(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.floor(parsed);
}

function parseBoolean(value: string | null) {
  return value === "true" || value === "1" || value === "yes";
}

function parseSort(value: string | null): SortKey {
  if (
    value === "rating" ||
    value === "price-low" ||
    value === "price-high" ||
    value === "recommended"
  ) {
    return value;
  }

  return "recommended";
}

function validateDateRange(
  checkIn: string | null,
  checkOut: string | null,
): { ok: true } | { ok: false; message: string } {
  if (!checkIn && !checkOut) return { ok: true };
  if (!checkIn || !checkOut) {
    return {
      ok: false,
      message: "checkIn dan checkOut harus dikirim bersamaan.",
    };
  }

  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);
  if (!start || !end) {
    return {
      ok: false,
      message: "Format tanggal harus YYYY-MM-DD.",
    };
  }

  if (end.getTime() <= start.getTime()) {
    return {
      ok: false,
      message: "checkOut harus lebih besar dari checkIn.",
    };
  }

  return { ok: true };
}

function getStayDates(checkIn: string, checkOut: string) {
  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);
  if (!start || !end) return [];

  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor.getTime() < end.getTime()) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}
