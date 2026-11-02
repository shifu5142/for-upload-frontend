"use client";

import { type MouseEvent, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Toast } from "@/components/admin/Toast";
import { CategoriesPanel } from "@/components/sales-manager/CategoriesPanel";
import { FilesPanel } from "@/components/sales-manager/FilesPanel";
import {
  SalesNavProvider,
  type SalesTabId,
} from "@/components/sales-manager/nav";
import { PlaybooksPanel } from "@/components/sales-manager/PlaybooksPanel";
import { PreviewPanel } from "@/components/sales-manager/PreviewPanel";
import { PublishPanel } from "@/components/sales-manager/PublishPanel";
import {
  SalesManagerProvider,
  useSalesManager,
} from "@/lib/sales-manager/store";
import { isSeedCategoryId } from "@/lib/workspace/catalog";
import { useWorkspace } from "@/lib/workspace/store";
import type { Category } from "@/lib/workspace/types";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "categories" },
  { id: "playbooks" },
  { id: "files" },
  { id: "preview" },
  { id: "publish" },
] as const;

type TabId = SalesTabId;

function missingAiPrompt(
  categories: Category[],
  filled?: { id: string; prompt: string },
) {
  const category = categories.findLast(
    (item) => (item.subcategories?.length ?? 0) > 0,
  );
  const subcategory = category?.subcategories?.find((item) => {
    const current = (
      filled?.id === item.id ? filled.prompt : item.aiPrompt
    ).trim();
    return current.length === 0;
  });
  if (!category || !subcategory) return null;
  return { categoryId: category.id, subcategoryId: subcategory.id };
}

export function SalesManager({ categories }: { categories: Category[] }) {
  return (
    <SalesManagerProvider>
      <SalesManagerShell categories={categories} />
    </SalesManagerProvider>
  );
}

function withWorkspaceAdditions(
  backend: Category[],
  workspaceCategories: Category[],
) {
  const additions = new Map(
    workspaceCategories
      .filter((category) => !isSeedCategoryId(category.id))
      .map((category) => [category.id, category]),
  );
  const merged = backend.map((category) => {
    const added = additions.get(category.id);
    additions.delete(category.id);
    if (!added?.subcategories?.length) return category;
    const seen = new Set(
      (category.subcategories ?? []).map((subcategory) => subcategory.id),
    );
    const subcategories = [
      ...(category.subcategories ?? []),
      ...added.subcategories.filter((subcategory) => !seen.has(subcategory.id)),
    ];
    return subcategories.length === (category.subcategories?.length ?? 0)
      ? category
      : { ...category, subcategories };
  });
  return [...merged, ...additions.values()];
}

function isFormControl(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest("button, a, input, textarea, select, label"))
  );
}

function SalesManagerShell({ categories }: { categories: Category[] }) {
  const sales = useSalesManager();
  const workspace = useWorkspace();
  const t = useTranslations("Sales");
  const [tab, setTab] = useState<TabId>("categories");
  const [notice, setNotice] = useState<string | null>(null);
  const [aiRequest, setAiRequest] = useState<{
    id: string;
    token: number;
  } | null>(null);
  const noticeTimer = useRef<number | null>(null);
  const newCategory = workspace.categories.findLast(
    (item) => (item.subcategories?.length ?? 0) > 0,
  );
  const managedCategories =
    newCategory && !categories.some((item) => item.id === newCategory.id)
      ? [...categories, newCategory]
      : categories;
  const previewCategories = withWorkspaceAdditions(
    categories,
    workspace.categories,
  );

  if (!sales.ready) return null;

  const tabIndex = TABS.findIndex((item) => item.id === tab);
  const nextTab = TABS[tabIndex + 1];

  function showAiNotice() {
    setNotice(t("aiRequired"));
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 1500);
  }

  function askForAiPrompt(subcategoryId: string) {
    setAiRequest({ id: subcategoryId, token: Date.now() });
    showAiNotice();
  }

  function goToTab(target: TabId) {
    const movingForward =
      TABS.findIndex((item) => item.id === target) > tabIndex;
    if (tab === "playbooks" && movingForward) {
      const missing = missingAiPrompt(managedCategories);
      if (missing) {
        workspace.expand(missing.categoryId);
        askForAiPrompt(missing.subcategoryId);
        return;
      }
    }
    setTab(target);
  }

  function openNextDiv(event: MouseEvent<HTMLDivElement>) {
    if (tab === "categories") return;
    if (!nextTab || isFormControl(event.target)) return;
    goToTab(nextTab.id);
  }

  function continueAfterPrompt(subcategoryId: string, aiPrompt: string) {
    const missing = missingAiPrompt(managedCategories, {
      id: subcategoryId,
      prompt: aiPrompt,
    });
    if (missing) {
      workspace.expand(missing.categoryId);
      askForAiPrompt(missing.subcategoryId);
      return;
    }
    setTab("files");
  }
  console.log("SalesManager is working");

  return (
    <SalesNavProvider openTab={goToTab}>
      <section className="mb-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-zinc-950">
              {t("title")}
            </h2>
            <p className="text-xs text-zinc-500">{t("subtitle")}</p>
          </div>
          <nav className="ms-auto flex flex-wrap gap-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goToTab(item.id)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-sm",
                  tab === item.id
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-600 hover:bg-zinc-100",
                )}
              >
                {t(item.id)}
              </button>
            ))}
          </nav>
        </div>
        <div
          className={cn(
            "admin-scroll max-h-[70vh] overflow-y-auto p-4",
            nextTab && tab !== "categories" && "cursor-pointer",
          )}
          onClick={openNextDiv}
        >
          {tab === "categories" ? <CategoriesPanel /> : null}
          {tab === "playbooks" ? (
            <PlaybooksPanel
              categories={managedCategories}
              aiRequest={aiRequest}
              onAiPromptReady={continueAfterPrompt}
            />
          ) : null}
          {tab === "files" ? <FilesPanel categories={categories} /> : null}
          {tab === "preview" ? (
            <PreviewPanel categories={previewCategories} />
          ) : null}
          {tab === "publish" ? <PublishPanel /> : null}
        </div>
      </section>
      {notice ? (
        <Toast message={notice} onDismiss={() => setNotice(null)} />
      ) : null}
    </SalesNavProvider>
  );
}
