export const appLocales = ["en", "zh-CN"] as const;

export type AppLocale = (typeof appLocales)[number];

export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_COOKIE_NAME = "chatbox-locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function normalizeLocale(value?: string | null): AppLocale | undefined {
  if (!value) {
    return undefined;
  }

  if (value === "en" || value.toLowerCase().startsWith("en")) {
    return "en";
  }

  if (value === "zh-CN" || value.toLowerCase().startsWith("zh")) {
    return "zh-CN";
  }

  return undefined;
}

export function isSupportedLocale(value: string): value is AppLocale {
  return normalizeLocale(value) !== undefined;
}
