"use client";

import { arrayMove } from "@dnd-kit/sortable";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createSalesId, mockCatalog } from "@/lib/sales-manager/mock-data";
import type {
  SalesCatalog,
  SalesCategory,
  SalesDetails,
  SalesPlaybook,
  SalesSubcategory,
} from "@/lib/sales-manager/types";
import type { IconName } from "@/lib/workspace/types";

const STORAGE_KEY = "shirsales-sales-manager-v1";

type SalesManagerContextValue = {
  ready: boolean;
  categories: SalesCategory[];
  subcategories: SalesSubcategory[];
  playbooks: SalesPlaybook[];
  dirty: boolean;
  publishMessage: string | null;
  addCategory: (name: string) => void;
  addCategoryWithSubcategory: (input: {
    categoryName: string;
    subcategoryName: string;
    subcategoryNames?: string[];
    internalDescription: string;
    aiDescription: string;
    icon: IconName;
    workspaceCategoryId?: string;
  }) => string | null;
  updateCategory: (id: string, patch: Partial<Pick<SalesCategory, "name" | "isActive">>) => void;
  reorderCategories: (activeId: string, overId: string) => void;
  addSubcategory: (categoryId: string, name: string) => void;
  updateSubcategory: (
    id: string,
    patch: Partial<Pick<SalesSubcategory, "name" | "isActive">>,
  ) => void;
  reorderSubcategories: (activeId: string, overId: string) => void;
  savePlaybook: (input: Omit<SalesPlaybook, "id" | "order" | "files"> & { id?: string }) => void;
  placePlaybook: (
    id: string,
    categoryId: string,
    subcategoryId: string | undefined,
    beforeId?: string,
  ) => void;
  addFile: (playbookId: string, name: string) => void;
  removeFile: (playbookId: string, fileId: string) => void;
  publishChanges: () => Promise<void>;
  dismissPublishMessage: () => void;
};

const SalesManagerContext = createContext<SalesManagerContextValue | null>(null);

export async function publishChanges() {
  // Backend integration will be added later.
}

function byOrder<T extends { order: number }>(items: T[]) {
  return [...items].sort((a, b) => a.order - b.order);
}

function groupKey(categoryId: string, subcategoryId?: string) {
  return `${categoryId}:${subcategoryId ?? ""}`;
}

function reorderById<T extends { id: string; order: number }>(
  items: T[],
  activeId: string,
  overId: string,
) {
  const sorted = byOrder(items);
  const from = sorted.findIndex((item) => item.id === activeId);
  const to = sorted.findIndex((item) => item.id === overId);
  if (from < 0 || to < 0 || from === to) return items;
  return arrayMove(sorted, from, to).map((item, order) => ({ ...item, order }));
}

export function SalesManagerProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<SalesCatalog>(mockCatalog);
  const [dirty, setDirty] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SalesCatalog;
        if (parsed.categories && parsed.subcategories && parsed.playbooks) {
          setCatalog(parsed);
        }
      } catch {
        setCatalog(mockCatalog);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
  }, [catalog, ready]);

  const change = useCallback((recipe: (current: SalesCatalog) => SalesCatalog) => {
    setCatalog((current) => recipe(current));
    setDirty(true);
    setPublishMessage(null);
  }, []);

  const addCategory = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      change((current) => ({
        ...current,
        categories: [
          ...current.categories,
          {
            id: createSalesId("cat"),
            name: trimmed,
            order: current.categories.length,
            isActive: true,
          },
        ],
      }));
    },
    [change],
  );

  const updateCategory = useCallback(
    (id: string, patch: Partial<Pick<SalesCategory, "name" | "isActive">>) => {
      change((current) => ({
        ...current,
        categories: current.categories.map((category) =>
          category.id === id ? { ...category, ...patch } : category,
        ),
      }));
    },
    [change],
  );

  const reorderCategories = useCallback(
    (activeId: string, overId: string) => {
      change((current) => ({
        ...current,
        categories: reorderById(current.categories, activeId, overId),
      }));
    },
    [change],
  );

  const addCategoryWithSubcategory = useCallback(
    (input: {
      categoryName: string;
      subcategoryName: string;
      subcategoryNames?: string[];
      internalDescription: string;
      aiDescription: string;
      icon: IconName;
      workspaceCategoryId?: string;
    }) => {
      const category = input.categoryName.trim();
      const subcategoryNames = [...(input.subcategoryNames ?? []), input.subcategoryName]
        .map((name) => name.trim())
        .filter((name, index, names) => name && names.indexOf(name) === index);
      if (!category && subcategoryNames.length === 0) return null;
      const details: SalesDetails = {
        icon: input.icon,
        ...(input.internalDescription.trim()
          ? { internalDescription: input.internalDescription.trim() }
          : {}),
        ...(input.aiDescription.trim() ? { aiDescription: input.aiDescription.trim() } : {}),
      };
      let targetId: string | null = null;
      change((current) => {
        if (!category) {
          const parent = byOrder(current.categories).at(-1);
          if (!parent) return current;
          targetId = parent.id;
          const siblings = current.subcategories.filter((item) => item.categoryId === parent.id);
          return {
            ...current,
            categories: input.workspaceCategoryId
              ? current.categories.map((item) =>
                  item.id === parent.id
                    ? { ...item, workspaceCategoryId: input.workspaceCategoryId }
                    : item,
                )
              : current.categories,
            subcategories: [
              ...current.subcategories,
              ...subcategoryNames.map((name, index) => ({
                id: createSalesId("sub"),
                categoryId: parent.id,
                name,
                order: siblings.length + index,
                isActive: true,
                ...details,
              })),
            ],
          };
        }
        const categoryId = createSalesId("cat");
        targetId = categoryId;
        const categories = [
          ...current.categories,
          {
            id: categoryId,
            name: category,
            order: current.categories.length,
            isActive: true,
            workspaceCategoryId: input.workspaceCategoryId,
            ...details,
          },
        ];
        if (subcategoryNames.length === 0) return { ...current, categories };
        return {
          ...current,
          categories,
          subcategories: [
            ...current.subcategories,
            ...subcategoryNames.map((name, index) => ({
              id: createSalesId("sub"),
              categoryId,
              name,
              order: index,
              isActive: true,
            })),
          ],
        };
      });
      return targetId;
    },
    [change],
  );

  const addSubcategory = useCallback(
    (categoryId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      change((current) => {
        const siblings = current.subcategories.filter((item) => item.categoryId === categoryId);
        return {
          ...current,
          subcategories: [
            ...current.subcategories,
            {
              id: createSalesId("sub"),
              categoryId,
              name: trimmed,
              order: siblings.length,
              isActive: true,
            },
          ],
        };
      });
    },
    [change],
  );

  const updateSubcategory = useCallback(
    (id: string, patch: Partial<Pick<SalesSubcategory, "name" | "isActive">>) => {
      change((current) => ({
        ...current,
        subcategories: current.subcategories.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      }));
    },
    [change],
  );

  const reorderSubcategories = useCallback(
    (activeId: string, overId: string) => {
      change((current) => {
        const active = current.subcategories.find((item) => item.id === activeId);
        const over = current.subcategories.find((item) => item.id === overId);
        if (!active || !over || active.categoryId !== over.categoryId) return current;
        const siblings = current.subcategories.filter(
          (item) => item.categoryId === active.categoryId,
        );
        const others = current.subcategories.filter(
          (item) => item.categoryId !== active.categoryId,
        );
        return {
          ...current,
          subcategories: [...others, ...reorderById(siblings, activeId, overId)],
        };
      });
    },
    [change],
  );

  const savePlaybook = useCallback(
    (input: Omit<SalesPlaybook, "id" | "order" | "files"> & { id?: string }) => {
      const title = input.title.trim();
      if (!title) return;
      change((current) => {
        if (input.id) {
          return {
            ...current,
            playbooks: current.playbooks.map((item) =>
              item.id === input.id
                ? {
                    ...item,
                    title,
                    content: input.content,
                    categoryId: input.categoryId,
                    subcategoryId: input.subcategoryId,
                    isActive: input.isActive,
                  }
                : item,
            ),
          };
        }
        const siblings = current.playbooks.filter(
          (item) =>
            groupKey(item.categoryId, item.subcategoryId) ===
            groupKey(input.categoryId, input.subcategoryId),
        );
        return {
          ...current,
          playbooks: [
            ...current.playbooks,
            {
              id: createSalesId("pb"),
              categoryId: input.categoryId,
              subcategoryId: input.subcategoryId,
              title,
              content: input.content,
              order: siblings.length,
              isActive: input.isActive,
              files: [],
            },
          ],
        };
      });
    },
    [change],
  );

  const placePlaybook = useCallback(
    (id: string, categoryId: string, subcategoryId: string | undefined, beforeId?: string) => {
      change((current) => {
        const moving = current.playbooks.find((item) => item.id === id);
        if (!moving) return current;
        const without = current.playbooks.filter((item) => item.id !== id);
        const targetKey = groupKey(categoryId, subcategoryId);
        const target = byOrder(
          without.filter((item) => groupKey(item.categoryId, item.subcategoryId) === targetKey),
        );
        const index = beforeId ? target.findIndex((item) => item.id === beforeId) : target.length;
        target.splice(index < 0 ? target.length : index, 0, {
          ...moving,
          categoryId,
          subcategoryId,
        });
        const reindexed = target.map((item, order) => ({ ...item, order }));
        const targetIds = new Set(reindexed.map((item) => item.id));
        const rest = without.filter((item) => !targetIds.has(item.id));
        const sourceKey = groupKey(moving.categoryId, moving.subcategoryId);
        const source = byOrder(
          rest.filter((item) => groupKey(item.categoryId, item.subcategoryId) === sourceKey),
        ).map((item, order) => ({ ...item, order }));
        const sourceIds = new Set(source.map((item) => item.id));
        return {
          ...current,
          playbooks: [...rest.filter((item) => !sourceIds.has(item.id)), ...source, ...reindexed],
        };
      });
    },
    [change],
  );

  const addFile = useCallback(
    (playbookId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      change((current) => ({
        ...current,
        playbooks: current.playbooks.map((item) =>
          item.id === playbookId
            ? { ...item, files: [...item.files, { id: createSalesId("file"), name: trimmed }] }
            : item,
        ),
      }));
    },
    [change],
  );

  const removeFile = useCallback(
    (playbookId: string, fileId: string) => {
      change((current) => ({
        ...current,
        playbooks: current.playbooks.map((item) =>
          item.id === playbookId
            ? { ...item, files: item.files.filter((file) => file.id !== fileId) }
            : item,
        ),
      }));
    },
    [change],
  );

  const publish = useCallback(async () => {
    await publishChanges();
    setDirty(false);
    setPublishMessage("published");
  }, []);

  const value = useMemo<SalesManagerContextValue>(
    () => ({
      ready,
      categories: byOrder(catalog.categories),
      subcategories: byOrder(catalog.subcategories),
      playbooks: byOrder(catalog.playbooks),
      dirty,
      publishMessage,
      addCategory,
      addCategoryWithSubcategory,
      updateCategory,
      reorderCategories,
      addSubcategory,
      updateSubcategory,
      reorderSubcategories,
      savePlaybook,
      placePlaybook,
      addFile,
      removeFile,
      publishChanges: publish,
      dismissPublishMessage: () => setPublishMessage(null),
    }),
    [
      ready,
      catalog,
      dirty,
      publishMessage,
      addCategory,
      addCategoryWithSubcategory,
      updateCategory,
      reorderCategories,
      addSubcategory,
      updateSubcategory,
      reorderSubcategories,
      savePlaybook,
      placePlaybook,
      addFile,
      removeFile,
      publish,
    ],
  );

  return <SalesManagerContext.Provider value={value}>{children}</SalesManagerContext.Provider>;
}

export function useSalesManager() {
  const value = useContext(SalesManagerContext);
  if (!value) throw new Error("useSalesManager must be used within SalesManagerProvider");
  return value;
}
