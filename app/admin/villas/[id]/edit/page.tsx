import { AdminVillaForm, arunaEditDefaults } from "@/components/admin-villa-form";

export default function EditVillaPage() {
  return <AdminVillaForm mode="edit" initialValues={arunaEditDefaults} />;
}
