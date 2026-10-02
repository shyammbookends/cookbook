"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  createCategoryAction,
  deleteCategoryAction,
  createTagAction,
  deleteTagAction,
  uploadCategoryImageAction,
  setCategoryImageUrlAction,
  removeCategoryImageAction,
} from "@/app/admin/actions/taxonomy";
import { getCategoryImageUrl } from "@/lib/media";

interface CategoryImage {
  id: string;
  storageKey?: string | null;
  sourceUrl?: string | null;
  variants?: unknown;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: CategoryImage | null;
  _count: { recipes: number };
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  _count: { recipeTags: number };
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  categories: Category[];
  tags: Tag[];
}

export function CategoryTagManager({ brand }: { brand: Brand }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Category Image Modal State
  const [activeCategoryForImage, setActiveCategoryForImage] = useState<Category | null>(null);
  const [modalTab, setModalTab] = useState<"upload" | "url">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openImageModal(category: Category) {
    setActiveCategoryForImage(category);
    setModalTab("upload");
    setSelectedFile(null);
    setFilePreview(null);
    setUrlInput("");
    setModalError(null);
  }

  function closeImageModal() {
    setActiveCategoryForImage(null);
    setSelectedFile(null);
    setFilePreview(null);
    setUrlInput("");
    setModalError(null);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFilePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleUploadFile() {
    if (!activeCategoryForImage || !selectedFile) return;
    setModalLoading(true);
    setModalError(null);
    try {
      const fd = new FormData();
      fd.set("file", selectedFile);
      const res = await uploadCategoryImageAction(activeCategoryForImage.id, fd);
      if (!res.ok) {
        setModalError(res.error || "Failed to upload image");
      } else {
        closeImageModal();
        router.refresh();
      }
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error uploading image");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleImportUrl() {
    if (!activeCategoryForImage || !urlInput.trim()) return;
    setModalLoading(true);
    setModalError(null);
    try {
      const res = await setCategoryImageUrlAction(activeCategoryForImage.id, urlInput.trim());
      if (!res.ok) {
        setModalError(res.error || "Failed to import image from URL");
      } else {
        closeImageModal();
        router.refresh();
      }
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error importing image");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleRemoveImage() {
    if (!activeCategoryForImage) return;
    if (!confirm(`Remove custom image from "${activeCategoryForImage.name}"?`)) return;
    setModalLoading(true);
    setModalError(null);
    try {
      const res = await removeCategoryImageAction(activeCategoryForImage.id);
      if (!res.ok) {
        setModalError(res.error || "Failed to remove image");
      } else {
        closeImageModal();
        router.refresh();
      }
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Error removing image");
    } finally {
      setModalLoading(false);
    }
  }

  function addCategory() {
    if (!newCategory.trim() || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await createCategoryAction({
        brandId: brand.id,
        name: newCategory.trim(),
        sortOrder: brand.categories.length,
      });
      if (!result.ok) setError(result.error);
      else {
        setNewCategory("");
        router.refresh();
      }
    });
  }

  function removeCategory(id: string, name: string) {
    if (!confirm(`Delete category "${name}"?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (!result.ok) {
        setError(result.error);
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function addTag() {
    if (!newTag.trim() || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await createTagAction({ brandId: brand.id, name: newTag.trim() });
      if (!result.ok) setError(result.error);
      else {
        setNewTag("");
        router.refresh();
      }
    });
  }

  function removeTag(id: string, name: string) {
    if (!confirm(`Delete tag "${name}"?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteTagAction(id);
      if (!result.ok) {
        setError(result.error);
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{brand.name}</h2>
          <span className="text-xs text-slate-400 font-mono">/{brand.slug}</span>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {brand.categories.length} categories · {brand.tags.length} tags
        </span>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Categories Section */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Categories</p>
            <span className="text-[11px] text-slate-400 font-medium">Click thumbnail or &quot;Image&quot; to change photo</span>
          </div>

          <ul className="mb-4 space-y-2 text-sm">
            {brand.categories.map((c) => {
              const previewUrl = getCategoryImageUrl(c);
              const hasCustomImage = !!c.image;

              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm hover:border-slate-300 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Category Image Thumbnail */}
                    <button
                      type="button"
                      onClick={() => openImageModal(c)}
                      className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title="Click to change category image"
                    >
                      <img
                        src={previewUrl}
                        alt={c.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <svg className="w-4 h-4 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 truncate">{c.name}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 shrink-0">
                          {c._count.recipes} {c._count.recipes === 1 ? "recipe" : "recipes"}
                        </span>
                        {hasCustomImage ? (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 shrink-0 border border-emerald-200">
                            Custom img
                          </span>
                        ) : (
                          <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 shrink-0 border border-slate-200">
                            Auto img
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">/{c.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => openImageModal(c)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors shadow-2xs"
                      title="Set or change category image"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Image</span>
                    </button>

                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => removeCategory(c.id, c.name)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Delete category"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
            {brand.categories.length === 0 && (
              <li className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white">
                No categories yet.
              </li>
            )}
          </ul>

          <div className="flex gap-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
              placeholder="New category name (e.g. Pizza, Pasta)…"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <button
              type="button"
              disabled={pending || !newCategory.trim()}
              onClick={addCategory}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        {/* Tags Section */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Tags</p>
          <ul className="mb-4 flex flex-wrap gap-2">
            {brand.tags.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm hover:border-slate-300 transition-colors"
              >
                <span className="font-medium text-slate-800">{t.name}</span>
                <span className="text-[10px] font-semibold text-slate-400">({t._count.recipeTags})</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => removeTag(t.id, t.name)}
                  className="ml-1 rounded-full p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Delete tag"
                >
                  ✕
                </button>
              </li>
            ))}
            {brand.tags.length === 0 && (
              <li className="w-full py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white">
                No tags yet.
              </li>
            )}
          </ul>
          <div className="flex gap-2">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="New tag name (press Enter to add)…"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <button
              type="button"
              disabled={pending || !newTag.trim()}
              onClick={addTag}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Category Image Modal */}
      {activeCategoryForImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Category Image: <span className="text-blue-600">{activeCategoryForImage.name}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Displayed on the brand homepage and menu category header
                </p>
              </div>
              <button
                type="button"
                onClick={closeImageModal}
                disabled={modalLoading}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {modalError}
              </div>
            )}

            {/* Current Image Preview */}
            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Live Preview
              </label>
              <div className="relative h-40 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-inner flex items-center justify-center">
                <img
                  src={filePreview || (activeCategoryForImage ? getCategoryImageUrl(activeCategoryForImage) : "")}
                  alt={activeCategoryForImage.name}
                  className="absolute inset-0 h-full w-full object-cover brightness-75"
                />
                <div className="absolute inset-0 bg-black/30" />
                <h4 className="relative z-10 text-2xl font-black text-white tracking-wide drop-shadow-md">
                  {activeCategoryForImage.name}
                </h4>

                {filePreview && (
                  <span className="absolute top-2 left-2 z-20 rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                    New Preview (Unsaved)
                  </span>
                )}
              </div>
            </div>

            {/* Tab Selector */}
            <div className="mt-5 flex border-b border-slate-200 text-sm font-medium">
              <button
                type="button"
                onClick={() => setModalTab("upload")}
                className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                  modalTab === "upload"
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setModalTab("url")}
                className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                  modalTab === "url"
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Import from URL
              </button>
            </div>

            {/* Upload Tab */}
            {modalTab === "upload" && (
              <div className="mt-4 space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all bg-slate-50/50"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB — Click to choose different file</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Click or drag image here</p>
                      <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, WebP, AVIF up to 10MB</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  {activeCategoryForImage.image && (
                    <button
                      type="button"
                      disabled={modalLoading}
                      onClick={handleRemoveImage}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Reset to Default
                    </button>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      disabled={modalLoading}
                      onClick={closeImageModal}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={modalLoading || !selectedFile}
                      onClick={handleUploadFile}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {modalLoading ? "Uploading…" : "Upload & Save"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* URL Tab */}
            {modalTab === "url" && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Image Web URL
                  </label>
                  <input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Paste a direct image link from Unsplash, Imgur, or your CDN.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  {activeCategoryForImage.image && (
                    <button
                      type="button"
                      disabled={modalLoading}
                      onClick={handleRemoveImage}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Reset to Default
                    </button>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      disabled={modalLoading}
                      onClick={closeImageModal}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={modalLoading || !urlInput.trim()}
                      onClick={handleImportUrl}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {modalLoading ? "Importing…" : "Import & Save"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
