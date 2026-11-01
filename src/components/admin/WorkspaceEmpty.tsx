"use client";

import { useTranslations } from "next-intl";

export function EmptyCategories({
  canEdit,
  onAdd,
}: {
  canEdit: boolean;
  onAdd: () => void;
}) {
  const copy = useTranslations("Workspace");
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
      <p className="text-sm font-medium text-zinc-800">{copy("emptyCategories")}</p>
      <p className="mt-1 text-sm text-zinc-500">{copy("emptyCategoriesHint")}</p>
      <button
        type="button"
        onClick={onAdd}
        disabled={!canEdit}
        className="mt-4 text-sm font-medium text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {copy("addCategory")}
      </button>
    </div>
  );
}

export function EmptyActions() {
  const copy = useTranslations("Workspace");
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
      <p className="text-sm font-medium text-zinc-800">{copy("noActions")}</p>
      <p className="mt-1 text-sm text-zinc-500">{copy("noActionsHint")}</p>
    </div>
  );
}
