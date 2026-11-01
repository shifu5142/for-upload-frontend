"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Paperclip, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { ActionMenu, Hint } from "@/components/admin/controls";
import { HighlightText } from "@/components/admin/Search";
import { cn } from "@/lib/utils";
import { playbookDragId } from "@/lib/workspace/dnd";
import { WorkspaceIcon } from "@/lib/workspace/icons";
import type { Playbook } from "@/lib/workspace/types";

export function PlaybookRow({
  playbook,
  query,
  dragDisabled,
  draggingPlaybook,
  onEdit,
  onDuplicate,
  onToggleActive,
  onDelete,
  onBlocked,
}: {
  playbook: Playbook;
  query: string;
  dragDisabled: boolean;
  draggingPlaybook: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onBlocked?: () => void;
}) {
  const t = useTranslations("PlaybookRow");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: playbookDragId(playbook.id), disabled: dragDisabled || Boolean(onBlocked) });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-transparent bg-white px-2 py-1.5 transition-[box-shadow,border-color,background-color] duration-150",
        "hover:border-zinc-200 hover:shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_16px_-12px_rgba(16,24,40,0.35)]",
        isDragging && "opacity-40",
        isOver && draggingPlaybook && "border-blue-400 bg-blue-50/60",
        !playbook.active && "bg-zinc-50",
      )}
    >
      <button
        type="button"
        {...(onBlocked ? {} : { ...attributes, ...listeners })}
        onClick={onBlocked}
        aria-label={t("drag")}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0 text-zinc-400",
          onBlocked
            ? "cursor-pointer hover:bg-zinc-100 hover:text-zinc-700"
            : dragDisabled
              ? "cursor-not-allowed opacity-40"
              : "cursor-grab hover:bg-zinc-100 hover:text-zinc-700 active:cursor-grabbing",
        )}
      >
        <GripDots />
      </button>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-zinc-50 text-zinc-500">
        <WorkspaceIcon name={playbook.icon} className="size-3.5" />
      </span>
      <button
        type="button"
        onClick={onBlocked ?? onEdit}
        className="min-w-0 flex-1 truncate text-start text-sm font-medium text-zinc-900 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-blue-500/20"
      >
        <HighlightText text={playbook.name} query={query} />
      </button>
      {playbook.attachments.length > 0 ? (
        <span
          className="inline-flex shrink-0 items-center gap-1 text-xs text-zinc-500"
          title={playbook.attachments.map((file) => file.name).join("\n")}
        >
          <Paperclip className="size-3.5" aria-hidden="true" />
          {playbook.attachments.length}
        </span>
      ) : null}
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
          playbook.active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500",
        )}
      >
        {playbook.active ? t("active") : t("hidden")}
      </span>
      <Hint
        label={t("edit")}
        onClick={onBlocked ?? onEdit}
        className="flex size-7 items-center justify-center rounded-md text-zinc-400 outline-none hover:bg-zinc-100 hover:text-zinc-700 focus-visible:ring-3 focus-visible:ring-blue-500/20"
      >
        <Pencil className="size-3.5" />
      </Hint>
      <ActionMenu
        label={t("actionsFor", { name: playbook.name })}
        items={[
          { id: "edit", label: t("edit"), onClick: onEdit },
          { id: "duplicate", label: t("duplicate"), onClick: onDuplicate },
          {
            id: "visibility",
            label: playbook.active ? t("hide") : t("show"),
            onClick: onToggleActive,
          },
          { id: "delete", label: t("delete"), onClick: onDelete, danger: true },
        ]}
        onBlocked={onBlocked}
      />
    </div>
  );
}

function GripDots() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
      <circle cx="6" cy="3.5" r="1.1" />
      <circle cx="10" cy="3.5" r="1.1" />
      <circle cx="6" cy="8" r="1.1" />
      <circle cx="10" cy="8" r="1.1" />
      <circle cx="6" cy="12.5" r="1.1" />
      <circle cx="10" cy="12.5" r="1.1" />
    </svg>
  );
}

export function PlaybookDragPreview({ playbook }: { playbook: Playbook }) {
  return (
    <div className="flex w-[360px] items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 shadow-xl">
      <WorkspaceIcon name={playbook.icon} className="size-4 text-zinc-500" />
      <span className="truncate text-sm font-medium text-zinc-900">{playbook.name}</span>
    </div>
  );
}
