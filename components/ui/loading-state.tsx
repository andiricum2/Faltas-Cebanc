"use client";

import { Info } from "lucide-react";
import React from "react";

interface LoadingStateProps {
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
}

/**
 * Componente reutilizable para manejar estados de carga y error
 * Elimina la duplicación del patrón loading/error en múltiples páginas
 */
export function LoadingState({ 
  loading, 
  error, 
  children, 
  loadingMessage = "Cargando datos...",
  errorMessage,
  onRetry 
}: LoadingStateProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto">
            <div className="w-full h-full rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          </div>
          <p className="text-muted-foreground">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto">
            <div className="w-full h-full rounded-full border-4 border-red-200 border-t-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-600">Error al cargar datos</h3>
            <p className="text-muted-foreground">{errorMessage || error}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Componente específico para verificación de snapshot
 * Se usa cuando no hay datos de snapshot disponibles
 */
export function SnapshotRequired({ 
  loading 
}: { 
  loading: boolean; 
}) {
  if (loading) {
    return (
      <LoadingState loading={true} error={null}>
        <div/>
      </LoadingState>
    );
  }
}
