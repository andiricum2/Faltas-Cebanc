"use client";

import { useSnapshot } from "@/lib/services/snapshotContext";
import { useConfigDataLoader } from "./useDataLoader";
import { useCallback, DependencyList } from "react";

/**
 * Hook específico para manejar configuraciones que requieren sincronización
 * Combina carga/guardado de datos con sincronización automática
 */
export function useConfigWithSync<T>(
  loadFunction: () => Promise<T>,
  saveFunction: (data: T) => Promise<void>,
  dependencies: DependencyList = []
) {
  const { syncNow } = useSnapshot();
  const { data, loading, error, reload, setData } = useConfigDataLoader(
    loadFunction,
    saveFunction,
    dependencies
  );

  const saveAndSync = useCallback(async (newData: T) => {
    try {
      await saveFunction(newData);
      setData(newData);
      // Intentar sincronizar después de guardar (fire and forget)
      try { 
        await syncNow(); 
      } catch {
        // Ignorar errores de sincronización
      }
      return newData;
    } catch (e: any) {
      throw new Error(e?.message || "Error al guardar datos");
    }
  }, [saveFunction, setData, syncNow]);

  return {
    data,
    loading,
    error,
    reload,
    save: saveAndSync,
    setData
  };
}
