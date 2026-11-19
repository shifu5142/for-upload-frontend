"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ChevronsLeft, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Search } from "@/components/admin/Search";
import { useSalesNav } from "@/components/sales-manager/nav";
import { Button } from "@/components/ui/button";
import {
  deleteFile,
  fetchFiles,
  filesForSubcategory,
  filesGroupedByPlaybook,
  FilesSkeleton,
  firstTwoWords,
  handleFileInputChange,
  type FetchedAttachment,
  subcategoryPlaybookIds,
} from "@/components/sales-manager/files";
import type { Category } from "@/lib/workspace/types";
import { useWorkspaceUi } from "@/lib/workspace/ui";

export function FilesPanel({ categories }: { categories: Category[] }) {
  const { getAccessToken } = useWorkspaceUi();
  const openTab = useSalesNav();
  const t = useTranslations("Sales");
  const closeLabel = useTranslations("Common");
  const [files, setFiles] = useState<FetchedAttachment[] | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFile, setOpenFile] = useState<FetchedAttachment | null>(null);
  const [query, setQuery] = useState("");
  const results = useTranslations("Workspace");

  useEffect(() => {
    void fetchFiles(getAccessToken, setFiles);
  }, [getAccessToken]);

  const needle = query.trim().toLocaleLowerCase("he");
  const matches = (value: string) =>
    value.toLocaleLowerCase("he").includes(needle);

  if (files === null) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Search
            value={query}
            onChange={setQuery}
            label={t("searchFiles")}
            placeholder={t("searchFilesPlaceholder")}
            className="min-w-0 flex-1"
          />
          <Button
            type="button"
            variant="outline"
            aria-label={t("nextPanel")}
            onClick={() => openTab("preview")}
            className="shrink-0"
          >
            <ChevronsLeft className="size-4" />
          </Button>
        </div>
        <FilesSkeleton />
      </div>
    );
  }

  const groups = filesGroupedByPlaybook(files);
  const sections = categories.flatMap((category) => {
    const subcategories = (category.subcategories ?? []).flatMap(
      (subcategory) => {
        const playbookIds = subcategoryPlaybookIds(subcategory);
        const group = filesForSubcategory(groups, playbookIds);
        const uploadId = playbookIds[0] ?? "";
        if (!needle) return [{ subcategory, group, uploadId }];
        const categoryMatch = matches(category.name);
        const subcategoryMatch = matches(subcategory.name);
        const matchedFiles = group.filter((file) => matches(file.file_name));
        if (!categoryMatch && !subcategoryMatch && matchedFiles.length === 0) {
          return [];
        }
        return [
          {
            subcategory,
            uploadId,
            group: categoryMatch || subcategoryMatch ? group : matchedFiles,
          },
        ];
      },
    );
    if (subcategories.length === 0) return [];
    return [{ category, subcategories }];
  });
  const listedFileIds = new Set(
    categories.flatMap((category) =>
      (category.subcategories ?? []).flatMap((subcategory) =>
        filesForSubcategory(
          groups,
          subcategoryPlaybookIds(subcategory),
        ).map((file) => file.id),
      ),
    ),
  );
  const unlistedFiles = files.filter(
    (file) =>
      !listedFileIds.has(file.id) && (!needle || matches(file.file_name)),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search
          value={query}
          onChange={setQuery}
          label={t("searchFiles")}
          placeholder={t("searchFilesPlaceholder")}
          className="min-w-0 flex-1"
        />
        <Button
          type="button"
          variant="outline"
          aria-label={t("nextPanel")}
          onClick={() => openTab("preview")}
          className="shrink-0"
        >
          <ChevronsLeft className="size-4" />
        </Button>
      </div>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {sections.length === 0 && unlistedFiles.length === 0 ? (
        <p className="text-sm text-zinc-400">
          {needle ? results("noResults", { query: query.trim() }) : t("noFiles")}
        </p>
      ) : null}
      {sections.map(({ category, subcategories }) => (
        <section
          key={category.id}
          className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3"
        >
          <h3 className="text-left text-sm font-semibold text-zinc-900">
            {category.name}
          </h3>
          {subcategories.map(({ subcategory, uploadId, group }) => {
            return (
              <div
                key={subcategory.id}
                className="rounded-lg bg-zinc-50 p-3"
              >
                <h4 className="text-sm font-medium text-zinc-800">
                  {subcategory.name}
                </h4>
                <p className="mt-1 text-xs text-zinc-500">
                  {t("supportingFiles")}
                </p>
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
                            void deleteFile(
                              file.id,
                              getAccessToken,
                              setFiles,
                              setError,
                            )
                          }
                          className="text-xs text-zinc-400 hover:text-red-600"
                        >
                          {t("remove")}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
                {uploadId ? (
                  <label className="mt-3 inline-flex h-8 cursor-pointer items-center rounded-lg border border-zinc-200 px-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50">
                    {uploadingId === uploadId ? "..." : t("addFile")}
                    <input
                      type="file"
                      className="sr-only"
                      disabled={uploadingId === uploadId}
                      onChange={(event) =>
                        handleFileInputChange(
                          event,
                          uploadId,
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
        </section>
      ))}
      {unlistedFiles.length > 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <ul className="space-y-1">
            {unlistedFiles.map((file) => (
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
            ))}
          </ul>
        </div>
      ) : null}
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
