"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useSnapshot } from "@/lib/services/snapshotContext";

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
  loadingMessage,
  errorMessage,
  onRetry 
}: LoadingStateProps) {
  const t = useTranslations();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto">
            <div className="w-full h-full rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-muted-foreground">{loadingMessage || t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto">
            <div className="w-full h-full rounded-full border-4 border-destructive/20 border-t-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-destructive">{t('common.errorLoadingData')}</h3>
            <p className="text-muted-foreground">{errorMessage || error}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t('common.retry')}
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
  const t = useTranslations();
  const { syncNow } = useSnapshot();

  const withFallback = useCallback(
    (key: string, fallback: string) => {
      const value = t(key);
      return value === key ? fallback : value;
    },
    [t]
  );

  const handleSync = useCallback(async () => {
    try {
      await syncNow();
    } catch {
      // Errores ya se manejan en el contexto/toasts
    }
  }, [syncNow]);
  
  if (loading) {
    return (
      <LoadingState loading={true} error={null}>
        <div/>
      </LoadingState>
    );
  }
  
  // Mostrar mensaje cuando no hay snapshot disponible
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 mx-auto">
          <div className="w-full h-full rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {withFallback('common.noDataAvailable', 'No hay datos disponibles')}
          </h3>
          <p className="text-muted-foreground">
            {withFallback('common.syncRequired', 'Necesitas sincronizar para cargar los datos.')}
          </p>
        </div>
        <Button 
          onClick={handleSync} 
          disabled={loading} 
          className="w-full sm:w-auto justify-center"
        >
          {withFallback('common.sync', 'Sincronizar ahora')}
        </Button>
      </div>
    </div>
  );
}
