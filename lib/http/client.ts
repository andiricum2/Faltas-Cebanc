/**
 * Minimal HTTP client wrapper for frontend and server calls.
 * Centralizes JSON parsing and auth/error handling.
 */

export async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (res.status === 401 || res.status === 403) {
    const err: any = new Error("No autenticado");
    err.code = "UNAUTHENTICATED";
    throw err;
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  try {
    return (await res.json()) as T;
  } catch {
    return null as unknown as T;
  }
}


