"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

export function DocumentLocale() {
  const locale = useLocale();
  const dir = locale === "he" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return null;
}
