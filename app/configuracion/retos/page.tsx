"use client";

import { useSnapshot } from "@/lib/services/snapshotContext";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loadRetoTargets, saveRetoTargets } from "@/lib/services/configRepository";
import { useConfigPage, useRetoModuleHours } from "@/lib/hooks";
import { isRetoModule } from "@/lib/utils";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { RetoTargets } from "@/lib/types/snapshot";
import Link from "next/link";

export default function ConfigRetosPage() {
  const { snapshot } = useSnapshot();
  const t = useTranslations();

  const moduleKeys = useMemo(() => Object.keys(snapshot?.aggregated?.modules || {}), [snapshot]);
  const nonRetoModules = useMemo(() => 
    moduleKeys.filter((m) => !isRetoModule(m, snapshot?.legend?.modules?.[m])), 
    [moduleKeys, snapshot?.legend?.modules]
  );
  const retos = useMemo(() => snapshot?.retos || [], [snapshot]);

  const { data: retoTargets, save, updateField } = useConfigPage<RetoTargets>(
    loadRetoTargets,
    saveRetoTargets
  );

  const { data: retoModuleHours, save: saveRetoModuleHours } = useRetoModuleHours();

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link 
          href="/configuracion"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
            {t('challenges.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            Asigna módulos a cada reto y establece horas específicas
          </p>
        </div>
      </div>

      {retos.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              <svg className="w-20 h-20 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium mb-1">{t('challenges.noChallenges')}</p>
              <p className="text-sm">Sincroniza tus datos para ver los retos disponibles</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {retos.map((r, retoIndex) => {
            const assignedCount = Object.keys(retoTargets?.[r.id] || {}).filter(
              m => retoTargets?.[r.id]?.[m]
            ).length;

            return (
              <Card key={r.id} className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-green-500/10">
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{r.label}</CardTitle>
                          <Badge variant="outline" className="font-mono text-xs">
                            {r.id}
                          </Badge>
                        </div>
                        <CardDescription>
                          {t('challenges.assignToModules')}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {assignedCount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        módulos asignados
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-hidden">
                    <div className="max-h-[400px] overflow-auto">
                      <table className="w-full">
                        <thead className="bg-muted sticky top-0 z-10">
                          <tr>
                            <th className="text-left p-4 font-semibold text-sm">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                {t('schedule.module')}
                              </div>
                            </th>
                            <th className="text-center p-4 font-semibold text-sm w-32">
                              <div className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {t('challenges.assigned')}
                              </div>
                            </th>
                            <th className="text-left p-4 font-semibold text-sm w-48">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {t('challenges.hours')}
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {nonRetoModules.map((m) => {
                            const isAssigned = !!(retoTargets?.[r.id]?.[m]);
                            const retoHours = retoModuleHours?.[r.id]?.[m];
                            return (
                              <tr 
                                key={`${r.id}-${m}`} 
                                className={`hover:bg-muted/30 transition-colors ${isAssigned ? 'bg-green-50/30 dark:bg-green-950/10' : ''}`}
                              >
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium">{snapshot?.legend?.modules?.[m] || m}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex justify-center">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isAssigned}
                                        onChange={(e) => {
                                          const next = { ...retoTargets, [r.id]: { ...(retoTargets?.[r.id] || {}), [m]: e.target.checked } };
                                          save(next);
                                          
                                          // Si se desmarca, limpiar las horas específicas
                                          if (!e.target.checked) {
                                            const nextHours = { ...retoModuleHours };
                                            if (nextHours[r.id]) {
                                              delete nextHours[r.id][m];
                                              if (Object.keys(nextHours[r.id]).length === 0) {
                                                delete nextHours[r.id];
                                              }
                                            }
                                            saveRetoModuleHours(nextHours);
                                          }
                                        }}
                                        className="sr-only peer"
                                      />
                                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                                    </label>
                                  </div>
                                </td>
                                <td className="p-4">
                                  {isAssigned ? (
                                    <Input
                                      type="number"
                                      min="0"
                                      max="40"
                                      step="0.5"
                                      value={retoHours || ""}
                                      placeholder={t('challenges.useModuleHours')}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        const hours = value === "" ? undefined : parseFloat(value);
                                        
                                        const nextHours = { ...retoModuleHours };
                                        if (!nextHours[r.id]) {
                                          nextHours[r.id] = {};
                                        }
                                        
                                        if (hours !== undefined && hours > 0) {
                                          nextHours[r.id][m] = hours;
                                        } else {
                                          delete nextHours[r.id][m];
                                          if (Object.keys(nextHours[r.id]).length === 0) {
                                            delete nextHours[r.id];
                                          }
                                        }
                                        
                                        saveRetoModuleHours(nextHours);
                                      }}
                                      className="max-w-[160px]"
                                    />
                                  ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-muted-foreground/20">
                    <div className="flex gap-2">
                      <svg className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-muted-foreground">
                        {t('challenges.retoHoursDescription')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      {retos.length > 0 && (
        <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-green-900 dark:text-green-100">
                <p className="font-medium mb-1">Consejo</p>
                <p className="text-green-800 dark:text-green-200">
                  Puedes definir horas específicas para cada módulo dentro de un reto. 
                  Si no defines horas específicas, se utilizarán las horas semanales del módulo configuradas en la sección de Horario.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


