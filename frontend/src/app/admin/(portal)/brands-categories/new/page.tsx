import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { SimpleBrandForm } from "@/components/admin/SimpleBrandForm";

export const metadata = { title: "Add Brand" };

export default function AdminNewBrandPage() {
  return (
    <AdminPortalShell title="Add Brand" back={{ href: "/admin/brands-categories", label: "Back to Brands & Categories" }}>
      <SimpleBrandForm savedHrefBase="/admin/brands-categories" />
    </AdminPortalShell>
  );
}
