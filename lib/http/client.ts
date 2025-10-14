/**
 * Minimal HTTP client wrapper for frontend and server calls.
 * Centralizes JSON parsing and auth/error handling.
 */

function emitToast(message: string, kind: "info" | "success" | "warning" | "error" = "error", title?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("app:toast", { detail: { message, title, kind } }));
  }
}

export async function request<T>(input: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(input, init);
    if (res.status === 401 || res.status === 403) {
      const err: any = new Error("No autenticado");
      err.code = "UNAUTHENTICATED";
      emitToast("Sesión caducada o credenciales inválidas", "warning", "Autenticación");
      throw err;
    }
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      const body = await res.text().catch(() => "");
      if (body) {
        try {
          const data = JSON.parse(body);
          msg = data?.errorMessage || msg;
        } catch {
          msg = body;
        }
      }

      const isUser = res.status >= 400 && res.status < 500;
      emitToast(isUser ? msg : "Ha ocurrido un error. Inténtalo más tarde.", isUser ? "warning" : "error", isUser ? "Revisa la petición" : "Error del servidor");

      const err: any = new Error(msg);
      err.status = res.status;
      err.code = "HTTP_ERROR";
      throw err;
    }
    try {
      return (await res.json()) as T;
    } catch {
      return null as unknown as T;
    }
  } catch (e: any) {
    if (e?.name === "AbortError") {
      emitToast("La petición ha expirado", "warning", "Tiempo de espera");
    } else if (e?.message && /Failed to fetch|NetworkError/i.test(e.message)) {
      emitToast("Sin conexión o servidor inaccesible", "warning", "Red");
    }
    throw e;
  }
}


