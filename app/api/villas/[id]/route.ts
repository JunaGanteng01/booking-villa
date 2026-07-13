import { NextResponse } from "next/server";
import { getVillaById } from "@/lib/villa-data";

const amenityIconMap: Record<string, string> = {
  Beach: "waves",
  Breakfast: "utensils",
  Butler: "sparkles",
  Chef: "utensils",
  Garden: "leaf",
  Lounge: "sofa",
  Pool: "waves",
  Spa: "sparkles",
  WiFi: "wifi",
  Yoga: "activity",
};

export async function GET(request: Request) {
  const id = decodeURIComponent(new URL(request.url).pathname.split("/").pop() ?? "");
  const villa = getVillaById(id);

  if (!villa) {
    return NextResponse.json(
      {
        error: "VILLA_NOT_FOUND",
        message: "Villa tidak ditemukan.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: {
      id: villa.id,
      slug: villa.id,
      name: villa.name,
      location: villa.location,
      category: villa.category,
      address: villa.address,
      description: villa.description,
      highlight: villa.highlight,
      image: villa.image,
      gallery: villa.gallery.map((url, index) => ({
        id: `${villa.id}-gallery-${index + 1}`,
        url,
        alt:
          index === 0
            ? `${villa.name} cover image`
            : `${villa.name} gallery image ${index + 1}`,
        sortOrder: index,
        isCover: index === 0,
      })),
      facilities: villa.amenities.map((amenity) => ({
        id: amenity.toLowerCase().replace(/\s+/g, "-"),
        name: amenity,
        icon: amenityIconMap[amenity] ?? "check",
        included: true,
      })),
      badges: villa.badges,
      pricePerNight: villa.price,
      rating: villa.rating,
      reviewCount: villa.reviews,
      capacity: {
        guests: villa.guests,
        bedrooms: villa.bedrooms,
        bathrooms: villa.bathrooms,
        size: villa.size,
      },
      availability: {
        available: villa.available,
        calendarMode: "mock",
        statuses: ["AVAILABLE", "PENDING", "BOOKED", "MAINTENANCE"],
      },
      bookingDefaults: {
        minStayNights: 1,
        serviceFeePercent: 5,
        taxPercent: 11,
      },
    },
    meta: {
      source: "mock",
    },
  });
}
