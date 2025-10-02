import { NextRequest, NextResponse } from "next/server";
import type { StudentSnapshot } from "@/lib/types/faltas";
import { loadProcessedSnapshot } from "@/lib/server/snapshot";
import { sumarFaltas, calcPercent, isRetoModule, extractGroupToken } from "@/lib/utils/calculations";

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

    // Helpers para evitar duplicación
    const getModuleBaseStats = (snap: StudentSnapshot, code: string) => {
      const moduleCalcs = (snap as any).moduleCalculations?.[code];
      const classes = moduleCalcs
        ? ((moduleCalcs?.sesionesDirectas || 0) + (moduleCalcs?.sesionesDerivadas || 0))
        : (snap.aggregated?.modules?.[code]?.classesGiven || 0);
      const absences = moduleCalcs?.totalFaltas ??
        sumarFaltas(snap.aggregated?.modules?.[code]?.absenceCounts);
      return { classes, absences };
    };

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

    const computeRetoProjection = (moduleClasses: number, moduleAbsences: number, added: number, coef: number) => {
      const retoFaltasDistribuidasProjected = added > 0 ? moduleAbsences + (added * coef) : moduleAbsences;
      const retoClasesImpartidasDistribuidasProjected = added > 0 ? moduleClasses + (added * coef) : moduleClasses;
      const totalFaltasProjected = moduleAbsences + retoFaltasDistribuidasProjected;
      const totalSessionsProjected = moduleClasses + retoClasesImpartidasDistribuidasProjected;
      const current = calcPercent(moduleAbsences, moduleClasses);
      const projected = calcPercent(totalFaltasProjected, totalSessionsProjected);
      return { current, projected };
    };

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
