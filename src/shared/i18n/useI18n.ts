import { useEffect, useState } from "react";
import {
  getStoredLanguage,
  LANGUAGE_CHANGE_EVENT,
  storeLanguage,
  type AppLanguage,
} from "./language";
import { translate, type TranslationKey } from "./translations";

export function useI18n() {
  const [language, setLanguageState] = useState<AppLanguage>(getStoredLanguage);

  useEffect(() => {
    const updateLanguage = () => setLanguageState(getStoredLanguage());

    window.addEventListener("storage", updateLanguage);
    window.addEventListener(LANGUAGE_CHANGE_EVENT, updateLanguage);

    return () => {
      window.removeEventListener("storage", updateLanguage);
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, updateLanguage);
    };
  }, []);

  const setLanguage = (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    storeLanguage(nextLanguage);
  };

  return {
    language,
    setLanguage,
    t: (key: TranslationKey) => translate(key, language),
  };
}
