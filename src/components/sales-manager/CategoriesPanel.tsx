"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { IconPicker } from "@/components/admin/IconPicker";
import { Toast } from "@/components/admin/Toast";
import { useSalesNav } from "@/components/sales-manager/nav";
import { Button } from "@/components/ui/button";
import { useSalesManager } from "@/lib/sales-manager/store";
import { useWorkspace } from "@/lib/workspace/store";
import type { IconName } from "@/lib/workspace/types";

const BackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
let refreshCategoryList = () => {};
let showSubcategoryDeleteNotice = (_message: string) => {};

export function bindCategoryListRefresh(refresh: () => void) {
  refreshCategoryList = refresh;
  return () => {
    refreshCategoryList = () => {};
  };
}

export function refreshDisplayedCategories() {
  refreshCategoryList();
}

export async function logDeleteClick(
  id: string,
  removeCategory?: (id: string) => void,
) {
  try {
    console.log("הוא לחץ על זה");
    console.log(id);
    const response = await fetch(`${BackendUrl}/category/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (data.message === "Category deleted successfully") {
      console.log("קטגוריה נמחקה בהצלחה");
      removeCategory?.(id);
      refreshCategoryList();
    } else {
      console.error("Failed to delete category");
    }
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}
////////////////////////////////////////////////////////////////////////////////////
export async function logDeleteClickSubcategory(
  subcategoryId: string,
  categoryId: string,
) {
  try {
    const response = await fetch(`${BackendUrl}/category/subcategoriesdelete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        categoryId,
        subcategoryId,
      }),
    });
    const data = await response.json();
    if (data.message === "SubCategory deleted successfully") {
      showSubcategoryDeleteNotice("subcategoryDeleted");
      refreshCategoryList();
    } else {
      showSubcategoryDeleteNotice("subcategoryDeleteFailed");
    }
    return response;
  } catch (error) {
    console.error(error);
  }
}

export function SubcategoryDeleteNotice() {
  const t = useTranslations("Toasts");
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    showSubcategoryDeleteNotice = (next) => {
      setMessage(next);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMessage(null), 1500);
    };
    return () => {
      showSubcategoryDeleteNotice = () => {};
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  if (!message) return null;
  const text =
    message === "subcategoryDeleted" || message === "subcategoryDeleteFailed"
      ? t(message)
      : message;
  return <Toast message={text} onDismiss={() => setMessage(null)} />;
}

const fieldClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15";

export function CategoriesPanel() {
  const sales = useSalesManager();
  const workspace = useWorkspace();
  const openTab = useSalesNav();
  const t = useTranslations("Sales");
  const [categoryName, setCategoryName] = useState("");
  const [subcategoryNames, setSubcategoryNames] = useState<
    { id: string; name: string; description: string; aiPrompt: string }[]
  >(() => [
    { id: crypto.randomUUID(), name: "", description: "", aiPrompt: "" },
  ]);
  const [internalDescription, setInternalDescription] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [icon, setIcon] = useState<IconName>("message");
  const hasSubcategory = subcategoryNames.some(
    (item) => item.name.trim().length > 0,
  );

  function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const category = categoryName.trim();
    const drafts = subcategoryNames
      .map((item) => ({
        name: item.name.trim(),
        description: item.description.trim(),
        aiPrompt: item.aiPrompt.trim(),
      }))
      .filter((item) => item.name);
    if (!category && drafts.length === 0) return;
    let workspaceCategoryId: string | undefined;
    if (category) {
      workspaceCategoryId = workspace.addCategory({
        name: category,
        icon,
        active: true,
        subcategories: drafts,
        internalDescription: drafts.length > 0 ? "" : internalDescription,
        aiDescription: drafts.length > 0 ? "" : aiDescription,
        startOpen: true,
        silent: true,
      });
    } else {
      const parent = workspace.categories.at(-1);
      if (parent) {
        for (const draft of drafts)
          workspace.addSubcategory(parent.id, draft, true);
        workspaceCategoryId = parent.id;
      }
    }
    sales.addCategoryWithSubcategory({
      categoryName,
      subcategoryName: drafts[0]?.name ?? "",
      subcategoryNames: drafts.map((item) => item.name),
      internalDescription: drafts.length > 0 ? "" : internalDescription,
      aiDescription: drafts.length > 0 ? "" : aiDescription,
      icon,
      workspaceCategoryId,
    });
    openTab("playbooks");
    setCategoryName("");
    setSubcategoryNames([
      { id: crypto.randomUUID(), name: "", description: "", aiPrompt: "" },
    ]);
    setInternalDescription("");
    setAiDescription("");
    setIcon("message");
  }

  return (
    <form
      className="grid grid-cols-2 items-start gap-x-4 gap-y-4"
      onSubmit={submitCategory}
    >
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-800">
          {t("category")}
        </span>
        <input
          value={categoryName}
          onChange={(event) => setCategoryName(event.target.value)}
          placeholder={t("categoryPlaceholder")}
          className={`${fieldClass} h-10`}
        />
      </label>
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-zinc-800">
          {t("subcategory")}
        </span>
        <div className="space-y-2">
          {subcategoryNames.map((field, index) => (
            <div
              key={field.id}
              className="space-y-2 rounded-lg border border-zinc-200 p-3"
            >
              <div className="flex items-center gap-2">
                <input
                  value={field.name}
                  onChange={(event) =>
                    setSubcategoryNames((current) =>
                      current.map((item) =>
                        item.id === field.id
                          ? { ...item, name: event.target.value }
                          : item,
                      ),
                    )
                  }
                  placeholder={t("subcategoryPlaceholder")}
                  className={`${fieldClass} h-10`}
                />
                {index === subcategoryNames.length - 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setSubcategoryNames((current) => [
                        ...current,
                        {
                          id: crypto.randomUUID(),
                          name: "",
                          description: "",
                          aiPrompt: "",
                        },
                      ])
                    }
                  >
                    {t("addSubcategory")}
                  </Button>
                ) : null}
              </div>
              <input
                value={field.description}
                onChange={(event) =>
                  setSubcategoryNames((current) =>
                    current.map((item) =>
                      item.id === field.id
                        ? { ...item, description: event.target.value }
                        : item,
                    ),
                  )
                }
                disabled={!field.name.trim()}
                placeholder={t("internalPlaceholder")}
                className={`${fieldClass} h-10 disabled:cursor-not-allowed`}
              />
              <textarea
                value={field.aiPrompt}
                onChange={(event) =>
                  setSubcategoryNames((current) =>
                    current.map((item) =>
                      item.id === field.id
                        ? { ...item, aiPrompt: event.target.value }
                        : item,
                    ),
                  )
                }
                disabled={!field.name.trim()}
                placeholder={t("promptPlaceholder")}
                rows={3}
                className={`${fieldClass} resize-y py-2.5 leading-6 disabled:cursor-not-allowed`}
              />
            </div>
          ))}
        </div>
      </div>
      <label
        className={`col-span-2 block space-y-1.5 transition-opacity ${hasSubcategory ? "pointer-events-none opacity-40" : ""}`}
      >
        <span className="text-sm font-medium text-zinc-800">
          {t("internalDescription")}
        </span>
        <input
          value={internalDescription}
          onChange={(event) => setInternalDescription(event.target.value)}
          placeholder={t("internalOnly")}
          disabled={hasSubcategory}
          className={`${fieldClass} h-10 disabled:cursor-not-allowed`}
        />
      </label>
      <label
        className={`flex h-full flex-col gap-1.5 transition-opacity ${hasSubcategory ? "pointer-events-none opacity-40" : ""}`}
      >
        <span className="text-sm font-medium text-zinc-800">{t("aiText")}</span>
        <textarea
          value={aiDescription}
          onChange={(event) => setAiDescription(event.target.value)}
          disabled={hasSubcategory}
          placeholder={t("aiOnly")}
          className={`${fieldClass} min-h-40 flex-1 resize-y py-2.5 leading-6 disabled:cursor-not-allowed`}
        />
      </label>
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-zinc-800">{t("icon")}</span>
        <IconPicker value={icon} onChange={setIcon} />
      </div>
      <Button type="submit" className="col-span-2 w-fit">
        {t("add")}
      </Button>
    </form>
  );
}
