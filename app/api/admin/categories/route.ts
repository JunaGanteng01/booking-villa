import { handleCatalogCreate, handleCatalogList } from "@/lib/admin-catalog-api";

export function GET(request: Request) {
  return handleCatalogList(request, "category");
}

export function POST(request: Request) {
  return handleCatalogCreate(request, "category");
}
