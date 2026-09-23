import { BrandForm } from "@/components/admin/BrandForm";

export const metadata = { title: "Add Brand" };

export default function NewBrandPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Add brand</h1>
      <BrandForm />
    </div>
  );
}
