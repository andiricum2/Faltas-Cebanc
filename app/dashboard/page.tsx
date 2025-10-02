"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { useSnapshot } from "@/lib/services/snapshotContext";
import { getStatistics, type StatisticsResponse } from "@/lib/services/apiClient";


export default function DashboardPage() {
  const { snapshot, loading, error } = useSnapshot();
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number | null>(null);
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
  const kpis = useMemo(() => statistics?.kpis || null, [statistics]);
  const totalPercent = snapshot?.percentages.totalPercent ?? 0;
  const userName = snapshot?.identity.fullName ?? "";
  const userInitial = useMemo(() => (userName?.trim()?.[0] || "U").toUpperCase(), [userName]);
  const dni = snapshot?.identity.dni ?? "";
  const studies = snapshot?.identity.group ?? "";

  // Semana actual (contiene la fecha de hoy) o última con ausencias; fallback al final
  const currentWeekIndex = useMemo(() => {
    if (!snapshot?.weeks?.length) return null;
    const today = new Date();
    const toDate = (iso: string) => new Date(iso + "T00:00:00");
    // 1) Buscar la semana que contiene hoy
    const idxToday = snapshot.weeks.findIndex((w) => {
      try {
        const start = toDate(w.weekStartISO);
        const end = toDate(w.weekEndISO);
        return today >= start && today <= end;
      } catch { return false; }
    });
    if (idxToday >= 0) return idxToday;
    // 2) Buscar la última semana con alguna falta
    for (let i = snapshot.weeks.length - 1; i >= 0; i -= 1) {
      const w = snapshot.weeks[i];
      const hasAbs = w.sessions?.some((c) => (c.cssClass || "").toLowerCase().includes("falta"));
      if (hasAbs) return i;
    }
    // 3) Fallback: la última
    return snapshot.weeks.length - 1;
  }, [snapshot?.weeks]);
  useEffect(() => {
    if (selectedWeekIdx === null && currentWeekIndex !== null) setSelectedWeekIdx(currentWeekIndex);
  }, [selectedWeekIdx, currentWeekIndex]);
  const selectedWeek = useMemo(() => {
    if (!snapshot || selectedWeekIdx === null) return null;
    const week = snapshot.weeks[selectedWeekIdx];
    return week ? { ...week, sessions: week.sessions } : null;
  }, [snapshot, selectedWeekIdx]);

  // Fecha de hoy en ISO local (yyyy-mm-dd) para resaltar el día actual
  const todayISO = useMemo(() => {
    const now = new Date();
    const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
    const local = new Date(now.getTime() - tzOffsetMs);
    return local.toISOString().slice(0, 10);
  }, []);

  // Cálculo de faltas por día en la semana seleccionada
  const weeklyAbsences = useMemo(() => {
    if (!selectedWeek) return [] as Array<{ date: string; total: number; types: Record<string, number> }>;
    const byDate: Record<string, { total: number; types: Record<string, number> }> = {};
    for (const d of selectedWeek.daysISO) byDate[d] = { total: 0, types: {} };
    for (const cell of selectedWeek.sessions) {
      if (!cell.dateISO) continue;
      const cls = (cell.cssClass || "").toLowerCase();
      // Solo contar si hay falta_<letra>
      const match = cls.match(/\bfalta[_\s-]([a-z])\b/i);
      if (!match) continue;
      const type = (match[1] || "?").toUpperCase();
      const bucket = byDate[cell.dateISO] || (byDate[cell.dateISO] = { total: 0, types: {} });
      bucket.total += 1;
      bucket.types[type] = (bucket.types[type] || 0) + 1;
    }
    return Object.entries(byDate).map(([date, v]) => ({ date, ...v }));
  }, [selectedWeek]);

  return (
    <div className="w-full space-y-6">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Panel de asistencia</h1>
        </div>
      </CardHeader>
      <CardContent>
        {snapshot ? (
          <div className="w-full space-y-6">
            {/* Top overview */}
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Profile */}
              <Card className="lg:col-span-2">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-blue-600/90 text-white flex items-center justify-center text-2xl font-semibold shadow-sm">
                        {userInitial}
                      </div>
                      <div>
                        <div className="text-lg font-semibold leading-tight">{userName}</div>
                        <div className="text-sm text-muted-foreground">{dni}{studies ? ` · ${studies}` : ""}</div>
                        {topLine ? <div className="mt-1 text-xs text-muted-foreground">{topLine}</div> : null}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Total percent radial */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Porcentaje total</div>
                      <div className="text-sm text-muted-foreground">Ausencias acumuladas</div>
                    </div>
                    <div className="relative h-20 w-20">
                      {(() => {
                        const size = 80; // px
                        const stroke = 8; // px
                        const radius = (size - stroke) / 2; // 36
                        const center = size / 2; // 40
                        const circumference = 2 * Math.PI * radius;
                        const clamped = Math.max(0, Math.min(100, totalPercent));
                        const fraction = Math.min(20, clamped) / 20; // 0..1
                        const visibleFraction = fraction > 0 && fraction < 0.012 ? 0.012 : fraction; // ~4° mínimo
                        const dash = visibleFraction * circumference;
                        const gap = circumference - dash;
                        // Color único (verde→amarillo→rojo)
                        const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
                        const toHex = (n: number) => n.toString(16).padStart(2, "0");
                        const G = { r: 22, g: 163, b: 74 };
                        const Y = { r: 245, g: 158, b: 11 };
                        const R = { r: 255, g: 0,  b: 0 };
                        const t = fraction;
                        let c = { r: G.r, g: G.g, b: G.b };
                        if (t <= 0.5) {
                          const k = t / 0.5;
                          c = { r: lerp(G.r, Y.r, k), g: lerp(G.g, Y.g, k), b: lerp(G.b, Y.b, k) };
                        } else {
                          const k = (t - 0.5) / 0.5;
                          c = { r: lerp(Y.r, R.r, k), g: lerp(Y.g, R.g, k), b: lerp(Y.b, R.b, k) };
                        }
                        const ringColor = `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
                        return (
                          <svg width={size} height={size} className="block">
                            <circle
                              cx={center}
                              cy={center}
                              r={radius}
                              stroke="#e5e7eb"
                              strokeWidth={stroke}
                              fill="none"
                            />
                            <circle
                              cx={center}
                              cy={center}
                              r={radius}
                              stroke={ringColor}
                              strokeWidth={stroke}
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={`${dash} ${gap}`}
                              transform={`rotate(-90 ${center} ${center})`}
                            />
                          </svg>
                        );
                      })()}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-lg font-semibold">{totalPercent}%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* KPIs */}
            {kpis ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Faltas (total)" value={kpis.totalAbsences} />
                <StatCard
                  label="Últimos 30 días"
                  value={<span className="flex items-center gap-2">{kpis.last30}<Badge variant={kpis.delta <= 0 ? "success" : "warning"}>{kpis.delta <= 0 ? "↘" : "↗"} {Math.abs(kpis.delta)}</Badge></span>}
                />
                <StatCard label="Módulos con más ausencias" value={kpis.topModules?.[0]?.key || "-"} hint={kpis.topModules?.slice(0,3).map(t => `${t.key} (${t.count})`).join(" · ")} />
                <StatCard label="Tipos más comunes" value={Object.entries(snapshot.aggregated.absenceTotals).sort((a,b)=>b[1]-a[1]).slice(0,1).map(([k])=>k).join(', ') || '-'} hint={Object.entries(snapshot.aggregated.absenceTotals).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>`${k} (${v})`).join(" · ")} />
              </div>
            ) : statisticsLoading ? (
              <div className="text-muted-foreground">Cargando estadísticas...</div>
            ) : null}

            {/* Semana actual - registro de faltas */}
            {selectedWeek ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Faltas esta semana</CardTitle>
                  <div className="text-xs text-muted-foreground">{selectedWeek.weekStartISO} → {selectedWeek.weekEndISO}</div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {weeklyAbsences.map((d) => {
                      const isToday = d.date === todayISO;
                      return (
                        <div
                          key={d.date}
                          className={`rounded-lg border p-3 hover:bg-muted/40 transition-colors ${isToday ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-400" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">{d.date}</div>
                            {isToday ? (
                              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Hoy</Badge>
                            ) : null}
                          </div>
                          <div className="mt-1 text-2xl font-semibold">{d.total}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(d.types).map(([type, count]) => (
                              <Badge key={type} variant="outline">{type}: {count}</Badge>
                            ))}
                            {d.total === 0 ? <Badge variant="success">Sin faltas</Badge> : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Módulos y Retos resumidos */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Módulos</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="border rounded-md divide-y">
                    <div className="grid grid-cols-4 text-sm font-medium bg-muted px-3 py-2 rounded-t-md">
                      <div>Módulo</div>
                      <div className="text-center">Sesiones</div>
                      <div className="text-center">Faltas</div>
                      <div className="text-right">%</div>
                    </div>
                    {modulesTable.normalModules?.slice(0, 8).map((row) => {
                      const calculations = moduleCalculations[row.key] || {
                        faltasDirectas: 0,
                        faltasDerivadas: 0,
                        sesionesDirectas: 0,
                        sesionesDerivadas: 0,
                        totalFaltas: 0,
                      };
                      const sesiones = calculations.sesionesDirectas + calculations.sesionesDerivadas;
                      const faltas = calculations.totalFaltas;
                      const pct = sesiones > 0 ? (faltas / sesiones) * 100 : 0;
                      const pctStr = pct.toFixed(1) + "%";
                      const barColor = pct < 7 ? "bg-emerald-500" : pct < 14 ? "bg-amber-500" : "bg-red-500";
                      return (
                        <div key={row.key} className="px-3 py-2">
                          <div className="grid grid-cols-4 items-center text-sm">
                            <div className="truncate pr-2" title={row.key}>{row.key}</div>
                            <div className="text-center font-mono">{sesiones.toFixed(2)}</div>
                            <div className="text-center font-mono">{faltas.toFixed(2)}</div>
                            <div className="text-right font-mono font-semibold tabular-nums">{pctStr}</div>
                          </div>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                            <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.min(100, (pct / 20) * 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Retos</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="border rounded-md divide-y">
                    <div className="grid grid-cols-4 text-sm font-medium bg-muted px-3 py-2 rounded-t-md">
                      <div>Reto</div>
                      <div className="text-center">Sesiones</div>
                      <div className="text-center">Faltas</div>
                      <div className="text-right">%</div>
                    </div>
                    {modulesTable.retoModules?.slice(0, 8).map((row) => {
                      const sesiones = Number(row.classes) || 0;
                      const faltas = Number(row.absences) || 0;
                      const pct = sesiones > 0 ? (faltas / sesiones) * 100 : 0;
                      const pctStr = pct.toFixed(1) + "%";
                      const barColor = pct < 7 ? "bg-emerald-500" : pct < 14 ? "bg-amber-500" : "bg-red-500";
                      return (
                        <div key={row.key} className="px-3 py-2">
                          <div className="grid grid-cols-4 items-center text-sm">
                            <div className="truncate pr-2" title={row.key}>{row.key}</div>
                            <div className="text-center font-mono">{sesiones.toFixed(2)}</div>
                            <div className="text-center font-mono">{faltas.toFixed(2)}</div>
                            <div className="text-right font-mono font-semibold tabular-nums">{pctStr}</div>
                          </div>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                            <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.min(100, (pct / 20) * 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-xs text-muted-foreground">
              Leyenda: {Object.entries(absenceLegend).map(([k, v]) => `${k}=${v}`).join(" · ")}
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
