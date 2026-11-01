"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { IconPicker } from "@/components/admin/IconPicker";
import { ToggleRow } from "@/components/admin/ToggleRow";
import { Button } from "@/components/ui/button";
import { createId } from "@/lib/workspace/mock-data";
import { emptyDraft, fromPlaybook } from "@/lib/workspace/playbook-draft";
import { useWorkspaceUi } from "@/lib/workspace/ui";
import type {
  Attachment,
  Category,
  Playbook,
  PlaybookDraft,
} from "@/lib/workspace/types";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

const fieldClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15";

const invalidFieldClass =
  "border-red-400 focus:border-red-500 focus:ring-red-500/15";

type FieldErrors = {
  name?: string;
  categoryId?: string;
  description?: string;
  prompt?: string;
  icon?: string;
};

export function PlaybookEditorDrawer({
  open,
  mode,
  playbook,
  categoryId,
  categories,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  mode: "create" | "edit";
  playbook: Playbook | null;
  categoryId: string;
  categories: Category[];
  onClose: () => void;
  onSave: (draft: PlaybookDraft) => void;
  onDelete: () => void;
}) {
  const formId = useId();
  const t = useTranslations("PlaybookForm");
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<PlaybookDraft>(() =>
    emptyDraft(categoryId),
  );
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { getAccessToken } = useWorkspaceUi();
  useEffect(() => {
    if (!open) return;
    setError("");
    setFieldErrors({});
    if (mode === "edit" && playbook)
      setDraft(fromPlaybook(playbook, categoryId));
    else setDraft(emptyDraft(categoryId));
  }, [categoryId, mode, open, playbook]);

  function update<K extends keyof PlaybookDraft>(
    key: K,
    value: PlaybookDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    if (key in fieldErrors) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[key as keyof FieldErrors];
        return next;
      });
    }
    if (error) setError("");
  }

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const next: Attachment[] = Array.from(list).map((file) => ({
      id: createId("file"),
      name: file.name,
    }));
    setDraft((current) => ({
      ...current,
      attachments: [...current.attachments, ...next],
    }));
    if (fileRef.current) fileRef.current.value = "";
  }

  function save() {
    const nextErrors: FieldErrors = {};
    if (!draft.name.trim()) nextErrors.name = t("required");
    if (!draft.categoryId) nextErrors.categoryId = t("chooseCategory");
    if (!draft.description.trim()) nextErrors.description = t("required");
    if (!draft.prompt.trim()) nextErrors.prompt = t("required");
    if (!draft.icon) nextErrors.icon = t("chooseIcon");

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError(t("fillAll"));
      return;
    }

    async function createPlaybook() {
      const token = await getAccessToken();
      if (!token) {
        setError("Unauthorized");
        return;
      }
      localStorage.setItem("token", token);
      setFieldErrors({});
      setError("");
      onSave(draft);
      const res = await fetch(`${backendUrl}/category/toggle-subcategory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        throw new Error("Failed to create playbook");
      }
      const data = await res.json();
    }
    createPlaybook();
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-zinc-950/20 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          initialFocus={nameRef}
          className="fixed inset-y-0 end-0 z-50 flex w-[min(100%,460px)] flex-col bg-white shadow-2xl outline-none transition-transform duration-200 data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full"
        >
          <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
            <div>
              <Dialog.Title className="text-base font-semibold text-zinc-950">
                {mode === "edit" ? t("editTitle") : t("newTitle")}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-zinc-500">
                {t("hint")}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label={t("close")}
              className="flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <form
            id={formId}
            className="admin-scroll flex-1 space-y-5 overflow-y-auto px-5 py-5"
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            ) : null}

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-800">
                {t("buttonName")}
              </span>
              <input
                ref={nameRef}
                value={draft.name}
                onChange={(event) => update("name", event.target.value)}
                className={`${fieldClass} h-10 ${fieldErrors.name ? invalidFieldClass : ""}`}
                placeholder={t("buttonNamePlaceholder")}
              />
              {fieldErrors.name ? (
                <span className="text-xs text-red-600">{fieldErrors.name}</span>
              ) : null}
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-800">
                {t("category")}
              </span>
              <select
                value={draft.categoryId}
                onChange={(event) => update("categoryId", event.target.value)}
                className={`${fieldClass} h-10 ${fieldErrors.categoryId ? invalidFieldClass : ""}`}
              >
                {categories.length === 0 ? (
                  <option value="">{t("noCategories")}</option>
                ) : null}
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryId ? (
                <span className="text-xs text-red-600">
                  {fieldErrors.categoryId}
                </span>
              ) : null}
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-800">
                {t("internalDescription")}
              </span>
              <input
                value={draft.description}
                onChange={(event) => update("description", event.target.value)}
                className={`${fieldClass} h-10 ${fieldErrors.description ? invalidFieldClass : ""}`}
                placeholder={t("internalPlaceholder")}
              />
              {fieldErrors.description ? (
                <span className="text-xs text-red-600">
                  {fieldErrors.description}
                </span>
              ) : null}
            </label>

            <div className="space-y-1.5">
              <span className="text-sm font-medium text-zinc-800">
                {t("icon")}
              </span>
              <IconPicker
                value={draft.icon}
                onChange={(icon) => update("icon", icon)}
              />
              {fieldErrors.icon ? (
                <span className="text-xs text-red-600">{fieldErrors.icon}</span>
              ) : null}
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-800">
                {t("prompt")}
              </span>
              <textarea
                value={draft.prompt}
                onChange={(event) => update("prompt", event.target.value)}
                rows={10}
                className={`${fieldClass} min-h-52 resize-y py-3 leading-6 ${fieldErrors.prompt ? invalidFieldClass : ""}`}
                placeholder={t("promptPlaceholder")}
              />
              {fieldErrors.prompt ? (
                <span className="text-xs text-red-600">
                  {fieldErrors.prompt}
                </span>
              ) : null}
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-800">
                  {t("attachments")}
                </span>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  {t("addFile")}
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="sr-only"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                onChange={(event) => addFiles(event.target.files)}
              />
              {draft.attachments.length === 0 ? (
                <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-4 text-center text-sm text-zinc-500">
                  {t("noAttachments")}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {draft.attachments.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-zinc-800">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          update(
                            "attachments",
                            draft.attachments.filter(
                              (item) => item.id !== file.id,
                            ),
                          )
                        }
                        className="text-xs font-medium text-zinc-500 hover:text-red-600"
                      >
                        {t("remove")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <ToggleRow
                title={t("activeTitle")}
                description={t("activeDescription")}
                checked={draft.active}
                onChange={(checked) => update("active", checked)}
              />
              <ToggleRow
                title={t("autoSendTitle")}
                description={t("autoSendDescription")}
                checked={draft.autoSend}
                onChange={(checked) => update("autoSend", checked)}
              />
            </div>

            {mode === "edit" ? (
              <div className="rounded-xl border border-red-100 bg-red-50/40 p-4">
                <p className="text-sm font-medium text-red-700">
                  {t("deleteTitle")}
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  {t("deleteDescription")}
                </p>
                <button
                  type="button"
                  onClick={onDelete}
                  className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
                >
                  {t("delete")}
                </button>
              </div>
            ) : null}
          </form>

          <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="button" onClick={save}>
              {mode === "edit" ? t("save") : t("create")}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
