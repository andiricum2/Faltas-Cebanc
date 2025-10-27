import fs from "node:fs/promises";
import path from "node:path";
import { buildSnapshot } from "@/lib/http/scraper";
import { getModuleCalculations } from "@/lib/utils";
import { writeJsonFile } from "@/lib/server/storage";
import type { StudentSnapshot, WeekSessions, UserIdentity, LegendModules, LegendAbsenceTypes, GlobalPercentages } from "@/lib/types/faltas";
import type { ThemeConfig } from "@/lib/types/theme";

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
  let retoModuleHours: Record<string, Record<string, number>> = {};
  let selectedGroup: string | null = null;
  let theme: any = undefined;
  
  try {
    const retoTargetsData = await fs.readFile(path.join(baseDir, "retoTargets.json"), "utf-8");
    retoTargets = JSON.parse(retoTargetsData);
  } catch (error) {
    // Missing is fine on first run; only warn for non-ENOENT errors
    if ((error as any)?.code !== "ENOENT") {
      console.warn(`No se pudo cargar retoTargets.json para ${dni}:`, error);
    }
  }
  
  try {
    const hoursPerModuleData = await fs.readFile(path.join(baseDir, "hoursPerModule.json"), "utf-8");
    hoursPerModule = JSON.parse(hoursPerModuleData);
  } catch (error) {
    // Missing is fine on first run; only warn for non-ENOENT errors
    if ((error as any)?.code !== "ENOENT") {
      console.warn(`No se pudo cargar hoursPerModule.json para ${dni}:`, error);
    }
  }
  
  try {
    const retoModuleHoursData = await fs.readFile(path.join(baseDir, "retoModuleHours.json"), "utf-8");
    retoModuleHours = JSON.parse(retoModuleHoursData);
  } catch (error) {
    // Missing is fine on first run; only warn for non-ENOENT errors
    if ((error as any)?.code !== "ENOENT") {
      console.warn(`No se pudo cargar retoModuleHours.json para ${dni}:`, error);
    }
  }

  // Cargar appConfig para ver si hay grupo seleccionado
  try {
    const appCfgData = await fs.readFile(path.join(baseDir, "appConfig.json"), "utf-8");
    const appCfg = JSON.parse(appCfgData);
    if (typeof appCfg?.selectedGroup === "string") {
      selectedGroup = appCfg.selectedGroup;
    } else if (appCfg?.selectedGroup === null) {
      selectedGroup = null;
    }
  } catch {}

  // Cargar theme
  try {
    const themeData = await fs.readFile(path.join(baseDir, "theme.json"), "utf-8");
    theme = JSON.parse(themeData);
  } catch (error) {
    // Missing is fine on first run; only warn for non-ENOENT errors
    if ((error as any)?.code !== "ENOENT") {
      console.warn(`No se pudo cargar theme.json para ${dni}:`, error);
    }
  }

  // Si hay grupo seleccionado, cargar presets del grupo desde GitHub y usarlos (sobre-escriben personalizados)
  if (selectedGroup && selectedGroup !== "personalizado") {
    try {
      const repo = "andiricum2/Faltas-Cebanc"; // owner/repo
      const branch = "main";
      const dir = "grupos";

      {
        const rawUrl = `https://raw.githubusercontent.com/${repo}/${encodeURIComponent(branch)}/${encodeURIComponent(dir)}/${encodeURIComponent(selectedGroup)}.json`;
        const res = await fetch(rawUrl, { headers: { "User-Agent": "FaltasCebanc-App" } });
        if (res.ok) {
          const parsed = await res.json();
          const gTargets: Record<string, Record<string, boolean>> = parsed.retoTargets || {};
          const gRetoModuleHours: Record<string, Record<string, number>> = parsed.retoModuleHours || {};
          const gWeekSchedule: (string | null)[][] | undefined = parsed.weekSchedule;
          
          // Calcular hoursPerModule desde weekSchedule si existe, sino usar el valor del grupo
          if (gWeekSchedule && Array.isArray(gWeekSchedule)) {
            const calculatedHours: Record<string, number> = {};
            for (const hourRow of gWeekSchedule) {
              for (const moduleCode of hourRow) {
                if (moduleCode) {
                  calculatedHours[moduleCode] = (calculatedHours[moduleCode] || 0) + 1;
                }
              }
            }
            hoursPerModule = calculatedHours;
            
            // Guardar weekSchedule del grupo
            const weekSchedulePath = `${baseDir}/weekSchedule.json`;
            await writeJsonFile(weekSchedulePath, gWeekSchedule);
          } else {
            // Fallback: usar hoursPerModule del grupo si no hay weekSchedule
            const gHours: Record<string, number> = parsed.hoursPerModule || parsed.hours || {};
            hoursPerModule = gHours || {};
          }
          
          retoTargets = gTargets || {};
          retoModuleHours = gRetoModuleHours || {};
        } else {
          console.warn(`No se pudo fetchear grupo '${selectedGroup}' desde GitHub (status ${res.status}).`);
        }
      }
    } catch (e) {
      console.warn(`No se pudo cargar grupo '${selectedGroup}' desde GitHub, usando configuraciones personalizadas si existen.`);
    }
  }

  const identity: UserIdentity = rawSnapshot.identity;
  
  // Construir snapshot base y aplicar distribución de retos
  const baseSnapshot = buildSnapshot(weeks, identity, legend, percentages);
  
  const { distributedSnapshot, coeficientes, moduleCalculations } = getModuleCalculations(
    baseSnapshot,
    retoTargets,
    hoursPerModule,
    retoModuleHours,
    {
      cleanRetoFaltas: false,
      addModuleCalculations: true
    }
  );

  const snapshot: StudentSnapshot = {
    ...baseSnapshot,
    aggregated: distributedSnapshot.aggregated,
    coeficientes,
    moduleCalculations: moduleCalculations || {},
    theme
  };

  // Persistir snapshot procesado usando función robusta
  try {
    await writeJsonFile(path.join(baseDir, "snapshot.json"), snapshot);
  } catch (error) {
    console.error("Error persisting snapshot:", error);
  }

  return snapshot;
}



