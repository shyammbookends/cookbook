import { db } from "@/server/db";
import { requireAdminOrRedirect } from "@/app/admin/actions/auth";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { CustomFieldsManager } from "@/components/admin/CustomFieldsManager";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const admin = await requireAdminOrRedirect();
  const [fields, brands] = await Promise.all([
    db.fieldDefinition.findMany({ orderBy: { sortOrder: "asc" } }),
    db.brand.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl space-y-10">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      <section>
        <h2 className="mb-3 font-semibold text-slate-800">Your account</h2>
        <p className="mb-4 text-sm text-slate-600 font-medium">{admin.name} · {admin.email} · {admin.role}</p>
        <ChangePasswordForm />
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-slate-800">Custom recipe fields</h2>
        <p className="mb-4 text-sm text-slate-600">
          Add a field here and it appears in the recipe form, the Excel template, and the import mapping — no code changes needed.
        </p>
        <CustomFieldsManager
          fields={fields.map((f) => ({ id: f.id, key: f.key, label: f.label, type: f.type, brandId: f.brandId, required: f.required }))}
          brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        />
      </section>
    </div>
  );
}
