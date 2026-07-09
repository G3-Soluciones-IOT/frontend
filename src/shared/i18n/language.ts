export type AppLanguage = "English" | "Spanish" | "Portuguese";

export const LANGUAGE_STORAGE_KEY = "preferredNavigationLanguage";
export const LANGUAGE_CHANGE_EVENT = "navigation-language-change";

export const appLanguages: AppLanguage[] = ["English", "Spanish", "Portuguese"];

export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === "English" || value === "Spanish" || value === "Portuguese";
}

export function getStoredLanguage(): AppLanguage {
  if (typeof window === "undefined") return "English";

  const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isAppLanguage(storedLanguage) ? storedLanguage : "English";
}

export function storeLanguage(language: AppLanguage) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
}
