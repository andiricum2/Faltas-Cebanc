"use client";

import React from "react";

/**
 * Hook genérico para manejar estados de carga de datos
 * Elimina la duplicación del patrón loading/error/data en múltiples componentes
 */
export function useDataLoader<T>(
  loadFunction: () => Promise<T>,
  dependencies: React.DependencyList = []
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadFunction();
      setData(result);
      return result;
    } catch (e: any) {
      const errorMessage = e?.message || "Error al cargar datos";
      setError(errorMessage);
      throw e;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  const reload = React.useCallback(() => {
    return load();
  }, [load]);

  // Auto-load on mount and when dependencies change
  React.useEffect(() => {
    load().catch(() => {}); // Error already handled in load function
  }, [load]);

  return {
    data,
    loading,
    error,
    reload,
    setData
  };
}

/**
 * Hook específico para carga de datos con sincronización automática
 * Útil para configuraciones que necesitan sincronizar después de guardar
 */
export function useConfigDataLoader<T>(
  loadFunction: () => Promise<T>,
  saveFunction: (data: T) => Promise<void>,
  dependencies: React.DependencyList = []
) {
  const { data, loading, error, reload, setData } = useDataLoader(loadFunction, dependencies);

  const save = React.useCallback(async (newData: T) => {
    try {
      await saveFunction(newData);
      setData(newData);
      return newData;
    } catch (e: any) {
      throw new Error(e?.message || "Error al guardar datos");
    }
  }, [saveFunction, setData]);

  return {
    data,
    loading,
    error,
    reload,
    save,
    setData
  };
}
