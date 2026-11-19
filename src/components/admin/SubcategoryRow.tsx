"use client";

import { Dialog } from "@base-ui/react/dialog";
import { type DraggableAttributes } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { ActiveToggleButton } from "@/components/admin/ActiveToggleButton";
import { GripDots } from "@/components/admin/GripDots";
import { HighlightText } from "@/components/admin/Search";
import { Button } from "@/components/ui/button";
import type { SaveSubcategoryNameDto } from "../../../../back-end/src/category/dto/saveSubcategoryName.dto";
import { refreshDisplayedCategories } from "@/components/sales-manager/CategoriesPanel";
import { backendUrl } from "@/lib/backend-url";
import { cn } from "@/lib/utils";
import { WorkspaceIcon } from "@/lib/workspace/icons";
import { useWorkspace } from "@/lib/workspace/store";
import { useWorkspaceUi } from "@/lib/workspace/ui";
import type { Category, CategorySubcategory } from "@/lib/workspace/types";

export function SortableSubcategoryRow(
  props: Omit<Parameters<typeof SubcategoryRow>[0], "dragHandle">,
) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `suborder:${props.subcategory.id}` });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <SubcategoryRow
        {...props}
        dragHandle={{
          attributes,
          listeners,
          isDragging,
        }}
      />
    </div>
  );
}

export function SubcategoryRow({
  categoryId,
  categoryName,
  subcategory,
  categoryActive = true,
  icon,
  showAiPlus,
  aiRequest,
  onAiPromptReady,
  canToggleActive,
  changesEnabled = true,
  onChangesBlocked,
  onToggleBlocked,
  onDeleteBlocked,
  onValuesChange,
  onRequestDelete,
  dragHandle,
  query = "",
  loggedIn = false,
}: {
  categoryId: string;
  categoryName: string;
  subcategory: CategorySubcategory;
  categoryActive?: boolean;
  icon: Category["icon"];
  showAiPlus: boolean;
  aiRequest?: { id: string; token: number } | null;
  onAiPromptReady?: (subcategoryId: string, aiPrompt: string) => void;
  canToggleActive: boolean;
  changesEnabled?: boolean;
  onChangesBlocked?: () => void;
  onToggleBlocked?: () => void;
  onDeleteBlocked?: () => void;
  dragHandle?: {
    attributes: DraggableAttributes;
    listeners?: Record<string, Function> | undefined;
    isDragging: boolean;
  };
  onValuesChange?: (
    subcategoryId: string,
    values: { description: string; aiPrompt: string },
  ) => void;
  onRequestDelete: () => void;
  query?: string;
  loggedIn?: boolean;
}) {
  const { setSubcategoryContent, setSubcategoryActive } = useWorkspace();
  const { saveSubcategory } = useWorkspaceUi();
  const t = useTranslations("Category");
  const [editorOpen, setEditorOpen] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renamePending, setRenamePending] = useState(false);
  const [shownName, setShownName] = useState(subcategory.name);
  const [shownActive, setShownActive] = useState(subcategory.active);
  const [draftName, setDraftName] = useState(subcategory.name);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { description: string; aiPrompt: string }>
  >({});
  const openedRequest = useRef(0);
  const formItems = subcategoryFormItems(subcategory);
  const contentLocked = !canToggleActive || !changesEnabled;

  useEffect(() => {
    setShownName(subcategory.name);
  }, [subcategory.name]);

  useEffect(() => {
    setShownActive(subcategory.active);
  }, [subcategory.active]);

  useEffect(() => {
    if (!renaming) setDraftName(shownName);
  }, [renaming, shownName]);

  useEffect(() => {
    if (renaming) renameInputRef.current?.focus();
  }, [renaming]);

  function setSubcategoryName(subcategoryId: string, name: string) {
    if (subcategoryId === subcategory.id) setShownName(name);
  }

  function startSubcategoryRename() {
    if (!canToggleActive) return;
    setDraftName(shownName);
    setRenaming(true);
  }

  async function commitSubcategoryRename() {
    if (renamePending) return;
    const content = draftName.trim();
    setRenamePending(true);
    try {
      await saveSubcategoryName(
        {
          subcategoryId: subcategory.id,
          categoryId,
          content,
        },
        setSubcategoryName,
      );
    } finally {
      setRenamePending(false);
      setRenaming(false);
    }
  }

  function openPromptInChat() {
    if (!loggedIn) return;
    const first = formItems[0];
    const prompt = (
      drafts[first?.id ?? ""]?.aiPrompt ||
      first?.prompt ||
      subcategory.aiPrompt
    ).trim();
    if (!prompt) return;
    const url = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openEditor() {
    setDrafts(
      Object.fromEntries(
        formItems.map((item) => [
          item.id,
          {
            description: item.label,
            aiPrompt: item.prompt,
          },
        ]),
      ),
    );
    setEditorOpen(true);
  }

  function requestSubcategoryDelete() {
    if (!canToggleActive) {
      onDeleteBlocked?.();
      return;
    }
    if (!changesEnabled) {
      onChangesBlocked?.();
      return;
    }
    onRequestDelete();
  }

  async function toggleSubcategoryActive() {
    if (togglingActive) return;
    if (!changesEnabled) {
      onChangesBlocked?.();
      return;
    }
    if (!canToggleActive) {
      onToggleBlocked?.();
      return;
    }
    setTogglingActive(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        onToggleBlocked?.();
        return;
      }
      const res = await fetch(`${backendUrl}/category/toggle-subcategory`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subcategoryId: subcategory.id }),
      });
      const data = await res.json();
      if (res.ok) {
        const nextActive =
          typeof data.active === "boolean" ? data.active : !shownActive;
        setShownActive(nextActive);
        setSubcategoryActive(categoryId, subcategory.id, nextActive);
        refreshDisplayedCategories();
      }
    } finally {
      setTogglingActive(false);
    }
  }

  function writeDraft(
    itemId: string,
    patch: { description?: string; aiPrompt?: string },
  ) {
    const next = {
      ...drafts,
      [itemId]: {
        description: drafts[itemId]?.description ?? "",
        aiPrompt: drafts[itemId]?.aiPrompt ?? "",
        ...patch,
      },
    };
    setDrafts(next);
    const firstId = formItems[0]?.id ?? itemId;
    onValuesChange?.(subcategory.id, {
      description: next[firstId]?.description ?? "",
      aiPrompt: next[firstId]?.aiPrompt ?? "",
    });
  }

  useEffect(() => {
    if (!showAiPlus || !aiRequest || aiRequest.id !== subcategory.id) return;
    if (aiRequest.token === openedRequest.current) return;
    openedRequest.current = aiRequest.token;
    const item = formItems[0];
    setDrafts(
      item
        ? {
            [item.id]: {
              description: item.label,
              aiPrompt: item.prompt,
            },
          }
        : {},
    );
    setEditorOpen(true);
  }, [aiRequest, showAiPlus, subcategory.id]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 transition-[box-shadow,border-color,background-color] duration-150",
        shownActive && categoryActive
          ? "bg-white text-zinc-900 hover:border-zinc-200 hover:shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_16px_-12px_rgba(16,24,40,0.35)]"
          : "bg-zinc-50 text-zinc-400",
        dragHandle?.isDragging &&
          "relative z-10 border-zinc-200 bg-white shadow-lg",
      )}
    >
      {dragHandle ? (
        <button
          type="button"
          aria-label={t("reorder")}
          className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 active:cursor-grabbing"
          {...dragHandle.attributes}
          {...dragHandle.listeners}
        >
          <GripDots />
        </button>
      ) : (
        <span className="flex size-7 shrink-0 items-center justify-center text-zinc-400">
          <GripDots />
        </span>
      )}
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-zinc-50 text-zinc-500">
        <WorkspaceIcon name={icon} className="size-3.5" />
      </span>
      <div className="relative flex min-w-0 flex-1 items-center gap-1">
        {renaming ? (
          <input
            ref={renameInputRef}
            value={draftName}
            disabled={renamePending}
            onChange={(event) => setDraftName(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={(event) => {
              if (renamePending) return;
              if (event.key === "Enter") {
                event.preventDefault();
                void commitSubcategoryRename();
              }
              if (event.key === "Escape") {
                setRenaming(false);
                setDraftName(shownName);
              }
            }}
            aria-label={t("rename")}
            aria-busy={renamePending}
            className={cn(
              "relative z-10 h-8 min-w-0 flex-1 rounded-md border bg-white px-2 text-sm font-medium text-zinc-900 outline-none",
              renamePending
                ? "border-zinc-200"
                : "border-blue-500 ring-3 ring-blue-500/15",
            )}
          />
        ) : (
          <button
            type="button"
            disabled={!shownActive || !categoryActive}
            onClick={openEditor}
            className={cn(
              "min-w-0 flex-1 truncate text-start text-sm font-medium",
              shownActive && categoryActive
                ? "text-zinc-900"
                : "cursor-default text-zinc-400",
            )}
          >
            <HighlightText text={shownName} query={query} />
          </button>
        )}
        <button
          type="button"
          aria-label={renaming ? t("save") : t("rename")}
          title={renaming ? t("save") : t("rename")}
          aria-busy={renamePending}
          disabled={!canToggleActive || renamePending}
          onClick={
            renaming
              ? () => void commitSubcategoryRename()
              : startSubcategoryRename
          }
          className={cn(
            "relative z-10 flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md",
            renamePending
              ? "cursor-progress text-zinc-500"
              : canToggleActive
                ? "cursor-pointer text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                : "cursor-not-allowed text-zinc-300",
          )}
        >
          {renamePending ? (
            <span
              className="size-3.5 animate-spin rounded-full border border-current border-t-transparent"
              aria-hidden
            />
          ) : renaming ? (
            <Check className="size-3.5" />
          ) : (
            <Pencil className="size-3.5" />
          )}
        </button>
        {renamePending ? (
          <span
            className="category-shimmer pointer-events-none absolute inset-0 rounded-md opacity-70"
            aria-hidden
          />
        ) : null}
      </div>
      <ActiveToggleButton
        active={shownActive}
        pending={togglingActive}
        activeLabel={t("active")}
        inactiveLabel={t("hidden")}
        onClick={() => void toggleSubcategoryActive()}
        className={cn(!categoryActive && "bg-zinc-200 text-zinc-400")}
      />
      <button
        type="button"
        aria-label={t("deleteSubcategory")}
        onClick={requestSubcategoryDelete}
        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="size-3.5" />
      </button>
      {showAiPlus ? (
        <button
          type="button"
          aria-label={t("aiText")}
          onClick={openEditor}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <Plus className="size-3.5" />
        </button>
      ) : null}
      {editorOpen ? (
        <Dialog.Root
          open={editorOpen}
          onOpenChange={(next) => {
            if (!next) setEditorOpen(false);
          }}
        >
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-[80] bg-zinc-950/25" />
            <Dialog.Popup className="fixed top-1/2 left-1/2 z-[80] max-h-[min(100%-2rem,640px)] w-[min(100%-2rem,420px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl outline-none">
              <Dialog.Title className="text-sm font-semibold text-zinc-950">
                {shownName}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-zinc-500">
                {categoryName}
              </Dialog.Description>
              {contentLocked ? (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {t("adminOnlyContent")}
                </p>
              ) : null}
              <div className="mt-4 space-y-4">
                {formItems.map((item) => (
                  <div key={item.id} className="space-y-3">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-zinc-700">
                        {t("internalDescription")}
                      </span>
                      <textarea
                        value={drafts[item.id]?.description ?? ""}
                        onChange={(event) =>
                          writeDraft(item.id, {
                            description: event.target.value,
                          })
                        }
                        placeholder={item.label || t("savedForSubcategory")}
                        disabled={contentLocked}
                        readOnly={contentLocked}
                        rows={3}
                        className={cn(
                          "w-full resize-y rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15",
                          contentLocked &&
                            "cursor-not-allowed bg-zinc-100 text-zinc-400",
                        )}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-zinc-700">
                        {t("aiPrompt")}
                      </span>
                      <textarea
                        value={drafts[item.id]?.aiPrompt ?? ""}
                        onChange={(event) =>
                          writeDraft(item.id, { aiPrompt: event.target.value })
                        }
                        placeholder={item.prompt || t("savedForSubcategory")}
                        disabled={contentLocked}
                        readOnly={contentLocked}
                        rows={6}
                        className={cn(
                          "w-full resize-y rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15",
                          contentLocked &&
                            "cursor-not-allowed bg-zinc-100 text-zinc-400",
                        )}
                      />
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span
                  title={loggedIn ? undefined : t("showPromptLogin")}
                  className={cn("me-auto", !loggedIn && "cursor-not-allowed")}
                >
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!loggedIn}
                    onClick={openPromptInChat}
                  >
                    {t("showPrompt")}
                  </Button>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditorOpen(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  disabled={contentLocked}
                  className={cn(contentLocked && "cursor-not-allowed")}
                  onClick={() => {
                    if (contentLocked) {
                      onToggleBlocked?.();
                      return;
                    }
                    if (!changesEnabled) {
                      onChangesBlocked?.();
                      return;
                    }
                    const first = formItems[0];
                    const description =
                      drafts[first?.id ?? ""]?.description ?? "";
                    const aiPrompt = drafts[first?.id ?? ""]?.aiPrompt ?? "";
                    const openedForContinue = aiRequest?.id === subcategory.id;
                    if (openedForContinue && !aiPrompt.trim()) {
                      onAiPromptReady?.(subcategory.id, aiPrompt);
                      return;
                    }
                    setSubcategoryContent(categoryId, subcategory.id, {
                      description,
                      aiPrompt,
                    });
                    saveSubcategory({
                      name: subcategory.name,
                      description,
                      prompt: aiPrompt,
                      icon,
                      active: shownActive,
                      autoSend: false,
                      attachments: [],
                      categoryId,
                    });
                    setEditorOpen(false);
                    if (openedForContinue)
                      onAiPromptReady?.(subcategory.id, aiPrompt);
                  }}
                >
                  {t("save")}
                </Button>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}
    </div>
  );
}

async function saveSubcategoryName(
  { subcategoryId, categoryId, content }: SaveSubcategoryNameDto,
  setSubcategoryName: (subcategoryId: string, name: string) => void,
) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${backendUrl}/category/subcategory-rename`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subcategoryId,
      categoryId,
      name: content,
    }),
  });
  console.log("saveSubcategoryName:", response);
  const data = (await response.json()) as {
    playbooks?: { name?: unknown }[];
  };
  const savedName = data.playbooks?.[0]?.name;
  if (response.ok && typeof savedName === "string") {
    setSubcategoryName(subcategoryId, savedName);
  }
  console.log("saveSubcategoryName:", data);
  return data;
}

function subcategoryFormItems(subcategory: CategorySubcategory) {
  const items = (subcategory.items ?? []).filter(
    (item, index, all) =>
      all.findIndex(
        (other) => other.label === item.label && other.prompt === item.prompt,
      ) === index,
  );
  if (items.length > 0) return items;
  return [
    {
      id: subcategory.id,
      label: subcategory.description || "",
      prompt: subcategory.aiPrompt || "",
    },
  ];
}
