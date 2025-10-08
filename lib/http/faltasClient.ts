import { httpConfig, withBase } from "@/lib/config";
import { logger } from "@/lib/logging/appLogger";
import { LoginBody, LoginResult } from "@/lib/types/faltas";

function normalizeSetCookie(header: string | string[] | null | undefined): string[] {
  if (!header) return [];
  if (Array.isArray(header)) return header;
  // Split combined Set-Cookie header into individual cookies (handles commas inside attributes)
  const parts = header.split(/,(?=[^;]+=)/);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function parseSetCookieForPhpsessid(header: string | string[] | null | undefined): string | undefined {
  const cookies = normalizeSetCookie(header);
  for (const cookie of cookies) {
    const match = /PHPSESSID=([^;]+)/.exec(cookie);
    if (match) return match[1];
  }
  return undefined;
}

export class FaltasClient {
  private sessionId: string | undefined;

  async login({ role, username, password }: LoginBody): Promise<LoginResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), httpConfig.timeoutMs);
    try {
      const form = new URLSearchParams();
      form.set("opcion_rol", role);
      form.set("usuario", username);
      form.set("contrasena", password);
      const res = await fetch(withBase("/control.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": httpConfig.userAgent,
          Origin: httpConfig.origin,
          ...(this.sessionId ? { Cookie: `PHPSESSID=${this.sessionId}` } : {}),
        },
        body: form.toString(),
        redirect: "manual",
        signal: controller.signal,
      });

      const location = res.headers.get("location") || "";
      const setCookieHeader = (res.headers as any).getSetCookie?.() ?? res.headers.get("set-cookie");
      const renewedSession = parseSetCookieForPhpsessid(setCookieHeader);
      if (renewedSession) this.sessionId = renewedSession;

      logger.debug(`login response`, 'HTTP', { status: res.status, location });

      if (/aplicacion\.php/.test(location)) {
        return { ok: true, sessionId: this.sessionId };
      }

      const errorMatch = /index\.php\?error_login=(1|2|3)/.exec(location);
      if (errorMatch) {
        const errorCode = Number(errorMatch[1]) as 1 | 2 | 3;
        const errorMessage =
          errorCode === 1
            ? "Usuario no válido"
            : errorCode === 2
            ? "Contraseña incorrecta"
            : "Rol no permitido";
        return { ok: false, errorCode, errorMessage };
      }

      return { ok: false, errorMessage: "Respuesta no reconocida" };
    } catch (error: any) {
      logger.error(`login error`, 'HTTP', { error: String(error?.message || error) });
      return { ok: false, errorMessage: "Error de red" };
    } finally {
      clearTimeout(timeout);
    }
  }

  setSession(sessionId: string | undefined) {
    this.sessionId = sessionId;
  }

  getSession(): string | undefined {
    return this.sessionId;
  }

  async fetchMostrarAlumno(params?: { date?: string }): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), httpConfig.timeoutMs);
    try {
      const url = withBase("/mostraralumno.php");
      const res = await fetch(url, {
        method: params?.date ? "POST" : "GET",
        headers: {
          "User-Agent": httpConfig.userAgent,
          Origin: httpConfig.origin,
          ...(this.sessionId ? { Cookie: `PHPSESSID=${this.sessionId}` } : {}),
          ...(params?.date ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
        },
        body: params?.date ? new URLSearchParams({ mifecha: params.date, envio: "Elegir" }).toString() : undefined,
        redirect: "manual",
        signal: controller.signal,
      });

      if (res.status === 401 || res.status === 403) {
        const err: any = new Error("No autenticado");
        err.code = "UNAUTHENTICATED";
        throw err;
      }

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location") || "";
        logger.warn(`Redirect encountered on mostraralumno`, 'HTTP', { location, status: res.status });
      }

      const text = await res.text();
      const setCookieHeader = (res.headers as any).getSetCookie?.() ?? res.headers.get("set-cookie");
      const renewedSession = parseSetCookieForPhpsessid(setCookieHeader);
      if (renewedSession) this.sessionId = renewedSession;
      return text;
    } catch (error: any) {
      logger.error(`fetch mostraralumno error`, 'HTTP', { error: String(error?.message || error) });
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}


