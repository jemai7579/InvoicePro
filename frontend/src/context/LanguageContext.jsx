import React, { createContext, useContext, useState, useCallback } from 'react';
import translations from '../i18n/translations';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('el_fatoora_lang') || 'fr';
  });

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    localStorage.setItem('el_fatoora_lang', newLang);
    // RTL support for Arabic
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  }, []);

  // Apply on mount
  React.useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key) => {
    return translations[lang]?.[key] ?? translations['fr']?.[key] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
