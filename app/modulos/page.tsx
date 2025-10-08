"use client";

import { useState, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSnapshot } from "@/lib/services/snapshotContext";
import { Badge } from "@/components/ui/badge";
import { percentColorClasses } from "@/lib/utils/ui";
import { LoadingState } from "@/components/ui/loading-state";
import { useModuleCalculations, useRetoCalculations } from "@/lib/hooks";

export default function ModulosPage() {
  const { snapshot, loading, error } = useSnapshot();

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [expandedRetos, setExpandedRetos] = useState<Record<string, boolean>>({});

  const rows = useModuleCalculations(snapshot);
  const retoRows = useRetoCalculations(snapshot);

  if (!snapshot || rows.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">Sin datos de módulos</p>
      </div>
    );
  }

  return (
    <LoadingState loading={loading} error={error}>
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
                  const { gradient: colorClass, text: textColor } = percentColorClasses(m.percent);
                  const isOpen = !!expandedModules[m.code];
                  const moduleData = snapshot?.aggregated?.modules?.[m.code];
                  const absenceCounts = moduleData?.absenceCounts || {};
                  const breakdown = Object.entries(absenceCounts).sort((a, b) => b[1] - a[1]);
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
                                    <span className="text-xs">×{count}</span>
                                    <span className="text-[10px] opacity-70">{snapshot?.legend?.absenceTypes?.[code] || ''}</span>
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
                  const { gradient: colorClass, text: textColor } = percentColorClasses(r.percent);
                  const isOpen = !!expandedRetos[r.id];
                  const retoData = snapshot?.aggregated?.modules?.[r.id];
                  const absenceCounts = retoData?.absenceCounts || {};
                  const breakdown = Object.entries(absenceCounts).sort((a, b) => b[1] - a[1]);
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
                        <td className="py-2 pr-3 font-medium">{r.label}</td>
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
                                    <span className="text-xs">×{count}</span>
                                    <span className="text-[10px] opacity-70">{snapshot?.legend?.absenceTypes?.[code] || ''}</span>
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
    </LoadingState>
  );
}
