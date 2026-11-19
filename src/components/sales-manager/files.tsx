"use client";

import { useTranslations } from "next-intl";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { backendUrl } from "@/lib/backend-url";
import type { Category } from "@/lib/workspace/types";

export type FetchedAttachment = {
  id: string;
  file_name: string;
  file_url: string;
  playbook_id: string;
};

type TokenGetter = () => Promise<string | null>;
type FilesSetter = Dispatch<SetStateAction<FetchedAttachment[] | null>>;

export function firstTwoWords(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).join(" ");
}

export async function handleFileUpload(
  file: File,
  playbookId: string,
  token: string,
) {
  const formData = new FormData();
  const fileType = file.type || "application/octet-stream";
  const upload = new File([await file.arrayBuffer()], file.name, {
    type: fileType,
  });

  formData.append("file_type", fileType);
  formData.append("file_url", upload, upload.name);
  formData.append("file_name", upload.name);
  formData.append("playbook_id", playbookId);
  const response = await fetch(`${backendUrl}/attachments/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = (await response.json().catch(() => null)) as {
    message?: string | string[];
  } | null;
  const message = Array.isArray(result?.message)
    ? result.message.join(", ")
    : result?.message;

  if (!response.ok) {
    throw new Error(message || "File upload failed");
  }

  return result;
}

export function isFetchedAttachment(value: unknown): value is FetchedAttachment {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.file_name === "string" &&
    typeof row.file_url === "string" &&
    typeof row.playbook_id === "string"
  );
}

export function FilesSkeleton() {
  const t = useTranslations("Sales");
  return (
    <div
      className="flex items-center justify-center py-10"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="sr-only">{t("loadingFiles")}</p>
      <span
        className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800"
        aria-hidden
      />
    </div>
  );
}

export function playbookTitles(categories: Category[]) {
  const titles = new Map<string, string>();
  for (const category of categories) {
    for (const subcategory of category.subcategories ?? []) {
      titles.set(subcategory.id, subcategory.name);
    }
  }
  return titles;
}

export function playbookNamesById(
  salesPlaybooks: { id: string; title: string }[],
  workspaceCategories: Category[],
  workspacePlaybooks: Record<string, { id: string; name: string }>,
  categories: Category[],
) {
  const names = new Map<string, string>();
  for (const playbook of salesPlaybooks) names.set(playbook.id, playbook.title);
  for (const [id, name] of playbookTitles(workspaceCategories)) names.set(id, name);
  for (const playbook of Object.values(workspacePlaybooks)) {
    names.set(playbook.id, playbook.name);
  }
  for (const [id, name] of playbookTitles(categories)) names.set(id, name);
  return names;
}

export function filesGroupedByPlaybook(files: FetchedAttachment[]) {
  const groups = new Map<string, FetchedAttachment[]>();
  for (const file of files) {
    const group = groups.get(file.playbook_id) ?? [];
    group.push(file);
    groups.set(file.playbook_id, group);
  }
  return groups;
}

export function fileSections(files: FetchedAttachment[]) {
  const groups = filesGroupedByPlaybook(files);
  if (groups.size === 0) return [["", [] as FetchedAttachment[]]] as [string, FetchedAttachment[]][];
  return [...groups];
}

export function subcategoryPlaybookIds(subcategory: {
  id: string;
  playbookIds?: string[];
}) {
  if (subcategory.playbookIds && subcategory.playbookIds.length > 0) {
    return subcategory.playbookIds;
  }
  return subcategory.playbookIds ? [] : [subcategory.id];
}

export function filesForSubcategory(
  groups: Map<string, FetchedAttachment[]>,
  playbookIds: string[],
) {
  return playbookIds.flatMap((id) => groups.get(id) ?? []);
}

export async function fetchFiles(
  getAccessToken: TokenGetter,
  setFiles: (files: FetchedAttachment[]) => void,
) {
  try {
    const token = (await getAccessToken()) ?? localStorage.getItem("token");
    if (!token) throw new Error("Unauthorized");
    const response = await fetch(
      `${backendUrl}/attachments/get-all-attachments`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const data = await response.json();
    setFiles(Array.isArray(data) ? data.filter(isFetchedAttachment) : []);
  } catch (error) {
    console.error(error);
    setFiles([]);
  }
}

export async function deleteFile(
  fileId: string,
  getAccessToken: TokenGetter,
  setFiles: FilesSetter,
  setError: (message: string) => void,
) {
  try {
    const token = (await getAccessToken()) ?? localStorage.getItem("token");
    if (!token) throw new Error("Unauthorized");
    const response = await fetch(`${backendUrl}/attachments/delete/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    await response.json();
    if (!response.ok) throw new Error("Failed to delete file");
    setFiles((current) => (current ?? []).filter((item) => item.id !== fileId));
  } catch (error) {
    console.error(error);
    setError("Failed to delete file");
  }
}

export function handleFileInputChange(
  event: ChangeEvent<HTMLInputElement>,
  playbookId: string,
  getAccessToken: TokenGetter,
  setError: (message: string | null) => void,
  setUploadingId: (id: string | null) => void,
  setFiles: FilesSetter,
) {
  const input = event.currentTarget;
  const selected = input.files?.[0];
  if (!selected) return;
  void selected.arrayBuffer().then((bytes) => {
    input.value = "";
    void onFileChosen(
      playbookId,
      new File([bytes], selected.name, {
        type: selected.type || "application/octet-stream",
      }),
      getAccessToken,
      setError,
      setUploadingId,
      setFiles,
    );
  });
}

export async function onFileChosen(
  playbookId: string,
  file: File | undefined,
  getAccessToken: TokenGetter,
  setError: (message: string | null) => void,
  setUploadingId: (id: string | null) => void,
  setFiles: FilesSetter,
) {
  if (!file) return;
  setError(null);
  setUploadingId(playbookId);
  try {
    const token = (await getAccessToken()) ?? localStorage.getItem("token");
    if (!token) throw new Error("Unauthorized");
    await handleFileUpload(file, playbookId, token);
    setFiles((current) => [
      ...(current ?? []),
      {
        id: crypto.randomUUID(),
        file_name: file.name,
        file_url: file.name,
        playbook_id: playbookId,
      },
    ]);
  } catch (uploadError) {
    setError(
      uploadError instanceof Error ? uploadError.message : "File upload failed",
    );
  } finally {
    setUploadingId(null);
  }
}
