"use client";

import { useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Activity, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { useSnapshot } from "@/lib/services/snapshotContext";
import { useStatistics, useStatisticsMetrics } from "@/lib/hooks";
import { LoadingState } from "@/components/ui/loading-state";
import { useTranslations } from "next-intl";

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
];

// Memoized loading skeleton component
const LoadingSkeleton = memo(() => (
  <div className="h-32 p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-20 animate-pulse" />
        <div className="h-8 bg-muted rounded w-12 animate-pulse" />
      </div>
      <div className="p-3 bg-muted rounded-full animate-pulse">
        <div className="w-6 h-6" />
      </div>
    </div>
    <div className="mt-4">
      <div className="w-full bg-muted rounded-full h-2 animate-pulse" />
    </div>
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Memoized custom tooltip component
const CustomTooltip = memo(({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3">
      <p className="font-medium text-sm">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

// Memoized absence type badge component
const AbsenceTypeBadge = memo(({ type, index, showValue = true }: { type: any; index: number; showValue?: boolean }) => (
  <div>
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border"
      style={{ borderColor: type.color, color: type.color }}
    >
      {showValue ? `${type.name}: ${type.value}` : type.name}
    </span>
  </div>
));

AbsenceTypeBadge.displayName = 'AbsenceTypeBadge';

// Memoized chart container to prevent unnecessary re-renders
const ChartContainer = memo(({ children, height = "h-80" }: { children: React.ReactNode; height?: string }) => (
  <div className={height}>
    {children}
  </div>
));

ChartContainer.displayName = 'ChartContainer';

export default function TendenciasPage() {
  const { snapshot } = useSnapshot();
  const { data: statistics, loading: statisticsLoading, error, reload: loadStatistics } = useStatistics(snapshot?.identity?.dni);
  const t = useTranslations();

  // Sin estados de hover para métricas

  // Datos procesados con mejor memoización
  const weeklySeries = useMemo(() => statistics?.weeklySeries || [], [statistics?.weeklySeries]);

  // Métricas calculadas con optimización usando hook personalizado
  const metrics = useStatisticsMetrics(statistics);

  // Datos para gráfico de pastel optimizado
  const absenceTypeData = useMemo(() => {
    if (!snapshot?.aggregated?.absenceTotals) return [];
    
    return Object.entries(snapshot.aggregated.absenceTotals)
      .map(([type, count], index) => ({
        name: type,
        value: count,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [snapshot?.aggregated?.absenceTotals]);

  // Early returns for different states
  if (!snapshot) {
    return (
      <LoadingState loading={true} error={null}>
        <div />
      </LoadingState>
    );
  }

  if (error) {
    return (
      <LoadingState loading={false} error={error} onRetry={loadStatistics}>
        <div />
      </LoadingState>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Métricas clave */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statisticsLoading && !metrics ? (
          // Estado de carga optimizado para métricas
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <Card className="h-32">
                <LoadingSkeleton />
              </Card>
            </div>
          ))
        ) : metrics ? (
          <>
            <MetricCard
              title={t('dashboard.attendancePercentage')}
              value={`${snapshot.percentages.totalPercent}%`}
              icon={Activity}
              color="blue"
              progressBar={snapshot.percentages.totalPercent}
              progressMax={20}
            />

            <MetricCard
              title={t('dashboard.totalAbsences')}
              value={metrics.totalFaltas}
              icon={Activity}
              color="green"
            >
              <div className="mt-1.5">
                <div className="flex flex-wrap gap-1">
                  {absenceTypeData.slice(0, 4).map((type, index) => (
                    <AbsenceTypeBadge key={type.name} type={type} index={index} />
                  ))}
                </div>
              </div>
            </MetricCard>

            <MetricCard
              title={t('trends.maxWeekly')}
              value={metrics.maxWeek}
              icon={BarChart3}
              color="amber"
            >
              <div className="mt-4">
                <div className="text-xs text-muted-foreground">
                  {metrics.maxWeekLabel && (
                    <span>{t('trends.week')}: {metrics.maxWeekLabel}</span>
                  )}
                </div>
              </div>
            </MetricCard>

            <MetricCard
              title={t('trends.absenceTypes')}
              value={absenceTypeData.length}
              icon={PieChartIcon}
              color="purple"
            >
              <div className="mt-1.5">
                <div className="flex flex-wrap gap-1">
                  {absenceTypeData.slice(0, 3).map((type, index) => (
                    <AbsenceTypeBadge key={type.name} type={type} index={index} showValue={false} />
                  ))}
                </div>
              </div>
            </MetricCard>
          </>
        ) : (
          // Estado vacío cuando no hay métricas disponibles
          <div className="col-span-full flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Activity className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">{t('trends.noMetrics')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Contenido principal */}
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gráfico de evolución semanal */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                {t('trends.weeklyEvolution')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ChartContainer>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklySeries}>
                    <defs>
                      <linearGradient id="colorAbsences" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="label" 
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      allowDecimals={false} 
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorAbsences)"
                      strokeWidth={3}
                      name="Faltas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Gráfico de tipos de faltas */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-purple-600" />
                {t('trends.distributionByType')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ChartContainer>
                <ResponsiveContainer width="100%" height="100%">
                  {absenceTypeData.length > 0 ? (
                    <PieChart>
                      <Pie
                        data={absenceTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(1)}%`}
                        labelLine={false}
                        nameKey="name"
                      >
                        {absenceTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={<CustomTooltip />}
                        formatter={(value: any, name: any) => [value, name]}
                      />
                    </PieChart>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-2">
                        <PieChartIcon className="w-8 h-8 mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground">{t('trends.noAbsenceTypeData')}</p>
                      </div>
                    </div>
                  )}
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
