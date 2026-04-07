import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, normalizeLocale, type AppLocale } from "./config";

function resolveLocaleFromAcceptLanguage(
  acceptLanguageHeader: string | null
): AppLocale | undefined {
  if (!acceptLanguageHeader) {
    return undefined;
  }

  for (const rawPart of acceptLanguageHeader.split(",")) {
    const candidate = rawPart.split(";")[0]?.trim();
    const locale = normalizeLocale(candidate);

    if (locale) {
      return locale;
    }
  }

  return undefined;
}

export async function getRequestLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const localeFromCookie = normalizeLocale(
    cookieStore.get(LOCALE_COOKIE_NAME)?.value
  );

  if (localeFromCookie) {
    return localeFromCookie;
  }

  const requestHeaders = await headers();
  return (
    resolveLocaleFromAcceptLanguage(requestHeaders.get("accept-language")) ??
    DEFAULT_LOCALE
  );
}
