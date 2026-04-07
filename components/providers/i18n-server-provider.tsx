import { I18nProvider } from "@/components/providers/i18n-provider";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";

export async function I18nServerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();
  const dictionary = await getDictionary(locale);

  return (
    <I18nProvider dictionary={dictionary} locale={locale}>
      {children}
    </I18nProvider>
  );
}
