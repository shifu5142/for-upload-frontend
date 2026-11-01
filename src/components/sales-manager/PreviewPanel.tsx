"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { WorkspaceIcon } from "@/lib/workspace/icons";
import type { Category } from "@/lib/workspace/types";

export function PreviewPanel({ categories }: { categories: Category[] }) {
  const t = useTranslations("Preview");
  const [closedIds, setClosedIds] = useState<Record<string, boolean>>({});
  const visible = categories.filter((category) => category.active);

  return (
    <div onClick={(event) => event.stopPropagation()}>
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
            {visible.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#9ca3af]">
                {t("empty")}
              </p>
            ) : (
              visible.map((category, index) => {
                const open = !closedIds[category.id];
                const subcategories = (category.subcategories ?? []).filter(
                  (subcategory) => subcategory.active,
                );
                const primary = index === 0;
                return (
                  <section
                    key={category.id}
                    className="mb-3.5 border-b border-[#ececec] pb-3.5 last:mb-0 last:border-b-0 last:pb-0"
                  >
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() =>
                        setClosedIds((current) => ({
                          ...current,
                          [category.id]: !current[category.id],
                        }))
                      }
                      className={
                        primary
                          ? "flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#111827] px-4 text-sm font-medium text-white"
                          : "flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[#e0e0e0] bg-white px-4 text-sm font-medium text-[#111827] shadow-[0_1px_2px_rgba(17,24,39,0.06)]"
                      }
                    >
                      <WorkspaceIcon
                        name={category.icon}
                        className={
                          primary ? "size-4 text-white" : "size-4 text-[#111827]"
                        }
                      />
                      <span className="truncate">{category.name}</span>
                      <ChevronDown
                        className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""} ${primary ? "text-white" : "text-[#111827]"}`}
                      />
                    </button>
                    {open && subcategories.length > 0 ? (
                      <div className="mt-2 flex flex-col gap-1.5 border-s-2 border-[#e5e7eb] ps-2.5">
                        {subcategories.map((subcategory) => (
                          <div
                            key={subcategory.id}
                            className="flex h-9 items-center rounded-lg border border-[#ececec] bg-white px-3 text-sm text-[#374151] shadow-[0_1px_2px_rgba(17,24,39,0.04)]"
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
        {visible.length === 0
          ? t("hidden")
          : t("activeButtons", { count: visible.length })}
      </p>
    </div>
  );
}
