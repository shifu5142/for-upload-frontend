"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { refreshDisplayedCategories } from "@/components/sales-manager/CategoriesPanel";
import { Button } from "@/components/ui/button";
import { useSalesManager } from "@/lib/sales-manager/store";
import { backendUrl } from "@/lib/backend-url";
import { useWorkspace } from "@/lib/workspace/store";
import type { Category } from "@/lib/workspace/types";

export function useToast() {
  return {
    toast: {
      error: (message: string) => console.error(message),
      success: (message: string) => console.log(message),
    },
  };
}
function lastEnteredCategory(categories: Category[]) {
  const category = categories.findLast(
    (item) => (item.subcategories?.length ?? 0) > 0,
  );
  if (!category) return null;
  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    subcategories: (category.subcategories ?? []).map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
      items: [
        {
          id: subcategory.id,
          label: subcategory.description,
          prompt: subcategory.aiPrompt,
        },
      ],
    })),
  };
}

export function PublishPanel() {
  const { toast } = useToast();
  const sales = useSalesManager();
  const workspace = useWorkspace();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const t = useTranslations("PublishPanel");

  async function handlePublishClick() {
    try {
      const payload = lastEnteredCategory(workspace.categories);
      if (payload) console.log(payload);
      void sales.publishChanges();
      setConfirmOpen(false);
      //to server
      const response = await fetch(
        `${backendUrl}/prompts-data/category-publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        throw new Error("שיגאה בפירסום: " + response.statusText);
      }
      const data = await response.json();
      if (data.message === "קטוגריה זו קיימת כבר") {
        toast.error(data.message);
      } else {
        if (data.message === "נוסף בהצלחה") {
          toast.success(data.message);
          if (payload) console.log(payload);
          void sales.publishChanges();
          setConfirmOpen(false);
        }
      }
      refreshDisplayedCategories();
    } catch (error) {
      console.error(error);
      toast.error(t("error"));
    }
  }
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-zinc-950">{t("title")}</h3>
      <p className="mt-1 text-sm leading-6 text-zinc-500">{t("localHint")}</p>
      <p className="mt-3 text-sm text-zinc-700">
        {sales.dirty ? t("pending") : t("none")}
      </p>
      {sales.publishMessage ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {sales.publishMessage === "published"
            ? t("published")
            : sales.publishMessage}
        </p>
      ) : null}
      <Button
        type="button"
        className="mt-4"
        disabled={!sales.dirty}
        onClick={() => setConfirmOpen(true)}
      >
        {t("publish")}
      </Button>
      <Dialog.Root
        open={confirmOpen}
        onOpenChange={(next) => {
          if (!next) setConfirmOpen(false);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[80] bg-zinc-950/25" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-[80] w-[min(100%-2rem,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl outline-none">
            <Dialog.Title className="text-base font-semibold text-zinc-950">
              {t("title")}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-zinc-600">
              {t("confirm")}
            </Dialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="button" onClick={handlePublishClick}>
                {t("submit")}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
