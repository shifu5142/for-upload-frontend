"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Switch } from "@base-ui/react/switch";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { IconPicker } from "@/components/admin/IconPicker";
import { Button } from "@/components/ui/button";
import type { IconName } from "@/lib/workspace/types";

export function CategoryModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { name: string; icon: IconName; active: boolean }) => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<IconName>("message");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("Dialogs");

  function resetAndClose() {
    setName("");
    setIcon("message");
    setActive(true);
    setError("");
    onClose();
  }

  function submit() {
    if (!name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    onCreate({ name: name.trim(), icon, active });
    resetAndClose();
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) resetAndClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[80] bg-zinc-950/25 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          initialFocus={nameRef}
          className="fixed top-1/2 left-1/2 z-[80] w-[min(100%-2rem,440px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl outline-none data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
        >
          <Dialog.Title className="text-base font-semibold text-zinc-950">
            {t("newCategory")}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-zinc-500">
            {t("newCategoryHint")}
          </Dialog.Description>
          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-800">{t("name")}</span>
              <input
                ref={nameRef}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (error) setError("");
                }}
                className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15"
                placeholder={t("namePlaceholder")}
              />
              {error ? <span className="text-xs text-red-600">{error}</span> : null}
            </label>
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-zinc-800">{t("icon")}</span>
              <IconPicker value={icon} onChange={setIcon} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2.5">
              <span>
                <span className="block text-sm font-medium text-zinc-800">{t("activeInExtension")}</span>
                <span className="block text-xs text-zinc-500">{t("hiddenCategoryHint")}</span>
              </span>
              <Switch.Root
                checked={active}
                onCheckedChange={setActive}
                aria-label={t("activeInExtension")}
                dir="ltr"
                className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-zinc-200 transition-colors data-[checked]:bg-blue-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/30"
              >
                <Switch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[checked]:translate-x-4" />
              </Switch.Root>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={resetAndClose}>
                {t("cancel")}
              </Button>
              <Button type="submit">{t("createCategory")}</Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
