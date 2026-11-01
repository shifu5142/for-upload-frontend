import type { CollisionDetection } from "@dnd-kit/core";
import { closestCenter, pointerWithin } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Category } from "@/lib/workspace/types";

export function stripId(value: string) {
  const index = value.indexOf(":");
  return index === -1 ? value : value.slice(index + 1);
}

export function categoryDragId(id: string) {
  return `category:${id}`;
}

export function playbookDragId(id: string) {
  return `playbook:${id}`;
}

export function dropDragId(id: string) {
  return `drop:${id}`;
}

export function findCategoryId(categories: Category[], playbookId: string) {
  return categories.find((category) => category.playbookIds.includes(playbookId))?.id ?? null;
}

export function resolveCategoryId(categories: Category[], overId: string) {
  if (overId.startsWith("category:") || overId.startsWith("drop:")) return stripId(overId);
  if (overId.startsWith("playbook:")) return findCategoryId(categories, stripId(overId));
  return null;
}

export function orderKey(categories: Category[]) {
  return categories.map((category) => `${category.id}:${category.playbookIds.join(",")}`).join("|");
}

export function movePlaybook(
  categories: Category[],
  playbookId: string,
  toCategoryId: string,
  index: number,
) {
  return categories.map((category) => {
    const without = category.playbookIds.filter((id) => id !== playbookId);
    if (category.id !== toCategoryId) return { ...category, playbookIds: without };
    const at = Math.max(0, Math.min(index, without.length));
    return {
      ...category,
      playbookIds: [...without.slice(0, at), playbookId, ...without.slice(at)],
    };
  });
}

export function reorderCategories(categories: Category[], activeId: string, overId: string) {
  const oldIndex = categories.findIndex((category) => category.id === activeId);
  const newIndex = categories.findIndex((category) => category.id === overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return categories;
  return arrayMove(categories, oldIndex, newIndex);
}

export function reorderPlaybookInCategory(
  categories: Category[],
  playbookId: string,
  overPlaybookId: string,
) {
  return categories.map((category) => {
    const oldIndex = category.playbookIds.indexOf(playbookId);
    const newIndex = category.playbookIds.indexOf(overPlaybookId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return category;
    return { ...category, playbookIds: arrayMove(category.playbookIds, oldIndex, newIndex) };
  });
}

export const collisionDetection: CollisionDetection = (args) => {
  const activeId = String(args.active.id);
  if (activeId.startsWith("category:")) {
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((container) =>
        String(container.id).startsWith("category:"),
      ),
    });
  }

  const pointerHits = pointerWithin(args);
  const playbookHits = pointerHits.filter((hit) => String(hit.id).startsWith("playbook:"));
  if (playbookHits.length > 0) return playbookHits;

  const zoneHits = pointerHits.filter((hit) => {
    const id = String(hit.id);
    return id.startsWith("drop:") || id.startsWith("category:");
  });
  if (zoneHits.length > 0) return zoneHits;

  return closestCenter(args);
};
