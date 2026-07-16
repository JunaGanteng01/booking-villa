import { AdminVillaForm } from "@/components/admin-villa-form";

export default async function EditVillaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminVillaForm mode="edit" villaId={id} />;
}
