"use client";

import { useSnapshot } from "@/lib/services/snapshotContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { loadWeekSchedule, saveWeekSchedule, saveHoursPerModule } from "@/lib/services/configRepository";
import { useConfigPage } from "@/lib/hooks";
import { isRetoModule } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { WeekSchedule } from "@/lib/types/snapshot";
import Link from "next/link";
import { useMemo, useEffect } from "react";
import { useConfig } from "@/lib/services/configContext";

export default function ConfigHorarioPage() {
  const { snapshot } = useSnapshot();
  const { config } = useConfig();
  const t = useTranslations();

  const { data: schedule, save } = useConfigPage<WeekSchedule>(
    loadWeekSchedule,
    saveWeekSchedule
  );

  const modules = Object.keys(snapshot?.legend?.modules || {})
    .filter((m) => !isRetoModule(m, snapshot?.legend?.modules?.[m]));
  
  const usingGroupConfig = config.selectedGroup && config.selectedGroup !== "personalizado";

  const days = [
    t('schedule.monday'),
    t('schedule.tuesday'),
    t('schedule.wednesday'),
    t('schedule.thursday'),
    t('schedule.friday'),
  ];

  // Calculate hours per module from schedule
  const hoursPerModule = useMemo(() => {
    const hours: Record<string, number> = {};
    if (!schedule) return hours;
    
    for (const hourRow of schedule) {
      for (const moduleCode of hourRow) {
        if (moduleCode) {
          hours[moduleCode] = (hours[moduleCode] || 0) + 1;
        }
      }
    }
    
    return hours;
  }, [schedule]);

  // Auto-save hours per module when schedule changes
  useEffect(() => {
    if (Object.keys(hoursPerModule).length > 0) {
      saveHoursPerModule(hoursPerModule);
    }
  }, [hoursPerModule]);

  const updateCell = (hour: number, day: number, value: string | null) => {
    if (!schedule) return;
    const newSchedule = schedule.map((row) => [...row]);
    newSchedule[hour][day] = value;
    save(newSchedule);
  };

  const clearSchedule = () => {
    const emptySchedule = Array.from({ length: 6 }, () => Array.from({ length: 5 }, () => null));
    save(emptySchedule);
  };

  const totalHours = Object.values(hoursPerModule).reduce((sum, h) => sum + h, 0);

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
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
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            {t('schedule.configTitle')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('schedule.subtitle')}
          </p>
        </div>
      </div>

      <Card className="border-2 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-xl">{t('schedule.configTitle')}</CardTitle>
                <CardDescription>
                  {t('schedule.subtitle')}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSchedule}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('schedule.clearSchedule')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>No hay módulos disponibles</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-semibold text-sm border-r sticky left-0 bg-muted/50 z-10 min-w-[100px]">
                        {/* Empty corner cell */}
                      </th>
                      {days.map((day, index) => (
                        <th key={index} className="text-center p-3 font-semibold text-sm min-w-[180px]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {schedule && schedule.map((hourRow, hourIndex) => (
                      <tr key={hourIndex} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium border-r sticky left-0 bg-background z-10">
                          <div className="flex items-center justify-center">
                            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {hourIndex + 1}
                            </div>
                          </div>
                        </td>
                        {hourRow.map((moduleCode, dayIndex) => (
                          <td key={dayIndex} className="p-2">
                            <Select
                              value={moduleCode || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateCell(hourIndex, dayIndex, value === "" ? null : value);
                              }}
                            >
                              <option value="">{t('schedule.noModule')}</option>
                              {modules.map((m) => (
                                <option key={m} value={m}>
                                  {snapshot?.legend?.modules?.[m] || m}
                                </option>
                              ))}
                            </Select>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hours Summary Card */}
      {Object.keys(hoursPerModule).length > 0 && (
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/10">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-xl">{t('schedule.hoursSummary')}</CardTitle>
                <CardDescription>
                  {t('schedule.totalHours', { hours: totalHours })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(hoursPerModule)
                .sort((a, b) => b[1] - a[1])
                .map(([moduleCode, hours]) => (
                  <div
                    key={moduleCode}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border"
                  >
                    <span className="font-medium text-sm">
                      {snapshot?.legend?.modules?.[moduleCode] || moduleCode}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {hours}h
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      {usingGroupConfig && (
        <Card className="border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm text-orange-900 dark:text-orange-100">
                <p className="font-medium mb-1">{t('configuration.sections.usingGroupConfig', { group: config.selectedGroup || '' })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Información</p>
              <p className="text-blue-800 dark:text-blue-200">
                Las horas calculadas automáticamente desde el horario se utilizarán para distribuir las faltas en los retos. 
                El horario refleja la distribución semanal de tus clases.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


