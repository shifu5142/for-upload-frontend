"use client";

import type { PlaybookDraft } from "@/lib/workspace/types";
import { createContext, type ReactNode, useContext } from "react";

type WorkspaceUiValue = {
  openCreatePlaybook: (categoryId: string) => void;
  editPlaybook: (id: string) => void;
  saveSubcategory: (draft: PlaybookDraft) => void;
  getAccessToken: () => Promise<string | null>;
};

const WorkspaceUiContext = createContext<WorkspaceUiValue | null>(null);

export function WorkspaceUiProvider({
  value,
  children,
}: {
  value: WorkspaceUiValue;
  children: ReactNode;
}) {
  return <WorkspaceUiContext.Provider value={value}>{children}</WorkspaceUiContext.Provider>;
}

export function useWorkspaceUi() {
  const value = useContext(WorkspaceUiContext);
  if (!value) throw new Error("useWorkspaceUi must be used within WorkspaceUiProvider");
  return value;
}
