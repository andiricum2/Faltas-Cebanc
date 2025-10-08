import { useDataLoader } from "./useDataLoader";
import { getStatistics } from "@/lib/services/apiClient";

/**
 * Hook para cargar estadísticas usando useDataLoader
 * Centraliza la lógica de carga de estadísticas
 */
export function useStatistics(dni: string | undefined) {
  return useDataLoader(
    () => {
      if (!dni) {
        throw new Error("DNI es requerido para cargar estadísticas");
      }
      return getStatistics(dni);
    },
    [dni]
  );
}
