import React, { useState, useEffect } from 'react';
import { LanguageContext } from './LanguageContext';
import { Language } from './translations';

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('fr');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language | null;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'fr')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  return (
    <LanguageContext.Provider value={language}>
      {children}
      <LanguageSwitcher currentLanguage={language} onChangeLanguage={changeLanguage} />
    </LanguageContext.Provider>
  );
}

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onChangeLanguage: (language: Language) => void;
}

function LanguageSwitcher({ currentLanguage, onChangeLanguage }: LanguageSwitcherProps) {
  return (
    <div className="fixed bottom-4 right-4 flex gap-2">
      <button
        onClick={() => onChangeLanguage('fr')}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          currentLanguage === 'fr'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => onChangeLanguage('en')}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          currentLanguage === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        EN
      </button>
    </div>
  );
}
