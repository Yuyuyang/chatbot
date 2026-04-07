"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { enDictionary } from "@/lib/i18n/dictionaries/en";
import { getTranslation } from "@/lib/i18n/translate";
import type { AppLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";

type I18nContextValue = {
  locale: AppLocale;
  dictionary: Dictionary;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  dictionary,
  locale,
}: {
  children: React.ReactNode;
  dictionary: Dictionary;
  locale: AppLocale;
}) {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dictionary,
      t: (key: string) => getTranslation(dictionary, key, enDictionary),
    }),
    [dictionary, locale]
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }

  return context;
}
