"use client";

import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CategoryAccordion } from "@/components/admin/CategoryAccordion";
import { useSalesSensors } from "@/components/sales-manager/bits";
import { useSalesNav } from "@/components/sales-manager/nav";
import { Button } from "@/components/ui/button";
import {
  categoryDragId,
  reorderCategories,
  reorderPlaybookInCategory,
  stripId,
} from "@/lib/workspace/dnd";
import { useWorkspace } from "@/lib/workspace/store";
import type { Category, Playbook } from "@/lib/workspace/types";
import { useWorkspaceUi } from "@/lib/workspace/ui";

export function PlaybooksPanel({
  categories,
  aiRequest,
  onAiPromptReady,
}: {
  categories: Category[];
  aiRequest?: { id: string; token: number } | null;
  onAiPromptReady?: (subcategoryId: string, aiPrompt: string) => void;
}) {
  const workspace = useWorkspace();
  const ui = useWorkspaceUi();
  const openTab = useSalesNav();
  const t = useTranslations("Sales");
  const sensors = useSalesSensors();
  const [draggingPlaybook, setDraggingPlaybook] = useState(false);

  function onDragEnd(event: DragEndEvent) {
    setDraggingPlaybook(false);
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId || activeId === overId) return;
    if (activeId.startsWith("category:") && overId.startsWith("category:")) {
      workspace.replaceCategories(
        reorderCategories(
          workspace.categories,
          stripId(activeId),
          stripId(overId),
        ),
      );
      workspace.markChanged();
      return;
    }
    if (activeId.startsWith("playbook:") && overId.startsWith("playbook:")) {
      workspace.replaceCategories(
        reorderPlaybookInCategory(
          workspace.categories,
          stripId(activeId),
          stripId(overId),
        ),
      );
      workspace.markChanged();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          type="button"
          className="min-w-32"
          onClick={() => openTab("preview")}
        >
          {t("save")}
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        onDragStart={(event) =>
          setDraggingPlaybook(String(event.active.id).startsWith("playbook:"))
        }
        onDragEnd={onDragEnd}
        onDragCancel={() => setDraggingPlaybook(false)}
      >
        <SortableContext
          items={categories.map((category) => categoryDragId(category.id))}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {categories.map((category) => {
              const playbooks = category.playbookIds
                .map((id) => workspace.playbooks[id])
                .filter((playbook): playbook is Playbook => Boolean(playbook));
              return (
                <CategoryAccordion
                  key={category.id}
                  category={category}
                  playbooks={playbooks}
                  sectionId={`plan-category-${category.id}`}
                  query=""
                  forceOpen={false}
                  dragDisabled={false}
                  draggingPlaybook={draggingPlaybook}
                  onEditPlaybook={ui.editPlaybook}
                  onCreatePlaybook={() => ui.openCreatePlaybook(category.id)}
                  onDeletePlaybook={(playbook) =>
                    workspace.deletePlaybook(playbook.id)
                  }
                  onDeleteCategory={() => workspace.deleteCategory(category.id)}
                  showSubcategoryAi
                  aiRequest={aiRequest}
                  onAiPromptReady={onAiPromptReady}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
      <div className="flex justify-end">
        <Button
          type="button"
          className="min-w-32"
          onClick={() => openTab("preview")}
        >
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
