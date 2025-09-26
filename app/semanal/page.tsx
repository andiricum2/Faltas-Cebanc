"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { extractAbsenceCode } from "@/lib/utils";
import { buildSelectedWeek } from "@/lib/services/snapshotService";
import { useSnapshot } from "@/lib/services/snapshotContext";

export default function SemanalPage() {
  const { snapshot } = useSnapshot();
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number | null>(null);

  const selectedWeek = useMemo(() => snapshot ? buildSelectedWeek(snapshot, selectedWeekIdx, "all", "all") : null, [snapshot, selectedWeekIdx]);

  // Ensure the current (latest) week is selected by default when snapshot arrives
  useEffect(() => {
    if (!snapshot) return;
    if (selectedWeekIdx !== null) return; // do not override user's choice
    // Try to select the current week by today's date; fallback to latest if not found
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const findIdx = snapshot.weeks.findIndex((w) => {
      const start = new Date(w.weekStartISO + "T00:00:00Z");
      const end = new Date(w.weekEndISO + "T00:00:00Z");
      return todayUTC >= start && todayUTC <= end;
    });
    const fallback = snapshot.weeks.length ? snapshot.weeks.length - 1 : null;
    setSelectedWeekIdx(findIdx >= 0 ? findIdx : fallback);
  }, [snapshot, selectedWeekIdx]);

  if (!snapshot) return <div className="text-muted-foreground">Cargando...</div>;

  const absenceLegend = snapshot.legend.absenceTypes || {};
  const moduleLegend = snapshot.legend.modules || {};

  const absenceColorClass = (code: string | null): string => {
    switch (code) {
      case "F": // Falta no justificada
        return "bg-red-100 text-red-900 border-red-300";
      case "J": // Justificada
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      case "C": // Justificada computable
        return "bg-teal-100 text-teal-900 border-teal-300";
      case "E": // Expulsión
        return "bg-purple-100 text-purple-900 border-purple-300";
      case "R": // Retraso
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "H": // Huelga
        return "bg-slate-200 text-slate-900 border-slate-300";
      default:
        return "";
    }
  };

  const moduleColorClass = (mod: string | null): string => {
    if (!mod) return "bg-white";
    const palette = [
      "bg-blue-200",
      "bg-green-200",
      "bg-yellow-200",
      "bg-pink-200",
      "bg-cyan-200",
      "bg-lime-200",
      "bg-indigo-200",
      "bg-orange-200",
      "bg-fuchsia-200",
      "bg-sky-200",
    ];
    let hash = 0;
    for (let i = 0; i < mod.length; i++) hash = (hash * 31 + mod.charCodeAt(i)) >>> 0;
    const idx = hash % palette.length;
    return palette[idx];
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Semanal</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Semana anterior"
            onClick={() => {
              const current = (selectedWeekIdx ?? (snapshot.weeks.length - 1));
              if (current > 0) setSelectedWeekIdx(current - 1);
            }}
            disabled={(selectedWeekIdx ?? (snapshot.weeks.length - 1)) <= 0}
            title="Semana anterior"
          >
            ←
          </Button>
          <Select
            className="w-[220px]"
            value={(selectedWeekIdx ?? (snapshot.weeks.length - 1)).toString()}
            onChange={(e)=>setSelectedWeekIdx(Number(e.target.value))}
          >
            {snapshot.weeks.map((w, idx)=> (
              <option key={w.weekStartISO} value={idx}>{w.weekStartISO} → {w.weekEndISO}</option>
            ))}
          </Select>
          <Button
            variant="outline"
            size="icon"
            aria-label="Semana siguiente"
            onClick={() => {
              const current = (selectedWeekIdx ?? (snapshot.weeks.length - 1));
              if (current < snapshot.weeks.length - 1) setSelectedWeekIdx(current + 1);
            }}
            disabled={(selectedWeekIdx ?? (snapshot.weeks.length - 1)) >= snapshot.weeks.length - 1}
            title="Semana siguiente"
          >
            →
          </Button>
        </div>
      </div>

      {selectedWeek && (
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
      )}
    </div>
  );
}


