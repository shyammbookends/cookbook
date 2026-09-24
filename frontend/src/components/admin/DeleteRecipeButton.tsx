"use client";

import { useTransition } from "react";
import { trashRecipeAction } from "@/app/admin/actions/recipe";

export function DeleteRecipeButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (confirm("Are you sure you want to delete this recipe?")) {
      startTransition(async () => {
        const res = await trashRecipeAction(id);
        if (!res.ok) {
          alert("Failed to delete recipe: " + res.error);
        }
      });
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-600 hover:text-red-700 disabled:opacity-50"
      title="Delete recipe"
    >
      {isPending ? "..." : "Trash"}
    </button>
  );
}
