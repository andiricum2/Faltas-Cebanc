/**
 * Utilidades de cálculo compartidas entre frontend y backend
 */

export function sumRecordValuesExcludingJ(record: Record<string, number> | undefined): number {
  if (!record) return 0;
  return Object.entries(record).reduce((acc, [code, n]) => {
    if (code === "J") return acc; // Justificadas no cuentan
    return acc + (Number.isFinite(n) ? (n as number) : 0);
  }, 0);
}

export function calcPercent(abs: number, total: number): number {
  if (!total || total <= 0) return 0;
  const raw = (abs / total) * 100;
  return Math.max(0, Math.min(100, Number(raw.toFixed(2))));
}

export function isRetoModule(code: string, label: string | undefined): boolean {
  const text = `${code} ${label || ""}`;
  // patrón exacto con límites no alfanuméricos: número + dos letras + número
  return /(?<![A-Za-z0-9])\d[A-Za-z]{2}\d(?![A-Za-z0-9])/i.test(text);
}

export function extractGroupToken(code: string, label: string | undefined): string | null {
  const text = `${code} ${label || ""}`;
  const m = text.match(/(?<![A-Za-z0-9])\d[A-Za-z]{2}\d(?![A-Za-z0-9])/i);
  return m ? m[0].toUpperCase() : null;
}

export function extractAbsenceCode(cssClass: string | null): string | null {
  if (!cssClass) return null;
  const m = cssClass.match(/falta_(\w*)/);
  return m ? m[1] : null;
}
