import { loadFormBrands } from "@/server/services/recipe-form";
import { RecipeForm } from "@/components/admin/RecipeForm";
import { ImportUploadForm } from "@/components/admin/ImportUploadForm";

export const metadata = { title: "Add Recipe" };

export default async function NewRecipePage() {
  const formBrands = await loadFormBrands();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Add recipe</h1>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Upload from Excel</h2>
            <p className="text-sm text-slate-600">
              Add one or many recipes from an .xlsx/.xls/.csv file — you&apos;ll see a preview before anything is saved.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download from a route handler */}
          <a href="/api/admin/import/template" className="shrink-0 rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200">
            ↓ Download template
          </a>
        </div>
        <ImportUploadForm compact />
      </section>

      <p className="mb-4 text-sm font-medium text-slate-500">Or fill in the form manually:</p>
      <RecipeForm brands={formBrands} />
    </div>
  );
}
