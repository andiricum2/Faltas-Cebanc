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
    const retoData = snapshot.aggregated.modules[retoId];
    const retoFaltas = sumarFaltas(retoData?.absenceCounts);
    const retoAsistencias = retoData?.classesGiven || 0;

    if (retoFaltas > 0 || retoAsistencias > 0) {
      // Determinar módulos objetivo
      let targets = nonRetoModules;
      const selected = retoTargets[retoId];
      if (selected && Object.values(selected).some(Boolean)) {
        targets = nonRetoModules.filter(m => !!selected[m]);
      }

      if (targets.length > 0) {
        // Calcular coeficientes basados en horas semanales
        const hours = targets.map(m => Math.max(0, Number(hoursPerModule[m] || 0)));
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
  }

  // Calcular estadísticas detalladas por módulo si se solicita
  if (addModuleCalculations) {
    for (const moduleCode of nonRetoModules) {
      const moduleData = distributedSnapshot.aggregated.modules[moduleCode];
      let faltasDerivadas = 0;
      let asistenciasDerivadas = 0;

      // Calcular faltas derivadas de retos usando datos originales
      Object.entries(coeficientes).forEach(([retoId, coeficientesReto]) => {
        const coeficiente = coeficientesReto[moduleCode] || 0;
        if (coeficiente > 0) {
          // Usar datos originales del reto, no los distribuidos
          const retoData = snapshot.aggregated.modules[retoId];
          const retoFaltas = sumarFaltas(retoData?.absenceCounts);
          const retoAsistencias = retoData?.classesGiven || 0;
          faltasDerivadas += Number((retoFaltas * coeficiente).toFixed(2));
          asistenciasDerivadas += Number((retoAsistencias * coeficiente).toFixed(2));
        }
      });

      // Calcular faltas directas (excluyendo las distribuidas de retos)
      // Las faltas directas son las que NO vienen de retos
      const faltasDirectas = sumarFaltas(moduleData?.absenceCounts);
      const asistenciasDirectas = Number((moduleData?.classesGiven || 0));
      const totalFaltas = Number((faltasDirectas + faltasDerivadas));
      const totalSesiones = Number((asistenciasDirectas + asistenciasDerivadas));
      const sesionesDirectas = Number(asistenciasDirectas);
      const sesionesDerivadas = Number(asistenciasDerivadas);

      moduleCalculations[moduleCode] = {
        faltasDirectas: Math.max(0, faltasDirectas),
        faltasDerivadas: Number(faltasDerivadas),
        sesionesDirectas,
        sesionesDerivadas,
        totalFaltas: Number(totalFaltas),
        totalSesiones: Number(totalSesiones)
      };
    }
  }

  return {
    distributedSnapshot,
    coeficientes,
    ...(addModuleCalculations && { moduleCalculations })
  };
}