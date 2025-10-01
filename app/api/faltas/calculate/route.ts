import { NextRequest, NextResponse } from "next/server";
import type { StudentSnapshot } from "@/lib/types/faltas";
import { loadProcessedSnapshot } from "@/lib/server/snapshot";
import { sumRecordValuesExcludingJ, calcPercent, isRetoModule, extractGroupToken } from "@/lib/utils/calculations";

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

    // Calcular estadísticas generales
    const totalSessionsGeneral = Object.values(snapshot.aggregated?.modules || {})
      .reduce((acc, m) => acc + (m?.classesGiven || 0), 0);
    const totalAbsencesGeneral = sumRecordValuesExcludingJ(snapshot.aggregated?.absenceTotals);
    const currentPercentGeneral = calcPercent(totalAbsencesGeneral, totalSessionsGeneral);
    const projectedPercentGeneral = calcPercent(totalAbsencesGeneral + addedAbsences, totalSessionsGeneral);

    // Calcular estadísticas del módulo seleccionado
    const totalSessionsModule = selectedModule === "__general__" ? 0 : 
      (snapshot.aggregated?.modules?.[selectedModule]?.classesGiven || 0);
    const totalAbsencesModule = selectedModule === "__general__" ? 0 :
      sumRecordValuesExcludingJ(snapshot.aggregated?.modules?.[selectedModule]?.absenceCounts);
    const currentPercentModule = calcPercent(totalAbsencesModule, totalSessionsModule);
    const projectedPercentModule = calcPercent(totalAbsencesModule + addedAbsences, totalSessionsModule);

    // Generar metadatos de módulos
    const moduleMeta = Object.keys(snapshot.aggregated?.modules || {}).map((code) => {
      const label = snapshot.legend?.modules?.[code] || code;
      const classes = snapshot.aggregated?.modules?.[code]?.classesGiven || 0;
      const absDirectas = sumRecordValuesExcludingJ(snapshot.aggregated?.modules?.[code]?.absenceCounts);
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
        const retoDirectAbs = sumRecordValuesExcludingJ(snapshot.aggregated?.modules?.[selectedModule]?.absenceCounts);
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

          const moduleClasses = snapshot.aggregated?.modules?.[m]?.classesGiven || 0;
          const moduleDirectAbs = sumRecordValuesExcludingJ(snapshot.aggregated?.modules?.[m]?.absenceCounts);

          // Faltas del reto distribuidas a este módulo
          const retoFaltasDistribuidas = retoDirectAbs * coeficiente;
          const retoFaltasDistribuidasProjected = (retoDirectAbs + addedAbsences) * coeficiente;

          // Sesiones derivadas del reto ponderadas para el módulo
          const derivedSessionsFromReto = retoClasses * coeficiente;

          // Total faltas = directas + distribuidas del reto
          const totalCurrent = moduleDirectAbs + retoFaltasDistribuidas;
          const totalProjected = moduleDirectAbs + retoFaltasDistribuidasProjected;

          // Denominador: sesiones del módulo + sesiones derivadas del reto
          const totalSessionsForPercent = moduleClasses + derivedSessionsFromReto;

          const current = calcPercent(totalCurrent, totalSessionsForPercent);
          const projected = calcPercent(totalProjected, totalSessionsForPercent);

          modules.push({ code: m, label: moduleLabel, current, projected, classes: moduleClasses });
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
