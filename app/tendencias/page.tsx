"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { buildModulesTable, buildWeeklySeries } from "@/lib/services/snapshotService";
import { useSnapshot } from "@/lib/services/snapshotContext";

export default function TendenciasPage() {
  const { snapshot } = useSnapshot();
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [absenceFilter, setAbsenceFilter] = useState<string>("all");

  const absenceLegend = snapshot?.legend.absenceTypes || {};
  const weeklySeries = useMemo(() => snapshot ? buildWeeklySeries(snapshot, moduleFilter, absenceFilter) : [], [snapshot, moduleFilter, absenceFilter]);
  const modulesTable = useMemo(() => snapshot ? buildModulesTable(snapshot, moduleFilter, absenceFilter) : [], [snapshot, moduleFilter, absenceFilter]);

  if (!snapshot) return <div className="text-muted-foreground">Cargando...</div>;

  return (
    <div className="w-full space-y-6">
      <CardHeader className="p-0">
        <CardTitle>Tendencias</CardTitle>
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


