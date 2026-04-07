import { enDictionary } from "./dictionaries/en";
import type { Dictionary } from "./types";

function getValueByPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, source);
}

export function getTranslation(
  dictionary: Dictionary,
  key: string,
  fallbackDictionary: Dictionary = enDictionary
): string {
  const translated = getValueByPath(dictionary, key);

  if (typeof translated === "string") {
    return translated;
  }

  const fallback = getValueByPath(fallbackDictionary, key);

  if (typeof fallback === "string") {
    return fallback;
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(`[i18n] Missing translation for key: ${key}`);
  }

  return key;
}
