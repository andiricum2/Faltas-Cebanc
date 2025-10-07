"use client";

import React from "react";
import { getAppConfig, saveAppConfig } from "@/lib/services/apiClient";

export type AutoSyncMinutes = 0 | 5 | 15 | 30;

export type AppConfig = {
  autoSyncMinutes: AutoSyncMinutes;
  selectedGroup?: string | null; // null or "personalizado" means custom
};

type ConfigContextType = {
  config: AppConfig;
  setAutoSyncMinutes: (minutes: AutoSyncMinutes) => void;
  setSelectedGroup: (group: string | null) => void;
};

const DEFAULT_CONFIG: AppConfig = {
  autoSyncMinutes: 0,
  selectedGroup: null,
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
      selectedGroup: typeof parsed?.selectedGroup === "string" ? parsed.selectedGroup : (parsed?.selectedGroup === null ? null : null),
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
    const localCfg = readStoredConfig();
    setConfig(localCfg);
    // Try to hydrate from server (best-effort)
    (async () => {
      try {
        const data = await getAppConfig();
        const serverCfg: Partial<AppConfig> = data?.config || {};
          setConfig((prev) => {
            const next = { ...prev, ...serverCfg };
            writeStoredConfig(next);
            return next;
          });
      } catch {}
    })();
  }, []);

  const setAutoSyncMinutes = React.useCallback((minutes: AutoSyncMinutes) => {
    setConfig((prev) => {
      const next = { ...prev, autoSyncMinutes: minutes };
      writeStoredConfig(next);
      // fire and forget server save
      saveAppConfig({ config: next }).catch(() => {});
      return next;
    });
  }, []);

  const setSelectedGroup = React.useCallback((group: string | null) => {
    setConfig((prev) => {
      const next = { ...prev, selectedGroup: group };
      writeStoredConfig(next);
      // fire and forget server save
      saveAppConfig({ config: next }).catch(() => {});
      return next;
    });
  }, []);

  const value = React.useMemo(() => ({ config, setAutoSyncMinutes, setSelectedGroup }), [config, setAutoSyncMinutes, setSelectedGroup]);

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const ctx = React.useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used within ConfigProvider");
  return ctx;
}


