import Link from "next/link";
import { listBrands } from "@/server/services/brand";

export const metadata = { title: "Brands" };

export default async function AdminBrandsPage() {
  const brands = await listBrands();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Brands</h1>
        <Link href="/admin/brands/new" className="rounded-lg bg-[#C6E86B] px-4 py-2 text-sm font-semibold text-[#0A2399]">
          + Add brand
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => {
          const theme = b.theme as { bg?: string; fg?: string; accent?: string };
          return (
            <Link
              key={b.id}
              href={`/admin/brands/${b.id}`}
              className="overflow-hidden rounded-2xl border border-white/10"
              style={{ background: theme.bg, color: theme.fg }}
            >
              <div className="p-5">
                <p className="text-xs uppercase tracking-wide opacity-70">
                  Brand {b.number} · {b.status}
                </p>
                <p className="mt-2 text-2xl font-bold">{b.name}</p>
                <p className="mt-1 text-sm opacity-70">{b.slug}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
