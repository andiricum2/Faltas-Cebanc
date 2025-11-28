"use client";

import { useConfig } from "@/lib/services/configContext";
import { getSnapshot as apiGetSnapshot, postSync as apiPostSync, logout as apiLogout } from "@/lib/services/apiClient";
import type { StudentSnapshot as Snapshot } from "@/lib/types/faltas";
import { saveRememberedCredentials } from "@/lib/services/credentials";
import { useState, useCallback, useEffect, useRef, useMemo, useContext } from "react";
import { createContext } from "react";
import { useStablePathname } from "@/lib/hooks/useStablePathname";

type SnapshotContextType = {
  snapshot: Snapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  syncNow: () => Promise<void>;
};

const SnapshotContext = createContext<SnapshotContextType | undefined>(undefined);

async function getSnapshot(): Promise<Snapshot | null> { return apiGetSnapshot(); }

async function postSync(): Promise<void> { await apiPostSync(); }

export function SnapshotProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const didAutoSyncRef = useRef<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pathname = useStablePathname();
  const isLoginPage = pathname === "/login";
  const { config } = useConfig();

  const refresh = useCallback(async () => {
    try {
      const s = await getSnapshot();
      setSnapshot(s);
    } catch (e: any) {
      setError(e?.message || "Error");
    }
  }, []);

  const syncNow = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await postSync();
      const s = await getSnapshot();
      setSnapshot(s);
    } catch (e: any) {
      if (e?.code === "UNAUTHENTICATED") {
        // If we're on any page other than login, redirect to login to trigger its flow.
        if (!isLoginPage) {
          window.location.href = "/login";
        }
        return;
      }
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }, [isLoginPage]);

  useEffect(() => {
    // Initial load (skip on login page)
    if (!isLoginPage) {
      refresh().catch(() => {});
    }
  }, [refresh, isLoginPage]);

  useEffect(() => {
    // Auto-sync once only after we have a snapshot (i.e., authenticated). Skip on login page.
    if (!isLoginPage && !didAutoSyncRef.current && snapshot) {
      didAutoSyncRef.current = true;
      syncNow().catch(() => {});
    }
  }, [syncNow, isLoginPage, snapshot]);

  useEffect(() => {
    // Manage periodic auto-sync according to config
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Require being authenticated (we infer that when snapshot exists)
    if (isLoginPage || !snapshot) return;
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
  }, [config.autoSyncMinutes, isLoginPage, syncNow, snapshot]);

  const value = useMemo(
    () => ({ snapshot, loading, error, refresh, syncNow }),
    [snapshot, loading, error, refresh, syncNow]
  );

  return <SnapshotContext.Provider value={value}>{children}</SnapshotContext.Provider>;
}

export function useSnapshot() {
  const ctx = useContext(SnapshotContext);
  if (!ctx) throw new Error("useSnapshot must be used within SnapshotProvider");
  return ctx;
}
