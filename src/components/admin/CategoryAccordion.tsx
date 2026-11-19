"use client";

import { Popover } from "@base-ui/react/popover";
import {
  closestCenter,
  type DragEndEvent,
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
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ActiveToggleButton } from "@/components/admin/ActiveToggleButton";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  SortableSubcategoryRow,
  SubcategoryRow,
} from "@/components/admin/SubcategoryRow";
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
import { backendUrl } from "@/lib/backend-url";
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
import {
  ICON_NAMES,
  type Category,
  type CategorySubcategory,
  type IconName,
  type Playbook,
} from "@/lib/workspace/types";

async function changeCategoryIcon(categoryId: string, icon: IconName) {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const response = await fetch(`${backendUrl}/category/icon-change`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ categoryId, icon }),
    });
    const data = (await response.json()) as { icon?: unknown };
    if (!response.ok) return null;
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function iconFromResponse(data: { icon?: unknown } | null): IconName | null {
  const icon = data?.icon;
  if (typeof icon !== "string") return null;
  return ICON_NAMES.find((name) => name === icon) ?? null;
}

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
  loggedIn = false,
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
  loggedIn?: boolean;
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
  const [togglingActive, setTogglingActive] = useState(false);
  const [orderDraft, setOrderDraft] = useState<string[] | null>(null);
  const [savedOrder, setSavedOrder] = useState<string[] | null>(null);
  const [orderConfirmOpen, setOrderConfirmOpen] = useState(false);
  const [orderPending, setOrderPending] = useState(false);
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
  const [deletePending, setDeletePending] = useState<{
    id: string;
    kind: "category" | "subcategory";
  } | null>(null);
  const [draftName, setDraftName] = useState(category.name);
  const [shownName, setShownName] = useState(category.name);
  const [shownIcon, setShownIcon] = useState(category.icon);
  const [iconPending, setIconPending] = useState(false);
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
    if (togglingActive) return;
    if (!canToggleActive) {
      onToggleBlocked?.();
      return;
    }
    if (!changesEnabled) {
      onChangesBlocked?.();
      return;
    }
    setTogglingActive(true);
    try {
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
    } finally {
      setTogglingActive(false);
    }
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
    setShownName(category.name);
  }, [category.name]);

  useEffect(() => {
    setShownIcon(category.icon);
  }, [category.icon]);

  async function selectCategoryIcon(icon: IconName) {
    if (iconPending) return;
    setIconPending(true);
    try {
      const data = await changeCategoryIcon(category.id, icon);
      const savedIcon = iconFromResponse(data);
      if (!savedIcon) return;
      setShownIcon(savedIcon);
      setCategoryIcon(category.id, savedIcon);
      refreshDisplayedCategories();
    } finally {
      setIconPending(false);
    }
  }

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
    const commitRename = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        console.log("commitRename", next, "category.id", category.id);
        const response = await fetch(`${backendUrl}/category/rename`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ categoryId: category.id, name: next }),
        });
        const data = (await response.json()) as {
          id?: unknown;
          name?: unknown;
        };
        console.log("commitRename", data);
        const savedName = typeof data.name === "string" ? data.name : "";
        const savedId = typeof data.id === "string" ? data.id : category.id;
        if (response.ok && savedName) {
          renameCategory(savedId, savedName);
          setDraftName(savedName);
          setShownName(savedName);
          setRenaming(false);
        }
      } catch (error) {
        console.error(error);
      }
    };
    void commitRename();
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
    if (orderPending) return;
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
    if (!orderDraft || orderPending) return;
    setOrderPending(true);
    try {
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
      refreshDisplayedCategories();
    } finally {
      setOrderPending(false);
      setOrderDraft(null);
      setOrderConfirmOpen(false);
    }
  }

  const deletingCategory =
    deletePending?.kind === "category" && deletePending.id === category.id;

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
        deletingCategory && "pointer-events-none relative cursor-progress",
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
              aria-busy={iconPending}
              disabled={iconPending}
              className={cn(
                "relative flex size-8 items-center justify-center overflow-hidden rounded-lg bg-zinc-50 text-zinc-600",
                iconPending ? "cursor-progress" : "hover:bg-zinc-100",
              )}
            >
              {iconPending ? (
                <span
                  className="relative z-10 size-3.5 animate-spin rounded-full border border-current border-t-transparent"
                  aria-hidden
                />
              ) : (
                <WorkspaceIcon
                  name={shownIcon}
                  className="relative z-10 size-4"
                />
              )}
              {iconPending ? (
                <span
                  className="category-shimmer pointer-events-none absolute inset-0"
                  aria-hidden
                />
              ) : null}
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
                    value={shownIcon}
                    onChange={(icon) => void selectCategoryIcon(icon)}
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
            <WorkspaceIcon name={shownIcon} className="size-4" />
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
              <HighlightText text={shownName} query={query} />
            </button>
          )}
        </div>
        <span className="shrink-0 text-xs text-zinc-400">
          {playbooks.length + shownSubcategories.length}
        </span>
        {canToggleActive ? (
          <ActiveToggleButton
            active={active}
            pending={togglingActive}
            activeLabel={t("active")}
            inactiveLabel={t("hidden")}
            onClick={() => void toggleCategoryActive()}
          />
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
          label={t("actionsFor", { name: shownName })}
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
              disabled={orderPending}
              aria-busy={orderPending}
              onClick={() => setOrderConfirmOpen(true)}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white",
                orderPending ? "cursor-progress" : "hover:bg-blue-700",
              )}
            >
              {orderPending ? (
                <span
                  className="size-3 animate-spin rounded-full border border-current border-t-transparent"
                  aria-hidden
                />
              ) : null}
              {t("save")}
            </button>
            <button
              type="button"
              disabled={orderPending}
              onClick={() => setOrderDraft(null)}
              className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-progress"
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
                    <div
                      className={cn(
                        "relative space-y-1",
                        orderPending && "pointer-events-none cursor-progress",
                      )}
                      aria-busy={orderPending}
                    >
                      {shownSubcategories.map((subcategory) => (
                        <DeletePendingFrame
                          key={subcategory.id}
                          pending={
                            deletePending?.kind === "subcategory" &&
                            deletePending.id === subcategory.id
                          }
                        >
                        <SortableSubcategoryRow
                          categoryId={category.id}
                          categoryName={category.name}
                          subcategory={subcategory}
                          categoryActive={active}
                          icon={shownIcon}
                          showAiPlus={showSubcategoryAi}
                          aiRequest={aiRequest}
                          onAiPromptReady={onAiPromptReady}
                          canToggleActive={canToggleActive}
                          changesEnabled={changesEnabled}
                          onChangesBlocked={onChangesBlocked}
                          onToggleBlocked={onToggleBlocked}
                          onDeleteBlocked={onDeleteBlocked}
                          loggedIn={loggedIn}
                          query={query}
                          onRequestDelete={() =>
                            setPendingDelete({
                              id: subcategory.id,
                              kind: "subcategory",
                              categoryId: category.id,
                            })
                          }
                        />
                        </DeletePendingFrame>
                      ))}
                      {orderPending ? (
                        <span
                          className="category-shimmer pointer-events-none absolute inset-0 rounded-lg opacity-70"
                          aria-hidden
                        />
                      ) : null}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                shownSubcategories.map((subcategory) => (
                  <DeletePendingFrame
                    key={subcategory.id}
                    pending={
                      deletePending?.kind === "subcategory" &&
                      deletePending.id === subcategory.id
                    }
                  >
                  <SubcategoryRow
                    categoryId={category.id}
                    categoryName={category.name}
                    subcategory={subcategory}
                    categoryActive={active}
                    icon={shownIcon}
                    showAiPlus={showSubcategoryAi}
                    aiRequest={aiRequest}
                    onAiPromptReady={onAiPromptReady}
                    canToggleActive={canToggleActive}
                    changesEnabled={changesEnabled}
                    onChangesBlocked={onChangesBlocked}
                    onToggleBlocked={onToggleBlocked}
                    onDeleteBlocked={onDeleteBlocked}
                    loggedIn={loggedIn}
                    query={query}
                    onRequestDelete={() =>
                      setPendingDelete({
                        id: subcategory.id,
                        kind: "subcategory",
                        categoryId: category.id,
                      })
                    }
                  />
                  </DeletePendingFrame>
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
          if (!pendingDelete || deletePending) return;
          if (!canToggleActive) {
            onDeleteBlocked?.();
            setPendingDelete(null);
            return;
          }
          if (!changesEnabled) {
            onChangesBlocked?.();
            return;
          }
          const target = pendingDelete;
          setDeletePending({ id: target.id, kind: target.kind });
          void (async () => {
            try {
              if (target.kind === "subcategory") {
                await logDeleteClickSubcategory(
                  target.id,
                  target.categoryId ?? "",
                );
                return;
              }
              await logDeleteClick(target.id, deleteCategory);
            } finally {
              setDeletePending(null);
            }
          })();
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
      {deletingCategory ? (
        <span
          className="category-shimmer pointer-events-none absolute inset-0 rounded-xl opacity-70"
          aria-hidden
        />
      ) : null}
    </section>
  );
}

function DeletePendingFrame({
  pending,
  children,
}: {
  pending: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("relative", pending && "pointer-events-none cursor-progress")}
      aria-busy={pending}
    >
      {children}
      {pending ? (
        <span
          className="category-shimmer pointer-events-none absolute inset-0 rounded-lg opacity-70"
          aria-hidden
        />
      ) : null}
    </div>
  );
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
