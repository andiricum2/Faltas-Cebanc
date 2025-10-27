"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ThemeConfig, ThemeColors, ThemePreset, THEME_PRESETS } from "@/lib/types/theme";
import { loadThemeConfig, saveThemeConfig } from "./themeRepository";
import { generatePresetId } from "@/lib/theme/utils";

interface ThemeContextValue {
  config: ThemeConfig;
  isLoading: boolean;
  activeMode: "light" | "dark";
  updateThemeMode: (mode: ThemeConfig["mode"]) => Promise<void>;
  updatePreset: (presetId: string) => Promise<void>;
  updateCustomColors: (mode: "light" | "dark", colors: Partial<ThemeColors>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  getActiveColors: (mode: "light" | "dark") => ThemeColors;
  getAllPresets: () => ThemePreset[];
  createCustomPreset: (preset: Omit<ThemePreset, "id" | "isCustom">) => Promise<void>;
  updateCustomPreset: (id: string, preset: Partial<Omit<ThemePreset, "id" | "isCustom">>) => Promise<void>;
  deleteCustomPreset: (id: string) => Promise<void>;
  saveCurrentAsPreset: (name: string, description: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Load theme synchronously from localStorage on initialization
function loadInitialTheme(): ThemeConfig {
  if (typeof window === 'undefined') {
    return { mode: "system", preset: "default" };
  }
  
  try {
    const raw = localStorage.getItem("app.theme");
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore errors
  }
  
  return { mode: "system", preset: "default" };
}

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(loadInitialTheme);
  const [isLoading, setIsLoading] = useState(false); // Cambiado a false porque ya cargamos sincrónicamente
  const [activeMode, setActiveMode] = useState<"light" | "dark">(() => {
    // Calculate initial active mode
    if (typeof window === 'undefined') return 'light';
    
    if (config.mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return config.mode === 'dark' ? 'dark' : 'light';
  });

  // Load theme config from server on mount (to sync if needed) but don't block UI
  useEffect(() => {
    loadThemeConfig()
      .then((loadedConfig) => {
        // Solo actualizar si hay cambios
        if (JSON.stringify(loadedConfig) !== JSON.stringify(config)) {
          setConfig(loadedConfig);
        }
      })
      .catch((error) => {
        console.error("Failed to load theme config:", error);
      });
  }, []);

  // Update active mode when config.mode changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateActiveMode = () => {
      if (config.mode === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setActiveMode(isDark ? 'dark' : 'light');
      } else {
        setActiveMode(config.mode === 'dark' ? 'dark' : 'light');
      }
    };

    updateActiveMode();

    // Listen for system theme changes if mode is "system"
    if (config.mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateActiveMode();
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [config.mode]);

  const updateThemeMode = useCallback(async (mode: ThemeConfig["mode"]) => {
    const newConfig = { ...config, mode };
    setConfig(newConfig);
    await saveThemeConfig(newConfig);
  }, [config]);

  const updatePreset = useCallback(async (presetId: string) => {
    const newConfig: ThemeConfig = {
      ...config,
      preset: presetId,
      // Clear custom colors when switching presets
      customLight: undefined,
      customDark: undefined,
    };
    setConfig(newConfig);
    await saveThemeConfig(newConfig);
  }, [config]);

  const updateCustomColors = useCallback(async (mode: "light" | "dark", colors: Partial<ThemeColors>) => {
    const key = mode === "light" ? "customLight" : "customDark";
    const newConfig = {
      ...config,
      [key]: {
        ...config[key],
        ...colors,
      },
    };
    setConfig(newConfig);
    await saveThemeConfig(newConfig);
  }, [config]);

  const resetToDefaults = useCallback(async () => {
    const newConfig: ThemeConfig = {
      mode: "system",
      preset: "default",
    };
    setConfig(newConfig);
    await saveThemeConfig(newConfig);
  }, []);

  const getAllPresets = useCallback((): ThemePreset[] => {
    return [...THEME_PRESETS, ...(config.customPresets || [])];
  }, [config.customPresets]);

  const getActiveColors = useCallback((mode: "light" | "dark"): ThemeColors => {
    const allPresets = [...THEME_PRESETS, ...(config.customPresets || [])];
    const preset = allPresets.find(p => p.id === (config.preset || "default")) || THEME_PRESETS[0];
    const baseColors = mode === "light" ? preset.light : preset.dark;
    const customColors = mode === "light" ? config.customLight : config.customDark;

    return {
      ...baseColors,
      ...customColors,
    };
  }, [config.preset, config.customLight, config.customDark, config.customPresets]);

  const createCustomPreset = useCallback(async (preset: Omit<ThemePreset, "id" | "isCustom">) => {
    const id = generatePresetId();
    const newPreset: ThemePreset = {
      ...preset,
      id,
      isCustom: true,
    };
    
    const customPresets = [...(config.customPresets || []), newPreset];
    const newConfig = {
      ...config,
      customPresets,
    };
    
    setConfig(newConfig);
    await saveThemeConfig(newConfig);
  }, [config]);

  const updateCustomPreset = useCallback(async (id: string, updates: Partial<Omit<ThemePreset, "id" | "isCustom">>) => {
    const customPresets = config.customPresets || [];
    const updatedPresets = customPresets.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    
    const newConfig = {
      ...config,
      customPresets: updatedPresets,
    };
    
    setConfig(newConfig);
    await saveThemeConfig(newConfig);
  }, [config]);

  const deleteCustomPreset = useCallback(async (id: string) => {
    const customPresets = config.customPresets || [];
    const updatedPresets = customPresets.filter(p => p.id !== id);
    
    const newConfig = {
      ...config,
      customPresets: updatedPresets,
      // If deleting the active preset, switch to default
      preset: config.preset === id ? "default" : config.preset,
    };
    
    setConfig(newConfig);
    await saveThemeConfig(newConfig);
  }, [config]);

  const saveCurrentAsPreset = useCallback(async (name: string, description: string) => {
    const lightColors = getActiveColors("light");
    const darkColors = getActiveColors("dark");
    
    await createCustomPreset({
      name,
      description,
      light: lightColors,
      dark: darkColors,
    });
  }, [getActiveColors, createCustomPreset]);

  const value: ThemeContextValue = {
    config,
    isLoading,
    activeMode,
    updateThemeMode,
    updatePreset,
    updateCustomColors,
    resetToDefaults,
    getActiveColors,
    getAllPresets,
    createCustomPreset,
    updateCustomPreset,
    deleteCustomPreset,
    saveCurrentAsPreset,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeContextProvider");
  }
  return context;
}

