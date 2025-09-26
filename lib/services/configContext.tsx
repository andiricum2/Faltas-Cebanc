"use client";

import React from "react";

export type AutoSyncMinutes = 0 | 5 | 15 | 30;

export type AppConfig = {
  autoSyncMinutes: AutoSyncMinutes;
};

type ConfigContextType = {
  config: AppConfig;
  setAutoSyncMinutes: (minutes: AutoSyncMinutes) => void;
};

const DEFAULT_CONFIG: AppConfig = {
  autoSyncMinutes: 0,
};

const STORAGE_KEY = "faltas.appConfig";

function readStoredConfig(): AppConfig {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    const minutes = Number(parsed?.autoSyncMinutes);
    const valid: AutoSyncMinutes[] = [0, 5, 15, 30];
    return {
      autoSyncMinutes: (valid.includes(minutes as any) ? (minutes as AutoSyncMinutes) : 0),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function writeStoredConfig(cfg: AppConfig) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {}
}

const ConfigContext = React.createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<AppConfig>(DEFAULT_CONFIG);

  React.useEffect(() => {
    setConfig(readStoredConfig());
  }, []);

  const setAutoSyncMinutes = React.useCallback((minutes: AutoSyncMinutes) => {
    setConfig((prev) => {
      const next = { ...prev, autoSyncMinutes: minutes };
      writeStoredConfig(next);
      return next;
    });
  }, []);

  const value = React.useMemo(() => ({ config, setAutoSyncMinutes }), [config, setAutoSyncMinutes]);

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const ctx = React.useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used within ConfigProvider");
  return ctx;
}


