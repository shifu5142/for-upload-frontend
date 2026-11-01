"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useTranslations } from "next-intl";
import { ExtensionPreview } from "@/components/admin/ExtensionPreview";
import type { Category } from "@/lib/workspace/types";

export function WorkspacePreviewAside({
  categories,
  status = "ready",
  showInactive = false,
}: {
  categories: Category[];
  status?: "loading" | "ready" | "error";
  showInactive?: boolean;
}) {
  const copy = useTranslations("Workspace");
  return (
    <aside className="hidden w-[400px] shrink-0 flex-col border-s border-zinc-200 bg-white xl:flex">
      <div className="border-b border-zinc-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-zinc-950">{copy("preview")}</h2>
        <p className="mt-1 text-xs text-zinc-500">{copy("previewHint")}</p>
      </div>
      <div className="admin-scroll flex-1 overflow-y-auto px-5 py-5">
        <ExtensionPreview
          categories={categories}
          status={status}
          showInactive={showInactive}
        />
      </div>
    </aside>
  );
}

export function PreviewDialog({
  open,
  onClose,
  categories,
  status = "ready",
  showInactive = false,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  status?: "loading" | "ready" | "error";
  showInactive?: boolean;
}) {
  const copy = useTranslations("Workspace");
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[80] bg-zinc-950/25 xl:hidden" />
        <Dialog.Popup className="fixed inset-x-4 top-16 z-[80] max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl bg-white p-4 shadow-xl outline-none xl:hidden">
          <Dialog.Title className="mb-3 text-sm font-semibold">
            {copy("preview")}
          </Dialog.Title>
          <ExtensionPreview
            categories={categories}
            status={status}
            showInactive={showInactive}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
