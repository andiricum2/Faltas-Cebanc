"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useSnapshot } from "@/lib/services/snapshotContext";
import { getSelectedWeek } from "@/lib/services/apiClient";
import { getTodayLocalISO, getDefaultWeekIndex } from "@/lib/utils";
import { absenceColorClass, moduleColorClass } from "@/lib/utils/ui";
import { extractAbsenceCode } from "@/lib/utils";
import { useDataLoader } from "@/lib/hooks";
import { LoadingState } from "@/components/ui/loading-state";

export default function SemanalPage() {
  const { snapshot } = useSnapshot();
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number | null>(null);

  // Fecha local de hoy (yyyy-mm-dd)
  const todayISO = useMemo(() => getTodayLocalISO(), []);

  // Índice de la semana actual por defecto (contiene la fecha de hoy)
  const defaultWeekIdx = useMemo(() => getDefaultWeekIndex(snapshot, todayISO), [snapshot, todayISO]);

  // Índice de semana (usuario o por defecto)
  const weekIdx = selectedWeekIdx ?? defaultWeekIdx;

  // Hook para cargar datos de semana usando useDataLoader
  const { data: selectedWeekData, loading: selectedWeekLoading, error } = useDataLoader(
    () => {
      if (!snapshot?.identity?.dni || weekIdx == null) {
        throw new Error("No hay datos disponibles");
      }
      return getSelectedWeek(snapshot.identity.dni, weekIdx, "all", "all");
    },
    [snapshot?.identity?.dni, weekIdx]
  );

  const selectedWeek = selectedWeekData?.week || null;
  const absenceLegend = selectedWeekData?.absenceLegend || snapshot?.legend.absenceTypes || {};
  const moduleLegend = selectedWeekData?.moduleLegend || snapshot?.legend.modules || {};

  // Seleccionar por defecto la semana actual al llegar snapshot (sin sobreescribir elección del usuario)
  useEffect(() => {
    if (!snapshot) return;
    if (selectedWeekIdx !== null) return;
    setSelectedWeekIdx(defaultWeekIdx);
  }, [snapshot, selectedWeekIdx, defaultWeekIdx]);

  return (
    <LoadingState loading={false} error={null}>
      <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Semanal</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Semana anterior"
            onClick={() => {
              const current = weekIdx ?? 0;
              if (current > 0) setSelectedWeekIdx(current - 1);
            }}
            disabled={(weekIdx ?? 0) <= 0}
            title="Semana anterior"
          >
            ←
          </Button>
          <Select
            className="w-[220px]"
            value={(weekIdx ?? 0).toString()}
            onChange={(e)=>setSelectedWeekIdx(Number(e.target.value))}
          >
            {snapshot?.weeks.map((w, idx)=> (
              <option key={w.weekStartISO} value={idx}>{`${w.weekStartISO} → ${w.weekEndISO}`}</option>
            ))}
          </Select>
          <Button
            variant="outline"
            size="icon"
            aria-label="Semana siguiente"
            onClick={() => {
              const current = weekIdx ?? 0;
              if (current < (snapshot?.weeks.length ?? 0) - 1) setSelectedWeekIdx(current + 1);
            }}
            disabled={(weekIdx ?? 0) >= (snapshot?.weeks.length ?? 0) - 1}
            title="Semana siguiente"
          >
            →
          </Button>
        </div>
      </div>

      {selectedWeekLoading ? (
        <LoadingState loading={true} error={null}>
          <div />
        </LoadingState>
      ) : error ? (
        <LoadingState loading={false} error={error}>
          <div />
        </LoadingState>
      ) : selectedWeek ? (
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">Detalle semanal ({selectedWeek.weekStartISO} → {selectedWeek.weekEndISO})</div>
          <div className="overflow-auto rounded-md border">
            <table className="min-w-[860px] w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Hora</th>
                  {selectedWeek.daysISO.map((d)=> (
                    <th key={d} className="px-3 py-2 text-left font-semibold">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1,2,3,4,5,6].map((h)=> (
                  <tr key={h} className="odd:bg-background">
                    <td className="px-3 py-2 text-center font-medium border-t">{h}</td>
                    {selectedWeek.daysISO.map((d, idx)=> {
                      const cell = selectedWeek.sessions.find((s)=> s.hour === h && s.weekday === (idx+1));
                      const code = extractAbsenceCode(cell?.cssClass || null);
                      const color = absenceColorClass(code);
                      return (
                        <td
                          key={d+"-"+h}
                          className={`px-3 py-2 border-t truncate ${color}`}
                          title={cell?.title || undefined}
                        >
                          {cell?.title ? (
                            <div className="flex items-center gap-2">
                              <span className={`inline-block h-2 w-2 rounded-full ${moduleColorClass(cell.title)}`} />
                              <span className="truncate">{cell.title}</span>
                              {code && <span className="ml-auto font-mono text-xs">{code}</span>}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <section>
              <h3 className="text-base font-semibold mb-4">Leyenda faltas</h3>
              <div className="flex flex-wrap gap-2 text-sm">
                {Object.entries(absenceLegend).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 rounded-md border px-2 py-1">
                    <span className={`inline-block h-3 w-3 rounded ${absenceColorClass(k)}`} />
                    <span className="font-mono text-xs">{k}</span>
                    <span className="truncate">{v}</span>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="text-base font-semibold mb-4">Leyenda asignaturas</h3>
              <div className="flex flex-wrap gap-2 text-sm max-h-40 overflow-auto p-1 border rounded-md">
                {Object.entries(moduleLegend).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 rounded-md border px-2 py-1">
                    <span className={`inline-block h-3 w-3 rounded ${moduleColorClass(k)}`} />
                    <span className="truncate" title={v}>{k}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : (
        <LoadingState loading={false} error="No se pudo cargar la semana seleccionada">
          <div />
        </LoadingState>
      )}
      </div>
    </LoadingState>
  );
}
