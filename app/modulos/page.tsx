"use client";

import { useMemo, useState, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSnapshot } from "@/lib/services/snapshotContext";
import { calcPercent, sumarFaltas } from "@/lib/utils/calculations";
import { Badge } from "@/components/ui/badge";

export default function ModulosPage() {
  const { snapshot } = useSnapshot();

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [expandedRetos, setExpandedRetos] = useState<Record<string, boolean>>({});

  const rows = useMemo(() => {
    const moduleCalcs = (snapshot as any)?.moduleCalculations as Record<string, any> | undefined;
    if (!snapshot || !moduleCalcs) return [] as Array<any>;
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
  }, [snapshot]);

  const retoRows = useMemo(() => {
    if (!snapshot || !(snapshot as any).retos) return [] as Array<any>;
    const retos = (snapshot as any).retos as Array<{ id: string; label: string; }>;
    return retos
      .map((r) => {
        const classes = (snapshot as any)?.aggregated?.modules?.[r.id]?.classesGiven || 0;
        const totalFaltas = sumarFaltas((snapshot as any)?.aggregated?.modules?.[r.id]?.absenceCounts);
        return {
          id: r.id,
          name: r.label || r.id,
          totalFaltas,
          totalSesiones: classes,
          percent: calcPercent(totalFaltas, classes),
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [snapshot]);

  if (!snapshot || rows.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">Sin datos de módulos</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Módulos · Resumen por asignatura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3 w-8"></th>
                  <th className="py-2 pr-3">Asignatura</th>
                  <th className="py-2 pr-3 text-center">Faltas directas</th>
                  <th className="py-2 pr-3 text-center">Faltas derivadas</th>
                  <th className="py-2 pr-3 text-center">Sesiones directas</th>
                  <th className="py-2 pr-3 text-center">Sesiones derivadas</th>
                  <th className="py-2 pr-3 text-center">Total faltas</th>
                  <th className="py-2 pr-3 text-center">Total sesiones</th>
                  <th className="py-2 text-center">% Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => {
                  const ratio = Math.min(100, Math.max(0, (m.percent / 20) * 100));
                  const colorClass = m.percent < 7 ? 'from-emerald-500 to-teal-600' : m.percent < 14 ? 'from-amber-500 to-orange-600' : 'from-red-500 to-pink-600';
                  const textColor = m.percent < 7 ? 'text-emerald-600' : m.percent < 14 ? 'text-amber-600' : 'text-red-600';
                  const isOpen = !!expandedModules[m.code];
                  const absenceCounts = (snapshot as any)?.aggregated?.modules?.[m.code]?.absenceCounts || {};
                  const breakdown = Object.entries(absenceCounts).sort((a, b) => (b[1] as number) - (a[1] as number));
                  return (
                    <Fragment key={m.code}>
                      <tr
                        className="border-b hover:bg-muted/40 cursor-pointer select-none"
                        onClick={() => setExpandedModules((s) => ({ ...s, [m.code]: !s[m.code] }))}
                        aria-expanded={isOpen}
                      >
                        <td className="py-2 pr-2 text-center align-middle">
                          <span className="text-sm">{isOpen ? '▾' : '▸'}</span>
                        </td>
                        <td className="py-2 pr-3 font-medium">{m.name}</td>
                        <td className="py-2 pr-3 text-center">{m.faltasDirectas}</td>
                        <td className="py-2 pr-3 text-center">{m.faltasDerivadas}</td>
                        <td className="py-2 pr-3 text-center">{m.sesionesDirectas}</td>
                        <td className="py-2 pr-3 text-center">{m.sesionesDerivadas}</td>
                        <td className="py-2 pr-3 font-medium text-center">{m.totalFaltas}</td>
                        <td className="py-2 pr-3 text-center">{m.totalSesiones}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-2 min-w-[160px]">
                            <span className={`text-xs font-bold ${textColor}`}>{m.percent.toFixed(2)}%</span>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full bg-gradient-to-r ${colorClass} transition-all duration-700 ease-out`}
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                      {isOpen ? (
                        <tr className="border-b bg-muted/30">
                          <td colSpan={9} className="py-3 pl-4">
                            <div className="flex flex-wrap gap-2">
                              {breakdown.length === 0 ? (
                                <span className="text-muted-foreground text-xs">Sin faltas desglosadas</span>
                              ) : (
                                breakdown.map(([code, count]) => (
                                  <Badge key={`${m.code}-${code}`} className="gap-1">
                                    <span className="font-mono text-xs">{code}</span>
                                    <span className="text-xs">×{count as number}</span>
                                    <span className="text-[10px] opacity-70">{(snapshot as any)?.legend?.absenceTypes?.[code] || ''}</span>
                                  </Badge>
                                ))
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-muted-foreground">No hay datos de módulos</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Módulos · Resumen por reto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3 w-8"></th>
                  <th className="py-2 pr-3">Reto</th>
                  <th className="py-2 pr-3 text-center">Total faltas</th>
                  <th className="py-2 pr-3 text-center">Total sesiones</th>
                  <th className="py-2 text-center">% Total</th>
                </tr>
              </thead>
              <tbody>
                {retoRows.map((r) => {
                  const ratio = Math.min(100, Math.max(0, (r.percent / 20) * 100));
                  const colorClass = r.percent < 7 ? 'from-emerald-500 to-teal-600' : r.percent < 14 ? 'from-amber-500 to-orange-600' : 'from-red-500 to-pink-600';
                  const textColor = r.percent < 7 ? 'text-emerald-600' : r.percent < 14 ? 'text-amber-600' : 'text-red-600';
                  const isOpen = !!expandedRetos[r.id];
                  const absenceCounts = (snapshot as any)?.aggregated?.modules?.[r.id]?.absenceCounts || {};
                  const breakdown = Object.entries(absenceCounts).sort((a, b) => (b[1] as number) - (a[1] as number));
                  return (
                    <Fragment key={r.id}>
                      <tr
                        className="border-b hover:bg-muted/40 cursor-pointer select-none"
                        onClick={() => setExpandedRetos((s) => ({ ...s, [r.id]: !s[r.id] }))}
                        aria-expanded={isOpen}
                      >
                        <td className="py-2 pr-2 text-center align-middle">
                          <span className="text-sm">{isOpen ? '▾' : '▸'}</span>
                        </td>
                        <td className="py-2 pr-3 font-medium">{r.name}</td>
                        <td className="py-2 pr-3 text-center">{r.totalFaltas}</td>
                        <td className="py-2 pr-3 text-center">{r.totalSesiones}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-2 min-w-[160px]">
                            <span className={`text-xs font-bold ${textColor}`}>{r.percent.toFixed(2)}%</span>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full bg-gradient-to-r ${colorClass} transition-all duration-700 ease-out`}
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                      {isOpen ? (
                        <tr className="border-b bg-muted/30">
                          <td colSpan={5} className="py-3 pl-4">
                            <div className="flex flex-wrap gap-2">
                              {breakdown.length === 0 ? (
                                <span className="text-muted-foreground text-xs">Sin faltas desglosadas</span>
                              ) : (
                                breakdown.map(([code, count]) => (
                                  <Badge key={`${r.id}-${code}`} className="gap-1">
                                    <span className="font-mono text-xs">{code}</span>
                                    <span className="text-xs">×{count as number}</span>
                                    <span className="text-[10px] opacity-70">{(snapshot as any)?.legend?.absenceTypes?.[code] || ''}</span>
                                  </Badge>
                                ))
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
                {retoRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">No hay datos de retos</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


