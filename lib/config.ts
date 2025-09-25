export type HttpConfig = {
  baseUrl: string;
  userAgent: string;
  timeoutMs: number;
  origin: string;
};

const DEFAULT_BASE = process.env.NEXT_PUBLIC_FALTAS_BASE_URL || "https://faltas.cebanc.com";

export const httpConfig: HttpConfig = {
  baseUrl: DEFAULT_BASE.replace(/\/$/, ""),
  userAgent: `faltas-client/0.1 (+nextjs)`,
  timeoutMs: Number(process.env.FALTAS_TIMEOUT_MS || 15000),
  origin: "https://faltas.cebanc.com",
};

export function withBase(path: string): string {
  if (!path.startsWith("/")) return `${httpConfig.baseUrl}/${path}`;
  return `${httpConfig.baseUrl}${path}`;
}


