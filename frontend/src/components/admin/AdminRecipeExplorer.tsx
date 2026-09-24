"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RecipeListTable } from "@/components/admin/RecipeListTable";

type RecipeItem = {
  id: string;
  title: string;
  status: string;
  heroImageId: string | null;
  updatedAt: Date;
  brand: { id?: string; name: string };
  category: { id?: string; name: string } | null;
};

type BrandItem = {
  id: string;
  name: string;
};

interface AdminRecipeExplorerProps {
  recipes: RecipeItem[];
  brands: BrandItem[];
  initialQuery?: string;
  initialBrand?: string;
  initialStatus?: string;
}

export function AdminRecipeExplorer({
  recipes,
  brands,
  initialQuery = "",
  initialBrand = "",
  initialStatus = "",
}: AdminRecipeExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery || searchParams.get("q") || "");
  const [selectedBrand, setSelectedBrand] = useState(initialBrand || searchParams.get("brand") || "");
  const [selectedStatus, setSelectedStatus] = useState(initialStatus || searchParams.get("status") || "");
  const [onlyMissingImage, setOnlyMissingImage] = useState(searchParams.get("missingImage") === "1");

  // Keep state in sync if URL search params change externally
  useEffect(() => {
    const qFromUrl = searchParams.get("q") || "";
    const brandFromUrl = searchParams.get("brand") || "";
    const statusFromUrl = searchParams.get("status") || "";
    const missingFromUrl = searchParams.get("missingImage") === "1";

    if (qFromUrl !== query) setQuery(qFromUrl);
    if (brandFromUrl !== selectedBrand) setSelectedBrand(brandFromUrl);
    if (statusFromUrl !== selectedStatus) setSelectedStatus(statusFromUrl);
    if (missingFromUrl !== onlyMissingImage) setOnlyMissingImage(missingFromUrl);
  }, [searchParams]);

  // Debounce syncing filter changes to URL search params
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (selectedBrand) params.set("brand", selectedBrand);
      if (selectedStatus) params.set("status", selectedStatus);
      if (onlyMissingImage) params.set("missingImage", "1");

      const qs = params.toString();
      const currentQs = window.location.search.replace(/^\?/, "");
      if (qs !== currentQs) {
        const nextUrl = qs ? `/admin/recipes?${qs}` : "/admin/recipes";
        router.replace(nextUrl, { scroll: false });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, selectedBrand, selectedStatus, onlyMissingImage, router]);

  // Instant client-side auto-detect filter (0ms delay as you type)
  const filteredRecipes = useMemo(() => {
    const q = query.trim().toLowerCase();

    return recipes.filter((r) => {
      // 1. Search Query filter (checks title, brand name, category name)
      if (q) {
        const titleMatch = r.title.toLowerCase().includes(q);
        const brandMatch = r.brand.name.toLowerCase().includes(q);
        const categoryMatch = r.category?.name.toLowerCase().includes(q);
        if (!titleMatch && !brandMatch && !categoryMatch) {
          return false;
        }
      }

      // 2. Brand filter
      if (selectedBrand) {
        const matchesBrand = r.brand.id === selectedBrand || r.brand.name === selectedBrand;
        if (!matchesBrand) return false;
      }

      // 3. Status filter
      if (selectedStatus && r.status !== selectedStatus) {
        return false;
      }

      // 4. Missing image filter
      if (onlyMissingImage && r.heroImageId !== null) {
        return false;
      }

      return true;
    });
  }, [recipes, query, selectedBrand, selectedStatus, onlyMissingImage]);

  const hasActiveFilters = Boolean(query.trim() || selectedBrand || selectedStatus || onlyMissingImage);

  const handleResetFilters = () => {
    setQuery("");
    setSelectedBrand("");
    setSelectedStatus("");
    setOnlyMissingImage(false);
  };

  return (
    <div>
      {/* Live Auto-detect Filter Bar */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar with live auto-detect */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recipes (auto-detects as you type)…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear search"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 hover:bg-slate-200">
                  ✕
                </span>
              </button>
            )}
          </div>

          {/* Brand Dropdown */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Missing Image Toggle */}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={onlyMissingImage}
              onChange={(e) => setOnlyMissingImage(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Missing photo</span>
          </label>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline transition-colors px-2 py-1"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Live Status / Result Count Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-800 font-semibold">{filteredRecipes.length}</strong> of {recipes.length} recipes
            </span>
            {query.trim() && (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-blue-700 font-medium">
                Matching &ldquo;{query}&rdquo;
              </span>
            )}
          </div>
          {query.trim() && (
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Live auto-detect active
            </span>
          )}
        </div>
      </div>

      {/* Recipes Table */}
      <RecipeListTable recipes={filteredRecipes} />
    </div>
  );
}
