"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { WorkspaceIcon } from "@/lib/workspace/icons";
import type { Category } from "@/lib/workspace/types";

export function ExtensionPreview({
  categories,
  status = "ready",
  showInactive = false,
}: {
  categories: Category[];
  status?: "loading" | "ready" | "error";
  showInactive?: boolean;
}) {
  const t = useTranslations("Preview");
  const [closedIds, setClosedIds] = useState<Record<string, boolean>>({});
  const visible = categories;
  const activeCount = categories.filter((category) => category.active).length;
  const subcategoryCount = categories.reduce(
    (sum, category) =>
      category.active
        ? sum +
          (category.subcategories?.filter((subcategory) => subcategory.active)
            .length ?? 0)
        : sum,
    0,
  );

  return (
    <div>
      <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-2xl border border-[#ececec] bg-[#fafafa] shadow-[0_16px_40px_-24px_rgba(17,24,39,0.45)]">
        <div className="flex max-h-[min(640px,calc(100dvh-11rem))] flex-col p-4">
          <header className="flex items-center gap-2.5 border-b border-[#ececec] pb-3">
            <Image
              src="/shirsales-icon.png"
              alt=""
              width={32}
              height={32}
              className="size-8 rounded-[9px]"
            />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-[#111827]">
                shirSales
              </div>
              <div className="text-[11px] text-[#9ca3af]">
                AI Sales Assistant
              </div>
            </div>
          </header>

          <div className="admin-scroll mt-3 min-h-0 flex-1 overflow-y-auto pe-1">
            {status === "loading" && visible.length === 0 ? (
              <div role="status" aria-live="polite" aria-busy="true">
                <p className="sr-only">{t("loading")}</p>
                <div className="flex flex-col gap-3.5">
                  {[0, 1, 2, 3].map((row) => (
                    <div key={row}>
                      <div className="category-shimmer h-12 w-full rounded-xl" style={{ animationDelay: `${row * 120}ms` }} />
                      {row === 0 ? (
                        <div className="mt-2 flex flex-col gap-1.5 border-s-2 border-[#e5e7eb] ps-2.5">
                          <div className="category-shimmer h-9 w-full rounded-lg" style={{ animationDelay: "160ms" }} />
                          <div className="category-shimmer h-9 w-4/5 rounded-lg" style={{ animationDelay: "240ms" }} />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : status === "error" && visible.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#9ca3af]">
                {t("error")}
              </p>
            ) : visible.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#9ca3af]">
                {t("empty")}
              </p>
            ) : (
              visible.map((category, index) => {
                const open = !category.active || !closedIds[category.id];
                const subcategories = (category.subcategories ?? []).filter(
                  (subcategory) => showInactive || subcategory.active,
                );
                const primary = category.active && index === 0;
                return (
                  <section
                    key={category.id}
                    className="mb-3.5 border-b border-[#ececec] pb-3.5 last:mb-0 last:border-b-0 last:pb-0"
                  >
                    <button
                      type="button"
                      aria-expanded={open}
                      disabled={!category.active}
                      onClick={() => {
                        if (!category.active) return;
                        setClosedIds((current) => ({
                          ...current,
                          [category.id]: !current[category.id],
                        }));
                      }}
                      className={
                        !category.active
                          ? "flex h-12 w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-xl border border-[#e5e7eb] bg-[#f3f4f6] px-4 text-sm font-medium text-[#9ca3af]"
                          : primary
                            ? "flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#111827] px-4 text-sm font-medium text-white"
                            : `flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border bg-white px-4 text-sm font-medium text-[#111827] shadow-[0_1px_2px_rgba(17,24,39,0.06)] ${open ? "border-[#111827]" : "border-[#e0e0e0]"}`
                      }
                    >
                      <WorkspaceIcon
                        name={category.icon}
                        className={
                          !category.active
                            ? "size-4 text-[#9ca3af]"
                            : primary
                              ? "size-4 text-white"
                              : "size-4 text-[#111827]"
                        }
                      />
                      <span className="truncate">{category.name}</span>
                      <ChevronDown
                        className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""} ${!category.active ? "text-[#9ca3af]" : primary ? "text-white" : "text-[#111827]"}`}
                      />
                    </button>
                    {open && subcategories.length > 0 ? (
                      <div className="mt-2 flex flex-col gap-1.5 border-s-2 border-[#e5e7eb] ps-2.5">
                        {subcategories.map((subcategory) => (
                          <div
                            key={subcategory.id}
                            className={
                              category.active && subcategory.active
                                ? "flex h-9 items-center rounded-lg border border-[#ececec] bg-white px-3 text-sm text-[#374151] shadow-[0_1px_2px_rgba(17,24,39,0.04)]"
                                : "flex h-9 items-center rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-3 text-sm text-[#9ca3af]"
                            }
                          >
                            <span className="truncate">{subcategory.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </section>
                );
              })
            )}
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-zinc-500">
        {activeCount + subcategoryCount === 0
          ? t("hidden")
          : t("activeButtons", { count: activeCount + subcategoryCount })}
      </p>
    </div>
  );
}
