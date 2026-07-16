import { handleCatalogCreate, handleCatalogList } from "@/lib/admin-catalog-api";

export function GET(request: Request) {
  return handleCatalogList(request, "amenity");
}

export function POST(request: Request) {
  return handleCatalogCreate(request, "amenity");
}
