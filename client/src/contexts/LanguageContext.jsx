import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS } from '../utils/translations';
import { useSettings } from '../hooks/useSettings';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const { settings, updateSettings } = useSettings();
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('nexuspanel_language') || 'pl';
  });

  useEffect(() => {
    if (settings?.language) {
      setLanguage(settings.language);
      localStorage.setItem('nexuspanel_language', settings.language);
    }
  }, [settings]);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('nexuspanel_language', lang);
  };

  const t = (key, defaultText = '') => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.pl;
    if (dict && dict[key]) return dict[key];
    const fallbackDict = TRANSLATIONS.en;
    if (fallbackDict && fallbackDict[key]) return fallbackDict[key];
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'pl',
      setLanguage: () => {},
      t: (k, def) => def || k
    };
  }
  return context;
}
