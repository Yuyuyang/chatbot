import { DEFAULT_LOCALE, type AppLocale } from "./config";
import { enDictionary } from "./dictionaries/en";
import { zhCNDictionary } from "./dictionaries/zh-CN";
import type { Dictionary } from "./types";

export async function getDictionary(locale: AppLocale): Promise<Dictionary> {
  switch (locale) {
    case "zh-CN":
      return zhCNDictionary;
    case "en":
    default:
      return enDictionary;
  }
}

export async function getFallbackDictionary(): Promise<Dictionary> {
  return getDictionary(DEFAULT_LOCALE);
}
