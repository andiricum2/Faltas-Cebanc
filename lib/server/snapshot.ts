import fs from "node:fs/promises";
import path from "node:path";
import { buildSnapshot } from "@/lib/http/scraper";
import { distributeRetoFaltas } from "@/lib/utils/calculations";
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
  } catch (error) {
    console.warn(`No se pudo cargar retoTargets.json para ${dni}:`, error);
  }
  
  try {
    const hoursPerModuleData = await fs.readFile(path.join(baseDir, "hoursPerModule.json"), "utf-8");
    hoursPerModule = JSON.parse(hoursPerModuleData);
  } catch (error) {
    console.warn(`No se pudo cargar hoursPerModule.json para ${dni}:`, error);
  }

  const identity: UserIdentity = rawSnapshot.identity;
  
  // Construir snapshot base y aplicar distribución de retos
  const baseSnapshot = buildSnapshot(weeks, identity, legend, percentages);
  
  const { distributedSnapshot, coeficientes, moduleCalculations } = distributeRetoFaltas(
    baseSnapshot,
    retoTargets,
    hoursPerModule,
    {
      cleanRetoFaltas: false,
      addModuleCalculations: true
    }
  );

  const snapshot: StudentSnapshot = {
    ...baseSnapshot,
    aggregated: distributedSnapshot.aggregated,
    coeficientes,
    moduleCalculations: moduleCalculations || {}
  };

  // Persistir snapshot procesado
  try {
    const tmpPath = path.join(baseDir, "snapshot.json.tmp");
    const finalPath = path.join(baseDir, "snapshot.json");
    await fs.writeFile(tmpPath, JSON.stringify(snapshot, null, 2), "utf-8");
    await fs.rename(tmpPath, finalPath);
  } catch (error) {
    console.error("Error persisting snapshot:", error);
  }

  return snapshot;
}



