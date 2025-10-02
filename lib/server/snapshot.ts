import fs from "node:fs/promises";
import path from "node:path";
import { buildSnapshot } from "@/lib/http/scraper";
import type { StudentSnapshot, WeekSessions, UserIdentity, LegendModules, LegendAbsenceTypes, GlobalPercentages } from "@/lib/types/faltas";

export async function loadProcessedSnapshot(dni: string): Promise<StudentSnapshot> {
  const baseBase = process.env.APP_DATA_DIR || process.cwd();
  const baseDir = path.join(baseBase, ".data", dni);

  const [snapshotData, weeksData, legendData, percentagesData] = await Promise.all([
    fs.readFile(path.join(baseDir, "snapshot.json"), "utf-8"),
    fs.readFile(path.join(baseDir, "weeks.json"), "utf-8"),
    fs.readFile(path.join(baseDir, "legend.json"), "utf-8"),
    fs.readFile(path.join(baseDir, "percentages.json"), "utf-8")
  ]);

  const rawSnapshot = JSON.parse(snapshotData);
  const weeks: WeekSessions[] = JSON.parse(weeksData);
  const legend = JSON.parse(legendData);
  const percentages: GlobalPercentages = JSON.parse(percentagesData);

  let retoTargets: Record<string, Record<string, boolean>> = {};
  let hoursPerModule: Record<string, number> = {};
  try {
    const retoTargetsData = await fs.readFile(path.join(baseDir, "retoTargets.json"), "utf-8");
    retoTargets = JSON.parse(retoTargetsData);
  } catch {}
  try {
    const hoursPerModuleData = await fs.readFile(path.join(baseDir, "hoursPerModule.json"), "utf-8");
    hoursPerModule = JSON.parse(hoursPerModuleData);
  } catch {}

  const identity: UserIdentity = rawSnapshot.identity;
  const snapshot = buildSnapshotWithRetoDistribution(
    weeks,
    identity,
    legend,
    percentages,
    retoTargets,
    hoursPerModule
  );

  // Persist processed snapshot atomically
  try {
    const tmpPath = path.join(baseDir, "snapshot.json.tmp");
    const finalPath = path.join(baseDir, "snapshot.json");
    await fs.writeFile(tmpPath, JSON.stringify(snapshot, null, 2), "utf-8");
    await fs.rename(tmpPath, finalPath);
  } catch {}

  return snapshot;
}

export function buildSnapshotWithRetoDistribution(
  weeks: WeekSessions[],
  identity: UserIdentity,
  legend: { modules: LegendModules; absenceTypes: LegendAbsenceTypes },
  percentages: GlobalPercentages,
  retoTargets: Record<string, Record<string, boolean>>,
  hoursPerModule: Record<string, number>
): StudentSnapshot {
  const baseSnapshot = buildSnapshot(weeks, identity, legend, percentages);

  const isReto = (code: string, label: string | undefined) =>
    /(?<![A-Za-z0-9])\d[A-Za-z]{2}\d(?![A-Za-z0-9])/i.test(`${code} ${label || ""}`);

  const retos = Object.keys(baseSnapshot.aggregated.modules).filter(code =>
    isReto(code, legend.modules[code])
  );

  const nonRetoModules = Object.keys(baseSnapshot.aggregated.modules).filter(code =>
    !isReto(code, legend.modules[code])
  );

  const distributedSnapshot = {
    ...baseSnapshot,
    aggregated: {
      ...baseSnapshot.aggregated,
      modules: { ...baseSnapshot.aggregated.modules },
      absenceTotals: { ...baseSnapshot.aggregated.absenceTotals }
    },
    coeficientes: {} as Record<string, Record<string, number>>,
    moduleCalculations: {} as Record<string, {
      faltasDirectas: number;
      faltasDerivadas: number;
      asistenciasDirectas: number;
      asistenciasDerivadas: number;
      totalFaltas: number;
      totalAsistencias: number;
    }>
  };

  for (const retoId of retos) {
    const retoFaltas = Object.entries(baseSnapshot.aggregated.modules[retoId]?.absenceCounts || {})
      .filter(([k]) => k !== "J")
      .reduce((a, [, v]) => a + (v as number), 0);

    let targets = nonRetoModules;
    const selected = retoTargets[retoId];
    if (selected && Object.values(selected).some(Boolean)) {
      targets = nonRetoModules.filter(m => !!selected[m]);
    }

    if (targets.length > 0) {
      const hours = targets.map(m => Math.max(0, Number(hoursPerModule[m] || 0)));
      const sumHours = hours.reduce((a, b) => a + b, 0);

      let coeficientes: Record<string, number>;
      if (sumHours > 0) {
        coeficientes = Object.fromEntries(
          targets.map((m, i) => [m, Number((hours[i] / sumHours).toFixed(2))])
        );
      } else {
        const equal = Number((1 / targets.length).toFixed(2));
        coeficientes = Object.fromEntries(
          targets.map(m => [m, equal])
        );
      }

      if (retoFaltas > 0) {
        for (const targetCode of targets) {
          const coeficiente = coeficientes[targetCode] || 0;
          const distributedFaltas = Math.round(retoFaltas * coeficiente);
          if (distributedFaltas > 0) {
            if (!distributedSnapshot.aggregated.modules[targetCode]) {
              distributedSnapshot.aggregated.modules[targetCode] = { classesGiven: 0, absenceCounts: {} } as any;
            }
            distributedSnapshot.aggregated.modules[targetCode].absenceCounts!["F"] =
              (distributedSnapshot.aggregated.modules[targetCode].absenceCounts!["F"] || 0) + distributedFaltas;
          }
        }
      }

      distributedSnapshot.coeficientes[retoId] = coeficientes;
    }
  }

  for (const moduleCode of nonRetoModules) {
    const moduleData = distributedSnapshot.aggregated.modules[moduleCode];
    let faltasDerivadas = 0;
    let asistenciasDerivadas = 0;

    if (distributedSnapshot.coeficientes) {
      Object.entries(distributedSnapshot.coeficientes).forEach(([retoId, coeficientes]) => {
        const coeficiente = coeficientes[moduleCode] || 0;
        if (coeficiente > 0) {
          // Usar datos del reto directamente (ya no se limpian)
          const retoData = distributedSnapshot.aggregated.modules[retoId];
          const retoFaltas = Object.entries(retoData?.absenceCounts || {})
            .filter(([k]) => k !== "J")
            .reduce((a, [, v]) => a + (v as number), 0);
          const retoAsistencias = retoData?.classesGiven || 0;
          faltasDerivadas += Number((retoFaltas * coeficiente).toFixed(2));
          asistenciasDerivadas += Number((retoAsistencias * coeficiente).toFixed(2));
        }
      });
    }

    // Las faltas directas son las faltas que NO vienen de retos (todas excepto "J" y "F")
    const faltasDirectas = Object.entries(moduleData?.absenceCounts || {})
      .filter(([k]) => k !== "J")
      .reduce((a, [, v]) => a + (v as number), 0);
    const asistenciasDirectas = Number((moduleData?.classesGiven || 0).toFixed(2));
    const totalFaltas = Number((faltasDirectas + faltasDerivadas).toFixed(2));
    const totalAsistencias = Number((asistenciasDirectas + asistenciasDerivadas).toFixed(2));

    distributedSnapshot.moduleCalculations[moduleCode] = {
      faltasDirectas: Math.max(0, faltasDirectas),
      faltasDerivadas: Number(faltasDerivadas.toFixed(2)),
      asistenciasDirectas: Number(asistenciasDirectas.toFixed(2)),
      asistenciasDerivadas: Number(asistenciasDerivadas.toFixed(2)),
      totalFaltas: Number(totalFaltas.toFixed(2)),
      totalAsistencias: Number(totalAsistencias.toFixed(2))
    };
  }

  return distributedSnapshot;
}


