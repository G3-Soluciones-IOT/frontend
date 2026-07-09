import en from "./en.json";
import es from "./es.json";
import pt from "./pt.json";
import type { AppLanguage } from "./language";

export type TranslationKey = keyof typeof en;

const dictionaries: Record<AppLanguage, Record<TranslationKey, string>> = {
  English: en,
  Spanish: es,
  Portuguese: pt,
};

export function translate(key: TranslationKey, language: AppLanguage) {
  return dictionaries[language][key] ?? dictionaries.English[key] ?? key;
}
