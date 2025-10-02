/**
 * Utility functions for handling external links in Tauri applications
 */

// Type definitions
interface TauriWindow extends Window {
  __TAURI__?: any;
  __TAURI_INTERNALS__?: any;
}

/**
 * Detects if the application is running in a Tauri environment
 */
function isTauriEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  
  const tauriWindow = window as TauriWindow;
  return !!(
    tauriWindow.__TAURI__ || 
    tauriWindow.__TAURI_INTERNALS__ ||
    navigator.userAgent.includes('Tauri')
  );
}

/**
 * Opens an external URL in the default browser
 * Automatically detects environment and uses appropriate method
 * 
 * @param url The URL to open
 * @returns Promise that resolves when the URL is opened
 */
export async function openExternalUrl(url: string): Promise<void> {
  // Validate URL format
  if (!isValidUrl(url)) {
    throw new Error(`Invalid URL: ${url}`);
  }

  try {
    if (isTauriEnvironment()) {
      await openInTauri(url);
    } else {
      openInBrowser(url);
    }
  } catch (error) {
    console.error('Failed to open external URL:', error);
    // Final fallback
    openInBrowser(url);
  }
}

/**
 * Opens URL using Tauri's shell API
 */
async function openInTauri(url: string): Promise<void> {
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('open_external_url', { url });
}

/**
 * Opens URL using browser's window.open
 */
function openInBrowser(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Validates if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a URL is external (not localhost or file://)
 * @param url The URL to check
 * @returns true if the URL is external
 */
export function isExternalUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  
  try {
    const parsedUrl = new URL(url);
    const isHttpHttps = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    const isLocalhost = parsedUrl.hostname === 'localhost' || 
                       parsedUrl.hostname === '127.0.0.1' ||
                       parsedUrl.hostname.startsWith('192.168.') ||
                       parsedUrl.hostname.startsWith('10.') ||
                       parsedUrl.hostname.startsWith('172.');
    
    return isHttpHttps && !isLocalhost;
  } catch {
    return false;
  }
}

/**
 * Handles a click on a link, opening external URLs in browser
 * @param event The click event
 * @param url The URL to open
 */
export function handleLinkClick(event: React.MouseEvent, url: string): void {
  if (isExternalUrl(url)) {
    event.preventDefault();
    openExternalUrl(url);
  }
}

/**
 * Creates a click handler for external links
 * @param url The URL to open
 * @returns Click handler function
 */
export function createExternalLinkHandler(url: string) {
  return (event: React.MouseEvent) => {
    if (isExternalUrl(url)) {
      event.preventDefault();
      openExternalUrl(url);
    }
  };
}
