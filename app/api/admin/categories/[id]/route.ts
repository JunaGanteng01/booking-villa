import { handleCatalogDelete, handleCatalogPatch } from "@/lib/admin-catalog-api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleCatalogPatch(request, "category", (await params).id);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleCatalogDelete(request, "category", (await params).id);
}
