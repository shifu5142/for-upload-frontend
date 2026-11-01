"use client";

import { Dialog } from "@base-ui/react/dialog";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  deleteFile,
  fetchFiles,
  fileSections,
  FilesSkeleton,
  firstTwoWords,
  handleFileInputChange,
  type FetchedAttachment,
  playbookNamesById,
} from "@/components/sales-manager/files";
import { useSalesManager } from "@/lib/sales-manager/store";
import { useWorkspace } from "@/lib/workspace/store";
import type { Category } from "@/lib/workspace/types";
import { useWorkspaceUi } from "@/lib/workspace/ui";

export function FilesPanel({ categories }: { categories: Category[] }) {
  const sales = useSalesManager();
  const workspace = useWorkspace();
  const { getAccessToken } = useWorkspaceUi();
  const t = useTranslations("Sales");
  const closeLabel = useTranslations("Common");
  const [files, setFiles] = useState<FetchedAttachment[] | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFile, setOpenFile] = useState<FetchedAttachment | null>(null);

  useEffect(() => {
    void fetchFiles(getAccessToken, setFiles);
  }, [getAccessToken]);

  if (files === null) return <FilesSkeleton />;

  const titles = playbookNamesById(
    sales.playbooks,
    workspace.categories,
    workspace.playbooks,
    categories,
  );
  const sections = fileSections(files);

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {sections.map(([playbookId, group]) => {
        const title = playbookId ? titles.get(playbookId) : null;
        return (
          <div
            key={playbookId || "empty"}
            className="rounded-xl border border-zinc-200 bg-white p-3"
          >
            {title ? (
              <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
            ) : null}
            <p className="mt-1 text-xs text-zinc-500">{t("supportingFiles")}</p>
            <ul className="mt-2 space-y-1">
              {group.length === 0 ? (
                <li className="text-sm text-zinc-400">{t("noFiles")}</li>
              ) : (
                group.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center gap-2 text-sm text-zinc-700"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFile(file)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-start"
                    >
                      <FileText className="size-3.5 shrink-0 text-zinc-400" />
                      <span className="min-w-0 flex-1 truncate">
                        {firstTwoWords(file.file_name)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void deleteFile(file.id, getAccessToken, setFiles, setError)
                      }
                      className="text-xs text-zinc-400 hover:text-red-600"
                    >
                      {t("remove")}
                    </button>
                  </li>
                ))
              )}
            </ul>
            {playbookId ? (
              <label className="mt-3 inline-flex h-8 cursor-pointer items-center rounded-lg border border-zinc-200 px-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50">
                {uploadingId === playbookId ? "..." : t("addFile")}
                <input
                  type="file"
                  className="sr-only"
                  disabled={uploadingId === playbookId}
                  onChange={(event) =>
                    handleFileInputChange(
                      event,
                      playbookId,
                      getAccessToken,
                      setError,
                      setUploadingId,
                      setFiles,
                    )
                  }
                />
              </label>
            ) : null}
          </div>
        );
      })}
      <Dialog.Root
        open={openFile !== null}
        onOpenChange={(next) => {
          if (!next) setOpenFile(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[80] bg-zinc-950/25" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-[80] w-[min(100%-2rem,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl outline-none">
            <Dialog.Title className="text-base font-semibold break-words text-zinc-950">
              {openFile?.file_name}
            </Dialog.Title>
            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenFile(null)}
              >
                {closeLabel("close")}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
