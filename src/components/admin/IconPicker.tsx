"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ICON_CHOICES, WorkspaceIcon } from "@/lib/workspace/icons";
import type { IconName } from "@/lib/workspace/types";

export function IconPicker({
  value,
  onChange,
}: {
  value: IconName;
  onChange: (icon: IconName) => void;
}) {
  const t = useTranslations("Icons");
  return (
    <div className="grid grid-cols-5 gap-1.5" role="listbox" aria-label={t("choose")}>
      {ICON_CHOICES.map((choice) => {
        const selected = choice.name === value;
        const label = t(choice.name);
        return (
          <button
            key={choice.name}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={label}
            title={label}
            onClick={() => onChange(choice.name)}
            className={cn(
              "flex h-10 items-center justify-center rounded-lg border text-zinc-600 transition-colors",
              selected
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-transparent bg-zinc-50 hover:border-zinc-200 hover:bg-white",
            )}
          >
            <WorkspaceIcon name={choice.name} className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
