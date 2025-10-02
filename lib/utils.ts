import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAcademicYearRange(today = new Date()): { start: Date; end: Date } {
  const year = today.getFullYear();
  const septFirstThisYear = new Date(Date.UTC(year, 8, 1));
  const isBeforeSept = today < septFirstThisYear;
  const startYear = isBeforeSept ? year - 1 : year;
  const endYear = startYear + 1;
  const start = new Date(Date.UTC(startYear, 8, 1));
  const end = new Date(Date.UTC(endYear, 7, 31));
  return { start, end };
}

export function enumerateMondaysBetween(start: Date, end: Date): string[] {
  const d = new Date(start.getTime());
  const day = d.getUTCDay();
  const deltaToMonday = (day === 0 ? 1 : day === 1 ? 0 : 8 - day);
  d.setUTCDate(d.getUTCDate() + deltaToMonday);
  const result: string[] = [];
  while (d <= end) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    result.push(`${y}-${m}-${dd}`);
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return result;
}

export function isoToDDMMYYYY(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

// Re-exportar funciones de cálculos
export { 
  sumRecordValuesExcludingJ, 
  calcPercent, 
  isRetoModule, 
  extractGroupToken,
  extractAbsenceCode
} from "./utils/calculations";
