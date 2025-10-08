import { useMemo } from "react";
import { calcPercent, sumarFaltas } from "@/lib/utils";
import type { SnapshotData, ModuleCalculation, RetoCalculation } from "@/lib/types/snapshot";

export function useModuleCalculations(snapshot: SnapshotData | null) {
  return useMemo((): ModuleCalculation[] => {
    const moduleCalcs = snapshot?.moduleCalculations;
    if (!snapshot || !moduleCalcs) return [];
    
    const names = snapshot.legend?.modules || {};
    return Object.entries(moduleCalcs)
      .map(([code, cal]) => {
        const fd = Number(cal?.faltasDirectas || 0);
        const fe = Number(cal?.faltasDerivadas || 0);
        const sd = Number(cal?.sesionesDirectas || 0);
        const se = Number(cal?.sesionesDerivadas || 0);
        const tf = Number(cal?.totalFaltas ?? (fd + fe));
        const ts = Number(cal?.totalSesiones ?? (sd + se));
        return {
          code,
          name: names[code] || code,
          faltasDirectas: fd,
          faltasDerivadas: fe,
          sesionesDirectas: sd,
          sesionesDerivadas: se,
          totalFaltas: tf,
          totalSesiones: ts,
          percent: calcPercent(tf, ts),
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [snapshot?.moduleCalculations, snapshot?.legend?.modules]);
}

export function useRetoCalculations(snapshot: SnapshotData | null) {
  return useMemo((): RetoCalculation[] => {
    if (!snapshot?.retos || !snapshot?.aggregated?.modules) return [];
    
    return snapshot.retos
      .map((r) => {
        const moduleData = snapshot.aggregated?.modules?.[r.id];
        const absenceCounts = moduleData?.absenceCounts || {};
        const totalFaltas = sumarFaltas(absenceCounts);
        const totalSesiones = moduleData?.classesGiven || 0;
        return {
          id: r.id,
          label: r.label,
          totalFaltas,
          totalSesiones,
          percent: calcPercent(totalFaltas, totalSesiones),
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [snapshot?.retos, snapshot?.aggregated?.modules]);
}

export function useStatisticsMetrics(statistics: any) {
  return useMemo(() => {
    const weeklySeries = statistics?.weeklySeries || [];
    if (!weeklySeries.length) return null;

    const totalFaltas = weeklySeries.reduce((sum: number, week: any) => sum + (week.total || 0), 0);
    const avgFaltasSemana = totalFaltas / weeklySeries.length;
    
    // Calcular tendencia de forma más eficiente
    const trend = weeklySeries.length > 1 
      ? (weeklySeries[weeklySeries.length - 1].total || 0) - (weeklySeries[weeklySeries.length - 2].total || 0) 
      : 0;

    // Encontrar la semana con más faltas usando reduce una sola vez
    const maxWeekData = weeklySeries.reduce((max: any, week: any) => 
      (week.total || 0) > (max.total || 0) ? week : max
    );

    return {
      totalFaltas: Math.round(totalFaltas),
      avgFaltasSemana: avgFaltasSemana.toFixed(2),
      trend,
      maxWeek: maxWeekData?.total || 0,
      maxWeekLabel: maxWeekData?.label || '',
      weeksCount: weeklySeries.length
    };
  }, [statistics?.weeklySeries]);
}
