"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StudentSnapshot as Snapshot } from "@/lib/types/faltas";
import { StatCard } from "@/components/ui/stat-card";
import { buildKpis, buildModulesTable, buildMonthlySeries, buildSelectedWeek, buildTopLine, buildWeeklySeries } from "@/lib/services/snapshotService";
import { useSnapshot } from "@/lib/services/snapshotContext";


export default function DashboardPage() {
  const { snapshot, loading, error, syncNow } = useSnapshot();
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number | null>(null);
  const [autoSync, setAutoSync] = useState<boolean>(false);
  const absenceLegend = snapshot?.legend.absenceTypes || {};

  const modulesTable = useMemo(
    () => (snapshot ? buildModulesTable(snapshot, "all", "all") : []),
    [snapshot]
  );
  const topLine = useMemo(() => snapshot ? buildTopLine(snapshot) : "", [snapshot]);
  const weeklySeries = useMemo(
    () => (snapshot ? buildWeeklySeries(snapshot, "all", "all") : []),
    [snapshot]
  );
  const monthlySeries = useMemo(
    () => (snapshot ? buildMonthlySeries(snapshot, "all", "all") : []),
    [snapshot]
  );
  const kpis = useMemo(() => snapshot ? buildKpis(snapshot) : null, [snapshot]);
  const selectedWeek = useMemo(
    () => (snapshot ? buildSelectedWeek(snapshot, selectedWeekIdx, "all", "all") : null),
    [snapshot, selectedWeekIdx]
  );

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
                      {kpis && (
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
                      )}
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
                    <div>
                      <div className="font-semibold mb-2">Resumen por módulo</div>
                      <div className="border rounded-md divide-y">
                        <div className="grid grid-cols-3 text-sm font-medium bg-muted px-3 py-2">
                          <div>Módulo</div>
                          <div className="text-center">Sesiones</div>
                          <div className="text-right">Faltas</div>
                        </div>
                        {modulesTable.map((row) => (
                          <div key={row.key} className="grid grid-cols-3 text-sm px-3 py-2">
                            <div className="truncate" title={row.key}>{row.key}</div>
                            <div className="text-center">{row.classes}</div>
                            <div className="text-right font-mono">{row.absences}</div>
                          </div>
                        ))}
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
