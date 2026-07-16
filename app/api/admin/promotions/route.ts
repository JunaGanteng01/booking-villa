import { handleCatalogCreate, handleCatalogList } from "@/lib/admin-catalog-api";

export function GET(request: Request) {
  return handleCatalogList(request, "promotion");
}

export function POST(request: Request) {
  return handleCatalogCreate(request, "promotion");
}
