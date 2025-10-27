"use client";

import { useSnapshot } from "@/lib/services/snapshotContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadWeekSchedule } from "@/lib/services/configRepository";
import { useConfigPage } from "@/lib/hooks";
import { isRetoModule } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { WeekSchedule } from "@/lib/types/snapshot";
import Link from "next/link";
import { useMemo } from "react";
import { Settings } from "lucide-react";

export default function HorarioPage() {
  const { snapshot } = useSnapshot();
  const t = useTranslations();

  const { data: schedule } = useConfigPage<WeekSchedule>(
    loadWeekSchedule,
    async () => {} // No save function, read-only
  );

  const modules = Object.keys(snapshot?.legend?.modules || {})
    .filter((m) => !isRetoModule(m, snapshot?.legend?.modules?.[m]));

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

  // Calculate merged cells for each day
  const mergedSchedule = useMemo(() => {
    if (!schedule) return [];
    
    // Structure: [day][hour] = { moduleCode, rowspan, skip }
    const merged: Array<Array<{ moduleCode: string | null; rowspan: number; skip: boolean }>> = [];
    
    // Initialize for each day
    for (let day = 0; day < 5; day++) {
      merged[day] = [];
      let currentModule: string | null = null;
      let startHour = 0;
      
      for (let hour = 0; hour < 6; hour++) {
        const moduleCode = schedule[hour][day];
        
        if (hour === 0) {
          // First hour of the day
          currentModule = moduleCode;
          startHour = 0;
          merged[day][hour] = { moduleCode, rowspan: 1, skip: false };
        } else {
          if (moduleCode === currentModule && moduleCode !== null) {
            // Same module as previous, increment rowspan
            merged[day][startHour].rowspan++;
            merged[day][hour] = { moduleCode, rowspan: 0, skip: true };
          } else {
            // Different module, start new
            currentModule = moduleCode;
            startHour = hour;
            merged[day][hour] = { moduleCode, rowspan: 1, skip: false };
          }
        }
      }
    }
    
    return merged;
  }, [schedule]);

  const totalHours = Object.values(hoursPerModule).reduce((sum, h) => sum + h, 0);

  const getModuleColor = (moduleCode: string | null) => {
    if (!moduleCode) return "bg-muted/20";
    const moduleIndex = modules.indexOf(moduleCode);
    const colors = [
      "bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-800",
      "bg-green-100 dark:bg-green-950 border-green-300 dark:border-green-800",
      "bg-purple-100 dark:bg-purple-950 border-purple-300 dark:border-purple-800",
      "bg-orange-100 dark:bg-orange-950 border-orange-300 dark:border-orange-800",
      "bg-pink-100 dark:bg-pink-950 border-pink-300 dark:border-pink-800",
      "bg-cyan-100 dark:bg-cyan-950 border-cyan-300 dark:border-cyan-800",
      "bg-yellow-100 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-800",
      "bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-800",
    ];
    return colors[moduleIndex % colors.length];
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            {t('schedule.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('schedule.viewSubtitle')}
          </p>
        </div>
        <Link href="/configuracion/horario">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            {t('schedule.editSchedule')}
          </Button>
        </Link>
      </div>

      <Card className="border-2 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-xl">{t('schedule.weeklySchedule')}</CardTitle>
              <CardDescription>
                {t('schedule.scheduledClasses')}
              </CardDescription>
            </div>
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
                <table className="w-full table-fixed">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-semibold text-sm border-r sticky left-0 bg-muted/50 z-10 w-16">
                        {/* Empty corner cell */}
                      </th>
                      {days.map((day, index) => (
                        <th key={index} className="text-center p-3 font-semibold text-sm w-[calc((100%-4rem)/5)]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schedule && schedule.map((hourRow, hourIndex) => (
                      <tr key={hourIndex} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium border-r sticky left-0 bg-background z-10">
                          <div className="flex items-center justify-center">
                            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {hourIndex + 1}
                            </div>
                          </div>
                        </td>
                        {days.map((day, dayIndex) => {
                          const cell = mergedSchedule[dayIndex]?.[hourIndex];
                          if (!cell || cell.skip) return null;
                          
                          const moduleCode = cell.moduleCode;
                          const rowspan = cell.rowspan;
                          const moduleName = moduleCode ? (snapshot?.legend?.modules?.[moduleCode] || moduleCode) : "";
                          const isLongText = moduleName.length > 25;
                          
                          return (
                            <td 
                              key={dayIndex} 
                              className="p-2" 
                              rowSpan={rowspan}
                              style={{ height: `${rowspan * 52}px` }}
                            >
                              <div
                                className={`
                                  h-full rounded-md flex items-center justify-center font-medium
                                  border transition-colors px-2 py-1
                                  ${moduleCode ? getModuleColor(moduleCode) : "bg-muted/20 border-transparent text-muted-foreground"}
                                `}
                              >
                                {moduleCode ? (
                                  <span 
                                    className={`text-center leading-tight ${isLongText ? 'text-xs' : 'text-sm'}`}
                                    style={{ 
                                      wordBreak: 'break-word',
                                      overflowWrap: 'break-word',
                                      hyphens: 'auto',
                                      display: '-webkit-box',
                                      WebkitLineClamp: rowspan * 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    {moduleName}
                                  </span>
                                ) : (
                                  <span className="text-xs">-</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
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
    </div>
  );
}

