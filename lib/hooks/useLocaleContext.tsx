"use client";

import { createContext, useContext, ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { useLocale } from './useLocale';

type LocaleContextType = {
  locale: 'es' | 'eu';
  setLocale: (locale: 'es' | 'eu') => void;
  isLoading: boolean;
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { locale, setLocale, messages, isLoading } = useLocale();

  if (isLoading) {
    return
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, isLoading }}>
      <NextIntlClientProvider messages={messages} locale={locale}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useLocaleContext() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocaleContext must be used within a LocaleProvider');
  }
  return context;
}
