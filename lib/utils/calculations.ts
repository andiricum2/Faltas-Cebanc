/**
 * Utilidades de cálculo compartidas entre frontend y backend
 */

export function sumarFaltas(record: Record<string, number> | undefined): number {
  if (!record) return 0;
  return Object.entries(record).reduce((acc, [code, n]) => {
    if (code === "J") return acc; // Justificadas no cuentan
    const count = Number.isFinite(n) ? (n as number) : 0;
    // Aplicar peso: R (retraso) cuenta como 1/3 de falta
    const weight = code === "R" ? 1/3 : 1;
    return acc + count * weight;
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

/**
 * Distribuye faltas de retos a módulos objetivo basado en horas semanales configuradas
 * Esta es la función centralizada para toda la lógica de distribución de retos
 */
export function getModuleCalculations(
  snapshot: {
    aggregated: {
      modules: Record<string, { classesGiven: number; absenceCounts: Record<string, number> }>;
      absenceTotals: Record<string, number>;
    };
    legend: { modules: Record<string, string> };
  },
  retoTargets: Record<string, Record<string, boolean>>,
  hoursPerModule: Record<string, number>,
  retoModuleHours: Record<string, Record<string, number>> = {},
  options: {
    cleanRetoFaltas?: boolean; // Si true, limpia las faltas del reto después de distribuir
    addModuleCalculations?: boolean; // Si true, añade cálculos detallados por módulo
  } = {}
): {
  distributedSnapshot: typeof snapshot;
  coeficientes: Record<string, Record<string, number>>;
  moduleCalculations?: Record<string, {
    faltasDirectas: number;
    faltasDerivadas: number;
    faltasDerivadasPorTipo: Record<string, number>; // Desglose por tipo de falta (F, J, R, etc.)
    sesionesDirectas: number;
    sesionesDerivadas: number;
    totalFaltas: number;
    totalSesiones: number;
  }>;
} {
  const { cleanRetoFaltas = false, addModuleCalculations = false } = options;
  
  // Identificar retos y módulos no-reto
  const retos = Object.keys(snapshot.aggregated.modules).filter(code =>
    isRetoModule(code, snapshot.legend.modules[code])
  );
  
  const nonRetoModules = Object.keys(snapshot.aggregated.modules).filter(code =>
    !isRetoModule(code, snapshot.legend.modules[code])
  );

  // Crear copia del snapshot para modificar
  const distributedSnapshot = {
    ...snapshot,
    aggregated: {
      ...snapshot.aggregated,
      modules: { ...snapshot.aggregated.modules },
      absenceTotals: { ...snapshot.aggregated.absenceTotals }
    }
  };

  const coeficientes: Record<string, Record<string, number>> = {};
  const moduleCalculations: Record<string, any> = {};

  // Procesar cada reto
  for (const retoId of retos) {

    // Determinar módulos objetivo
    let targets = nonRetoModules;
    const selected = retoTargets[retoId];
    if (selected && Object.values(selected).some(Boolean)) {
      targets = nonRetoModules.filter(m => !!selected[m]);
    }

    if (targets.length > 0) {
      // Calcular coeficientes basados en horas específicas del reto o horas semanales del módulo
      const retoHours = retoModuleHours[retoId] || {};
      const hours = targets.map(m => {
        // Si hay horas específicas para este módulo en este reto, usarlas
        if (retoHours[m] !== undefined) {
          return Math.max(0, Number(retoHours[m]));
        }
        // Si no, usar las horas semanales del módulo
        return Math.max(0, Number(hoursPerModule[m] || 0));
      });
      const sumHours = hours.reduce((a, b) => a + b, 0);

      let coeficientesReto: Record<string, number>;
      if (sumHours > 0) {
        coeficientesReto = Object.fromEntries(
          targets.map((m, i) => [m, Number((hours[i] / sumHours))])
        );
      } else {
        const equal = Number((1 / targets.length));
        coeficientesReto = Object.fromEntries(
          targets.map(m => [m, equal])
        );
      }

      // Limpiar faltas del reto si se especifica
      if (cleanRetoFaltas) {
        distributedSnapshot.aggregated.modules[retoId].absenceCounts = {};
      }

      coeficientes[retoId] = coeficientesReto;
    }
  }

  // Calcular estadísticas detalladas por módulo si se solicita
  if (addModuleCalculations) {
    for (const moduleCode of nonRetoModules) {
      const moduleData = distributedSnapshot.aggregated.modules[moduleCode];
      let faltasDerivadas = 0;
      let asistenciasDerivadas = 0;
      const faltasDerivadasPorTipo: Record<string, number> = {};

      // Calcular faltas derivadas de retos usando datos originales
      Object.entries(coeficientes).forEach(([retoId, coeficientesReto]) => {
        const coeficiente = coeficientesReto[moduleCode] || 0;
        if (coeficiente > 0) {
          // Usar datos originales del reto, no los distribuidos
          const retoData = snapshot.aggregated.modules[retoId];
          const retoAsistencias = retoData?.classesGiven || 0;
          
          // Multiplicar cada tipo de falta por el coeficiente antes de sumarlas
          const absenceCounts = retoData?.absenceCounts || {};
          const ponderatedAbsences: Record<string, number> = {};
          for (const [code, count] of Object.entries(absenceCounts)) {
            const ponderatedValue = Number((count * coeficiente).toFixed(2));
            ponderatedAbsences[code] = ponderatedValue;
            
            // Acumular por tipo de falta
            faltasDerivadasPorTipo[code] = (faltasDerivadasPorTipo[code] || 0) + ponderatedValue;
          }
          const retoFaltasPonderadas = Number(sumarFaltas(ponderatedAbsences).toFixed(2));
          
          // No redondear valores intermedios para evitar acumulación de errores
          faltasDerivadas += retoFaltasPonderadas;
          asistenciasDerivadas += retoAsistencias * coeficiente;
        }
      });

      // Calcular faltas directas (excluyendo las distribuidas de retos)
      // Las faltas directas son las que NO vienen de retos
      const faltasDirectas = sumarFaltas(moduleData?.absenceCounts);
      const asistenciasDirectas = moduleData?.classesGiven || 0;
      
      // Redondear solo al final para evitar acumulación de errores
      const totalFaltas = Number((faltasDirectas + faltasDerivadas).toFixed(2));
      const totalSesiones = Number((asistenciasDirectas + asistenciasDerivadas).toFixed(2));

      // Redondear las faltas derivadas por tipo
      const faltasDerivadasPorTipoRedondeadas: Record<string, number> = {};
      for (const [code, value] of Object.entries(faltasDerivadasPorTipo)) {
        faltasDerivadasPorTipoRedondeadas[code] = Number(value.toFixed(2));
      }

      moduleCalculations[moduleCode] = {
        faltasDirectas: Math.max(0, Number(faltasDirectas.toFixed(2))),
        faltasDerivadas: Number(faltasDerivadas.toFixed(2)),
        faltasDerivadasPorTipo: faltasDerivadasPorTipoRedondeadas,
        sesionesDirectas: Number(asistenciasDirectas.toFixed(2)),
        sesionesDerivadas: Number(asistenciasDerivadas.toFixed(2)),
        totalFaltas,
        totalSesiones
      };
    }
  }

  return {
    distributedSnapshot,
    coeficientes,
    ...(addModuleCalculations && { moduleCalculations })
  };
}