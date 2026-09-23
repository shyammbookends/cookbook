import Link from "next/link";
import { getDashboardStats } from "@/server/services/dashboard";

export const metadata = { title: "Dashboard" };

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 transition-shadow hover:shadow-md">
      <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total recipes" value={stats.total} />
        <StatCard label="Published" value={stats.published} />
        <StatCard label="Drafts" value={stats.drafts} />
        <StatCard label="Scheduled" value={stats.scheduled} />
        <StatCard label="Categories" value={stats.categories} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {stats.brands.map((b) => (
          <Link key={b.id} href={`/admin/recipes?brand=${b.id}`} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 hover:border-blue-400 hover:shadow-md transition-all">
            <p className="text-sm text-slate-500 font-medium">{b.name}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{b.count} recipes</p>
          </Link>
        ))}
      </div>

      {(stats.needsImage > 0 || stats.failedImports > 0) && (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="font-semibold text-amber-700">Needs attention</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-600">
            {stats.needsImage > 0 && (
              <li>
                <Link href="/admin/recipes?missingImage=1" className="underline hover:text-amber-800">
                  {stats.needsImage} recipe(s) missing a hero image
                </Link>
              </li>
            )}
            {stats.failedImports > 0 && (
              <li>
                <Link href="/admin/import/history" className="underline hover:text-amber-800">
                  {stats.failedImports} import job(s) had errors
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <p className="mb-3 font-semibold text-slate-800">Recent recipes</p>
          <ul className="space-y-2 text-sm">
            {stats.recentRecipes.map((r) => (
              <li key={r.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <Link href={`/admin/recipes/${r.id}`} className="font-medium text-slate-700 hover:text-blue-600 hover:underline transition-colors">
                  {r.title}
                </Link>
                <span className="text-xs text-slate-500 font-medium">
                  {r.brand.name} · {r.status}
                </span>
              </li>
            ))}
            {stats.recentRecipes.length === 0 && <li className="text-slate-400">No recipes yet.</li>}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <p className="mb-3 font-semibold text-slate-800">Recent imports</p>
          <ul className="space-y-2 text-sm">
            {stats.recentImports.map((job) => (
              <li key={job.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <Link href={`/admin/import/${job.id}`} className="font-medium text-slate-700 hover:text-blue-600 hover:underline transition-colors">
                  {job.originalName}
                </Link>
                <span className="text-xs text-slate-500 font-medium">{job.status}</span>
              </li>
            ))}
            {stats.recentImports.length === 0 && <li className="text-slate-400">No imports yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
