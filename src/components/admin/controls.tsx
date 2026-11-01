"use client";

import { Menu } from "@base-ui/react/menu";
import { Tooltip } from "@base-ui/react/tooltip";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const menuItemClass =
  "flex w-full cursor-pointer items-center rounded-lg px-2.5 py-2 text-start text-sm text-zinc-700 outline-none data-[highlighted]:bg-zinc-100";

export function Hint({
  label,
  className,
  children,
  onClick,
}: {
  label: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger aria-label={label} className={className} onClick={onClick}>
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner side="bottom" sideOffset={6}>
          <Tooltip.Popup className="z-[90] rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white shadow-md data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function ActionMenu({
  label,
  items,
  onBlocked,
}: {
  label: string;
  items: {
    id: string;
    label: string;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
  }[];
  onBlocked?: () => void;
}) {
  if (onBlocked) {
    return (
      <button
        type="button"
        aria-label={label}
        onClick={onBlocked}
        className="flex size-7 items-center justify-center rounded-md text-zinc-400 outline-none hover:bg-zinc-100 hover:text-zinc-700 focus-visible:ring-3 focus-visible:ring-blue-500/20"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>
    );
  }
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={label}
        className="flex size-7 items-center justify-center rounded-md text-zinc-400 outline-none hover:bg-zinc-100 hover:text-zinc-700 focus-visible:ring-3 focus-visible:ring-blue-500/20"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={6} className="z-[90]">
          <Menu.Popup className="min-w-44 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg outline-none data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {items.map((item) => (
              <Menu.Item
                key={item.id}
                disabled={item.disabled}
                onClick={item.onClick}
                className={cn(
                  menuItemClass,
                  item.danger && "text-red-600 data-[highlighted]:bg-red-50",
                  item.disabled &&
                    "cursor-not-allowed text-zinc-300 data-[highlighted]:bg-transparent",
                )}
              >
                {item.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
