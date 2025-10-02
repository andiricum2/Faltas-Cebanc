"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StudentSnapshot as Snapshot } from "@/lib/types/faltas";
import { StatCard } from "@/components/ui/stat-card";
import { useSnapshot } from "@/lib/services/snapshotContext";
import { getStatistics, type StatisticsResponse } from "@/lib/services/apiClient";


export default function DashboardPage() {
  const { snapshot, loading, error, syncNow } = useSnapshot();
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number | null>(null);
  const [autoSync, setAutoSync] = useState<boolean>(false);
  const [statistics, setStatistics] = useState<StatisticsResponse | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  
  const absenceLegend = snapshot?.legend.absenceTypes || {};
  
  // Los datos ya vienen calculados del servidor
  const moduleCalculations = (snapshot as any)?.moduleCalculations || {};

  // Cargar estadísticas cuando cambie el snapshot
  useEffect(() => {
    if (!snapshot?.identity?.dni) return;
    
    const loadStatistics = async () => {
      setStatisticsLoading(true);
      try {
        const result = await getStatistics(snapshot.identity.dni, "all", "all");
        setStatistics(result);
      } catch (error) {
        console.error("Error loading statistics:", error);
      } finally {
        setStatisticsLoading(false);
      }
    };

    loadStatistics();
  }, [snapshot?.identity?.dni]);

  // Usar datos del endpoint de estadísticas
  const modulesTable = useMemo(() => {
    return statistics?.modulesTable || { normalModules: [], retoModules: [] };
  }, [statistics]);
  
  const topLine = useMemo(() => statistics?.topLine || "", [statistics]);
  const weeklySeries = useMemo(() => statistics?.weeklySeries || [], [statistics]);
  const monthlySeries = useMemo(() => statistics?.monthlySeries || [], [statistics]);
  const kpis = useMemo(() => statistics?.kpis || null, [statistics]);
  const selectedWeek = useMemo(() => {
    if (!snapshot || selectedWeekIdx === null) return null;
    const week = snapshot.weeks[selectedWeekIdx];
    return week ? { ...week, sessions: week.sessions } : null;
  }, [snapshot, selectedWeekIdx]);

  useEffect(() => {
    const stored = localStorage.getItem("autosync") === "1";
    setAutoSync(stored);
    // Initial sync is handled by SnapshotProvider to avoid double requests
  }, []);

  return (
      <div className="w-full space-y-6">
          <CardHeader className="p-0">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">Panel de asistencia</h1>
            </div>
          </CardHeader>
          <CardContent>
            {snapshot ? (
              <div className="w-full">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">{topLine}</div>
                      <div className="text-xl font-semibold">{snapshot.identity.fullName} ({snapshot.identity.dni})</div>
                      {snapshot.identity.group && <div className="text-muted-foreground">{snapshot.identity.group}</div>}
                      {kpis ? (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <StatCard label="Faltas (total)" value={kpis.totalAbsences} />
                          <StatCard
                            label="Últimos 30 días"
                            value={<span className="flex items-center gap-2">{kpis.last30}<Badge variant={kpis.delta <= 0 ? "success" : "warning"}>{kpis.delta <= 0 ? "↘" : "↗"} {Math.abs(kpis.delta)}</Badge></span>}
                          />
                          <Card className="col-span-2">
                            <CardContent className="p-3">
                              <div className="text-xs text-muted-foreground">Top módulos con ausencias</div>
                              <div className="text-sm flex gap-3 mt-1 flex-wrap">
                                {kpis.topModules.map((t)=> (
                                  <Badge key={t.key} variant="outline">{t.key}: {t.count}</Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : statisticsLoading ? (
                        <div className="text-muted-foreground">Cargando estadísticas...</div>
                      ) : null}
                      <div className="mt-4">
                        <div className="font-semibold mb-1">Porcentajes globales</div>
                        <div className="text-sm">Total: {snapshot.percentages.totalPercent}%</div>
                        <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                          {Object.entries(snapshot.percentages.byModule).map(([k, v]) => (
                            <div key={k} className="flex justify-between"><span className="truncate mr-2">{k}</span><span>{v}%</span></div>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Leyenda faltas: {Object.entries(absenceLegend).map(([k, v]) => `${k}=${v}`).join(" · ")}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {/* Tabla de módulos normales */}
                      <div>
                        <div className="font-semibold mb-2">Módulos</div>
                        <div className="border rounded-md divide-y">
                          <div className="grid grid-cols-7 text-sm font-medium bg-muted px-3 py-2">
                            <div>Módulo</div>
                            <div className="text-center">Sesiones directas</div>
                            <div className="text-center">Sesiones de retos</div>
                            <div className="text-center">Total sesiones</div>
                            <div className="text-center">Faltas directas</div>
                            <div className="text-center">Faltas de retos</div>
                            <div className="text-center">Total faltas</div>
                          </div>
                          {modulesTable.normalModules?.map((row) => {
                            const calculations = moduleCalculations[row.key] || {
                              faltasDirectas: 0,
                              faltasDerivadas: 0,
                              asistenciasDirectas: 0,
                              asistenciasDerivadas: 0,
                              totalFaltas: 0,
                              totalAsistencias: 0
                            };
                            
                            return (
                              <div key={row.key} className="grid grid-cols-7 text-sm px-3 py-2">
                                <div className="truncate" title={row.key}>{row.key}</div>
                                <div className="text-center font-mono">{calculations.asistenciasDirectas.toFixed(2)}</div>
                                <div className="text-center font-mono text-blue-600">
                                  {calculations.asistenciasDerivadas.toFixed(2)}
                                </div>
                                <div className="text-center font-mono font-semibold">
                                  {calculations.totalAsistencias.toFixed(2)}
                                </div>
                                <div className="text-center font-mono">{calculations.faltasDirectas.toFixed(2)}</div>
                                <div className="text-center font-mono text-blue-600">
                                  {calculations.faltasDerivadas.toFixed(2)}
                                </div>
                                <div className="text-center font-mono font-semibold">
                                  {calculations.totalFaltas.toFixed(2)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Tabla de retos */}
                      <div>
                        <div className="font-semibold mb-2">Retos</div>
                        <div className="border rounded-md divide-y">
                          <div className="grid grid-cols-3 text-sm font-medium bg-muted px-3 py-2">
                            <div>Reto</div>
                            <div className="text-center">Sesiones</div>
                            <div className="text-right">Faltas</div>
                          </div>
                          {modulesTable.retoModules?.map((row) => (
                            <div key={row.key} className="grid grid-cols-3 text-sm px-3 py-2">
                              <div className="truncate" title={row.key}>{row.key}</div>
                              <div className="text-center font-mono">{Number(row.classes).toFixed(2)}</div>
                              <div className="text-right font-mono">{row.absences}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            ) : (
              loading ? (
                <div className="space-y-4">
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-muted rounded w-40"></div>
                    <div className="h-6 bg-muted rounded w-64"></div>
                    <div className="h-4 bg-muted rounded w-72"></div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 animate-pulse">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-16 bg-muted rounded"></div>
                        <div className="h-16 bg-muted rounded"></div>
                      </div>
                      <div className="h-32 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-56"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-6 bg-muted rounded w-40"></div>
                      <div className="border rounded-md">
                        <div className="h-8 bg-muted rounded-t"></div>
                        <div className="divide-y">
                          <div className="h-8 bg-muted"></div>
                          <div className="h-8 bg-muted"></div>
                          <div className="h-8 bg-muted"></div>
                          <div className="h-8 bg-muted"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-72 bg-muted rounded animate-pulse"></div>
                </div>
              ) : (
                <div className="text-muted-foreground">No hay datos.</div>
              )
            )}
          </CardContent>
      </div>
  );
}
