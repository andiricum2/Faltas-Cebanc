"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useSnapshot } from "@/lib/services/snapshotContext";
import { getStatistics, type StatisticsResponse } from "@/lib/services/apiClient";

export default function TendenciasPage() {
  const { snapshot } = useSnapshot();
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [absenceFilter, setAbsenceFilter] = useState<string>("all");
  const [statistics, setStatistics] = useState<StatisticsResponse | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);

  const absenceLegend = snapshot?.legend.absenceTypes || {};

  // Cargar estadísticas cuando cambien los filtros
  useEffect(() => {
    if (!snapshot?.identity?.dni) return;
    
    const loadStatistics = async () => {
      setStatisticsLoading(true);
      try {
        const result = await getStatistics(
          snapshot.identity.dni,
          moduleFilter,
          absenceFilter
        );
        setStatistics(result);
      } catch (error) {
        console.error("Error loading statistics:", error);
      } finally {
        setStatisticsLoading(false);
      }
    };

    loadStatistics();
  }, [snapshot?.identity?.dni, moduleFilter, absenceFilter]);

  // Usar datos del endpoint
  const weeklySeries = useMemo(() => statistics?.weeklySeries || [], [statistics]);
  const monthlySeries = useMemo(() => statistics?.monthlySeries || [], [statistics]);
  const modulesTable = useMemo(() => {
    const allModules = [
      ...(statistics?.modulesTable.normalModules || []),
      ...(statistics?.modulesTable.retoModules || [])
    ];
    return allModules;
  }, [statistics]);

  if (!snapshot) return <div className="text-muted-foreground">Cargando...</div>;

  return (
    <div className="w-full space-y-6">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between">
          <CardTitle>Tendencias</CardTitle>
          {statisticsLoading && (
            <div className="text-sm text-muted-foreground">Cargando datos...</div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="evolucion" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="evolucion">Evolución</TabsTrigger>
            <TabsTrigger value="modulos">Módulos</TabsTrigger>
          </TabsList>

          <TabsContent value="evolucion">
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
                <LineChart data={weeklySeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#10b981" name="Faltas/semana" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="modulos">
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
          </TabsContent>

          
        </Tabs>
      </CardContent>
    </div>
  );
}


