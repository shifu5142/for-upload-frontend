"use client";

import { KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function useSalesSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

export function StatusButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  const t = useTranslations("Sales");
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
        active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500",
      )}
    >
      {active ? t("activeDisable") : t("inactiveEnable")}
    </button>
  );
}

export function Grip({ listeners, attributes }: { listeners?: object; attributes?: object }) {
  const t = useTranslations("Sales");
  return (
    <button
      type="button"
      aria-label={t("drag")}
      className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md border-0 bg-transparent text-zinc-400 hover:bg-zinc-100 active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
        <circle cx="6" cy="3.5" r="1.1" />
        <circle cx="10" cy="3.5" r="1.1" />
        <circle cx="6" cy="8" r="1.1" />
        <circle cx="10" cy="8" r="1.1" />
        <circle cx="6" cy="12.5" r="1.1" />
        <circle cx="10" cy="12.5" r="1.1" />
      </svg>
    </button>
  );
}
