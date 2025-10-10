// Sistema de logging centralizado para la aplicación
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: any;
}

class Logger {
  private level: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Límite de logs en memoria
  private shipQueue: LogEntry[] = [];
  private shipTimer: any = null;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private addLog(level: LogLevel, message: string, context?: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      data
    };

    this.logs.push(entry);
    
    // Mantener solo los últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Encolar para envío
    this.enqueueShip(entry);

    // También loggear en consola para desarrollo
    if (process.env.NODE_ENV === 'development') {
      const prefix = `[${LogLevel[level]}] ${context ? `[${context}] ` : ''}`;
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(prefix + message, data || '');
          break;
        case LogLevel.INFO:
          console.info(prefix + message, data || '');
          break;
        case LogLevel.WARN:
          console.warn(prefix + message, data || '');
          break;
        case LogLevel.ERROR:
          console.error(prefix + message, data || '');
          break;
      }
    }
  }

  private enqueueShip(entry: LogEntry) {
    this.shipQueue.push(entry);
    if (!this.shipTimer) {
      this.shipTimer = setTimeout(() => this.flushShip(), 2000);
    }
    if (this.shipQueue.length >= 50) {
      this.flushShip();
    }
    // Escribir en Tauri (si disponible)
    if (typeof window !== "undefined" && (window as any).__TAURI__) {
      try {
        (window as any).__TAURI__.invoke("log_client", {
          level: LogLevel[entry.level],
          message: `${entry.context ? `[${entry.context}] ` : ""}${entry.message}`,
        }).catch(() => {});
      } catch {}
    }
  }

  private async flushShip() {
    const batch = this.shipQueue.splice(0, this.shipQueue.length);
    this.shipTimer && clearTimeout(this.shipTimer);
    this.shipTimer = null;
    if (batch.length === 0) return;
    try {
      if (typeof fetch !== "undefined") {
        await fetch("/api/faltas/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            logs: batch.map((l) => ({
              level: LogLevel[l.level] as any,
              message: l.message,
              context: l.context,
              data: l.data,
              timestamp: l.timestamp.toISOString(),
            })),
          }),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
  }

  debug(message: string, context?: string, data?: any): void {
    this.addLog(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.addLog(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: any): void {
    this.addLog(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: string, data?: any): void {
    this.addLog(LogLevel.ERROR, message, context, data);
  }

  // Métodos para obtener logs
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  clearLogs(): void {
    this.logs = [];
  }

  // Método para cambiar el nivel de logging
  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

// Instancia global del logger
export const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
);

// Funciones de conveniencia para logging común
export const logApiError = (endpoint: string, error: any) => {
  logger.error(`API Error en ${endpoint}`, 'API', { error: error.message || error, stack: error.stack });
};

export const logApiSuccess = (endpoint: string, data?: any) => {
  logger.info(`API Success en ${endpoint}`, 'API', data);
};

export const logUserAction = (action: string, data?: any) => {
  logger.info(`User action: ${action}`, 'USER', data);
};

export const logPerformance = (operation: string, duration: number, data?: any) => {
  logger.info(`Performance: ${operation} took ${duration}ms`, 'PERF', data);
};

export const logSnapshotEvent = (event: string, data?: any) => {
  logger.info(`Snapshot event: ${event}`, 'SNAPSHOT', data);
};

export const logConfigChange = (config: string, value: any) => {
  logger.info(`Config change: ${config}`, 'CONFIG', { config, value });
};
