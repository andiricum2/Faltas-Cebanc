import { useEffect, useState } from "react";

export type ServerStatus = "checking" | "online" | "offline";

type UseServerStatusOptions = {
  url?: string;
  intervalMs?: number;
};

type ServerStatusResponse = {
  status: ServerStatus;
};

const DEFAULT_ENDPOINT = "/api/server-status";

/**
 * Comprueba periódicamente el estado del servidor a través del endpoint interno
 * /api/server-status para evitar problemas de CORS en el navegador.
 */
export function useServerStatus(options: UseServerStatusOptions = {}) {
  const { url = DEFAULT_ENDPOINT, intervalMs = 5000 } = options;

  const [status, setStatus] = useState<ServerStatus>("checking");

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval>;

    const checkStatus = async () => {
      try {
        const response = await fetch(url, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Status request failed");
        }

        const { status: remoteStatus } = (await response.json()) as ServerStatusResponse;

        if (!cancelled) {
          setStatus(remoteStatus);
        }
      } catch {
        if (!cancelled) {
          setStatus("offline");
        }
      }
    };

    checkStatus();
    intervalId = setInterval(checkStatus, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [url, intervalMs]);

  return status;
}

