import { createContext } from 'react';
import { Language } from './translations';

export const LanguageContext = createContext<Language>('fr');
