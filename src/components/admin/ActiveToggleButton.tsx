"use client";

import { cn } from "@/lib/utils";

export function ActiveToggleButton({
  active,
  pending,
  disabled = false,
  activeLabel,
  inactiveLabel,
  onClick,
  className,
}: {
  active: boolean;
  pending: boolean;
  disabled?: boolean;
  activeLabel: string;
  inactiveLabel: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      aria-busy={pending}
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full px-2 py-0.5 text-[11px] font-medium",
        !disabled && !pending && "cursor-pointer hover:opacity-80",
        pending && "cursor-progress",
        active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-200 text-zinc-500",
        className,
      )}
    >
      <span
        className={cn(
          "relative z-10 inline-flex items-center gap-1 transition-opacity duration-200",
          pending && "opacity-70",
        )}
      >
        {pending ? (
          <span
            className="size-2.5 animate-spin rounded-full border border-current border-t-transparent"
            aria-hidden
          />
        ) : null}
        {active ? activeLabel : inactiveLabel}
      </span>
      {pending ? (
        <span
          className="category-shimmer pointer-events-none absolute inset-0 opacity-70"
          aria-hidden
        />
      ) : null}
    </button>
  );
}
