"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function PublishModal({
  open,
  onClose,
  onPublish,
}: {
  open: boolean;
  onClose: () => void;
  onPublish: () => void;
}) {
  const t = useTranslations("Dialogs");
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[80] bg-zinc-950/25 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-[80] w-[min(100%-2rem,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl outline-none data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
          <Dialog.Title className="text-base font-semibold text-zinc-950">
            {t("publishTitle")}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-zinc-600">
            {t("publishDescription")}
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close
              type="button"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-200 bg-white px-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              {t("cancel")}
            </Dialog.Close>
            <Button
              type="button"
              onClick={() => {
                onPublish();
                onClose();
              }}
            >
              {t("publish")}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
