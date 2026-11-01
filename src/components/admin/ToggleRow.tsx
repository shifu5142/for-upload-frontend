"use client";

import { Switch } from "@base-ui/react/switch";

export function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2.5">
      <span>
        <span className="block text-sm font-medium text-zinc-800">{title}</span>
        <span className="block text-xs text-zinc-500">{description}</span>
      </span>
      <Switch.Root
        checked={checked}
        onCheckedChange={onChange}
        aria-label={title}
        dir="ltr"
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-zinc-200 transition-colors data-[checked]:bg-blue-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/30"
      >
        <Switch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[checked]:translate-x-4" />
      </Switch.Root>
    </div>
  );
}
