"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { CategoryAccordion } from "@/components/admin/CategoryAccordion";
import { CategoryModal } from "@/components/admin/CategoryModal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { PlaybookEditorDrawer } from "@/components/admin/PlaybookEditorDrawer";
import { PlaybookDragPreview } from "@/components/admin/PlaybookRow";
import { PublishModal } from "@/components/admin/PublishModal";
import { Toast } from "@/components/admin/Toast";
import { TopToolbar } from "@/components/admin/TopToolbar";
import {
  EmptyActions,
  EmptyCategories,
} from "@/components/admin/WorkspaceEmpty";
import {
  PreviewDialog,
  WorkspacePreviewAside,
} from "@/components/admin/WorkspacePreview";
import {
  bindCategoryListRefresh,
  refreshDisplayedCategories,
  SubcategoryDeleteNotice,
} from "@/components/sales-manager/CategoriesPanel";
import { SalesManager } from "@/components/sales-manager/SalesManager";
import SyncKindeUser from "@/lib/auth-kinde/SyncKindeUser";
import {
  addSubcategoryToCategory,
  categoriesFromBackend,
  returnedSubcategory,
} from "@/lib/workspace/backend-categories";
import {
  categoryDragId,
  collisionDetection,
  findCategoryId,
  movePlaybook,
  orderKey,
  reorderCategories,
  reorderPlaybookInCategory,
  resolveCategoryId,
  stripId,
} from "@/lib/workspace/dnd";
import { WorkspaceIcon } from "@/lib/workspace/icons";
import { useWorkspace, WorkspaceProvider } from "@/lib/workspace/store";
import type { Category, Playbook, PlaybookDraft } from "@/lib/workspace/types";
import { WorkspaceUiProvider } from "@/lib/workspace/ui";

type EditorState =
  | { mode: "create"; categoryId: string }
  | { mode: "edit"; playbookId: string }
  | null;

type ConfirmState = {
  title: string;
  description: string;
  confirmLabel: string;
  tone: "default" | "danger";
  action: () => void;
};

export function WorkspaceScreen() {
  return (
    <Tooltip.Provider delay={350}>
      <WorkspaceProvider>
        <WorkspaceShell />
      </WorkspaceProvider>
    </Tooltip.Provider>
  );
}

const TOAST_KEYS = [
  "categoryDeleted",
  "categoryCreated",
  "subcategoryAdded",
  "playbookSaved",
  "playbookCreated",
  "playbookDeleted",
  "playbookDuplicated",
  "extensionUpdated",
  "createCategoryFirst",
  "subcategoryUpdateFailed",
  "subcategoryUpdated",
  "adminOnly",
  "adminDeleteOnly",
] as const;

function toastText(
  translate: (key: (typeof TOAST_KEYS)[number]) => string,
  message: string | null,
) {
  if (!message) return "";
  return (TOAST_KEYS as readonly string[]).includes(message)
    ? translate(message as (typeof TOAST_KEYS)[number])
    : message;
}

function WorkspaceShell() {
  const workspace = useWorkspace();
  const header = useTranslations("Header");
  const copy = useTranslations("Workspace");
  const dialogs = useTranslations("Dialogs");
  const toasts = useTranslations("Toasts");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorState>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [fetchedCategories, setFetchedCategories] = useState<unknown[]>([]);
  const [categoriesStatus, setCategoriesStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [adminNotice, setAdminNotice] = useState<string | null>(null);
  const adminNoticeTimer = useRef<number | null>(null);
  const categoriesRef = useRef(workspace.categories);
  const loadedCategoriesFor = useRef<string | null>(null);
  const snapshotRef = useRef<Category[] | null>(null);
  const orderBeforeRef = useRef("");
  const movedAcrossRef = useRef(false);
  categoriesRef.current = workspace.categories;
  const { user, isAuthenticated, isLoading, getAccessTokenRaw } =
    useKindeBrowserClient();
  const getAccessTokenRawRef = useRef(getAccessTokenRaw);
  getAccessTokenRawRef.current = getAccessTokenRaw;

  useEffect(() => {
    if (isLoading) return;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      setCategoriesStatus("error");
      return;
    }
    const userId = isAuthenticated ? (user?.id ?? "signed-in") : "guest";
    let cancelled = false;
    let unbindRefresh = () => {};

    async function run() {
      const token = isAuthenticated
        ? await getAccessTokenRawRef.current()
        : null;
      if (cancelled) return;
      if (isAuthenticated && !token) return;

      async function fetchCategories() {
        try {
          const response = await fetch(`${backendUrl}/category/all`, {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                }
              : { "Content-Type": "application/json" },
            method: "GET",
          });
          const data = await response.json();
          if (cancelled) return;
          if (!response.ok) {
            setCategoriesStatus("error");
            return;
          }
          loadedCategoriesFor.current = userId;
          setFetchedCategories(Array.isArray(data) ? data : []);
          setCategoriesStatus("ready");
        } catch {
          if (!cancelled) setCategoriesStatus("error");
        }
      }
      unbindRefresh = bindCategoryListRefresh(() => {
        loadedCategoriesFor.current = null;
        void fetchCategories();
      });
      if (loadedCategoriesFor.current !== userId) void fetchCategories();

      if (isAuthenticated && token) {
        const response = await fetch(`${backendUrl}/auth/token-data`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          method: "GET",
        });
        if (!response.ok || cancelled) return;
        const data = await response.json();
        if (cancelled) return;
        localStorage.setItem("token", token);
        setCanEdit(isAdminUser(data));
      }
    }

    void run();
    return () => {
      cancelled = true;
      unbindRefresh();
    };
  }, [isAuthenticated, isLoading, user?.id]);
  function showAdminNotice() {
    setAdminNotice("adminOnly");
    if (adminNoticeTimer.current) window.clearTimeout(adminNoticeTimer.current);
    adminNoticeTimer.current = window.setTimeout(
      () => setAdminNotice(null),
      1500,
    );
  }

  function showDeleteNotice() {
    setAdminNotice("adminDeleteOnly");
    if (adminNoticeTimer.current) window.clearTimeout(adminNoticeTimer.current);
    adminNoticeTimer.current = window.setTimeout(
      () => setAdminNotice(null),
      1500,
    );
  }

  function editPlaybook(id: string) {
    if (!canEdit) {
      showAdminNotice();
      return;
    }
    setEditor({ mode: "edit", playbookId: id });
    setEditorOpen(true);
  }

  const greeting = user?.given_name
    ? header("hello", { name: user.given_name })
    : null;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const displayCategories = useMemo(
    () => categoriesFromBackend(fetchedCategories),
    [fetchedCategories],
  );
  const groups = useMemo(
    () => filterGroups(displayCategories, workspace.playbooks, query, canEdit),
    [canEdit, displayCategories, query, workspace.playbooks],
  );

  const searching = query.trim().length > 0;
  const draggingPlaybook = dragId?.startsWith("playbook:") ?? false;

  function openCreate(categoryId?: string) {
    if (!canEdit) {
      showAdminNotice();
      return;
    }
    const target = categoryId ?? displayCategories[0]?.id;
    if (!target) {
      workspace.showToast("createCategoryFirst");
      setCategoryModal(true);
      return;
    }
    setEditor({ mode: "create", categoryId: target });
    setEditorOpen(true);
  }

  function onDragStart(event: DragStartEvent) {
    if (searching) return;
    snapshotRef.current = structuredClone(categoriesRef.current);
    orderBeforeRef.current = orderKey(categoriesRef.current);
    movedAcrossRef.current = false;
    setDragId(String(event.active.id));
  }

  function onDragOver(event: DragOverEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId || !activeId.startsWith("playbook:")) return;

    const playbookId = stripId(activeId);
    const from = findCategoryId(categoriesRef.current, playbookId);
    const to = resolveCategoryId(categoriesRef.current, overId);
    if (!from || !to || from === to) return;

    const target = categoriesRef.current.find((category) => category.id === to);
    if (!target) return;

    let index = target.playbookIds.length;
    if (overId.startsWith("playbook:") && event.over) {
      const overIndex = target.playbookIds.indexOf(stripId(overId));
      const activeTop = event.active.rect.current.translated?.top;
      const isBelow =
        activeTop != null &&
        activeTop > event.over.rect.top + event.over.rect.height / 2;
      index =
        overIndex < 0
          ? target.playbookIds.length
          : overIndex + (isBelow ? 1 : 0);
    }

    const next = movePlaybook(categoriesRef.current, playbookId, to, index);
    movedAcrossRef.current = true;
    categoriesRef.current = next;
    workspace.replaceCategories(next);
    workspace.expand(to);
  }

  function finishDrag(next: Category[]) {
    if (orderKey(next) !== orderBeforeRef.current) workspace.markChanged();
    snapshotRef.current = null;
    movedAcrossRef.current = false;
    setDragId(null);
  }

  function onDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    let next = categoriesRef.current;

    if (!overId) {
      if (snapshotRef.current) {
        next = snapshotRef.current;
        categoriesRef.current = next;
        workspace.replaceCategories(next);
      }
      finishDrag(next);
      return;
    }

    if (activeId.startsWith("category:") && overId.startsWith("category:")) {
      next = reorderCategories(
        categoriesRef.current,
        stripId(activeId),
        stripId(overId),
      );
    } else if (
      activeId.startsWith("playbook:") &&
      !movedAcrossRef.current &&
      overId.startsWith("playbook:")
    ) {
      next = reorderPlaybookInCategory(
        categoriesRef.current,
        stripId(activeId),
        stripId(overId),
      );
    }

    categoriesRef.current = next;
    workspace.replaceCategories(next);
    finishDrag(next);
  }

  function onDragCancel() {
    if (snapshotRef.current) {
      categoriesRef.current = snapshotRef.current;
      workspace.replaceCategories(snapshotRef.current);
    }
    snapshotRef.current = null;
    movedAcrossRef.current = false;
    setDragId(null);
  }
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  //לכן מגיע הפרמטרים כדי לעשות update
  async function saveEditor(draft: PlaybookDraft) {
    const token = await getAccessTokenRaw();
    if (!token) return;
    if (editor?.mode === "edit")
      workspace.savePlaybook(draft, editor.playbookId);
    else workspace.savePlaybook(draft);
    const response = await fetch(`${backendUrl}/category/updatesubcategory`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        categoryId: draft.categoryId,
        subcategoryName: draft.name,
        description: draft.description,
        aiPrompt: draft.prompt,
        icon: draft.icon,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error(data);
      workspace.showToast("שגיאה בעדכון תת קטגוריה");
      return;
    }
    const subcategory = returnedSubcategory(data);
    if (subcategory) {
      const selectedName =
        displayCategories.find((item) => item.id === draft.categoryId)?.name ??
        workspace.categories.find((item) => item.id === draft.categoryId)
          ?.name ??
        "";
      setFetchedCategories((current) =>
        addSubcategoryToCategory(
          current,
          draft.categoryId,
          selectedName,
          subcategory,
        ),
      );
      workspace.expand(draft.categoryId);
    }
    refreshDisplayedCategories();
    workspace.showToast("תת קטגוריה עודכנה בהצלחה");
    setEditorOpen(false);
  }

  const editingPlaybook =
    editor?.mode === "edit"
      ? (workspace.playbooks[editor.playbookId] ?? null)
      : null;
  const editingCategoryId =
    editor?.mode === "edit"
      ? (workspace.categories.find((category) =>
          category.playbookIds.includes(editor.playbookId),
        )?.id ??
        workspace.categories[0]?.id ??
        "")
      : (editor?.categoryId ?? "");

  function requestPlaybookDelete() {
    if (!editingPlaybook) return;
    setConfirm({
      title: dialogs("deletePlaybook"),
      description: dialogs("deletePlaybookShort", {
        name: editingPlaybook.name,
      }),
      confirmLabel: dialogs("delete"),
      tone: "danger",
      action: () => {
        workspace.deletePlaybook(editingPlaybook.id);
        setEditorOpen(false);
      },
    });
  }

  const overlayPlaybook = dragId?.startsWith("playbook:")
    ? workspace.playbooks[stripId(dragId)]
    : undefined;
  const overlayCategory = dragId?.startsWith("category:")
    ? displayCategories.find((category) => category.id === stripId(dragId))
    : undefined;

  const workspaceBody = !workspace.ready ? (
    <WorkspaceSkeleton />
  ) : (
    <WorkspaceUiProvider
      value={{
        openCreatePlaybook: openCreate,
        editPlaybook,
        saveSubcategory: saveEditor,
        getAccessToken: async () =>
          (await getAccessTokenRawRef.current()) ?? null,
      }}
    >
      <div className="flex h-dvh flex-col overflow-hidden bg-[#f5f5f6] text-zinc-900">
        <TopToolbar
          query={query}
          onQueryChange={setQuery}
          changeCount={workspace.changeCount}
          onCreatePlaybook={() => openCreate()}
          canCreate={canEdit}
          onPublish={() => {
            if (workspace.changeCount === 0) return;
            setPublishOpen(true);
          }}
          onOpenPreview={() => setPreviewOpen(true)}
          greeting={greeting}
        />

        <div className="flex min-h-0 flex-1">
          <main className="admin-scroll min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            {canEdit ? <SalesManager categories={displayCategories} /> : null}
            <p className="mb-4 text-sm text-zinc-500">{copy("dragHint")}</p>

            {searching ? (
              <p className="mb-3 text-sm text-zinc-500">
                {groups.reduce(
                  (sum, group) => sum + group.playbooks.length,
                  0,
                ) === 0
                  ? copy("noResults", { query: query.trim() })
                  : copy("dragDisabled")}
              </p>
            ) : null}

            {categoriesStatus === "loading" &&
            displayCategories.length === 0 ? (
              <CategoryListSkeleton label={copy("loadingCategories")} />
            ) : displayCategories.length === 0 ? (
              <EmptyCategories
                canEdit={canEdit}
                onAdd={() => {
                  if (!canEdit) {
                    showAdminNotice();
                    return;
                  }
                  setCategoryModal(true);
                }}
              />
            ) : groups.length === 0 ? (
              <EmptyActions />
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                onDragCancel={onDragCancel}
                accessibility={{
                  announcements: {
                    onDragStart: () => copy("dragStart"),
                    onDragOver: () => copy("dragOver"),
                    onDragEnd: () => copy("dragEnd"),
                    onDragCancel: () => copy("dragCancel"),
                  },
                }}
              >
                <SortableContext
                  items={groups.map((group) =>
                    categoryDragId(group.category.id),
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 pb-10">
                    {groups.map((group) => (
                      <CategoryAccordion
                        key={group.category.id}
                        category={group.category}
                        playbooks={group.playbooks}
                        query={query}
                        forceOpen={searching}
                        dragDisabled={searching}
                        draggingPlaybook={draggingPlaybook}
                        canToggleActive={canEdit}
                        onToggleBlocked={showAdminNotice}
                        onDeleteBlocked={showDeleteNotice}
                        onEditPlaybook={editPlaybook}
                        onCreatePlaybook={() => openCreate(group.category.id)}
                        onDeletePlaybook={(playbook) =>
                          setConfirm({
                            title: dialogs("deletePlaybook"),
                            description: dialogs("deletePlaybookDescription", {
                              name: playbook.name,
                            }),
                            confirmLabel: dialogs("delete"),
                            tone: "danger",
                            action: () => {
                              workspace.deletePlaybook(playbook.id);
                              if (
                                editor?.mode === "edit" &&
                                editor.playbookId === playbook.id
                              ) {
                                setEditorOpen(false);
                              }
                            },
                          })
                        }
                        onDeleteCategory={() =>
                          setConfirm({
                            title: dialogs("deleteCategory"),
                            description:
                              group.category.playbookIds.length > 0
                                ? dialogs("deleteCategoryWithActions", {
                                    name: group.category.name,
                                    count: group.category.playbookIds.length,
                                  })
                                : dialogs("deleteCategoryNamed", {
                                    name: group.category.name,
                                  }),
                            confirmLabel: dialogs("deleteCategoryConfirm"),
                            tone: "danger",
                            action: () =>
                              workspace.deleteCategory(group.category.id),
                          })
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {overlayPlaybook ? (
                    <PlaybookDragPreview playbook={overlayPlaybook} />
                  ) : null}
                  {overlayCategory ? (
                    <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-3 shadow-xl">
                      <WorkspaceIcon
                        name={overlayCategory.icon}
                        className="size-4 text-zinc-500"
                      />
                      <span className="text-sm font-semibold">
                        {overlayCategory.name}
                      </span>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </main>

          <WorkspacePreviewAside
            categories={displayCategories}
            status={categoriesStatus}
            showInactive={canEdit}
          />
        </div>

        <PlaybookEditorDrawer
          open={editorOpen}
          mode={editor?.mode ?? "create"}
          playbook={editingPlaybook}
          categoryId={editingCategoryId}
          categories={displayCategories}
          onClose={() => setEditorOpen(false)}
          onSave={saveEditor}
          onDelete={requestPlaybookDelete}
        />
        <CategoryModal
          open={categoryModal}
          onClose={() => setCategoryModal(false)}
          onCreate={(input) => {
            const id = workspace.addCategory(input);
            requestAnimationFrame(() => {
              document
                .getElementById(`category-${id}`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            });
          }}
        />
        <PublishModal
          open={publishOpen}
          onClose={() => setPublishOpen(false)}
          onPublish={workspace.publish}
        />
        <ConfirmDialog
          open={confirm !== null}
          title={confirm?.title ?? ""}
          description={confirm?.description ?? ""}
          confirmLabel={confirm?.confirmLabel ?? dialogs("confirm")}
          tone={confirm?.tone ?? "default"}
          onClose={() => setConfirm(null)}
          onConfirm={() => confirm?.action()}
        />
        <PreviewDialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          categories={displayCategories}
          status={categoriesStatus}
          showInactive={canEdit}
        />
        {adminNotice ? (
          <Toast
            message={toastText(toasts, adminNotice)}
            onDismiss={() => setAdminNotice(null)}
          />
        ) : null}
        {workspace.toast ? (
          <Toast
            message={toastText(toasts, workspace.toast)}
            onDismiss={workspace.dismissToast}
          />
        ) : null}
        <SubcategoryDeleteNotice />
      </div>
    </WorkspaceUiProvider>
  );

  return (
    <>
      <SyncKindeUser />
      {workspaceBody}
    </>
  );
}

function isAdminUser(data: { user?: unknown }) {
  return data.user === "admin";
}

function filterGroups(
  categories: Category[],
  playbooks: Record<string, Playbook>,
  query: string,
  showInactive: boolean,
) {
  const needle = query.trim().toLocaleLowerCase("he");
  return categories.flatMap((category) => {
    if (!showInactive && !category.active) return [];
    const items = category.playbookIds
      .map((id) => playbooks[id])
      .filter((playbook): playbook is Playbook => {
        if (!playbook) return false;
        return showInactive || playbook.active;
      });
    if (!needle) return [{ category, playbooks: items }];
    if (category.name.toLocaleLowerCase("he").includes(needle))
      return [{ category, playbooks: items }];
    const matched = items.filter(
      (playbook) =>
        playbook.name.toLocaleLowerCase("he").includes(needle) ||
        playbook.description.toLocaleLowerCase("he").includes(needle),
    );
    return matched.length > 0 ? [{ category, playbooks: matched }] : [];
  });
}

function CategoryListSkeleton({ label }: { label: string }) {
  return (
    <div
      className="space-y-3 pb-10"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="sr-only">{label}</p>
      {[0, 1, 2, 3].map((card) => (
        <div
          key={card}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
        >
          <div className="flex items-center gap-2">
            <span className="category-shimmer size-8 shrink-0 rounded-md" />
            <span className="category-shimmer size-8 shrink-0 rounded-lg" />
            <span
              className="category-shimmer h-4 rounded-md"
              style={{
                width: `${42 + card * 8}%`,
                animationDelay: `${card * 120}ms`,
              }}
            />
            <span className="category-shimmer ms-auto h-5 w-14 shrink-0 rounded-full" />
          </div>
          <div className="mt-3 space-y-2 border-s border-zinc-100 ps-4">
            {[0, 1].map((row) => (
              <div key={row} className="flex items-center gap-2 py-1">
                <span className="category-shimmer size-7 shrink-0 rounded-md" />
                <span
                  className="category-shimmer h-3.5 rounded-md"
                  style={{
                    width: row === 0 ? "58%" : "40%",
                    animationDelay: `${180 + card * 120 + row * 90}ms`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="flex h-dvh flex-col bg-[#f5f5f6]">
      <div className="h-16 border-b border-zinc-200 bg-white" />
      <div className="space-y-3 p-6">
        <div className="h-24 rounded-xl bg-white" />
        <div className="h-24 rounded-xl bg-white" />
        <div className="h-24 rounded-xl bg-white" />
      </div>
    </div>
  );
}
