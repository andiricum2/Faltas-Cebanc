"use client";

import React from "react";
import { useConfigWithSync } from "./useConfigWithSync";

/**
 * Hook específico para páginas de configuración que siguen el patrón común:
 * - Cargar datos de configuración
 * - Mostrar estado de carga/error
 * - Guardar datos con sincronización automática
 * - Manejar estado de snapshot requerido
 */
export function useConfigPage<T>(
  loadFunction: () => Promise<T>,
  saveFunction: (data: T) => Promise<void>,
  dependencies: React.DependencyList = []
) {
  const { data, loading, error, reload, save, setData } = useConfigWithSync(
    loadFunction,
    saveFunction,
    dependencies
  );

  // Función helper para actualizar un campo específico
  const updateField = React.useCallback(<K extends keyof T>(
    field: K,
    value: T[K]
  ) => {
    if (!data) return;
    const updated = { ...data, [field]: value };
    save(updated).catch(() => {}); // Error handling is done in the hook
  }, [data, save]);

  // Función helper para resetear todos los valores
  const resetToDefaults = React.useCallback((defaults: T) => {
    save(defaults).catch(() => {});
  }, [save]);

  return {
    data,
    loading,
    error,
    reload,
    save,
    setData,
    updateField,
    resetToDefaults
  };
}
