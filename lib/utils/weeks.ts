import type { StudentSnapshot } from "@/lib/types/faltas";
import { getTodayLocalISO } from "./dates";

export function findCurrentWeekIndex(snapshot: StudentSnapshot | null | undefined, todayISO = getTodayLocalISO()): number | null {
  if (!snapshot?.weeks?.length) return null;
  const idx = snapshot.weeks.findIndex(w => w.weekStartISO <= todayISO && todayISO <= w.weekEndISO);
  return idx >= 0 ? idx : null;
}

export function getDefaultWeekIndex(snapshot: StudentSnapshot | null | undefined, todayISO = getTodayLocalISO()): number | null {
  if (!snapshot?.weeks?.length) return null;
  const current = findCurrentWeekIndex(snapshot, todayISO);
  return current != null ? current : (snapshot.weeks.length - 1);
}
