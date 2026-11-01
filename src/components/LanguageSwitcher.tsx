"use client";

import { Popover } from "@base-ui/react/popover";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { locale: "en", direction: "LTR", labelKey: "english" },
  { locale: "he", direction: "RTL", labelKey: "hebrew" },
] as const;

export function LanguageSwitcher() {
  const t = useTranslations("Language");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const direction = locale === "he" ? "RTL" : "LTR";

  function selectLocale(next: AppLocale) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={t("menu")}
        className="inline-flex h-8 min-w-12 items-center justify-center rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold tracking-wide text-zinc-800 hover:bg-zinc-50"
      >
        {direction === "RTL" ? t("buttonRtl") : t("buttonLtr")}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={6} className="z-[90]">
          <Popover.Popup className="min-w-44 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg outline-none">
            {OPTIONS.map((option) => {
              const selected = option.locale === locale;
              return (
                <button
                  key={option.locale}
                  type="button"
                  onClick={() => selectLocale(option.locale)}
                  className={cn(
                    "flex w-full cursor-pointer items-center rounded-lg px-2.5 py-2 text-start text-sm outline-none hover:bg-zinc-100",
                    selected ? "bg-zinc-100 font-semibold text-zinc-950" : "text-zinc-700",
                  )}
                  aria-current={selected ? "true" : undefined}
                >
                  {t(option.labelKey)}
                </button>
              );
            })}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
