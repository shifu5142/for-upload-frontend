"use client";

import { createContext, type ReactNode, useContext } from "react";

export type SalesTabId = "categories" | "playbooks" | "files" | "preview" | "publish";

const SalesNavContext = createContext<((tab: SalesTabId) => void) | null>(null);

export function SalesNavProvider({
  openTab,
  children,
}: {
  openTab: (tab: SalesTabId) => void;
  children: ReactNode;
}) {
  return <SalesNavContext.Provider value={openTab}>{children}</SalesNavContext.Provider>;
}

export function useSalesNav() {
  const openTab = useContext(SalesNavContext);
  if (!openTab) throw new Error("useSalesNav must be used within SalesNavProvider");
  return openTab;
}
