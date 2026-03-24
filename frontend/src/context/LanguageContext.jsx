import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

import translations from '../i18n/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('el_fatoora_lang');
      return (saved === 'fr' || saved === 'en' || saved === 'ar') ? saved : 'fr';
    } catch (e) {
      return 'fr';
    }
  });

  const setLang = useCallback((newLang) => {
    if (newLang === 'fr' || newLang === 'en' || newLang === 'ar') {
      setLangState(newLang);
      try {
        localStorage.setItem('el_fatoora_lang', newLang);
      } catch (e) {
        console.warn('LocalStorage not available');
      }
    }
  }, []);

  const t = useCallback((key) => {
    if (!key) return '';
    
    const getVal = (obj, path) => {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    const currentList = translations[lang] || translations['fr'] || {};
    const val = getVal(currentList, key);
    
    if (val !== undefined) return val;
    
    const fallbackVal = getVal(translations['fr'], key);
    return fallbackVal !== undefined ? fallbackVal : key;
  }, [lang]);

  const value = {
    lang,
    setLang,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageProvider;

