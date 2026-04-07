"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { SparklesIcon, VercelIcon } from "@/components/chat/icons";
import { LanguageSelector } from "@/components/chat/language-selector";
import { Preview } from "@/components/chat/preview";
import { useI18n } from "@/hooks/use-i18n";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="flex h-dvh w-screen bg-sidebar">
      <div className="flex w-full flex-col bg-background p-8 xl:w-[600px] xl:shrink-0 xl:rounded-r-2xl xl:border-r xl:border-border/40 md:p-16">
        <div className="flex items-center justify-between gap-3">
          <Link
            className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            href="/"
          >
            <ArrowLeftIcon className="size-3.5 shrink-0" />
            {t("auth.back")}
          </Link>
          <LanguageSelector />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-10">
          <div className="flex flex-col gap-2">
            <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
              <SparklesIcon size={14} />
            </div>
            {children}
          </div>
        </div>
      </div>

      <div className="hidden flex-1 flex-col overflow-hidden pl-12 xl:flex">
        <div className="flex items-center gap-1.5 pt-8 text-[13px] text-muted-foreground/50">
          {t("auth.poweredBy")}
          <VercelIcon size={14} />
          <span className="font-medium text-muted-foreground">AI Gateway</span>
        </div>
        <div className="flex-1 pt-4">
          <Preview />
        </div>
      </div>
    </div>
  );
}
