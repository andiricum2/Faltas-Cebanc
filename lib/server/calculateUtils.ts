import type { StudentSnapshot } from "@/lib/types/faltas";
import { sumarFaltas, calcPercent } from "@/lib/utils";

export type ModuleBaseStats = { classes: number; absences: number };

export function getModuleBaseStats(snap: StudentSnapshot, code: string): ModuleBaseStats {
  const moduleCalcs = (snap as any).moduleCalculations?.[code];
  const classes = moduleCalcs
    ? ((moduleCalcs?.sesionesDirectas || 0) + (moduleCalcs?.sesionesDerivadas || 0))
    : (snap.aggregated?.modules?.[code]?.classesGiven || 0);
  const absences = moduleCalcs?.totalFaltas ??
    sumarFaltas(snap.aggregated?.modules?.[code]?.absenceCounts);
  return { classes, absences };
}

export function sumGeneral(snap: StudentSnapshot): { totalSessions: number; totalAbsences: number } {
  const hasModuleCalcs = !!(snap as any).moduleCalculations;
  const totalSessions = hasModuleCalcs
    ? Object.values((snap as any).moduleCalculations || {}).reduce((acc: number, m: any) => acc + ((m?.sesionesDirectas || 0) + (m?.sesionesDerivadas || 0)), 0)
    : Object.values(snap.aggregated?.modules || {}).reduce((acc, m: any) => acc + (m?.classesGiven || 0), 0);
  const totalAbsences = hasModuleCalcs
    ? Object.values((snap as any).moduleCalculations || {}).reduce((acc: number, m: any) => acc + (m?.totalFaltas || 0), 0)
    : sumarFaltas(snap.aggregated?.absenceTotals);
  return { totalSessions, totalAbsences };
}

export function buildBaseByModule(snapshot: StudentSnapshot): Record<string, { sessions: number; absences: number; label: string }> {
  const out: Record<string, { sessions: number; absences: number; label: string }> = {};
  for (const code of Object.keys(snapshot.aggregated?.modules || {})) {
    const base = getModuleBaseStats(snapshot, code);
    out[code] = {
      sessions: Number(base.classes || 0),
      absences: Number(base.absences || 0),
      label: snapshot.legend?.modules?.[code] || code
    };
  }
  return out;
}

export function computeRetoProjection(moduleClasses: number, moduleAbsences: number, added: number, coef: number) {
  const retoFaltasDistribuidasProjected = added > 0 ? moduleAbsences + (added * coef) : moduleAbsences;
  const retoClasesImpartidasDistribuidasProjected = added > 0 ? moduleClasses + (added * coef) : moduleClasses;
  const totalFaltasProjected = moduleAbsences + retoFaltasDistribuidasProjected;
  const totalSessionsProjected = moduleClasses + retoClasesImpartidasDistribuidasProjected;
  const current = calcPercent(moduleAbsences, moduleClasses);
  const projected = calcPercent(totalFaltasProjected, totalSessionsProjected);
  return { current, projected };
}

// --- Planning types and computation ---
export type CalculationPlanEntry = {
  kind: "abs" | "att"; // falta o asistencia
  scope: "module" | "reto" | "general";
  code?: string; // requerido si scope != general
  hours: number; // en horas
};

export type CalculatePlanResponse = {
  general: {
    base: { totalSessions: number; totalAbsences: number; percent: number };
    projected: { totalSessions: number; totalAbsences: number; percent: number };
    delta: { sessions: number; absences: number; percent: number };
  };
  byModule: Array<{
    code: string;
    label: string;
    base: { sessions: number; absences: number; percent: number };
    projected: { sessions: number; absences: number; percent: number };
    delta: { sessions: number; absences: number; percent: number };
  }>;
};

export function computePlanProjection(snapshot: StudentSnapshot, entries: CalculationPlanEntry[]): CalculatePlanResponse {
  const allModuleCodes = Object.keys(snapshot.aggregated?.modules || {});
  const baseByModule = buildBaseByModule(snapshot);

  const deltaByModule: Record<string, { sessions: number; absences: number }> = Object.fromEntries(
    allModuleCodes.map((c) => [c, { sessions: 0, absences: 0 }])
  );
  let generalExtraAbsences = 0;
  let generalExtraSessions = 0;

  const applyToModule = (code: string, kind: "abs" | "att", hours: number) => {
    if (!deltaByModule[code]) return;
    if (kind === "abs") deltaByModule[code].absences += hours;
    if (kind === "att") deltaByModule[code].sessions += hours;
  };

  const addToModule = (code: string, sessions: number, absences: number) => {
    if (sessions > 0) applyToModule(code, "att", sessions);
    if (absences > 0) applyToModule(code, "abs", absences);
  };
  const addToGeneral = (sessions: number, absences: number) => {
    if (sessions > 0) generalExtraSessions += sessions;
    if (absences > 0) generalExtraAbsences += absences;
  };

  const coefAll = (snapshot as any).coeficientes || {};

  for (const e of entries) {
    const hours = Math.max(0, Number(e?.hours || 0));
    if (!hours) continue;
    const isAbs = e.kind === "abs";
    if (e.scope === "general") {
      addToGeneral(hours, isAbs ? hours : 0);
      continue;
    }
    const code = e.code || "";
    if (!code) continue;

    if (e.scope === "module") {
      addToModule(code, hours, isAbs ? hours : 0);
    } else if (e.scope === "reto") {
      const coefMap = coefAll[code] || {};
      addToModule(code, hours, isAbs ? hours : 0);
      for (const [mod, coef] of Object.entries(coefMap)) {
        const h = hours * (Number(coef) || 0);
        if (h <= 0) continue;
        addToModule(mod, h, isAbs ? h : 0);
      }
    }
  }

  const baseGeneral = sumGeneral(snapshot);

  const byModule = allModuleCodes.map((code) => {
    const base = baseByModule[code];
    const d = deltaByModule[code];
    const label = base.label;
    const projSessions = base.sessions + d.sessions;
    const projAbsences = base.absences + d.absences;
    return {
      code,
      label,
      base: {
        sessions: base.sessions,
        absences: base.absences,
        percent: calcPercent(base.absences, base.sessions)
      },
      projected: {
        sessions: projSessions,
        absences: projAbsences,
        percent: calcPercent(projAbsences, projSessions)
      },
      delta: {
        sessions: d.sessions,
        absences: d.absences,
        percent: calcPercent(projAbsences, projSessions) - calcPercent(base.absences, base.sessions)
      }
    };
  });

  const totalDeltaFromModules = Object.values(deltaByModule).reduce(
    (acc, d) => {
      acc.sessions += d.sessions;
      acc.absences += d.absences;
      return acc;
    },
    { sessions: 0, absences: 0 }
  );

  const projectedGeneral = {
    totalSessions: baseGeneral.totalSessions + totalDeltaFromModules.sessions + generalExtraSessions,
    totalAbsences: baseGeneral.totalAbsences + totalDeltaFromModules.absences + generalExtraAbsences
  };

  return {
    general: {
      base: {
        totalSessions: baseGeneral.totalSessions,
        totalAbsences: baseGeneral.totalAbsences,
        percent: calcPercent(baseGeneral.totalAbsences, baseGeneral.totalSessions)
      },
      projected: {
        totalSessions: projectedGeneral.totalSessions,
        totalAbsences: projectedGeneral.totalAbsences,
        percent: calcPercent(projectedGeneral.totalAbsences, projectedGeneral.totalSessions)
      },
      delta: {
        sessions: projectedGeneral.totalSessions - baseGeneral.totalSessions,
        absences: projectedGeneral.totalAbsences - baseGeneral.totalAbsences,
        percent: calcPercent(projectedGeneral.totalAbsences, projectedGeneral.totalSessions) - calcPercent(baseGeneral.totalAbsences, baseGeneral.totalSessions)
      }
    },
    byModule
  };
}


