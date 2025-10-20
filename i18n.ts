import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // For now, we'll always use Spanish as default
  // The actual locale will be handled by our custom hook
  return {
    locale: 'es',
    messages: (await import('./messages/es.json')).default
  };
});
