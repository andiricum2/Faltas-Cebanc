"use client";

import { useTranslations } from "next-intl";

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
  if (loading) {
    return (
      <LoadingState loading={true} error={null}>
        <div/>
      </LoadingState>
    );
  }
}
