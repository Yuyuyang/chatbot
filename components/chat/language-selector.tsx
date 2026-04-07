"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AppLocale } from "@/lib/i18n/config";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { CheckCircleFillIcon, ChevronDownIcon, LoaderIcon } from "./icons";

const localeItems: AppLocale[] = ["en", "zh-CN"];

export function LanguageSelector() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<AppLocale | null>(null);

  const localeLabels: Record<AppLocale, string> = {
    en: t("common.language.english"),
    "zh-CN": t("common.language.chinese"),
  };

  const currentLabel = locale === "en" ? "EN" : localeLabels[locale];

  const handleSelect = async (nextLocale: AppLocale) => {
    if (nextLocale === locale || pendingLocale) {
      setOpen(false);
      return;
    }

    setPendingLocale(nextLocale);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/preferences/locale`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ locale: nextLocale }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save locale preference");
      }

      setOpen(false);
      router.refresh();
    } catch {
      toast.error(t("common.toast.switchLanguageFailed"));
    } finally {
      setPendingLocale(null);
    }
  };

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <Button
          className="min-w-[80px] gap-1.5 rounded-lg border-border/50 text-muted-foreground shadow-none transition-colors hover:text-foreground"
          disabled={pendingLocale !== null}
          size="sm"
          variant="outline"
        >
          {pendingLocale ? (
            <span className="animate-spin">
              <LoaderIcon />
            </span>
          ) : null}
          <span className="truncate">{currentLabel}</span>
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[160px]">
        {localeItems.map((item) => (
          <DropdownMenuItem
            className={cn(
              "flex cursor-pointer items-center justify-between gap-3",
              pendingLocale === item && "pointer-events-none opacity-60"
            )}
            key={item}
            onSelect={() => {
              void handleSelect(item);
            }}
          >
            <span>{localeLabels[item]}</span>
            {locale === item ? <CheckCircleFillIcon /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
