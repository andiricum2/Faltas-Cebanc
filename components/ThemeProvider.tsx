"use client";

import { useEffect, useLayoutEffect } from "react";
import { useTheme } from "@/lib/services/themeContext";

// useLayoutEffect en el cliente, useEffect en el servidor
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Enables smooth theme transitions using View Transition API or CSS classes
 */
function enableThemeTransition(callback: () => void) {
  if (typeof window === 'undefined') {
    callback();
    return;
  }
  
  // Check if View Transition API is available (Chrome 111+, Edge 111+)
  const doc = document as any;
  if (doc.startViewTransition) {
    // Use modern View Transition API for smooth transitions
    doc.startViewTransition(callback);
    return;
  }
  
  // Fallback: Use CSS class approach
  const root = document.documentElement;
  
  // Add transitioning class
  root.classList.add('theme-transitioning');
  
  // Apply changes
  callback();
  
  // Remove class after transition completes
  setTimeout(() => {
    root.classList.remove('theme-transitioning');
  }, 150);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { config: themeConfig, getActiveColors } = useTheme();

  // Apply theme as early as possible using useLayoutEffect (runs before browser paint)
  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    
    // Use themeConfig.mode (new theme system) primarily
    const themeMode = themeConfig.mode;
    
    // Determine active mode
    let activeMode: 'light' | 'dark' = 'light';
    
    if (themeMode === 'system') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      activeMode = prefersDark ? 'dark' : 'light';
    } else if (themeMode === 'light' || themeMode === 'dark') {
      // Use explicit theme
      activeMode = themeMode;
    }
    
    // Check if this is a theme change (not initial load)
    const currentTheme = root.classList.contains('dark') ? 'dark' : 'light';
    const isThemeChange = currentTheme !== activeMode && root.classList.contains(currentTheme);
    
    const applyTheme = () => {
      // Remove existing theme classes
      root.classList.remove('light', 'dark');
      root.classList.add(activeMode);
      
      // Apply colors
      const colors = getActiveColors(activeMode);
      
      // Convert camelCase to kebab-case and apply CSS variables
      Object.entries(colors).forEach(([key, value]) => {
        const cssVarName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        root.style.setProperty(`--${cssVarName}`, value);
      });
    };
    
    if (isThemeChange) {
      // Use transition for theme changes
      enableThemeTransition(applyTheme);
    } else {
      // No transition for initial load
      applyTheme();
    }
  }, [themeConfig.mode, themeConfig.preset, themeConfig.customLight, themeConfig.customDark, getActiveColors]);

  // Listen for system theme changes
  useEffect(() => {
    if (themeConfig.mode === 'system') {
      const root = document.documentElement;
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        const newMode = e.matches ? 'dark' : 'light';
        
        // Use transition for system theme changes
        enableThemeTransition(() => {
          root.classList.remove('light', 'dark');
          root.classList.add(newMode);
          
          const colors = getActiveColors(newMode);
          Object.entries(colors).forEach(([key, value]) => {
            const cssVarName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            root.style.setProperty(`--${cssVarName}`, value);
          });
        });
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [themeConfig.mode, getActiveColors]);

  return <>{children}</>;
}
