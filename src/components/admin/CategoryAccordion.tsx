"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Popover } from "@base-ui/react/popover";
import {
  closestCenter,
  type DragEndEvent,
  type DraggableAttributes,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ActionMenu, Hint } from "@/components/admin/controls";
import {
  logDeleteClick,
  logDeleteClickSubcategory,
  refreshDisplayedCategories,
} from "@/components/sales-manager/CategoriesPanel";
import { GripDots } from "@/components/admin/GripDots";
import { IconPicker } from "@/components/admin/IconPicker";
import { PlaybookRow } from "@/components/admin/PlaybookRow";
import { HighlightText } from "@/components/admin/Search";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  categoryDragId,
  dropDragId,
  playbookDragId,
  stripId,
} from "@/lib/workspace/dnd";
import { WorkspaceIcon } from "@/lib/workspace/icons";
import { useWorkspace } from "@/lib/workspace/store";
import { useWorkspaceUi } from "@/lib/workspace/ui";
import type {
  Category,
  CategorySubcategory,
  Playbook,
} from "@/lib/workspace/types";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

function subcategoriesInOrder(
  subcategories: CategorySubcategory[],
  order: string[],
) {
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...subcategories].sort((left, right) => {
    const leftRank = rank.get(left.id);
    const rightRank = rank.get(right.id);
    if (leftRank === undefined && rightRank === undefined) return 0;
    if (leftRank === undefined) return 1;
    if (rightRank === undefined) return -1;
    return leftRank - rightRank;
  });
}

export function CategoryAccordion({
  category,
  playbooks,
  query,
  forceOpen,
  dragDisabled,
  draggingPlaybook,
  onEditPlaybook,
  onCreatePlaybook,
  onDeletePlaybook,
  sectionId,
  changesEnabled = true,
  onChangesBlocked,
  canToggleActive = true,
  onToggleBlocked,
  onDeleteBlocked,
  showSubcategoryAi = false,
  aiRequest = null,
  onAiPromptReady,
}: {
  category: Category;
  playbooks: Playbook[];
  query: string;
  forceOpen: boolean;
  dragDisabled: boolean;
  draggingPlaybook: boolean;
  onEditPlaybook: (id: string) => void;
  onCreatePlaybook: () => void;
  onDeletePlaybook: (playbook: Playbook) => void;
  onDeleteCategory: () => void;
  sectionId?: string;
  changesEnabled?: boolean;
  onChangesBlocked?: () => void;
  canToggleActive?: boolean;
  onToggleBlocked?: () => void;
  onDeleteBlocked?: () => void;
  showSubcategoryAi?: boolean;
  aiRequest?: { id: string; token: number } | null;
  onAiPromptReady?: (subcategoryId: string, aiPrompt: string) => void;
}) {
  const {
    expanded,
    toggleExpanded,
    expand,
    renameCategory,
    setCategoryIcon,
    setCategoryActive,
    duplicatePlaybook,
    setPlaybookActive,
    deleteCategory,
  } = useWorkspace();
  const [active, setActive] = useState(category.active);
  const [orderDraft, setOrderDraft] = useState<string[] | null>(null);
  const [savedOrder, setSavedOrder] = useState<string[] | null>(null);
  const [orderConfirmOpen, setOrderConfirmOpen] = useState(false);
  const ordering = orderDraft !== null;
  const open =
    ordering || !active || forceOpen || expanded[category.id] !== false;
  const [animate, setAnimate] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    kind: "category" | "subcategory";
    categoryId?: string;
  } | null>(null);
  const [draftName, setDraftName] = useState(category.name);
  const cancelRename = useRef(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: categoryDragId(category.id),
    disabled: dragDisabled || !changesEnabled || !active,
  });
  const t = useTranslations("Category");
  const subcategorySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const { getAccessToken } = useWorkspaceUi();

  function allowChange(action: () => void) {
    if (!changesEnabled) {
      onChangesBlocked?.();
      return;
    }
    action();
  }

  async function toggleCategoryActive() {
    if (!canToggleActive) {
      onToggleBlocked?.();
      return;
    }
    if (!changesEnabled) {
      onChangesBlocked?.();
      return;
    }
    const token = await getAccessToken();
    if (!token) {
      onToggleBlocked?.();
      return;
    }
    const res = await fetch(`${backendUrl}/category/toggle-active`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ categoryId: category.id }),
    });
    const data = await res.json();
    if (!res.ok || typeof data.active !== "boolean") return;
    setActive(data.active);
    setCategoryActive(category.id, data.active);
    refreshDisplayedCategories();
  }

  function createPlaybook() {
    if (!canToggleActive) {
      onToggleBlocked?.();
      return;
    }
    allowChange(onCreatePlaybook);
  }

  function togglePlaybookActive(playbook: Playbook) {
    if (!changesEnabled) {
      onChangesBlocked?.();
      return;
    }
    if (!canToggleActive) {
      onToggleBlocked?.();
      return;
    }
    setPlaybookActive(playbook.id, !playbook.active);
  }

  function requestCategoryDelete() {
    if (!canToggleActive) {
      onDeleteBlocked?.();
      return;
    }
    allowChange(() => setPendingDelete({ id: category.id, kind: "category" }));
  }

  function categoryActions() {
    return [
      {
        id: "rename",
        label: t("rename"),
        disabled: !canToggleActive,
        onClick: startCategoryRename,
      },
      ...(canToggleActive
        ? [
            {
              id: "visibility",
              label: active ? t("hide") : t("show"),
              onClick: toggleCategoryActive,
            },
            ...(!ordering
              ? [
                  {
                    id: "reorder",
                    label: t("reorder"),
                    onClick: startSubcategoryReorder,
                  },
                ]
              : []),
          ]
        : []),
      {
        id: "add",
        label: t("addPlaybook"),
        onClick: createPlaybook,
      },
      {
        id: "delete",
        label: t("deleteCategory"),
        onClick: requestCategoryDelete,
        danger: true,
      },
    ];
  }

  function toggleCategoryExpanded() {
    if (!active) return;
    toggleExpanded(category.id);
  }

  function startCategoryRename() {
    if (!canToggleActive) {
      onToggleBlocked?.();
      return;
    }
    allowChange(() => {
      setDraftName(category.name);
      setRenaming(true);
    });
  }

  useEffect(() => {
    setActive(category.active);
  }, [category.active]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (renaming) renameInputRef.current?.focus();
  }, [renaming]);

  function commitRename() {
    if (cancelRename.current) {
      cancelRename.current = false;
      setDraftName(category.name);
      return;
    }
    const next = draftName.trim();
    if (!next || next === category.name) {
      setDraftName(category.name);
      setRenaming(false);
      return;
    }
    renameCategory(category.id, next);
    setRenaming(false);
  }

  const visibleSubcategories = [...(category.subcategories ?? [])]
    .filter((subcategory) => canToggleActive || subcategory.active)
    .sort((left, right) => left.position - right.position);
  const shownSubcategories = orderDraft
    ? subcategoriesInOrder(visibleSubcategories, orderDraft)
    : savedOrder
      ? subcategoriesInOrder(visibleSubcategories, savedOrder)
      : visibleSubcategories;

  function startSubcategoryReorder() {
    if (!canToggleActive) {
      onToggleBlocked?.();
      return;
    }
    expand(category.id);
    setOrderDraft(visibleSubcategories.map((item) => item.id));
  }

  function finishSubcategoryDrag(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrderDraft((current) => {
      if (!current) return current;
      const oldIndex = current.indexOf(stripId(String(active.id)));
      const newIndex = current.indexOf(stripId(String(over.id)));
      if (oldIndex < 0 || newIndex < 0) return current;
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  async function confirmSubcategoryOrder() {
    if (!orderDraft) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${backendUrl}/category/reorder-subcategories`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order: orderDraft,
        category: category.id,
      }),
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.order)) {
      setSavedOrder(
        data.order.filter(
          (id: unknown): id is string => typeof id === "string",
        ),
      );
    }
    setOrderDraft(null);
    setOrderConfirmOpen(false);
    refreshDisplayedCategories();
  }

  return (
    <section
      id={sectionId ?? `category-${category.id}`}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        isDragging && "opacity-50",
        isOver && draggingPlaybook && "border-blue-400 ring-2 ring-blue-100",
        !active && "bg-zinc-50",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-3",
          !active && "text-zinc-400",
        )}
      >
        <button
          type="button"
          {...(changesEnabled ? { ...attributes, ...listeners } : {})}
          onClick={changesEnabled ? undefined : onChangesBlocked}
          aria-label={t("drag")}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0 text-zinc-400",
            !changesEnabled
              ? "cursor-pointer hover:bg-zinc-100 hover:text-zinc-700"
              : dragDisabled
                ? "cursor-not-allowed opacity-40"
                : "cursor-grab hover:bg-zinc-100 hover:text-zinc-700 active:cursor-grabbing",
          )}
        >
          <GripDots />
        </button>
        {changesEnabled ? (
          <Popover.Root>
            <Popover.Trigger
              aria-label={t("changeIcon")}
              title={t("changeIcon")}
              className="flex size-8 items-center justify-center rounded-lg bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
            >
              <WorkspaceIcon name={category.icon} className="size-4" />
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner
                side="bottom"
                align="start"
                sideOffset={8}
                className="z-[70]"
              >
                <Popover.Popup className="w-[240px] rounded-xl border border-zinc-200 bg-white p-2 shadow-lg outline-none">
                  <Popover.Title className="px-1 pb-2 text-xs font-medium text-zinc-500">
                    {t("iconTitle")}
                  </Popover.Title>
                  <IconPicker
                    value={category.icon}
                    onChange={(icon) => setCategoryIcon(category.id, icon)}
                  />
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        ) : (
          <button
            type="button"
            aria-label={t("changeIcon")}
            title={t("changeIcon")}
            onClick={onChangesBlocked}
            className="flex size-8 items-center justify-center rounded-lg bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
          >
            <WorkspaceIcon name={category.icon} className="size-4" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              ref={renameInputRef}
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={commitRename}
              onFocus={(event) => event.currentTarget.select()}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
                if (event.key === "Escape") {
                  cancelRename.current = true;
                  setRenaming(false);
                  setDraftName(category.name);
                }
              }}
              aria-label={t("nameLabel")}
              className="h-8 w-full rounded-md border border-blue-500 bg-white px-2 text-sm font-semibold outline-none ring-3 ring-blue-500/15"
            />
          ) : (
            <button
              type="button"
              disabled={!active}
              onClick={toggleCategoryExpanded}
              onDoubleClick={startCategoryRename}
              className={cn(
                "block max-w-full truncate text-start text-sm font-semibold",
                active ? "text-zinc-950" : "cursor-default text-zinc-400",
              )}
            >
              <HighlightText text={category.name} query={query} />
            </button>
          )}
        </div>
        <span className="shrink-0 text-xs text-zinc-400">
          {playbooks.length + shownSubcategories.length}
        </span>
        {canToggleActive ? (
          <button
            type="button"
            onClick={toggleCategoryActive}
            className={cn(
              "shrink-0 cursor-pointer rounded-full px-2 py-0.5 text-[11px] font-medium hover:opacity-80",
              active
                ? "bg-emerald-50 text-emerald-700"
                : "bg-zinc-200 text-zinc-500",
            )}
          >
            {active ? t("active") : t("hidden")}
          </button>
        ) : null}
        <button
          type="button"
          aria-label={t("deleteCategory")}
          onClick={requestCategoryDelete}
          className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="size-3.5" />
        </button>
        <Hint
          label={t("addPlaybook")}
          onClick={createPlaybook}
          className={cn(
            "flex size-7 items-center justify-center rounded-md",
            canToggleActive
              ? "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              : "cursor-not-allowed text-zinc-300",
          )}
        >
          <Plus className="size-4" />
        </Hint>
        <ActionMenu
          label={t("actionsFor", { name: category.name })}
          items={categoryActions()}
          onBlocked={changesEnabled ? undefined : onChangesBlocked}
        />
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? t("collapse") : t("expand")}
          disabled={!active}
          onClick={() => {
            if (!active) return;
            toggleExpanded(category.id);
          }}
          className="flex size-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-default disabled:hover:bg-transparent"
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              !open && "-rotate-90",
            )}
          />
        </button>
        {canToggleActive && ordering ? (
          <span className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setOrderConfirmOpen(true)}
              className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              {t("save")}
            </button>
            <button
              type="button"
              onClick={() => setOrderDraft(null)}
              className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {t("cancel")}
            </button>
          </span>
        ) : null}
      </div>
      <div
        className="accordion-body"
        data-open={open ? "true" : "false"}
        data-animate={animate ? "true" : "false"}
      >
        <div className="accordion-inner" inert={open ? undefined : true}>
          <SortableContext
            items={playbooks.map((playbook) => playbookDragId(playbook.id))}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1 px-3 pb-3">
              {category.internalDescription || category.aiDescription ? (
                <div className="mb-2 rounded-lg bg-zinc-50 px-3 py-2 text-xs leading-5 text-zinc-500">
                  {category.internalDescription ? (
                    <p>{category.internalDescription}</p>
                  ) : null}
                  {category.aiDescription ? (
                    <p
                      className={
                        category.internalDescription ? "mt-1" : undefined
                      }
                    >
                      {category.aiDescription}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {ordering ? (
                <DndContext
                  sensors={subcategorySensors}
                  collisionDetection={closestCenter}
                  onDragEnd={finishSubcategoryDrag}
                >
                  <SortableContext
                    items={shownSubcategories.map(
                      (subcategory) => `suborder:${subcategory.id}`,
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {shownSubcategories.map((subcategory) => (
                        <SortableSubcategoryRow
                          key={subcategory.id}
                          categoryId={category.id}
                          categoryName={category.name}
                          subcategory={subcategory}
                          categoryActive={active}
                          icon={category.icon}
                          showAiPlus={showSubcategoryAi}
                          aiRequest={aiRequest}
                          onAiPromptReady={onAiPromptReady}
                          canToggleActive={canToggleActive}
                          changesEnabled={changesEnabled}
                          onChangesBlocked={onChangesBlocked}
                          onToggleBlocked={onToggleBlocked}
                          onDeleteBlocked={onDeleteBlocked}
                          onRequestDelete={() =>
                            setPendingDelete({
                              id: subcategory.id,
                              kind: "subcategory",
                              categoryId: category.id,
                            })
                          }
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                shownSubcategories.map((subcategory) => (
                  <SubcategoryRow
                    key={subcategory.id}
                    categoryId={category.id}
                    categoryName={category.name}
                    subcategory={subcategory}
                    categoryActive={active}
                    icon={category.icon}
                    showAiPlus={showSubcategoryAi}
                    aiRequest={aiRequest}
                    onAiPromptReady={onAiPromptReady}
                    canToggleActive={canToggleActive}
                    changesEnabled={changesEnabled}
                    onChangesBlocked={onChangesBlocked}
                    onToggleBlocked={onToggleBlocked}
                    onDeleteBlocked={onDeleteBlocked}
                    onRequestDelete={() =>
                      setPendingDelete({
                        id: subcategory.id,
                        kind: "subcategory",
                        categoryId: category.id,
                      })
                    }
                  />
                ))
              )}
              {playbooks.length === 0 && shownSubcategories.length === 0 ? (
                <EmptyCategory categoryId={category.id} />
              ) : (
                playbooks.map((playbook) => (
                  <PlaybookRow
                    key={playbook.id}
                    playbook={playbook}
                    query={query}
                    dragDisabled={dragDisabled}
                    draggingPlaybook={draggingPlaybook}
                    onEdit={() => onEditPlaybook(playbook.id)}
                    onDuplicate={() => duplicatePlaybook(playbook.id)}
                    onToggleActive={() => {
                      if (!changesEnabled) {
                        onChangesBlocked?.();
                        return;
                      }
                      if (!canToggleActive) {
                        onToggleBlocked?.();
                        return;
                      }
                      setPlaybookActive(playbook.id, !playbook.active);
                    }}
                    onDelete={() =>
                      allowChange(() => onDeletePlaybook(playbook))
                    }
                    onBlocked={changesEnabled ? undefined : onChangesBlocked}
                  />
                ))
              )}
              {playbooks.length > 0 ? (
                <DropTail categoryId={category.id} />
              ) : null}
            </div>
          </SortableContext>
        </div>
      </div>
      <ConfirmDialog
        open={pendingDelete !== null}
        title={t("deleteTitle")}
        description={
          pendingDelete?.kind === "subcategory"
            ? t("deleteSubcategoryConfirm")
            : t("deleteCategoryConfirm")
        }
        confirmLabel={t("delete")}
        tone="danger"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          if (!canToggleActive) {
            onDeleteBlocked?.();
            setPendingDelete(null);
            return;
          }
          if (!changesEnabled) {
            onChangesBlocked?.();
            return;
          }
          if (pendingDelete.kind === "subcategory") {
            void logDeleteClickSubcategory(
              pendingDelete.id,
              pendingDelete.categoryId ?? "",
            );
            return;
          }
          void logDeleteClick(pendingDelete.id, deleteCategory);
        }}
      />
      <ConfirmDialog
        open={orderConfirmOpen}
        title={t("saveOrderTitle")}
        description={t("saveOrderConfirm")}
        confirmLabel={t("save")}
        onClose={() => setOrderConfirmOpen(false)}
        onConfirm={confirmSubcategoryOrder}
      />
    </section>
  );
}

function SortableSubcategoryRow(
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

function SubcategoryRow({
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
}) {
  const { setSubcategoryContent, setSubcategoryActive } = useWorkspace();
  const { saveSubcategory } = useWorkspaceUi();
  const t = useTranslations("Category");
  const [editorOpen, setEditorOpen] = useState(false);
  const [drafts, setDrafts] = useState<
    Record<string, { description: string; aiPrompt: string }>
  >({});
  const openedRequest = useRef(0);
  const formItems = subcategoryFormItems(subcategory);

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
    if (!changesEnabled) {
      onChangesBlocked?.();
      return;
    }
    if (!canToggleActive) {
      onToggleBlocked?.();
      return;
    }
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
      setSubcategoryActive(
        categoryId,
        subcategory.id,
        typeof data.active === "boolean" ? data.active : !subcategory.active,
      );
      refreshDisplayedCategories();
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
        subcategory.active && categoryActive
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
      <button
        type="button"
        disabled={!subcategory.active || !categoryActive}
        onClick={openEditor}
        className={cn(
          "min-w-0 flex-1 truncate text-start text-sm font-medium",
          subcategory.active && categoryActive
            ? "text-zinc-900"
            : "cursor-default text-zinc-400",
        )}
      >
        {subcategory.name}
      </button>
      <button
        type="button"
        onClick={toggleSubcategoryActive}
        className={cn(
          "pointer-events-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
          canToggleActive &&
            categoryActive &&
            "cursor-pointer hover:opacity-80",
          !categoryActive
            ? "bg-zinc-200 text-zinc-400"
            : subcategory.active
              ? "bg-emerald-50 text-emerald-700"
              : "bg-zinc-200 text-zinc-500",
        )}
      >
        {subcategory.active ? t("active") : t("hidden")}
      </button>
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
                {subcategory.name}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-zinc-500">
                {categoryName}
              </Dialog.Description>
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
                        readOnly={!changesEnabled}
                        rows={3}
                        className="w-full resize-y rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15"
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
                        readOnly={!changesEnabled}
                        rows={6}
                        className="w-full resize-y rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15"
                      />
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditorOpen(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
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
                      active: subcategory.active,
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

function EmptyCategory({ categoryId }: { categoryId: string }) {
  const t = useTranslations("Category");
  const { setNodeRef, isOver } = useDroppable({ id: dropDragId(categoryId) });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center",
        isOver && "border-blue-400 bg-blue-50",
      )}
    >
      <p className="text-sm text-zinc-500">{t("empty")}</p>
    </div>
  );
}

function DropTail({ categoryId }: { categoryId: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: dropDragId(categoryId) });
  return (
    <div
      ref={setNodeRef}
      className={cn("h-3 rounded-md", isOver && "bg-blue-100")}
      aria-hidden="true"
    />
  );
}
