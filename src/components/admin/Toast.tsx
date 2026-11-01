"use client";

import { useTranslations } from "next-intl";

export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const t = useTranslations("Common");
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4">
      <div
        role="status"
        className="pointer-events-auto flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-lg"
      >
        <span>{message}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-zinc-400 hover:text-zinc-700"
          aria-label={t("close")}
        >
          ×
        </button>
      </div>
    </div>
  );
}
