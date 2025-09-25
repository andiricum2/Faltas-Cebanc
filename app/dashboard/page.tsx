"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Badge } from "@/components/ui/badge";
import { extractAbsenceCode } from "@/lib/utils";
import type { StudentSnapshot as Snapshot } from "@/lib/types/faltas";


async function syncNow() {
  const res = await fetch("/api/faltas/sync", { method: "POST" });
  return res.json();
}

async function fetchSnapshot(): Promise<Snapshot | null> {
  const res = await fetch("/api/faltas/snapshot", { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [absenceFilter, setAbsenceFilter] = useState<string>("all");
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number | null>(null);
  const [autoSync, setAutoSync] = useState<boolean>(false);

  const absenceLegend = snapshot?.legend.absenceTypes || {};

  const modulesTable = useMemo(() => {
    if (!snapshot) return [] as Array<{ key: string; classes: number; absences: string }>; 
    let entries = Object.entries(snapshot.aggregated.modules);
    if (moduleFilter !== "all") entries = entries.filter(([mod]) => mod === moduleFilter);
    return entries.map(([mod, v]) => ({
      key: mod,
      classes: v.classesGiven,
      absences: Object.entries(v.absenceCounts)
        .filter(([code]) => absenceFilter === "all" || code === absenceFilter)
        .map(([code, cnt]) => `${code}:${cnt}`)
        .join("  "),
    }));
  }, [snapshot, moduleFilter, absenceFilter]);

  const topLine = useMemo(() => {
    if (!snapshot) return "";
    const nWeeks = snapshot.weeks.length;
    const start = snapshot.weeks[0]?.weekStartISO || "";
    const end = snapshot.weeks[nWeeks - 1]?.weekEndISO || "";
    return `${nWeeks} semanas · ${start} → ${end}`;
  }, [snapshot]);

  const weeklySeries = useMemo(() => {
    if (!snapshot) return [] as Array<{ label: string; total: number } & Record<string, number>>;
    return snapshot.weeks.map((w, idx) => {
      const counters = w.sessions.reduce((acc, s) => {
        const code = extractAbsenceCode(s.cssClass);
        const mod = s.title;
        if (!code) return acc;
        if (moduleFilter !== "all" && mod !== moduleFilter) return acc;
        if (absenceFilter !== "all" && code !== absenceFilter) return acc;
        acc.total += 1;
        acc[code] = (acc[code] || 0) + 1;
        return acc;
      }, { label: `${w.weekStartISO}`, total: 0 } as any);
      counters.__index = idx; // keep reference for drill-down
      return counters;
    });
  }, [snapshot, moduleFilter, absenceFilter]);

  const monthlySeries = useMemo(() => {
    if (!snapshot) return [] as Array<{ month: string; total: number }>;
    const byMonth: Record<string, number> = {};
    snapshot.weeks.forEach((w) => {
      w.sessions.forEach((s) => {
        const code = extractAbsenceCode(s.cssClass);
        const mod = s.title;
        if (!code) return;
        if (moduleFilter !== "all" && mod !== moduleFilter) return;
        if (absenceFilter !== "all" && code !== absenceFilter) return;
        const month = s.dateISO.slice(0, 7);
        byMonth[month] = (byMonth[month] || 0) + 1;
      });
    });
    return Object.entries(byMonth).sort(([a],[b]) => a.localeCompare(b)).map(([month, total]) => ({ month, total }));
  }, [snapshot, moduleFilter, absenceFilter]);

  // KPIs
  const kpis = useMemo(() => {
    if (!snapshot) return null as null | { totalAbsences: number; last30: number; prev30: number; delta: number; topModules: Array<{ key: string; count: number }> };
    const now = new Date();
    const iso30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    let total = 0, last30 = 0, prev30 = 0;
    const moduleCounts: Record<string, number> = {};
    snapshot.weeks.forEach((w) => {
      w.sessions.forEach((s) => {
        const code = extractAbsenceCode(s.cssClass);
        if (!code) return;
        const d = new Date(s.dateISO + "T00:00:00Z");
        total += 1;
        if (d >= iso30) last30 += 1; else prev30 += 1;
        const mod = s.title || "?";
        moduleCounts[mod] = (moduleCounts[mod] || 0) + 1;
      });
    });
    const topModules = Object.entries(moduleCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([key,count])=>({key,count}));
    const delta = last30 - Math.min(prev30, last30);
    return { totalAbsences: total, last30, prev30, delta, topModules };
  }, [snapshot]);

  // Drill-down: selected week sessions filtered
  const selectedWeek = useMemo(() => {
    if (!snapshot) return null;
    const idx = selectedWeekIdx ?? (snapshot.weeks.length ? snapshot.weeks.length - 1 : null);
    if (idx === null || idx < 0 || idx >= snapshot.weeks.length) return null;
    const w = snapshot.weeks[idx];
    const sessions = w.sessions.filter((s) => {
      const code = extractAbsenceCode(s.cssClass);
      const mod = s.title;
      if (moduleFilter !== "all" && mod !== moduleFilter) return false;
      if (absenceFilter !== "all" && code !== absenceFilter) return false;
      return true;
    });
    return { ...w, sessions };
  }, [snapshot, selectedWeekIdx, moduleFilter, absenceFilter]);

  useEffect(() => {
    const isElectron = typeof (window as any).process !== "undefined" && (window as any).process?.versions?.electron;
    const stored = localStorage.getItem("autosync") === "1";
    setAutoSync(stored);
    fetchSnapshot().then(async (snap) => {
      setSnapshot(snap);
      if (isElectron && stored) {
        try { await syncNow(); const s2 = await fetchSnapshot(); setSnapshot(s2); } catch {}
      }
    }).catch(() => {});
  }, []);

  const onSync = async () => {
    setLoading(true);
    setError(null);
    try {
      await syncNow();
      const snap = await fetchSnapshot();
      setSnapshot(snap);
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-5xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Panel de asistencia</span>
              <Button onClick={onSync} disabled={loading}>{loading ? "Sincronizando..." : "Sincronizar"}</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {snapshot ? (
              <Tabs defaultValue="global" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="global">Global</TabsTrigger>
                  <TabsTrigger value="semanal">Semanal</TabsTrigger>
                  <TabsTrigger value="mensual">Mensual</TabsTrigger>
                  <TabsTrigger value="evolucion">Evolución</TabsTrigger>
                </TabsList>

                <TabsContent value="global">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">{topLine}</div>
                      <div className="text-xl font-semibold">{snapshot.identity.fullName} ({snapshot.identity.dni})</div>
                      {snapshot.identity.group && <div className="text-muted-foreground">{snapshot.identity.group}</div>}
                      {kpis && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Card>
                            <CardContent className="p-3">
                              <div className="text-xs text-muted-foreground">Faltas (total)</div>
                              <div className="text-xl font-semibold">{kpis.totalAbsences}</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <div className="text-xs text-muted-foreground">Últimos 30 días</div>
                              <div className="text-xl font-semibold flex items-center gap-2">
                                {kpis.last30}
                                <Badge variant={kpis.delta <= 0 ? "success" : "warning"}>{kpis.delta <= 0 ? "↘" : "↗"} {Math.abs(kpis.delta)}</Badge>
                              </div>
                            </CardContent>
                          </Card>
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
                      <div className="flex items-center gap-2 mb-2">
                        <select className="border rounded px-2 py-1 text-sm" value={moduleFilter} onChange={(e)=>setModuleFilter(e.target.value)}>
                          <option value="all">Todos los módulos</option>
                          {Object.keys(snapshot.aggregated.modules).map((k)=> (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                        <select className="border rounded px-2 py-1 text-sm" value={absenceFilter} onChange={(e)=>setAbsenceFilter(e.target.value)}>
                          <option value="all">Todas las faltas</option>
                          {Object.keys(absenceLegend).map((k)=> (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                      </div>
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
                </TabsContent>

                <TabsContent value="semanal">
                  <div className="flex items-center gap-2 mb-3">
                    <select className="border rounded px-2 py-1 text-sm" value={moduleFilter} onChange={(e)=>setModuleFilter(e.target.value)}>
                      <option value="all">Todos los módulos</option>
                      {Object.keys(snapshot.aggregated.modules).map((k)=> (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                    <select className="border rounded px-2 py-1 text-sm" value={absenceFilter} onChange={(e)=>setAbsenceFilter(e.target.value)}>
                      <option value="all">Todas las faltas</option>
                      {Object.keys(absenceLegend).map((k)=> (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklySeries} onClick={(d:any)=>{ if (d?.activePayload?.[0]?.payload?.__index != null) setSelectedWeekIdx(d.activePayload[0].payload.__index); }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" hide={false} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#22c55e" name="Faltas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {selectedWeek && (
                    <div className="mt-4">
                      <div className="font-semibold mb-2">Detalle semanal ({selectedWeek.weekStartISO} → {selectedWeek.weekEndISO})</div>
                      <div className="overflow-auto">
                        <table className="w-full text-sm border">
                          <thead>
                            <tr>
                              <th className="border px-2 py-1">Hora</th>
                              {selectedWeek.daysISO.map((d)=> (
                                <th key={d} className="border px-2 py-1">{d}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[1,2,3,4,5,6].map((h)=> (
                              <tr key={h}>
                                <td className="border px-2 py-1 text-center font-medium">{h}</td>
                                {selectedWeek.daysISO.map((d, idx)=> {
                                  const cell = selectedWeek.sessions.find((s)=> s.hour === h && s.weekday === (idx+1));
                                  return <td key={d+"-"+h} className="border px-2 py-1 truncate" title={cell?.cssClass || undefined}>{cell?.title || "-"}</td>;
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="mensual">
                  <div className="flex items-center gap-2 mb-3">
                    <select className="border rounded px-2 py-1 text-sm" value={moduleFilter} onChange={(e)=>setModuleFilter(e.target.value)}>
                      <option value="all">Todos los módulos</option>
                      {Object.keys(snapshot.aggregated.modules).map((k)=> (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                    <select className="border rounded px-2 py-1 text-sm" value={absenceFilter} onChange={(e)=>setAbsenceFilter(e.target.value)}>
                      <option value="all">Todas las faltas</option>
                      {Object.keys(absenceLegend).map((k)=> (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlySeries}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Faltas" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="evolucion">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklySeries}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="total" stroke="#10b981" name="Faltas/semana" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={modulesTable.map((m) => ({ module: m.key, sessions: m.classes }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="module" hide={false} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="sessions" fill="#a855f7" name="Sesiones impartidas" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-muted-foreground">No hay datos. Pulsa sincronizar.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


