import { useContext } from 'react';
import { LanguageContext } from './LanguageContext';
import { translations, Language } from './translations';

export function useTranslation() {
  const language = useContext(LanguageContext) as Language;

  const t = (key: string, variables?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      value = value[k];
      if (!value) {
        return key; // Return key if translation not found
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace variables like {username} with actual values
    if (variables) {
      let result = value;
      for (const [varKey, varValue] of Object.entries(variables)) {
        result = result.replace(new RegExp(`{${varKey}}`, 'g'), varValue);
      }
      return result;
    }

    return value;
  };

  return { t, language };
}
