"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSnapshot } from "@/lib/services/snapshotContext";
import { getTodayLocalISO } from "@/lib/utils/dates";
import { findCurrentWeekIndex } from "@/lib/utils/weeks";
import { aggregateWeeklyAbsences } from "@/lib/utils/absences";
import { LoadingState } from "@/components/ui/loading-state";
import { getPercentageColors } from "@/lib/utils/ui";

export default function DashboardPage() {
  const { snapshot, loading, error } = useSnapshot();
  const [animateBars, setAnimateBars] = useState(false);

  const totalPercent = snapshot?.percentages.totalPercent ?? 0;
  const userName = snapshot?.identity.fullName ?? "";
  const userInitial = (userName?.trim()?.[0] || "U").toUpperCase();
  const dni = snapshot?.identity.dni ?? "";
  const studies = snapshot?.identity.group ?? "";

  // Fecha de hoy en ISO local (yyyy-mm-dd) para resaltar el día actual
  const todayISO = useMemo(() => getTodayLocalISO(), []);

  // Semana actual (contiene la fecha de hoy)
  const currentWeekIndex = useMemo(() => findCurrentWeekIndex(snapshot, todayISO), [snapshot, todayISO]);

  // Activar animación de barras tras primer paint
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimateBars(true));
    return () => cancelAnimationFrame(id);
  }, []);
  
  const selectedWeek = snapshot && currentWeekIndex != null ? (snapshot.weeks[currentWeekIndex] ?? null) : null;

  // Cálculo de faltas por día en la semana seleccionada
  const weeklyAbsences = useMemo(() => aggregateWeeklyAbsences(selectedWeek), [selectedWeek]);

  return (
    <LoadingState loading={loading} error={error}>
      <div className="w-full space-y-6">
        {/* Top overview */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Profile */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6 pb-0 pt-0 h-full">
              <div className="flex items-center h-full">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-blue-600/90 text-white flex items-center justify-center text-2xl font-semibold shadow-sm">
                    {userInitial}
                  </div>
                  <div>
                    <div className="text-lg font-semibold leading-tight">{userName}</div>
                    <div className="text-sm text-muted-foreground">{dni}{studies ? ` · ${studies}` : ""}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Total percent radial */}
          <Card>
            <CardContent className="p-5 flex items-center">
              <div className="flex items-center justify-between w-full">
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
                    // Animación: si animateBars es false, iniciamos en 0
                    const animatedFraction = animateBars ? visibleFraction : 0;
                    const dash = animatedFraction * circumference;
                    const gap = circumference - dash;
                    // Usar la utilidad centralizada para colores
                    const { startColor, endColor } = getPercentageColors(clamped);
                    return (
                      <svg width={size} height={size} className="block">
                        <defs>
                          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={startColor} />
                            <stop offset="100%" stopColor={endColor} />
                          </linearGradient>
                        </defs>
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
                          stroke="url(#ringGradient)"
                          strokeWidth={stroke}
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${dash} ${gap}`}
                          style={{ transition: 'stroke-dasharray 0.8s ease-out 0.15s' }}
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

        {/* Semana actual - registro de faltas */}
        {selectedWeek ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Faltas esta semana</CardTitle>
              <div className="text-xs text-muted-foreground">{selectedWeek.weekStartISO} → {selectedWeek.weekEndISO}</div>
            </CardHeader>
            <CardContent>
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

        {/* Porcentajes por asignatura */}
        {snapshot?.percentages?.byModule && Object.keys(snapshot.percentages.byModule).length > 0 ? (
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Object.entries(snapshot.percentages.byModule).map(([moduleCode, percentage], index) => {
                  const moduleName = snapshot.legend.modules[moduleCode] || moduleCode;
                  
                  const colorClass = percentage < 7 ? 'from-emerald-500 to-teal-600' :
                                   percentage < 14 ? 'from-amber-500 to-orange-600' :
                                   'from-red-500 to-pink-600';

                  return (
                    <div
                      key={moduleCode}
                      className="relative overflow-hidden rounded-lg"
                    >
                      <Card className="h-full rounded-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                        <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-10`} />
                        <CardContent className="p-3 relative z-10">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h3 className="font-medium text-xs line-clamp-2" title={moduleName}>
                                {moduleName}
                              </h3>
                              <span className={`text-s font-bold ${
                                  percentage < 7 ? 'text-emerald-600' :
                                  percentage < 14 ? 'text-amber-600' :
                                  'text-red-600'
                                }`}>
                                {percentage.toFixed(2)}%
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  style={{
                                    width: animateBars ? `${Math.min(100, Math.max(0, (percentage / 20) * 100))}%` : '0%',
                                    transitionDelay: `${index * 100}ms`
                                  }}
                                  className={`h-1.5 rounded-full bg-gradient-to-r ${colorClass} transition-all duration-700 ease-out`}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </LoadingState>
  );
}