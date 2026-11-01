"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export function HighlightText({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle) return text;

  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const expression = new RegExp(escaped, "gi");
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(expression)) {
    const index = match.index ?? 0;
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index));
    nodes.push(
      <mark key={`${index}-${match[0]}`} className="rounded-sm bg-amber-100 px-0.5 text-inherit">
        {match[0]}
      </mark>,
    );
    lastIndex = index + match[0].length;
  }

  if (lastIndex === 0) return text;
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function Search({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useTranslations("Search");
  return (
    <label className="relative block w-full min-w-0 sm:w-64">
      <span className="sr-only">{t("label")}</span>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3-3" />
      </svg>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("placeholder")}
        maxLength={80}
        className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 ps-9 pe-8 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:ring-3 focus:ring-blue-500/15"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute end-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
          aria-label={t("clear")}
        >
          ×
        </button>
      ) : null}
    </label>
  );
}
