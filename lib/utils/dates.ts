export function getTodayLocalISO(): string {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
  const local = new Date(now.getTime() - tzOffsetMs);
  return local.toISOString().slice(0, 10);
}

export function isDateWithinRange(dateISO: string, startISO: string, endISO: string): boolean {
  return startISO <= dateISO && dateISO <= endISO;
}

