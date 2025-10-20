"use client";

import { useState, useEffect, useCallback } from 'react';

export type Locale = 'es' | 'eu';

const STORAGE_KEY = 'faltas.locale';
const DEFAULT_LOCALE: Locale = 'es';

// Hook personalizado para manejar idiomas
export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [messages, setMessages] = useState<any>(null);

  // Cargar idioma desde localStorage al inicializar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === 'es' || stored === 'eu')) {
        setLocaleState(stored as Locale);
      }
    } catch {
      // Fallback a español si hay error
      setLocaleState(DEFAULT_LOCALE);
    }
  }, []);

  // Cargar mensajes cuando cambie el idioma
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const messagesModule = await import(`../../messages/${locale}.json`);
        setMessages(messagesModule.default);
      } catch (error) {
        console.error('Error loading messages:', error);
        // Fallback a español si hay error
        const fallbackMessages = await import('../../messages/es.json');
        setMessages(fallbackMessages.default);
      }
    };

    loadMessages();
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // Ignorar errores de localStorage
    }
  }, []);

  return {
    locale,
    setLocale,
    messages,
    isLoading: !messages
  };
}
