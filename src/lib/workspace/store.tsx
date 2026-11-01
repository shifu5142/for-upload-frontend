"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  inferUserCategoryIds,
  inferUserSubcategoryIds,
  isSeedCategoryId,
  toUserCatalog,
} from "@/lib/workspace/catalog";
import { logPublishedCatalog } from "@/lib/workspace/log-catalog";
import { createId, initialWorkspace } from "@/lib/workspace/mock-data";
import type {
  Category,
  CategorySubcategory,
  IconName,
  Playbook,
  PlaybookDraft,
  WorkspaceData,
} from "@/lib/workspace/types";

const STORAGE_KEY = "shirsales-admin-v1";

export type SubcategoryDraft = {
  name: string;
  description: string;
  aiPrompt: string;
};

type StoredWorkspace = WorkspaceData & {
  changeCount?: number;
  expanded?: Record<string, boolean>;
  userCategoryIds?: string[];
  userSubcategoryIds?: string[];
  keptOriginalCategories?: boolean;
};

type WorkspaceState = {
  ready: boolean;
  categories: Category[];
  playbooks: Record<string, Playbook>;
  changeCount: number;
  expanded: Record<string, boolean>;
  toast: string | null;
};

type WorkspaceToastActions = {
  showToast: (message: string) => void;
  dismissToast: () => void;
};

type NewCategoryInput = {
  name: string;
  icon: IconName;
  active: boolean;
  subcategoryName?: string;
  subcategoryNames?: string[];
  subcategories?: SubcategoryDraft[];
  internalDescription?: string;
  aiDescription?: string;
  startOpen?: boolean;
  silent?: boolean;
};

type SubcategoryContent = {
  description: string;
  aiPrompt: string;
};

type WorkspaceCategoryActions = {
  toggleExpanded: (id: string) => void;
  expand: (id: string) => void;
  renameCategory: (id: string, name: string) => void;
  setCategoryIcon: (id: string, icon: IconName) => void;
  setCategoryActive: (id: string, active: boolean) => void;
  deleteCategory: (id: string) => void;
  addCategory: (input: NewCategoryInput) => string;
  replaceCategories: (categories: Category[]) => void;
};

type WorkspaceSubcategoryActions = {
  renameSubcategory: (
    categoryId: string,
    subcategoryId: string,
    name: string,
  ) => void;
  setSubcategoryContent: (
    categoryId: string,
    subcategoryId: string,
    content: SubcategoryContent,
  ) => void;
  setSubcategoryActive: (
    categoryId: string,
    subcategoryId: string,
    active: boolean,
  ) => void;
  addSubcategory: (
    categoryId: string,
    draft: SubcategoryDraft,
    silent?: boolean,
  ) => void;
};

type WorkspacePlaybookActions = {
  savePlaybook: (draft: PlaybookDraft, playbookId?: string) => void;
  deletePlaybook: (id: string) => void;
  duplicatePlaybook: (id: string) => void;
  setPlaybookActive: (id: string, active: boolean) => void;
};

type WorkspacePublishActions = {
  markChanged: () => void;
  publish: () => void;
};

type WorkspaceContextValue = WorkspaceState &
  WorkspaceToastActions &
  WorkspaceCategoryActions &
  WorkspaceSubcategoryActions &
  WorkspacePlaybookActions &
  WorkspacePublishActions;

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function normalizeSubcategory(
  value: CategorySubcategory & { aiText?: string },
): CategorySubcategory {
  return {
    id: value.id,
    name: value.name,
    description: value.description ?? "",
    aiPrompt: value.aiPrompt ?? value.aiText ?? "",
    active: value.active !== false,
    position:
      typeof value.position === "number" ? value.position : Number.MAX_SAFE_INTEGER,
    ...(value.items ? { items: value.items } : {}),
  };
}

function subcategoryFromDraft(draft: SubcategoryDraft): CategorySubcategory {
  return {
    id: createId("sub"),
    name: draft.name.trim(),
    description: draft.description.trim(),
    aiPrompt: draft.aiPrompt.trim(),
    active: true,
    position: Number.MAX_SAFE_INTEGER,
  };
}

function isStoredWorkspace(value: unknown): value is StoredWorkspace {
  if (!value || typeof value !== "object") return false;
  const record = value as StoredWorkspace;
  return (
    Array.isArray(record.categories) &&
    !!record.playbooks &&
    typeof record.playbooks === "object"
  );
}

function storedCategories(stored: StoredWorkspace) {
  if (stored.keptOriginalCategories) return stored.categories;
  return stored.categories.filter((category) => isSeedCategoryId(category.id));
}

function restoredCategories(stored: StoredWorkspace) {
  return storedCategories(stored).map((category) => ({
    ...category,
    playbookIds: category.playbookIds.filter((id) => stored.playbooks[id]),
    subcategories: category.subcategories?.map(normalizeSubcategory),
  }));
}

function restoredPlaybooks(stored: StoredWorkspace, categories: Category[]) {
  if (stored.keptOriginalCategories) return stored.playbooks;
  const keptPlaybookIds = new Set(
    categories.flatMap((category) => category.playbookIds),
  );
  return Object.fromEntries(
    Object.entries(stored.playbooks).filter(([id]) => keptPlaybookIds.has(id)),
  );
}

function restoredExpanded(stored: StoredWorkspace) {
  const expanded = stored.expanded ?? {};
  if (stored.keptOriginalCategories) return expanded;
  return Object.fromEntries(
    Object.entries(expanded).filter(([id]) => isSeedCategoryId(id)),
  );
}

function restoredUserIds(stored: StoredWorkspace, categories: Category[]) {
  const storedUserCategoryIds = Array.isArray(stored.userCategoryIds)
    ? stored.userCategoryIds
    : inferUserCategoryIds(stored.categories);
  const storedUserSubcategoryIds = Array.isArray(stored.userSubcategoryIds)
    ? stored.userSubcategoryIds
    : inferUserSubcategoryIds(stored.categories);
  if (stored.keptOriginalCategories) {
    return {
      userCategoryIds: storedUserCategoryIds,
      userSubcategoryIds: storedUserSubcategoryIds,
    };
  }
  const keptCategoryIds = new Set(categories.map((category) => category.id));
  const keptSubcategoryIds = new Set(
    categories.flatMap((category) =>
      (category.subcategories ?? []).map((subcategory) => subcategory.id),
    ),
  );
  return {
    userCategoryIds: storedUserCategoryIds.filter((id) =>
      keptCategoryIds.has(id),
    ),
    userSubcategoryIds: storedUserSubcategoryIds.filter((id) =>
      keptSubcategoryIds.has(id),
    ),
  };
}

function restoreStoredWorkspace(stored: StoredWorkspace) {
  const categories = restoredCategories(stored);
  return {
    data: {
      categories,
      playbooks: restoredPlaybooks(stored, categories),
    },
    changeCount: typeof stored.changeCount === "number" ? stored.changeCount : 0,
    expanded: restoredExpanded(stored),
    ...restoredUserIds(stored, categories),
  };
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WorkspaceData>(initialWorkspace);
  const [changeCount, setChangeCount] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [userCategoryIds, setUserCategoryIds] = useState<string[]>([]);
  const [userSubcategoryIds, setUserSubcategoryIds] = useState<string[]>([]);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isStoredWorkspace(parsed)) {
          const restored = restoreStoredWorkspace(parsed);
          setData(restored.data);
          setChangeCount(restored.changeCount);
          setExpanded(restored.expanded);
          setUserCategoryIds(restored.userCategoryIds);
          setUserSubcategoryIds(restored.userSubcategoryIds);
        }
      }
    } catch (error) {
      console.error(error);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...data,
        changeCount,
        expanded,
        userCategoryIds,
        userSubcategoryIds,
        keptOriginalCategories: true,
      }),
    );
  }, [changeCount, data, expanded, ready, userCategoryIds, userSubcategoryIds]);
  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);
  const markChanged = useCallback(
    () => setChangeCount((count) => count + 1),
    [],
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((current) => ({ ...current, [id]: current[id] === false }));
  }, []);

  const expand = useCallback((id: string) => {
    setExpanded((current) =>
      current[id] === false ? { ...current, [id]: true } : current,
    );
  }, []);

  const renameCategory = useCallback(
    (id: string, name: string) => {
      const nextName = name.trim();
      if (!nextName) return;
      setData((current) => ({
        ...current,
        categories: current.categories.map((category) =>
          category.id === id ? { ...category, name: nextName } : category,
        ),
      }));
      markChanged();
    },
    [markChanged],
  );

  const renameSubcategory = useCallback(
    (categoryId: string, subcategoryId: string, name: string) => {
      const nextName = name.trim();
      if (!nextName) return;
      setData((current) => ({
        ...current,
        categories: current.categories.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                subcategories: category.subcategories?.map((subcategory) =>
                  subcategory.id === subcategoryId
                    ? { ...subcategory, name: nextName }
                    : subcategory,
                ),
              }
            : category,
        ),
      }));
      markChanged();
    },
    [markChanged],
  );

  const setSubcategoryContent = useCallback(
    (
      categoryId: string,
      subcategoryId: string,
      content: SubcategoryContent,
    ) => {
      setData((current) => ({
        ...current,
        categories: current.categories.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                subcategories: category.subcategories?.map((subcategory) =>
                  subcategory.id === subcategoryId
                    ? {
                        ...subcategory,
                        description: content.description.trim(),
                        aiPrompt: content.aiPrompt.trim(),
                      }
                    : subcategory,
                ),
              }
            : category,
        ),
      }));
      markChanged();
    },
    [markChanged],
  );

  const setSubcategoryActive = useCallback(
    (categoryId: string, subcategoryId: string, active: boolean) => {
      setData((current) => ({
        ...current,
        categories: current.categories.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                subcategories: category.subcategories?.map((subcategory) =>
                  subcategory.id === subcategoryId
                    ? { ...subcategory, active }
                    : subcategory,
                ),
              }
            : category,
        ),
      }));
      markChanged();
    },
    [markChanged],
  );

  const setCategoryIcon = useCallback(
    (id: string, icon: IconName) => {
      setData((current) => ({
        ...current,
        categories: current.categories.map((category) =>
          category.id === id ? { ...category, icon } : category,
        ),
      }));
      markChanged();
    },
    [markChanged],
  );

  const setCategoryActive = useCallback(
    (id: string, active: boolean) => {
      setData((current) => ({
        ...current,
        categories: current.categories.map((category) =>
          category.id === id ? { ...category, active } : category,
        ),
      }));
      markChanged();
    },
    [markChanged],
  );

  const deleteCategory = useCallback(
    (id: string) => {
      let removedSubcategoryIds: string[] = [];
      setData((current) => {
        const category = current.categories.find((item) => item.id === id);
        removedSubcategoryIds = category?.subcategories?.map((subcategory) => subcategory.id) ?? [];
        const playbooks = { ...current.playbooks };
        for (const playbookId of category?.playbookIds ?? [])
          delete playbooks[playbookId];
        return {
          playbooks,
          categories: current.categories.filter((item) => item.id !== id),
        };
      });
      setUserCategoryIds((current) => current.filter((item) => item !== id));
      setUserSubcategoryIds((current) =>
        current.filter((item) => !removedSubcategoryIds.includes(item)),
      );
      markChanged();
      showToast("categoryDeleted");
    },
    [markChanged, showToast],
  );

  const addCategory = useCallback(
    (input: NewCategoryInput) => {
      const id = createId("cat");
      const drafts = [
        ...(input.subcategories ?? []),
        ...(input.subcategoryNames ?? []).map((name) => ({
          name,
          description: "",
          aiPrompt: "",
        })),
        ...(input.subcategoryName
          ? [{ name: input.subcategoryName, description: "", aiPrompt: "" }]
          : []),
      ].filter(
        (draft, index, items) =>
          draft.name.trim() &&
          items.findIndex((item) => item.name.trim() === draft.name.trim()) ===
            index,
      );
      const internalDescription = input.internalDescription?.trim();
      const aiDescription = input.aiDescription?.trim();
      const subcategories = drafts.map(subcategoryFromDraft);
      setUserCategoryIds((current) => [...current, id]);
      setUserSubcategoryIds((current) => [
        ...current,
        ...subcategories.map((subcategory) => subcategory.id),
      ]);
      setData((current) => ({
        ...current,
        categories: [
          ...current.categories,
          {
            id,
            name: input.name.trim(),
            icon: input.icon,
            active: input.active,
            playbookIds: [],
            ...(drafts.length === 0 && internalDescription
              ? { internalDescription }
              : {}),
            ...(drafts.length === 0 && aiDescription ? { aiDescription } : {}),
            ...(subcategories.length > 0 ? { subcategories } : {}),
          },
        ],
      }));
      setExpanded((current) => ({ ...current, [id]: input.startOpen ?? true }));
      markChanged();
      if (!input.silent) showToast("categoryCreated");
      return id;
    },
    [markChanged, showToast],
  );

  const addSubcategory = useCallback(
    (categoryId: string, draft: SubcategoryDraft, silent?: boolean) => {
      if (!draft.name.trim()) return;
      const subcategory = subcategoryFromDraft(draft);
      setUserSubcategoryIds((current) => [...current, subcategory.id]);
      setData((current) => ({
        ...current,
        categories: current.categories.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                subcategories: [...(category.subcategories ?? []), subcategory],
              }
            : category,
        ),
      }));
      setExpanded((current) => ({ ...current, [categoryId]: true }));
      markChanged();
      if (!silent) showToast("subcategoryAdded");
    },
    [markChanged, showToast],
  );

  const savePlaybook = useCallback(
    (draft: PlaybookDraft, playbookId?: string) => {
      const id = playbookId ?? createId("pb");
      const playbook: Playbook = {
        id,
        name: draft.name.trim(),
        description: draft.description.trim(),
        prompt: draft.prompt,
        icon: draft.icon,
        active: draft.active,
        autoSend: draft.autoSend,
        attachments: draft.attachments,
      };

      setData((current) => {
        const playbooks = { ...current.playbooks, [id]: playbook };
        const categories = current.categories.map((category) => ({
          ...category,
          playbookIds: category.playbookIds.filter((itemId) => itemId !== id),
        }));
        const target = categories.find(
          (category) => category.id === draft.categoryId,
        );
        if (target) {
          const previous = current.categories.find((category) =>
            category.playbookIds.includes(id),
          );
          if (previous?.id === draft.categoryId) {
            const index = previous.playbookIds.indexOf(id);
            target.playbookIds.splice(index, 0, id);
          } else {
            target.playbookIds.push(id);
          }
        }
        return { playbooks, categories };
      });
      markChanged();
    },
    [markChanged],
  );

  const deletePlaybook = useCallback(
    (id: string) => {
      setData((current) => {
        const playbooks = { ...current.playbooks };
        delete playbooks[id];
        return {
          playbooks,
          categories: current.categories.map((category) => ({
            ...category,
            playbookIds: category.playbookIds.filter((itemId) => itemId !== id),
          })),
        };
      });
      markChanged();
      showToast("playbookDeleted");
    },
    [markChanged, showToast],
  );

  const duplicatePlaybook = useCallback(
    (id: string) => {
      setData((current) => {
        const source = current.playbooks[id];
        if (!source) return current;
        const copyId = createId("pb");
        const copy: Playbook = {
          ...source,
          id: copyId,
          name: `${source.name} (${
            typeof document !== "undefined" && document.documentElement.lang === "he"
              ? "עותק"
              : "copy"
          })`,
          attachments: source.attachments.map((attachment) => ({
            ...attachment,
            id: createId("file"),
          })),
        };
        return {
          playbooks: { ...current.playbooks, [copyId]: copy },
          categories: current.categories.map((category) => {
            const index = category.playbookIds.indexOf(id);
            if (index < 0) return category;
            const playbookIds = [...category.playbookIds];
            playbookIds.splice(index + 1, 0, copyId);
            return { ...category, playbookIds };
          }),
        };
      });
      markChanged();
      showToast("playbookDuplicated");
    },
    [markChanged, showToast],
  );

  const setPlaybookActive = useCallback(
    (id: string, active: boolean) => {
      setData((current) => {
        const playbook = current.playbooks[id];
        if (!playbook) return current;
        return {
          ...current,
          playbooks: { ...current.playbooks, [id]: { ...playbook, active } },
        };
      });
      markChanged();
    },
    [markChanged],
  );

  const replaceCategories = useCallback((categories: Category[]) => {
    setData((current) => ({ ...current, categories }));
  }, []);

  const publish = useCallback(() => {
    const catalog = toUserCatalog(data.categories, userCategoryIds, userSubcategoryIds);
    void logPublishedCatalog(catalog);
    setChangeCount(0);
    showToast("extensionUpdated");
  }, [data.categories, showToast, userCategoryIds, userSubcategoryIds]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ready,
      categories: data.categories,
      playbooks: data.playbooks,
      changeCount,
      expanded,
      toast,
      showToast,
      dismissToast,
      toggleExpanded,
      expand,
      renameCategory,
      renameSubcategory,
      setSubcategoryContent,
      setSubcategoryActive,
      setCategoryIcon,
      setCategoryActive,
      deleteCategory,
      addCategory,
      addSubcategory,
      savePlaybook,
      deletePlaybook,
      duplicatePlaybook,
      setPlaybookActive,
      replaceCategories,
      markChanged,
      publish,
    }),
    [
      addCategory,
      addSubcategory,
      changeCount,
      data.categories,
      data.playbooks,
      deleteCategory,
      deletePlaybook,
      dismissToast,
      duplicatePlaybook,
      expand,
      expanded,
      markChanged,
      publish,
      ready,
      renameCategory,
      renameSubcategory,
      setSubcategoryContent,
      setSubcategoryActive,
      replaceCategories,
      savePlaybook,
      setCategoryActive,
      setCategoryIcon,
      setPlaybookActive,
      showToast,
      toast,
      toggleExpanded,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context)
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  return context;
}
