import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fr } from "./locales/fr";
import { en } from "./locales/en";

const LOCALES = { fr, en };
const STORAGE_KEY = "artisan_lang";

const LanguageContext = createContext({ lang: "fr", setLang: () => {}, t: () => "" });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "en" ? "en" : "fr";
  });

  const setLang = useCallback((newLang) => {
    const l = newLang === "en" ? "en" : "fr";
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }, []);

  // Resolve a dotted key path like "auth.login" from the locale object
  const t = useCallback((key) => {
    const keys = key.split(".");
    let val = LOCALES[lang];
    for (const k of keys) {
      if (val == null) break;
      val = val[k];
    }
    if (val != null && typeof val !== "object") return val;
    // Fallback to French
    let fallback = LOCALES.fr;
    for (const k of keys) {
      if (fallback == null) break;
      fallback = fallback[k];
    }
    return (fallback != null && typeof fallback !== "object") ? fallback : key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

// Convenience: get the full locale object for array-type translations (tour steps, splash phrases)
export function useLocale() {
  const { lang } = useContext(LanguageContext);
  return LOCALES[lang];
}
