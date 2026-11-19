"use client";

import { Popover } from "@base-ui/react/popover";
import { LoginLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { Plus, User } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Search } from "@/components/admin/Search";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button, buttonVariants } from "@/components/ui/button";

export function TopToolbar({
  query,
  onQueryChange,
  onCreatePlaybook,
  onOpenPreview,
  greeting,
  canCreate,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onCreatePlaybook: () => void;
  onOpenPreview: () => void;
  greeting: string | null;
  canCreate: boolean;
}) {
  const t = useTranslations("Header");

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Image
          src="/shirsales-icon.png"
          alt=""
          width={32}
          height={32}
          className="size-8 rounded-lg"
        />
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-[15px] font-semibold tracking-tight text-zinc-950">
            shirSales
          </span>
          <h1 className="truncate text-sm font-medium text-zinc-500">
            {t("product")}
          </h1>
        </div>
      </div>

      <div className="ms-auto flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
        <Search value={query} onChange={onQueryChange} />
        <Button
          type="button"
          variant="outline"
          className="xl:hidden"
          onClick={onOpenPreview}
        >
          {t("preview")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCreatePlaybook}
          disabled={!canCreate}
          title={canCreate ? undefined : t("adminOnly")}
        >
          <Plus className="size-3.5" />
          {t("playbook")}
        </Button>
        <LanguageSwitcher />
        {greeting ? (
          <Popover.Root>
            <Popover.Trigger className={buttonVariants({ variant: "outline" })}>
              <User />
              {greeting}
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner side="bottom" align="end" sideOffset={6} className="z-[90]">
                <Popover.Popup className="min-w-36 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg outline-none">
                  <LogoutLink className="flex w-full cursor-pointer items-center rounded-lg px-2.5 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100">
                    {t("logout")}
                  </LogoutLink>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        ) : (
          <LoginLink className={buttonVariants({ variant: "outline" })}>
            <User />
            {t("login")}
          </LoginLink>
        )}
      </div>
    </header>
  );
}
