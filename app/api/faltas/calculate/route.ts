import { NextRequest, NextResponse } from "next/server";
import type { StudentSnapshot } from "@/lib/types/faltas";
import { loadProcessedSnapshot } from "@/lib/server/snapshot";
import { sumarFaltas, calcPercent, isRetoModule, extractGroupToken } from "@/lib/utils/calculations";
import { getModuleBaseStats, sumGeneral, buildBaseByModule, computeRetoProjection } from "@/lib/server/calculateUtils";

export type CalculateResponse = {
  general: {
    totalSessions: number;
    totalAbsences: number;
    currentPercent: number;
    projectedPercent: number;
  };
  module: {
    totalSessions: number;
    totalAbsences: number;
    currentPercent: number;
    projectedPercent: number;
  };
  retoAnalysis?: {
    reto: {
      current: number;
      projected: number;
      classes: number;
    };
    modules: Array<{
      code: string;
      label: string;
      current: number;
      projected: number;
      classes: number;
    }>;
  };
  moduleMeta: Array<{
    code: string;
    label: string;
    classes: number;
    absDirectas: number;
    isReto: boolean;
    group: string | null;
  }>;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get("dni");
    const selectedModule = searchParams.get("module") || "__general__";
    const addedAbsences = Number(searchParams.get("addedAbsences")) || 0;
    
    if (!dni) {
      return NextResponse.json({ error: "DNI requerido" }, { status: 400 });
    }

    // Cargar snapshot procesado directamente (evitar llamada HTTP interna)
    const snapshot: StudentSnapshot = await loadProcessedSnapshot(dni);

    // Helpers reutilizados movidos a lib/server/calculateUtils

    // Calcular estadísticas generales
    const { totalSessions: totalSessionsGeneral, totalAbsences: totalAbsencesGeneral } = sumGeneral(snapshot);
    const currentPercentGeneral = calcPercent(totalAbsencesGeneral, totalSessionsGeneral);
    const projectedPercentGeneral = calcPercent(totalAbsencesGeneral + addedAbsences, totalSessionsGeneral);

    // Calcular estadísticas del módulo seleccionado (usar moduleCalculations del snapshot si existe)
    const { classes: totalSessionsModule, absences: totalAbsencesModule } = selectedModule === "__general__"
      ? { classes: 0, absences: 0 }
      : getModuleBaseStats(snapshot, selectedModule);

    const currentPercentModule = calcPercent(totalAbsencesModule, totalSessionsModule);
    const projectedPercentModule = calcPercent(totalAbsencesModule + addedAbsences, totalSessionsModule);

    // Generar metadatos de módulos
    const moduleMeta = Object.keys(snapshot.aggregated?.modules || {}).map((code) => {
      const label = snapshot.legend?.modules?.[code] || code;
      const classes = snapshot.aggregated?.modules?.[code]?.classesGiven || 0;
      const absDirectas = sumarFaltas(snapshot.aggregated?.modules?.[code]?.absenceCounts);
      const reto = isRetoModule(code, label);
      const group = extractGroupToken(code, label);
      return { code, label, classes, absDirectas, isReto: reto, group };
    });

    // Análisis de reto si el módulo seleccionado es un reto
    let retoAnalysis = undefined;
    if (selectedModule !== "__general__") {
      const label = snapshot.legend?.modules?.[selectedModule] || selectedModule;
      const isReto = isRetoModule(selectedModule, label);
      
      if (isReto) {
        const retoClasses = snapshot.aggregated?.modules?.[selectedModule]?.classesGiven || 0;
        const retoDirectAbs = sumarFaltas(snapshot.aggregated?.modules?.[selectedModule]?.absenceCounts);
        const retoCurrent = calcPercent(retoDirectAbs, retoClasses);
        const retoProjected = calcPercent(retoDirectAbs + addedAbsences, retoClasses);

        const coeficientes = snapshot.coeficientes?.[selectedModule] || {};
        const modules: Array<{
          code: string;
          label: string;
          current: number;
          projected: number;
          classes: number;
        }> = [];

        for (const m of Object.keys(snapshot.aggregated?.modules || {})) {
          const moduleLabel = snapshot.legend?.modules?.[m] || m;
          const isRetoMod = isRetoModule(m, moduleLabel);
          if (isRetoMod) continue; // Saltar otros retos

          const coeficiente = coeficientes[m] || 0;
          if (coeficiente === 0) continue; // Solo módulos asignados

          const base = getModuleBaseStats(snapshot, m);
          const { current, projected } = computeRetoProjection(base.classes, base.absences, addedAbsences, coeficiente);
          modules.push({ code: m, label: moduleLabel, current, projected, classes: base.classes });
        }

        retoAnalysis = {
          reto: { current: retoCurrent, projected: retoProjected, classes: retoClasses },
          modules
        };
      }
    }

    const response: CalculateResponse = {
      general: {
        totalSessions: totalSessionsGeneral,
        totalAbsences: totalAbsencesGeneral,
        currentPercent: currentPercentGeneral,
        projectedPercent: projectedPercentGeneral
      },
      module: {
        totalSessions: totalSessionsModule,
        totalAbsences: totalAbsencesModule,
        currentPercent: currentPercentModule,
        projectedPercent: projectedPercentModule
      },
      retoAnalysis,
      moduleMeta
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error en /api/faltas/calculate:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export type CalculationPlanEntry = {
  kind: "abs" | "att"; // falta o asistencia
  scope: "module" | "reto" | "general";
  code?: string; // requerido si scope != general
  hours: number; // en horas (la UI puede convertir días -> horas antes de enviar)
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dni: string | undefined = body?.dni;
    const entries: CalculationPlanEntry[] = Array.isArray(body?.entries) ? body.entries : [];

    if (!dni) {
      return NextResponse.json({ error: "DNI requerido" }, { status: 400 });
    }

    const snapshot: StudentSnapshot = await loadProcessedSnapshot(dni);

    const sumGeneral = (snap: StudentSnapshot) => {
      const hasModuleCalcs = !!(snap as any).moduleCalculations;
      const totalSessions = hasModuleCalcs
        ? Object.values((snap as any).moduleCalculations || {}).reduce((acc: number, m: any) => acc + ((m?.sesionesDirectas || 0) + (m?.sesionesDerivadas || 0)), 0)
        : Object.values(snap.aggregated?.modules || {}).reduce((acc, m: any) => acc + (m?.classesGiven || 0), 0);
      const totalAbsences = hasModuleCalcs
        ? Object.values((snap as any).moduleCalculations || {}).reduce((acc: number, m: any) => acc + (m?.totalFaltas || 0), 0)
        : sumarFaltas(snap.aggregated?.absenceTotals);
      return { totalSessions, totalAbsences };
    };

    // Base por módulo
    const allModuleCodes = Object.keys(snapshot.aggregated?.modules || {});
    const baseByModule = buildBaseByModule(snapshot);

    // Deltas por módulo
    const deltaByModule: Record<string, { sessions: number; absences: number }> = Object.fromEntries(
      allModuleCodes.map((c) => [c, { sessions: 0, absences: 0 }])
    );
    let generalExtraAbsences = 0; // faltas no asignadas a módulos
    let generalExtraSessions = 0; // sesiones no asignadas a módulos

    const applyToModule = (code: string, kind: "abs" | "att", hours: number) => {
      if (!deltaByModule[code]) return;
      if (kind === "abs") deltaByModule[code].absences += hours;
      if (kind === "att") deltaByModule[code].sessions += hours;
    };

    // Usar coeficientes existentes del snapshot para distribuir aportes de retos
    const coefAll = snapshot.coeficientes || {};

    // Helpers compactos para sumar en módulo y general
    const addToModule = (code: string, sessions: number, absences: number) => {
      if (sessions > 0) applyToModule(code, "att", sessions);
      if (absences > 0) applyToModule(code, "abs", absences);
    };
    const addToGeneral = (sessions: number, absences: number) => {
      if (sessions > 0) generalExtraSessions += sessions;
      if (absences > 0) generalExtraAbsences += absences;
    };

    for (const e of entries) {
      const hours = Math.max(0, Number(e?.hours || 0));
      if (!hours) continue;
      const isAbs = e.kind === "abs";
      if (e.scope === "general") {
        // Falta: sesiones + faltas; Asistencia: solo sesiones
        addToGeneral(hours, isAbs ? hours : 0);
        continue;
      }
      const code = e.code || "";
      if (!code) continue;

      if (e.scope === "module") {
        // Falta: sesiones + faltas; Asistencia: solo sesiones
        addToModule(code, hours, isAbs ? hours : 0);
      } else if (e.scope === "reto") {
        const coefMap = coefAll[code] || {};
        // Propio reto: sesiones + (faltas si aplica)
        addToModule(code, hours, isAbs ? hours : 0);
        for (const [mod, coef] of Object.entries(coefMap)) {
          const h = hours * (Number(coef) || 0);
          if (h <= 0) continue;
          // Distribución: sesiones + (faltas si aplica)
          addToModule(mod, h, isAbs ? h : 0);
        }
      }
    }

    const baseGeneral = sumGeneral(snapshot);

    // Construir respuesta por módulo
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

    // Deltas totales desde módulos
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

    const response: CalculatePlanResponse = {
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

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error en POST /api/faltas/calculate:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
