"use client";

import React from "react";
import { useConfig } from "@/lib/services/configContext";
import { getSnapshot as apiGetSnapshot, postSync as apiPostSync, logout as apiLogout } from "@/lib/services/apiClient";
import type { StudentSnapshot as Snapshot } from "@/lib/types/faltas";
import { saveRememberedCredentials } from "@/lib/services/credentials";

type SnapshotContextType = {
  snapshot: Snapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  syncNow: () => Promise<void>;
};

const SnapshotContext = React.createContext<SnapshotContextType | undefined>(undefined);

async function getSnapshot(): Promise<Snapshot | null> { return apiGetSnapshot(); }

async function postSync(): Promise<void> { await apiPostSync(); }

export function SnapshotProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = React.useState<Snapshot | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const didAutoSyncRef = React.useRef<boolean>(false);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  // Use Next.js navigation hook to avoid direct window access
  // Defer import to avoid SSR issues since this is a client component
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { usePathname } = require("next/navigation");
  const pathname: string | null = usePathname?.() ?? null;
  const isLoginPage = pathname === "/login";
  const { config } = useConfig();

  const refresh = React.useCallback(async () => {
    try {
      const s = await getSnapshot();
      setSnapshot(s);
    } catch (e: any) {
      setError(e?.message || "Error");
    }
  }, []);

  const syncNow = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await postSync();
      const s = await getSnapshot();
      setSnapshot(s);
    } catch (e: any) {
      if (e?.code === "UNAUTHENTICATED") {
        try { await apiLogout(); } catch {}
        try { await saveRememberedCredentials(null); } catch {}
        window.location.href = "/login";
        return;
      }
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Initial load (skip on login page)
    if (!isLoginPage) {
      refresh().catch(() => {});
    }
  }, [refresh, isLoginPage]);

  React.useEffect(() => {
    // Auto-sync once on first mount to keep data fresh across all pages (skip on login page)
    if (!isLoginPage && !didAutoSyncRef.current) {
      didAutoSyncRef.current = true;
      syncNow().catch(() => {});
    }
  }, [syncNow, isLoginPage]);

  React.useEffect(() => {
    // Manage periodic auto-sync according to config
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (isLoginPage) return;
    const minutes = config.autoSyncMinutes;
    if (!minutes || minutes <= 0) return; // disabled
    const ms = minutes * 60 * 1000;
    intervalRef.current = setInterval(() => {
      syncNow().catch(() => {});
    }, ms);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [config.autoSyncMinutes, isLoginPage, syncNow]);

  const value = React.useMemo(
    () => ({ snapshot, loading, error, refresh, syncNow }),
    [snapshot, loading, error, refresh, syncNow]
  );

  return <SnapshotContext.Provider value={value}>{children}</SnapshotContext.Provider>;
}

export function useSnapshot() {
  const ctx = React.useContext(SnapshotContext);
  if (!ctx) throw new Error("useSnapshot must be used within SnapshotProvider");
  return ctx;
}
